/**
 * Course Storage Layer (Telegram + Firestore)
 * 
 * Combines:
 * - Firestore: Skeleton (metadata, sections, pointers)
 * - Telegram: Body (immutable course blobs)
 * - GDrive: Fallback if Telegram fails
 */

import { initAdmin } from '@/lib/auth/firebase-admin';
import { Course } from '@/lib/types';
import {
    CourseBlob,
    CourseFirestore,
    COURSE_BLOB_SCHEMA_VERSION
} from '@/lib/types/course-compact';
import {
    uploadCourseBlob,
    downloadCourseBlob,
    isTelegramEnabled,
    getBlobStats
} from '@/lib/storage/telegram-storage';
import { courseToBlob, blobToCourse } from '@/lib/storage/course-converter';
import {
    saveCourseToGDrive,
    getCourseFromGDrive,
    isDriveStorageEnabled
} from '@/lib/storage/gdrive-courses';
import {
    getPublishedPointer,
    getDraftPointer,
    getAnyPointer,
    invalidatePointerCache,
    updatePointerCache
} from '@/lib/cache/pointer-cache';
import {
    addToLocalRegistry,
    getFromLocalRegistry,
    getAllLocalCourses,
    removeFromLocalRegistry
} from '@/lib/cache/local-registry';

/**
 * Get Firestore instance
 */
function getFirestore() {
    try {
        const admin = initAdmin();
        return admin.firestore();
    } catch (error) {
        console.error('Failed to initialize Firestore:', error);
        return null;
    }
}

/**
 * Get course by ID (Telegram-first approach)
 * Checks local registry first for courses saved during Firestore outage
 */
export async function getCourse(id: string): Promise<Course | null> {
    // Step 0: Check local registry FIRST (for courses saved during Firestore outage)
    const localEntry = await getFromLocalRegistry(id);
    if (localEntry) {
        console.log(`📥 [LocalRegistry→TG] Fetching ${id}`);
        const blob = await downloadCourseBlob(localEntry.tg_file_id);
        if (blob) {
            return blobToCourse(id, localEntry.meta, localEntry.sections, blob);
        }
    }

    const db = getFirestore();
    if (!db) return null;

    try {
        const docRef = db.collection('courses').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        const data = docSnap.data() as any;

        // Prefer draft_snapshot for CMS editing, fall back to published for students
        const tgFileId = data.draft_snapshot?.tg_file_id || data.published?.tg_file_id;

        if (tgFileId) {
            const source = data.draft_snapshot?.tg_file_id ? 'draft' : 'published';
            console.log(`📥 [TG] Fetching ${id} from Telegram (${source})`);

            const blob = await downloadCourseBlob(tgFileId);

            if (blob) {
                const course = blobToCourse(id, data.meta, data.sections, blob);
                // Add draft info to course for CMS awareness
                (course as any)._isDraft = source === 'draft';
                (course as any)._hasDraftChanges = data.draft_snapshot?.dirty || false;
                return course;
            }

            console.warn(`⚠️ Telegram download failed for ${id}, trying fallback`);
        }

        // Fallback: Legacy Firestore or GDrive
        if (data._lessonsInSubcollection) {
            const lessonsSnap = await docRef.collection('lessons').orderBy('_order').get();
            const lessons = lessonsSnap.docs.map(doc => {
                const { _order, ...lessonData } = doc.data();
                return lessonData;
            });
            return { id, ...data, lessons } as Course;
        }

        if (data.lessons) {
            return { id, ...data } as Course;
        }

        // Try GDrive
        if (isDriveStorageEnabled()) {
            return await getCourseFromGDrive(id);
        }

        return null;
    } catch (error) {
        console.error(`Error getting course ${id}:`, error);
        return null;
    }
}

/**
 * Get ONLY published course (for students - never shows drafts)
 * 
 * CACHE-FIRST: Uses pointer cache to avoid Firestore reads!
 * Also checks local registry for courses published during outages.
 * Firestore only used as fallback for legacy courses.
 */
export async function getPublishedCourse(id: string): Promise<Course | null> {
    try {
        // Step 0: Check local registry FIRST (for courses saved during Firestore outage)
        // We use local registry as a fallback for courses that may not be in Firestore
        const localEntry = await getFromLocalRegistry(id);
        if (localEntry && !localEntry.pending_sync) {
            // Only use if marked as synced (meaning it was published)
            console.log(`📥 [LocalRegistry→TG] Fetching published ${id}`);
            const blob = await downloadCourseBlob(localEntry.tg_file_id);
            if (blob) {
                return blobToCourse(id, localEntry.meta, localEntry.sections, blob);
            }
        }

        // Step 1: Try pointer cache FIRST (no Firestore read!)
        const pointer = await getPublishedPointer(id);

        if (pointer?.tg_file_id) {
            console.log(`📥 [Cache→TG] Fetching ${id} (v${pointer.version}) - ZERO FIRESTORE!`);
            const blob = await downloadCourseBlob(pointer.tg_file_id);

            if (blob) {
                // Use cached metadata - NO Firestore read needed!
                return blobToCourse(
                    id,
                    pointer.meta || { title: id },
                    pointer.sections || [],
                    blob
                );
            }
        }

        // Step 2: Fallback to Firestore for legacy courses
        const db = getFirestore();
        if (!db) return null;

        const docRef = db.collection('courses').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) return null;

        const data = docSnap.data() as any;

        // Try published from Firestore (migrated course)
        if (data.published?.tg_file_id) {
            console.log(`📥 [Firestore→TG] Fetching ${id} (legacy path)`);
            const blob = await downloadCourseBlob(data.published.tg_file_id);
            if (blob) {
                return blobToCourse(id, data.meta, data.sections, blob);
            }
        }

        // Fallback to legacy embedded lessons
        if (data._lessonsInSubcollection) {
            const lessonsSnap = await docRef.collection('lessons').orderBy('_order').get();
            const lessons = lessonsSnap.docs.map(doc => doc.data());
            return { id, ...data, lessons } as Course;
        }

        if (data.lessons) {
            return { id, ...data } as Course;
        }

        return null;
    } catch (error) {
        console.error(`Error getting published course ${id}:`, error);
        return null;
    }
}

/**
 * Save course (Telegram-first, Firestore-resilient)
 * 
 * Priority:
 * 1. Telegram upload (always succeeds, no quota)
 * 2. Firestore pointer (optional - may fail if quota exhausted)
 * 3. GDrive fallback
 */
export async function saveCourse(id: string, course: Course): Promise<boolean> {
    const { blob, meta, sections } = courseToBlob(course);
    const stats = getBlobStats(blob);

    console.log(`📦 Saving ${id} (${stats.lessonCount} lessons, ${(stats.sizeBytes / 1024).toFixed(1)}KB)`);

    // Step 1: Try Telegram first (no quota limits)
    if (isTelegramEnabled()) {
        try {
            const { file_id, hash } = await uploadCourseBlob(id, blob);
            console.log(`✅ [Telegram] ${id} saved`);

            // Step 2: Try to update Firestore pointer (optional, with timeout)
            // Use Promise.race to timeout after 5 seconds
            const firestoreTimeout = new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error('Firestore timeout')), 5000)
            );

            const firestoreUpdate = async () => {
                const db = getFirestore();
                if (db) {
                    const existingDoc = await db.collection('courses').doc(id).get();
                    const existingData = existingDoc.exists ? existingDoc.data() : {};

                    await db.collection('courses').doc(id).set({
                        meta,
                        sections,
                        draft_snapshot: {
                            tg_file_id: file_id,
                            version: (existingData?.draft_snapshot?.version || 0) + 1,
                            hash,
                            savedAt: new Date().toISOString(),
                            dirty: true,
                        },
                        published: existingData?.published || null,
                        status: existingData?.published ? 'published' : 'draft',
                        createdAt: course.createdAt || existingData?.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }, { merge: true });

                    console.log(`✅ [Firestore] ${id} pointer updated`);
                }
            };

            try {
                await Promise.race([firestoreUpdate(), firestoreTimeout]);
            } catch (firestoreError: any) {
                // Firestore failed/timed out but Telegram succeeded
                // Add to local registry so course is still accessible!
                await addToLocalRegistry(id, file_id, meta as any, sections);

                if (firestoreError?.message === 'Firestore timeout') {
                    console.warn(`⚠️ [Firestore] Timeout after 5s - saved to Telegram + local registry`);
                } else if (firestoreError?.code === 8 || firestoreError?.message?.includes('RESOURCE_EXHAUSTED')) {
                    console.warn(`⚠️ [Firestore] Quota exhausted - saved to Telegram + local registry`);
                } else {
                    console.warn(`⚠️ [Firestore] Failed:`, firestoreError?.message);
                }
            }

            return true; // Success - Telegram save worked
        } catch (telegramError) {
            console.error(`❌ Telegram failed:`, telegramError);
        }
    }

    // Fallback to GDrive
    if (isDriveStorageEnabled()) {
        return await saveCourseToGDrive(id, course);
    }

    // Last resort: legacy Firestore (may fail if quota exhausted)
    try {
        const db = getFirestore();
        if (!db) return false;

        const { id: _, lessons, ...metadata } = course;
        await db.collection('courses').doc(id).set({
            ...metadata,
            lessons,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        return true;
    } catch (error: any) {
        if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`⚠️ [Firestore] Quota exhausted - cannot save course without Telegram`);
        } else {
            console.error(`Error saving course ${id}:`, error);
        }
        return false;
    }
}

/**
 * List all courses (metadata only, Firestore-resilient)
 * Includes courses from local registry (saved during Firestore outage)
 */
export async function listCourses(): Promise<Course[]> {
    const courses: Course[] = [];
    const seenIds = new Set<string>();

    // Step 1: Add courses from local registry FIRST (newest, may not be in Firestore)
    const localCourses = await getAllLocalCourses();
    for (const local of localCourses) {
        courses.push({
            id: local.id,
            title: local.meta.title || '',
            description: local.meta.description || '',
            thumbnail: local.meta.thumbnail || '',
            instructor: local.meta.instructor || '',
            category: local.meta.category || '',
            level: (local.meta.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
            duration: '',
            lessonsCount: 1,
            enrolledCount: 0,
            rating: 0,
            price: 0,
            lessons: [],
            isPublished: false,
            createdAt: local.createdAt,
        } as Course);
        seenIds.add(local.id);
    }

    if (localCourses.length > 0) {
        console.log(`📋 [LocalRegistry] Added ${localCourses.length} local course(s)`);
    }

    // Step 2: Add courses from Firestore
    const db = getFirestore();
    if (db) {
        try {
            const snapshot = await db.collection('courses').get();

            snapshot.forEach(doc => {
                // Skip if already added from local registry
                if (seenIds.has(doc.id)) return;

                const data = doc.data();
                courses.push({
                    id: doc.id,
                    title: data.meta?.title || data.title || '',
                    description: data.meta?.description || data.description || '',
                    thumbnail: data.meta?.thumbnail || data.thumbnail || '',
                    instructor: data.meta?.instructor || data.instructor || '',
                    category: data.meta?.category || data.category || '',
                    level: data.meta?.level || data.level || 'beginner',
                    duration: data.meta?.duration || data.duration || '',
                    lessonsCount: data.published?.lessonCount || data.lessonsCount || 0,
                    enrolledCount: data.enrolledCount || 0,
                    rating: data.rating || 0,
                    price: data.price || 0,
                    lessons: [],
                    isPublished: data.status === 'published' || data.isPublished,
                } as Course);
            });

            console.log(`📋 Listed ${courses.length} courses (${localCourses.length} local + ${courses.length - localCourses.length} Firestore)`);
        } catch (error: any) {
            if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(`⚠️ [Firestore] Quota exhausted - returning local courses only`);
            } else {
                console.error('Error listing courses:', error);
            }
        }
    }

    return courses;
}

/**
 * Delete course (from Firestore AND local registry)
 */
export async function deleteCourse(id: string): Promise<boolean> {
    // Remove from local registry first (always do this)
    await removeFromLocalRegistry(id);

    const db = getFirestore();
    if (!db) {
        console.log(`✅ Deleted ${id} from local registry (Firestore unavailable)`);
        return true;
    }

    try {
        await db.collection('courses').doc(id).delete();
        console.log(`✅ Deleted ${id} from Firestore and local registry`);
        return true;
    } catch (error: any) {
        if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`⚠️ [Firestore] Quota exhausted - deleted from local registry only`);
            return true;  // Local registry deletion succeeded
        }
        console.error(`Error deleting course ${id}:`, error);
        return false;
    }
}

export function ensureDataDir() {
    // No-op for compatibility
}
