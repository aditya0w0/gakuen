/**
 * Migration Script: Convert Legacy Firestore Courses to Telegram Blobs
 * 
 * Run with: npx tsx scripts/migrate-to-telegram.ts
 * 
 * This script:
 * 1. Lists all courses from Firestore
 * 2. Converts each to compact blob format
 * 3. Uploads to Telegram
 * 4. Updates Firestore with blob pointer
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

const db = admin.firestore();

// Telegram config
const TG_API = 'https://api.telegram.org/bot';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

interface MigrationResult {
    courseId: string;
    status: 'success' | 'skipped' | 'error';
    message: string;
    version?: number;
}

async function uploadToTelegram(courseId: string, blob: any): Promise<{ file_id: string; hash: string }> {
    const crypto = await import('crypto');
    const jsonString = JSON.stringify(blob);
    const hash = crypto.createHash('md5').update(jsonString).digest('hex');

    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', new Blob([jsonString], { type: 'application/json' }), `${courseId}.json`);
    formData.append('caption', `Migration: ${courseId} | Hash: ${hash.slice(0, 8)}`);

    const response = await fetch(`${TG_API}${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Telegram upload failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
    }

    return { file_id: result.result.document.file_id, hash };
}

function courseToBlob(course: any): { blob: any; meta: any; sections: any[] } {
    const lessons: Record<string, any> = {};
    const blocks: Record<string, any> = {};

    let blockCounter = 1;
    let lessonCounter = 1;

    for (const lesson of course.lessons || []) {
        const lessonId = `L${lessonCounter++}`;
        const blockIds: string[] = [];

        for (const component of lesson.components || []) {
            const blockId = `B${blockCounter++}`;

            blocks[blockId] = {
                id: blockId,
                t: component.type === 'text' ? 'p' : component.type,
                v: (component.content || component.text || '').replace(/<[^>]*>/g, ''),
            };

            if (component.src) blocks[blockId].src = component.src;
            blockIds.push(blockId);
        }

        lessons[lessonId] = {
            id: lessonId,
            t: lesson.title,
            d: lesson.duration,
            b: blockIds,
        };
    }

    const sections = (course.sections || []).map((s: any, i: number) => ({
        id: `S${i + 1}`,
        t: s.title,
        l: s.lessonIds?.map((_: any, j: number) => `L${j + 1}`) || [],
    }));

    const meta = {
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        category: course.category,
        level: course.level,
        duration: course.duration,
    };

    return { blob: { v: 1, lessons, blocks }, meta, sections };
}

async function migrateCourse(courseId: string): Promise<MigrationResult> {
    try {
        const docRef = db.collection('courses').doc(courseId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { courseId, status: 'error', message: 'Course not found' };
        }

        const data = docSnap.data()!;

        // Skip if already migrated
        if (data.published?.tg_file_id) {
            return { courseId, status: 'skipped', message: 'Already migrated' };
        }

        // Get lessons from subcollection if needed
        let lessons = data.lessons || [];
        if (data._lessonsInSubcollection) {
            const lessonsSnap = await docRef.collection('lessons').orderBy('_order').get();
            lessons = lessonsSnap.docs.map(doc => {
                const { _order, ...lessonData } = doc.data();
                return lessonData;
            });
        }

        const courseData = { ...data, lessons };
        const { blob, meta, sections } = courseToBlob(courseData);

        const lessonCount = Object.keys(blob.lessons).length;
        const blockCount = Object.keys(blob.blocks).length;
        const sizeBytes = JSON.stringify(blob).length;

        console.log(`📦 ${courseId}: ${lessonCount} lessons, ${blockCount} blocks, ${(sizeBytes / 1024).toFixed(1)}KB`);

        // Upload to Telegram
        const { file_id, hash } = await uploadToTelegram(courseId, blob);

        // Update Firestore
        await docRef.update({
            meta,
            sections,
            published: {
                tg_file_id: file_id,
                version: 1,
                hash,
                lessonCount,
                blockCount,
                publishedAt: new Date().toISOString(),
                publishedBy: 'migration-script',
            },
            status: data.isPublished ? 'published' : 'draft',
            structure_version: 1,
            updatedAt: new Date().toISOString(),
        });

        return {
            courseId,
            status: 'success',
            message: `Migrated ${lessonCount} lessons`,
            version: 1
        };
    } catch (error) {
        console.error(`❌ ${courseId}:`, error);
        return {
            courseId,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function main() {
    console.log('🚀 Starting migration to Telegram storage...\n');

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
        process.exit(1);
    }

    // Get all courses
    const snapshot = await db.collection('courses').get();
    const courseIds = snapshot.docs.map(doc => doc.id);

    console.log(`📋 Found ${courseIds.length} courses to process\n`);

    const results: MigrationResult[] = [];

    for (const courseId of courseIds) {
        const result = await migrateCourse(courseId);
        results.push(result);

        const emoji = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
        console.log(`${emoji} ${courseId}: ${result.message}`);

        // Rate limit: 1 second between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Success: ${results.filter(r => r.status === 'success').length}`);
    console.log(`   Skipped: ${results.filter(r => r.status === 'skipped').length}`);
    console.log(`   Errors:  ${results.filter(r => r.status === 'error').length}`);
}

main().catch(console.error);
