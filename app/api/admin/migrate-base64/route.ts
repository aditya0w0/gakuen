import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { downloadCourseBlob, uploadCourseBlob } from '@/lib/storage/telegram-storage';
import { uploadToR2, isR2Enabled } from '@/lib/storage/r2-storage';
import { uploadToDrive, isDriveEnabled } from '@/lib/storage/google-drive';
import { addToLocalRegistry, getFromLocalRegistry, markAsSynced } from '@/lib/cache/local-registry';
import { updatePointerCache } from '@/lib/cache/pointer-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large migrations

/**
 * BASE64 MIGRATION API
 * 
 * Scans all course content for base64 data URLs,
 * uploads them to storage, and replaces with proper URLs.
 * 
 * This fixes the "JSON explosion" issue where images were
 * stored as base64 instead of file references.
 */

interface MigrationStats {
    coursesScanned: number;
    base64Found: number;
    uploaded: number;
    failed: number;
    bytesRemoved: number;
}

/**
 * Recursively scan an object for base64 data URLs and replace them
 */
async function migrateBase64InObject(obj: any, stats: MigrationStats): Promise<any> {
    if (!obj) return obj;

    // Handle strings - check for base64 data URLs
    if (typeof obj === 'string') {
        // Match data:image/xxx;base64,... pattern
        const base64Regex = /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/;
        const match = obj.match(base64Regex);

        if (match) {
            const mimeType = `image/${match[1]}`;
            const base64Data = match[2];

            console.log(`🔍 Found base64 image (${mimeType}, ${(base64Data.length / 1024).toFixed(1)}KB)`);
            stats.base64Found++;
            stats.bytesRemoved += obj.length;

            try {
                // Decode base64 to buffer
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `migrated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

                let uploadUrl: string | null = null;

                // Try R2 first
                if (isR2Enabled()) {
                    try {
                        const result = await uploadToR2(buffer, filename, 'cms', mimeType);
                        uploadUrl = result.url;
                        console.log(`✅ Uploaded to R2: ${result.fileId}`);
                    } catch (e) {
                        console.warn('R2 upload failed, trying Drive...');
                    }
                }

                // Fallback to Drive
                if (!uploadUrl && isDriveEnabled()) {
                    try {
                        const result = await uploadToDrive(buffer, filename, 'cms', mimeType);
                        uploadUrl = result.url;
                        console.log(`✅ Uploaded to Drive: ${result.fileId}`);
                    } catch (e) {
                        console.warn('Drive upload failed');
                    }
                }

                if (uploadUrl) {
                    stats.uploaded++;
                    return uploadUrl;
                } else {
                    stats.failed++;
                    console.error('❌ All upload methods failed');
                    return obj; // Keep original on failure
                }
            } catch (err) {
                console.error('❌ Base64 migration failed:', err);
                stats.failed++;
                return obj;
            }
        }

        return obj;
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => migrateBase64InObject(item, stats)));
    }

    // Handle Objects
    if (typeof obj === 'object') {
        const migrated: any = {};
        for (const [key, value] of Object.entries(obj)) {
            migrated[key] = await migrateBase64InObject(value, stats);
        }
        return migrated;
    }

    return obj;
}

export async function POST(request: NextRequest) {
    const stats: MigrationStats = {
        coursesScanned: 0,
        base64Found: 0,
        uploaded: 0,
        failed: 0,
        bytesRemoved: 0
    };
    const startTime = Date.now();

    try {
        const admin = initAdmin();
        const db = admin.firestore();

        console.log("🚀 Starting Base64 Migration...");

        // Get all courses
        const coursesSnap = await db.collection('courses').get();

        for (const courseDoc of coursesSnap.docs) {
            const courseId = courseDoc.id;
            const courseData = courseDoc.data();
            let needsFirestoreUpdate = false;

            console.log(`\n📦 Scanning Course: ${courseId}`);
            stats.coursesScanned++;

            // A. Migrate metadata (thumbnail, instructorAvatar)
            if (courseData.meta) {
                const beforeSize = JSON.stringify(courseData.meta).length;
                const migratedMeta = await migrateBase64InObject(courseData.meta, stats);
                const afterSize = JSON.stringify(migratedMeta).length;

                if (beforeSize !== afterSize) {
                    courseData.meta = migratedMeta;
                    needsFirestoreUpdate = true;
                    console.log(`  📝 Meta: ${((beforeSize - afterSize) / 1024).toFixed(1)}KB reduced`);
                }
            }

            // B. Migrate Telegram Blobs
            const blobsToHandle = [
                { type: 'published', data: courseData.published },
                { type: 'draft', data: courseData.draft_snapshot }
            ].filter(b => b.data?.tg_file_id);

            for (const blobInfo of blobsToHandle) {
                try {
                    const type = blobInfo.type as 'published' | 'draft';
                    const fileId = blobInfo.data.tg_file_id;

                    console.log(`  📥 Downloading ${type} blob: ${fileId}`);
                    const blob = await downloadCourseBlob(fileId);

                    if (blob) {
                        const beforeSize = JSON.stringify(blob).length;
                        const migratedBlob = await migrateBase64InObject(blob, stats);
                        const afterSize = JSON.stringify(migratedBlob).length;

                        if (beforeSize !== afterSize) {
                            console.log(`  🛠️ Patching ${type} blob: ${((beforeSize - afterSize) / 1024).toFixed(1)}KB reduced`);

                            // Upload patched blob back to Telegram
                            const { file_id: newFileId, hash } = await uploadCourseBlob(courseId, migratedBlob);

                            // Update pointers
                            if (type === 'published') {
                                courseData.published.tg_file_id = newFileId;
                                courseData.published.hash = hash;
                            } else {
                                courseData.draft_snapshot.tg_file_id = newFileId;
                                courseData.draft_snapshot.hash = hash;
                            }
                            needsFirestoreUpdate = true;

                            // Update cache
                            updatePointerCache(courseId, type, {
                                tg_file_id: newFileId,
                                version: blobInfo.data.version || 1,
                                hash,
                                meta: courseData.meta,
                                sections: courseData.sections
                            });
                        }
                    }
                } catch (blobErr) {
                    console.error(`  ❌ Failed to migrate ${blobInfo.type} blob:`, blobErr);
                }
            }

            // C. Update Firestore if anything changed
            if (needsFirestoreUpdate) {
                await courseDoc.ref.update(courseData);

                // D. Update Local Registry (Vercel Blob) if exists
                const registryEntry = await getFromLocalRegistry(courseId);
                if (registryEntry) {
                    const finalTgId = courseData.published?.tg_file_id || courseData.draft_snapshot?.tg_file_id;
                    await addToLocalRegistry(courseId, finalTgId, courseData.meta, courseData.sections);
                    if (!courseData.draft_snapshot?.dirty) {
                        await markAsSynced(courseId);
                    }
                }
            }
        }

        const duration = (Date.now() - startTime) / 1000;
        const bytesRemovedMB = (stats.bytesRemoved / (1024 * 1024)).toFixed(2);

        console.log(`\n✅ Base64 Migration Complete in ${duration}s!`);
        console.log(`Summary: ${stats.coursesScanned} courses, ${stats.base64Found} base64 found, ${stats.uploaded} uploaded, ${stats.failed} failed`);
        console.log(`Total payload reduction: ${bytesRemovedMB}MB`);

        return NextResponse.json({
            success: true,
            stats: {
                ...stats,
                bytesRemovedMB: parseFloat(bytesRemovedMB)
            },
            duration: `${duration}s`
        });

    } catch (error: any) {
        console.error('Base64 Migration Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stats
        }, { status: 500 });
    }
}
