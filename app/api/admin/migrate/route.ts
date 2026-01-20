/**
 * Migration API - Convert a course to Telegram blob storage
 * 
 * POST /api/admin/migrate?courseId=xxx
 * POST /api/admin/migrate?all=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { uploadCourseBlob, isTelegramEnabled, getBlobStats } from '@/lib/storage/telegram-storage';
import { courseToBlob } from '@/lib/storage/course-converter';

export async function POST(request: NextRequest) {
    // Auth check
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }
    if (authResult.user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const user = authResult.user;

    if (!isTelegramEnabled()) {
        return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const migrateAll = searchParams.get('all') === 'true';

    const admin = initAdmin();
    const db = admin.firestore();

    const results: any[] = [];

    try {
        let courseIds: string[] = [];

        if (migrateAll) {
            const snapshot = await db.collection('courses').get();
            courseIds = snapshot.docs.map(doc => doc.id);
        } else if (courseId) {
            courseIds = [courseId];
        } else {
            return NextResponse.json({ error: 'Provide courseId or all=true' }, { status: 400 });
        }

        for (const id of courseIds) {
            try {
                const docRef = db.collection('courses').doc(id);
                const docSnap = await docRef.get();

                if (!docSnap.exists) {
                    results.push({ id, status: 'error', message: 'Not found' });
                    continue;
                }

                const data = docSnap.data()!;

                // Skip if already migrated
                if (data.published?.tg_file_id) {
                    results.push({ id, status: 'skipped', message: 'Already migrated' });
                    continue;
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

                const courseData = { id, ...data, lessons };
                const { blob, meta, sections } = courseToBlob(courseData as any);
                const stats = getBlobStats(blob);

                console.log(`📦 Migrating ${id}: ${stats.lessonCount} lessons, ${(stats.sizeBytes / 1024).toFixed(1)}KB`);

                // Upload to Telegram
                const { file_id, hash } = await uploadCourseBlob(id, blob);

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
                        publishedBy: user.id,
                    },
                    status: data.isPublished ? 'published' : 'draft',
                    structure_version: 1,
                    updatedAt: new Date().toISOString(),
                });

                results.push({
                    id,
                    status: 'success',
                    lessonCount: stats.lessonCount,
                    blockCount: stats.blockCount,
                    sizeKB: (stats.sizeBytes / 1024).toFixed(1),
                });
            } catch (error) {
                console.error(`❌ ${id}:`, error);
                results.push({
                    id,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return NextResponse.json({
            success: true,
            migrated: results.filter(r => r.status === 'success').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
            results,
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
