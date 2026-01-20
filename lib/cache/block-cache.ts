/**
 * Per-Block IndexedDB Cache
 * 
 * Stores individual blocks for granular autosave.
 * This enables:
 * - Per-block dirty tracking
 * - Minimal sync payloads
 * - Offline block-level editing
 */

import { BlockCompact } from '@/lib/types/course-compact';

const DB_NAME = 'gakuen-blocks';
const DB_VERSION = 1;
const BLOCKS_STORE = 'blocks';
const LESSONS_STORE = 'lessons';

interface BlockEntry {
    key: string;  // courseId:blockId
    courseId: string;
    blockId: string;
    block: BlockCompact;
    lastModified: number;
    dirty: boolean;
}

interface LessonEntry {
    key: string;  // courseId:lessonId
    courseId: string;
    lessonId: string;
    title: string;
    blockIds: string[];  // Ordered block IDs
    lastModified: number;
    dirty: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB not available'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Blocks store with indexes
            if (!db.objectStoreNames.contains(BLOCKS_STORE)) {
                const blockStore = db.createObjectStore(BLOCKS_STORE, { keyPath: 'key' });
                blockStore.createIndex('courseId', 'courseId', { unique: false });
                blockStore.createIndex('dirty', 'dirty', { unique: false });
            }

            // Lessons store
            if (!db.objectStoreNames.contains(LESSONS_STORE)) {
                const lessonStore = db.createObjectStore(LESSONS_STORE, { keyPath: 'key' });
                lessonStore.createIndex('courseId', 'courseId', { unique: false });
            }
        };
    });

    return dbPromise;
}

/**
 * Save a single block (instant, local only)
 */
export async function saveBlock(
    courseId: string,
    blockId: string,
    block: BlockCompact
): Promise<void> {
    const db = await getDB();

    const entry: BlockEntry = {
        key: `${courseId}:${blockId}`,
        courseId,
        blockId,
        block,
        lastModified: Date.now(),
        dirty: true,
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BLOCKS_STORE, 'readwrite');
        const store = tx.objectStore(BLOCKS_STORE);
        const request = store.put(entry);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log(`💾 [Block] Saved ${blockId}`);
            resolve();
        };
    });
}

/**
 * Get a single block
 */
export async function getBlock(
    courseId: string,
    blockId: string
): Promise<BlockCompact | null> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BLOCKS_STORE, 'readonly');
        const store = tx.objectStore(BLOCKS_STORE);
        const request = store.get(`${courseId}:${blockId}`);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const entry = request.result as BlockEntry | undefined;
            resolve(entry?.block || null);
        };
    });
}

/**
 * Get all blocks for a course
 */
export async function getCourseBlocks(
    courseId: string
): Promise<Record<string, BlockCompact>> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BLOCKS_STORE, 'readonly');
        const store = tx.objectStore(BLOCKS_STORE);
        const index = store.index('courseId');
        const request = index.getAll(courseId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const entries = request.result as BlockEntry[];
            const blocks: Record<string, BlockCompact> = {};
            for (const entry of entries) {
                blocks[entry.blockId] = entry.block;
            }
            resolve(blocks);
        };
    });
}

/**
 * Get all dirty blocks for a course (for sync)
 */
export async function getDirtyBlocks(
    courseId: string
): Promise<BlockEntry[]> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BLOCKS_STORE, 'readonly');
        const store = tx.objectStore(BLOCKS_STORE);
        const index = store.index('courseId');
        const request = index.getAll(courseId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const entries = request.result as BlockEntry[];
            resolve(entries.filter(e => e.dirty));
        };
    });
}

/**
 * Mark blocks as synced
 */
export async function markBlocksSynced(
    courseId: string,
    blockIds: string[]
): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(BLOCKS_STORE, 'readwrite');
    const store = tx.objectStore(BLOCKS_STORE);

    for (const blockId of blockIds) {
        const key = `${courseId}:${blockId}`;
        const request = store.get(key);

        request.onsuccess = () => {
            const entry = request.result as BlockEntry | undefined;
            if (entry) {
                entry.dirty = false;
                store.put(entry);
            }
        };
    }
}

/**
 * Save lesson structure (block order)
 */
export async function saveLessonStructure(
    courseId: string,
    lessonId: string,
    title: string,
    blockIds: string[]
): Promise<void> {
    const db = await getDB();

    const entry: LessonEntry = {
        key: `${courseId}:${lessonId}`,
        courseId,
        lessonId,
        title,
        blockIds,
        lastModified: Date.now(),
        dirty: true,
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(LESSONS_STORE, 'readwrite');
        const store = tx.objectStore(LESSONS_STORE);
        const request = store.put(entry);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get lesson structure
 */
export async function getLessonStructure(
    courseId: string,
    lessonId: string
): Promise<LessonEntry | null> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(LESSONS_STORE, 'readonly');
        const store = tx.objectStore(LESSONS_STORE);
        const request = store.get(`${courseId}:${lessonId}`);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            resolve(request.result || null);
        };
    });
}

/**
 * Delete a block
 */
export async function deleteBlock(
    courseId: string,
    blockId: string
): Promise<void> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BLOCKS_STORE, 'readwrite');
        const store = tx.objectStore(BLOCKS_STORE);
        const request = store.delete(`${courseId}:${blockId}`);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Clear all blocks for a course
 */
export async function clearCourseBlocks(courseId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction([BLOCKS_STORE, LESSONS_STORE], 'readwrite');

    // Clear blocks
    const blockStore = tx.objectStore(BLOCKS_STORE);
    const blockIndex = blockStore.index('courseId');
    const blockRequest = blockIndex.getAllKeys(courseId);

    blockRequest.onsuccess = () => {
        for (const key of blockRequest.result) {
            blockStore.delete(key);
        }
    };

    // Clear lessons
    const lessonStore = tx.objectStore(LESSONS_STORE);
    const lessonIndex = lessonStore.index('courseId');
    const lessonRequest = lessonIndex.getAllKeys(courseId);

    lessonRequest.onsuccess = () => {
        for (const key of lessonRequest.result) {
            lessonStore.delete(key);
        }
    };
}

export type { BlockEntry, LessonEntry };
