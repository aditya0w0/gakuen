/**
 * Checkpoint API - Save draft snapshot to Telegram
 * 
 * POST /api/admin/checkpoint?courseId=xxx
 * Body: Course JSON
 * 
 * This is called by the 30s checkpoint sync from the client.
 * Saves to draft_snapshot (NOT published).
 * 
 * FIRESTORE-RESILIENT: Telegram save succeeds even if Firestore quota exhausted
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

    try {
        const course = await request.json();

        if (!course || !course.id) {
            return NextResponse.json({ error: 'Invalid course data' }, { status: 400 });
        }

        const { blob, meta, sections } = courseToBlob(course);
        const stats = getBlobStats(blob);

        console.log(`⏱️ [Checkpoint] ${courseId}: ${stats.lessonCount} lessons, ${(stats.sizeBytes / 1024).toFixed(1)}KB`);

        // Step 1: Upload to Telegram FIRST (always succeeds, no quota)
        const { file_id, hash } = await uploadCourseBlob(courseId, blob);
        console.log(`✅ [Telegram] ${courseId} uploaded → ${file_id.substring(0, 20)}...`);


        // Step 2: Try to update Firestore (optional - may fail if quota exhausted)
        // With 5-second timeout to avoid long waits
        let firestoreUpdated = false;
        let draftVersion = 1;

        const firestoreTimeout = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 5000)
        );

        const firestoreUpdate = async () => {
            const admin = initAdmin();
            const db = admin.firestore();
            const docRef = db.collection('courses').doc(courseId);

            // Get existing data to preserve published state
            const existingDoc = await docRef.get();
            const existingData = existingDoc.exists ? existingDoc.data() : {};
            draftVersion = (existingData?.draft_snapshot?.version || 0) + 1;

            await docRef.set({
                meta,
                sections,
                draft_snapshot: {
                    tg_file_id: file_id,
                    version: draftVersion,
                    hash,
                    lessonCount: stats.lessonCount,
                    blockCount: stats.blockCount,
                    savedAt: new Date().toISOString(),
                    dirty: false,
                },
                published: existingData?.published || null,
                status: existingData?.published ? 'published' : 'draft',
                createdAt: course.createdAt || existingData?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }, { merge: true });

            firestoreUpdated = true;
            console.log(`✅ [Firestore] ${courseId} → draft v${draftVersion}`);
        };

        try {
            await Promise.race([firestoreUpdate(), firestoreTimeout]);
        } catch (firestoreError: any) {
            if (firestoreError?.message === 'Firestore timeout') {
                console.warn(`⚠️ [Firestore] Timeout after 5s - Telegram save succeeded`);
            } else if (firestoreError?.code === 8 || firestoreError?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(`⚠️ [Firestore] Quota exhausted - Telegram save succeeded`);
            } else {
                console.warn(`⚠️ [Firestore] Error:`, firestoreError?.message);
            }
        }

        return NextResponse.json({
            success: true,
            courseId,
            draft_version: draftVersion,
            lessonCount: stats.lessonCount,
            tg_file_id: file_id,
            firestore_updated: firestoreUpdated,
            // If Firestore failed, client should retry pointer update later
            pending_firestore_sync: !firestoreUpdated,
        });
    } catch (error) {
        console.error('Checkpoint error:', error);
        return NextResponse.json({
            error: 'Checkpoint failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
