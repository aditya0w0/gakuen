/**
 * CMS Draft Cache - IndexedDB-first autosave
 * 
 * Saves all edits locally, only syncs to Telegram on explicit publish.
 * This bypasses Firestore quota limits for autosave.
 */

const DB_NAME = 'gakuen-cms-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

export interface DraftEntry {
    courseId: string;
    course: any;  // Full course data
    lastModified: number;
    syncedAt?: number;
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
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'courseId' });
            }
        };
    });

    return dbPromise;
}

/**
 * Save draft locally (instant, no API call)
 */
export async function saveDraftLocal(courseId: string, course: any): Promise<void> {
    try {
        const db = await getDB();

        const entry: DraftEntry = {
            courseId,
            course,
            lastModified: Date.now(),
            dirty: true,
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(entry);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log(`💾 [Local] Saved draft for ${courseId}`);
                resolve();
            };
        });
    } catch (error) {
        console.error('Local save error:', error);
    }
}

/**
 * Get draft from local cache
 */
export async function getDraftLocal(courseId: string): Promise<any | null> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(courseId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const entry = request.result as DraftEntry | undefined;
                if (entry) {
                    console.log(`📂 [Local] Loaded draft for ${courseId} (${new Date(entry.lastModified).toLocaleTimeString()})`);
                    resolve(entry.course);
                } else {
                    resolve(null);
                }
            };
        });
    } catch (error) {
        console.error('Local get error:', error);
        return null;
    }
}

/**
 * Check if local draft exists and is newer than synced version
 */
export async function hasDirtyDraft(courseId: string): Promise<boolean> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(courseId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const entry = request.result as DraftEntry | undefined;
                resolve(entry?.dirty || false);
            };
        });
    } catch (error) {
        return false;
    }
}

/**
 * Mark draft as synced (after successful Telegram upload)
 */
export async function markDraftSynced(courseId: string): Promise<void> {
    try {
        const db = await getDB();

        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(courseId);

        request.onsuccess = () => {
            const entry = request.result as DraftEntry | undefined;
            if (entry) {
                entry.syncedAt = Date.now();
                entry.dirty = false;
                store.put(entry);
                console.log(`✅ [Local] Marked ${courseId} as synced`);
            }
        };
    } catch (error) {
        console.error('Mark synced error:', error);
    }
}

/**
 * Get all dirty drafts (for batch sync)
 */
export async function getAllDirtyDrafts(): Promise<DraftEntry[]> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const entries = request.result as DraftEntry[];
                resolve(entries.filter(e => e.dirty));
            };
        });
    } catch (error) {
        console.error('Get all drafts error:', error);
        return [];
    }
}

/**
 * Clear local draft (after delete or full sync)
 */
export async function clearDraftLocal(courseId: string): Promise<void> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(courseId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    } catch (error) {
        console.error('Clear draft error:', error);
    }
}
