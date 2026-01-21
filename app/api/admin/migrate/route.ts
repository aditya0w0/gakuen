import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { getFileFromDrive } from '@/lib/storage/google-drive';
import { uploadToR2 } from '@/lib/storage/r2-storage';
import { downloadCourseBlob, uploadCourseBlob, isTelegramEnabled } from '@/lib/storage/telegram-storage';
import { addToLocalRegistry, getFromLocalRegistry, markAsSynced } from '@/lib/cache/local-registry';
import { updatePointerCache } from '@/lib/cache/pointer-cache';

export const dynamic = 'force-dynamic';

/**
 * RECURSIVE MIGRATION ENGINE
 * Scans objects (metadata, components, lesson content) for Google Drive links
 * and replaces them with R2 URLs.
 */
async function migrateRecursive(obj: any, stats: any): Promise<any> {
    if (!obj) return obj;

    // Handle character-based replacements (strings)
    if (typeof obj === 'string') {
        // Find Drive file IDs in URLs: /api/images/[FILE_ID]
        const driveRegex = /\/api\/images\/([a-zA-Z0-9_-]{25,})/g;
        let newContent = obj;

        // Collect all matches first to avoid issues with concurrent migration
        const matches = [...obj.matchAll(driveRegex)];

        for (const match of matches) {
            const driveFileId = match[1];

            // Skip if already migrated (starts with r2-)
            if (driveFileId.startsWith('r2-')) continue;

            console.log(`🔍 Found Drive image: ${driveFileId}`);
            stats.found++;

            try {
                // 1. Download from Drive
                const file = await getFileFromDrive(driveFileId);
                if (file) {
                    // 2. Upload to R2
                    const r2Result = await uploadToR2(file.buffer, `migrated-${driveFileId}.webp`, 'cms', file.mimeType);

                    // 3. Replace in content
                    const driveUrl = `/api/images/${driveFileId}`;
                    newContent = newContent.replaceAll(driveUrl, r2Result.url);

                    console.log(`✅ Migrated: ${driveFileId} -> ${r2Result.fileId}`);
                    stats.migrated++;
                } else {
                    console.warn(`⚠️ Could not fetch from Drive: ${driveFileId}`);
                    stats.failed++;
                }
            } catch (err) {
                console.error(`❌ Migration failed for ${driveFileId}:`, err);
                stats.failed++;
            }
        }
        return newContent;
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
        const results = await Promise.all(obj.map(item => migrateRecursive(item, stats)));
        return results;
    }

    // Handle Objects
    if (typeof obj === 'object') {
        const migrated: any = {};
        for (const [key, value] of Object.entries(obj)) {
            migrated[key] = await migrateRecursive(value, stats);
        }
        return migrated;
    }

    return obj;
}

export async function POST(request: NextRequest) {
    const stats = { found: 0, migrated: 0, failed: 0, coursesPatched: 0, blobsUpdated: 0 };
    const startTime = Date.now();

    try {
        const admin = initAdmin();
        const db = admin.firestore();

        console.log("🚀 Starting Architecture-Aware Migration...");

        // --- STEP 1: MIGRATE USER AVATARS ---
        const usersSnap = await db.collection('users').get();
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            if (userData.avatar) {
                const migratedAvatar = await migrateRecursive(userData.avatar, stats);
                if (migratedAvatar !== userData.avatar) {
                    await userDoc.ref.update({ avatar: migratedAvatar });
                }
            }
        }

        // --- STEP 2: MIGRATE COURSES (Metadata & Content) ---
        const coursesSnap = await db.collection('courses').get();
        for (const courseDoc of coursesSnap.docs) {
            const courseId = courseDoc.id;
            const courseData = courseDoc.data();
            let needsFirestoreUpdate = false;
            let courseStats = { found: 0, migrated: 0, failed: 0 };

            console.log(`\n📦 Processing Course: ${courseId}`);

            // A. Migrate Metadata (thumbnail, instructorAvatar)
            if (courseData.meta) {
                const migratedMeta = await migrateRecursive(courseData.meta, courseStats);
                if (JSON.stringify(migratedMeta) !== JSON.stringify(courseData.meta)) {
                    courseData.meta = migratedMeta;
                    needsFirestoreUpdate = true;
                }
                // Aggregate metadata stats
                stats.found += courseStats.found;
                stats.migrated += courseStats.migrated;
                stats.failed += courseStats.failed;

                // Reset courseStats for next phase if needed
                courseStats = { found: 0, migrated: 0, failed: 0 };
            }

            // B. Migrate Telegram Blobs (Deep Sync)
            // We need to check both Published and Draft blobs
            const blobsToHandle = [
                { type: 'published', data: courseData.published },
                { type: 'draft', data: courseData.draft_snapshot }
            ].filter(b => b.data?.tg_file_id);

            for (const blobInfo of blobsToHandle) {
                try {
                    const type = blobInfo.type as 'published' | 'draft';
                    const fileId = blobInfo.data.tg_file_id;

                    console.log(`  📥 Downloading ${type} blob from Telegram: ${fileId}`);
                    const blob = await downloadCourseBlob(fileId);

                    if (blob) {
                        const blobStats = { found: 0, migrated: 0, failed: 0 };
                        const migratedBlob = await migrateRecursive(blob, blobStats);

                        if (blobStats.migrated > 0) {
                            console.log(`  🛠️ Patching ${type} blob (${blobStats.migrated} images)...`);

                            // Upload patched blob back to Telegram
                            const { file_id: newFileId, hash } = await uploadCourseBlob(courseId, migratedBlob);

                            // Update statistics for re-uploads
                            stats.blobsUpdated++;

                            // Update the pointers in Firestore data
                            if (type === 'published') {
                                courseData.published.tg_file_id = newFileId;
                                courseData.published.hash = hash;
                            } else {
                                courseData.draft_snapshot.tg_file_id = newFileId;
                                courseData.draft_snapshot.hash = hash;
                            }
                            needsFirestoreUpdate = true;

                            // Update Pointer Cache
                            updatePointerCache(courseId, type, {
                                tg_file_id: newFileId,
                                version: blobInfo.data.version || 1,
                                hash,
                                meta: courseData.meta,
                                sections: courseData.sections
                            });
                        }

                        // Always update global statistics from blob scan
                        stats.found += blobStats.found;
                        stats.migrated += blobStats.migrated;
                        stats.failed += blobStats.failed;
                    }
                } catch (blobErr) {
                    console.error(`  ❌ Failed to migrate ${blobInfo.type} blob for ${courseId}:`, blobErr);
                }
            }

            // C. Final Housekeeping for the course
            if (needsFirestoreUpdate) {
                await courseDoc.ref.update(courseData);
                stats.coursesPatched++;

                // D. Update Local Registry (Vercel Blob) if exists
                const registryEntry = await getFromLocalRegistry(courseId);
                if (registryEntry) {
                    console.log(`  💾 Updating Local Registry (Vercel Blob) for ${courseId}`);
                    // Use the latest published tg_file_id if available
                    const finalTgId = courseData.published?.tg_file_id || courseData.draft_snapshot?.tg_file_id;
                    await addToLocalRegistry(courseId, finalTgId, courseData.meta, courseData.sections);
                    if (!courseData.draft_snapshot?.dirty) {
                        await markAsSynced(courseId);
                    }
                }
            }
        }

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n✅ Migration Complete in ${duration}s!`);
        console.log(`Summary: ${stats.found} found, ${stats.migrated} migrated, ${stats.failed} failed, ${stats.coursesPatched} courses updated, ${stats.blobsUpdated} blobs re-uploaded.`);

        return NextResponse.json({
            success: true,
            stats,
            duration: `${duration}s`
        });

    } catch (error: any) {
        console.error('Migration API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
