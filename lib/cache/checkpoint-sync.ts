/**
 * Checkpoint Sync Manager
 * 
 * Periodically (every 30s) syncs dirty drafts from IndexedDB to Telegram.
 * Updates Firestore draft_snapshot pointer for crash recovery.
 */

import { getAllDirtyDrafts, markDraftSynced, DraftEntry } from './draft-cache';

// Sync interval (30 seconds)
const SYNC_INTERVAL_MS = 30 * 1000;

// Track active sync
let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

/**
 * Start the checkpoint sync loop
 */
export function startCheckpointSync(): void {
    if (syncInterval) {
        console.log('⏱️ Checkpoint sync already running');
        return;
    }

    console.log('⏱️ Starting 30s checkpoint sync...');

    syncInterval = setInterval(async () => {
        await runCheckpoint();
    }, SYNC_INTERVAL_MS);

    // Also run immediately on start
    runCheckpoint();
}

/**
 * Stop the checkpoint sync loop
 */
export function stopCheckpointSync(): void {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('⏱️ Checkpoint sync stopped');
    }
}

/**
 * Run a single checkpoint (sync all dirty drafts)
 */
export async function runCheckpoint(): Promise<{ synced: number; failed: number }> {
    if (isSyncing) {
        console.log('⏱️ Checkpoint already in progress, skipping');
        return { synced: 0, failed: 0 };
    }

    isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
        const dirtyDrafts = await getAllDirtyDrafts();

        if (dirtyDrafts.length === 0) {
            return { synced: 0, failed: 0 };
        }

        console.log(`⏱️ [Checkpoint] Found ${dirtyDrafts.length} dirty draft(s)`);

        for (const draft of dirtyDrafts) {
            try {
                const success = await syncDraftToServer(draft);
                if (success) {
                    await markDraftSynced(draft.courseId);
                    synced++;
                    console.log(`✅ [Checkpoint] Synced ${draft.courseId}`);
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(`❌ [Checkpoint] Failed ${draft.courseId}:`, error);
                failed++;
            }
        }

        if (synced > 0 || failed > 0) {
            console.log(`⏱️ [Checkpoint] Complete: ${synced} synced, ${failed} failed`);
        }
    } finally {
        isSyncing = false;
    }

    return { synced, failed };
}

/**
 * Sync a single draft to server (Telegram upload + Firestore pointer)
 */
async function syncDraftToServer(draft: DraftEntry): Promise<boolean> {
    try {
        // Use the migrate-test endpoint for now (no auth)
        const response = await fetch(`/api/admin/checkpoint?courseId=${draft.courseId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(draft.course),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Checkpoint API error: ${response.status}`, text);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Checkpoint sync error:', error);
        return false;
    }
}

/**
 * Force sync a specific course (manual trigger)
 */
export async function forceSyncCourse(courseId: string): Promise<boolean> {
    const dirtyDrafts = await getAllDirtyDrafts();
    const draft = dirtyDrafts.find(d => d.courseId === courseId);

    if (!draft) {
        console.log(`No dirty draft for ${courseId}`);
        return true; // Nothing to sync
    }

    const success = await syncDraftToServer(draft);
    if (success) {
        await markDraftSynced(courseId);
    }
    return success;
}

// Export the DraftEntry type for external use
export type { DraftEntry };
