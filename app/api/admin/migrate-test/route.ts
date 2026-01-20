/**
 * Test Migration API - NO AUTH (for debugging only)
 * 
 * POST /api/admin/migrate-test?courseId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { uploadCourseBlob, isTelegramEnabled, getBlobStats } from '@/lib/storage/telegram-storage';
import { courseToBlob } from '@/lib/storage/course-converter';

export async function POST(request: NextRequest) {
    if (!isTelegramEnabled()) {
        return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
        return NextResponse.json({ error: 'Provide courseId' }, { status: 400 });
    }

    const admin = initAdmin();
    const db = admin.firestore();

    try {
        const docRef = db.collection('courses').doc(courseId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const data = docSnap.data()!;

        // Skip if already migrated
        if (data.published?.tg_file_id) {
            return NextResponse.json({
                status: 'skipped',
                message: 'Already migrated',
                tg_file_id: data.published.tg_file_id
            });
        }

        // Get lessons
        let lessons = data.lessons || [];
        if (data._lessonsInSubcollection) {
            const lessonsSnap = await docRef.collection('lessons').orderBy('_order').get();
            lessons = lessonsSnap.docs.map(doc => {
                const { _order, ...lessonData } = doc.data();
                return lessonData;
            });
        }

        const courseData = { id: courseId, ...data, lessons };
        const { blob, meta, sections } = courseToBlob(courseData as any);
        const stats = getBlobStats(blob);

        console.log(`📦 Migrating ${courseId}: ${stats.lessonCount} lessons, ${(stats.sizeBytes / 1024).toFixed(1)}KB`);

        // Upload to Telegram
        const { file_id, hash } = await uploadCourseBlob(courseId, blob);

        // Update Firestore
        await docRef.update({
            meta,
            sections,
            published: {
                tg_file_id: file_id,
                version: 1,
                hash,
                lessonCount: stats.lessonCount,
                blockCount: stats.blockCount,
                publishedAt: new Date().toISOString(),
                publishedBy: 'test-migration',
            },
            status: data.isPublished ? 'published' : 'draft',
            structure_version: 1,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            courseId,
            lessonCount: stats.lessonCount,
            blockCount: stats.blockCount,
            sizeKB: (stats.sizeBytes / 1024).toFixed(1),
            tg_file_id: file_id,
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
