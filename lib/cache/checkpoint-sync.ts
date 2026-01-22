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
export async function runCheckpoint(): Promise<{
  synced: number;
  failed: number;
}> {
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
      console.log(
        `⏱️ [Checkpoint] Complete: ${synced} synced, ${failed} failed`
      );
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

/**
 * Compress data using browser's CompressionStream (gzip)
 * Falls back to uncompressed if not supported
 */
async function compressData(
  data: string
): Promise<{ compressed: ArrayBuffer; isCompressed: boolean }> {
  // Check if CompressionStream is supported
  if (typeof CompressionStream === 'undefined') {
    const encoder = new TextEncoder();
    return { compressed: encoder.encode(data).buffer, isCompressed: false };
  }

  try {
    const encoder = new TextEncoder();
    const inputBytes = encoder.encode(data);

    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(inputBytes);
    writer.close();

    const chunks: Uint8Array[] = [];
    const reader = cs.readable.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(
      `📦 Compressed ${(inputBytes.length / 1024).toFixed(1)}KB → ${(result.length / 1024).toFixed(1)}KB (${((1 - result.length / inputBytes.length) * 100).toFixed(0)}% reduction)`
    );

    return { compressed: result.buffer, isCompressed: true };
  } catch (error) {
    console.warn('Compression failed, sending uncompressed:', error);
    const encoder = new TextEncoder();
    return { compressed: encoder.encode(data).buffer, isCompressed: false };
  }
}

/**
 * Sync a single draft to server (Telegram upload + Firestore pointer)
 */
async function syncDraftToServer(draft: DraftEntry): Promise<boolean> {
  try {
    const jsonData = JSON.stringify(draft.course);
    const { compressed, isCompressed } = await compressData(jsonData);

    const response = await fetch(
      `/api/admin/checkpoint?courseId=${draft.courseId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': isCompressed
            ? 'application/gzip'
            : 'application/json',
          'Content-Encoding': isCompressed ? 'gzip' : 'identity',
        },
        body: compressed,
      }
    );

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
  const draft = dirtyDrafts.find((d) => d.courseId === courseId);

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
