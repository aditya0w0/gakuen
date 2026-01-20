/**
 * Firestore Sync Queue
 * 
 * Syncs pending courses from local registry to Firestore.
 * Call this periodically or when Firestore becomes available.
 */

import { initAdmin } from '@/lib/auth/firebase-admin';
import {
    getAllLocalCourses,
    removeFromLocalRegistry,
    markAsSynced,
    LocalCourseEntry
} from '@/lib/cache/local-registry';
import { invalidatePointerCache } from '@/lib/cache/pointer-cache';

interface SyncResult {
    synced: string[];
    failed: string[];
    skipped: string[];
    quota_exhausted: boolean;
}

/**
 * Try to sync one course to Firestore
 */
async function syncCourse(entry: LocalCourseEntry, db: any): Promise<boolean> {
    try {
        const docRef = db.collection('courses').doc(entry.id);

        // Check if already exists
        const existing = await docRef.get();
        const existingData = existing.exists ? existing.data() : {};

        await docRef.set({
            meta: entry.meta,
            sections: entry.sections,
            draft_snapshot: {
                tg_file_id: entry.tg_file_id,
                version: (existingData?.draft_snapshot?.version || 0) + 1,
                savedAt: new Date().toISOString(),
                dirty: false,
            },
            published: existingData?.published || null,
            status: existingData?.published ? 'published' : 'draft',
            createdAt: entry.createdAt || existingData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        return true;
    } catch (error: any) {
        if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('QUOTA_EXHAUSTED');
        }
        console.error(`Failed to sync ${entry.id}:`, error?.message);
        return false;
    }
}

/**
 * Sync all pending courses from local registry to Firestore
 */
export async function syncPendingCourses(): Promise<SyncResult> {
    const result: SyncResult = {
        synced: [],
        failed: [],
        skipped: [],
        quota_exhausted: false,
    };

    const allCourses = await getAllLocalCourses();
    const pendingCourses = allCourses.filter(c => c.pending_sync);

    if (pendingCourses.length === 0) {
        console.log('📋 [SyncQueue] No pending courses to sync');
        return result;
    }

    console.log(`📤 [SyncQueue] Syncing ${pendingCourses.length} pending course(s)...`);

    try {
        const admin = initAdmin();
        const db = admin.firestore();

        for (const entry of pendingCourses) {
            try {
                const success = await syncCourse(entry, db);

                if (success) {
                    // Mark as synced but keep in registry for cache
                    await markAsSynced(entry.id);
                    result.synced.push(entry.id);
                    console.log(`✅ [SyncQueue] Synced ${entry.id}`);
                } else {
                    result.failed.push(entry.id);
                }
            } catch (error: any) {
                if (error?.message === 'QUOTA_EXHAUSTED') {
                    console.warn('⚠️ [SyncQueue] Firestore quota still exhausted, stopping sync');
                    result.quota_exhausted = true;
                    break;
                }
                result.failed.push(entry.id);
            }
        }

        // Invalidate pointer cache if any synced
        if (result.synced.length > 0) {
            invalidatePointerCache();
        }

    } catch (error: any) {
        console.error('❌ [SyncQueue] Sync failed:', error?.message);
        if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            result.quota_exhausted = true;
        }
    }

    console.log(`📋 [SyncQueue] Done: ${result.synced.length} synced, ${result.failed.length} failed`);
    return result;
}

/**
 * Check if sync is needed
 */
export async function hasPendingSync(): Promise<boolean> {
    const courses = await getAllLocalCourses();
    return courses.some(c => c.pending_sync);
}

/**
 * Get count of pending sync items
 */
export async function getPendingSyncCount(): Promise<number> {
    const courses = await getAllLocalCourses();
    return courses.filter(c => c.pending_sync).length;
}
