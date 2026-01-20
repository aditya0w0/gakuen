/**
 * Local Course Registry - WITH VERCEL BLOB PERSISTENCE
 * 
 * When Firestore quota is exhausted, we save course pointers here.
 * Uses Vercel Blob for cloud persistence (survives deployments!)
 * Falls back to local file for development.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LocalCourseEntry {
    id: string;
    tg_file_id: string;
    meta: {
        title: string;
        description?: string;
        thumbnail?: string;
        instructor?: string;
        category?: string;
        level?: 'beginner' | 'intermediate' | 'advanced';
    };
    sections: any[];
    createdAt: string;
    pending_sync: boolean;
}

// In-memory registry
let localRegistry = new Map<string, LocalCourseEntry>();
let loaded = false;
let saveInProgress = false;

// Local file fallback for development
const LOCAL_REGISTRY_FILE = path.join(process.cwd(), '.data', 'local-registry.json');
const BLOB_FILENAME = 'course-registry.json';

/**
 * Check if Vercel Blob is configured
 */
function isBlobEnabled(): boolean {
    return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Load from Vercel Blob
 */
async function loadFromBlob(): Promise<LocalCourseEntry[]> {
    try {
        const { list, head } = await import('@vercel/blob');

        // List blobs to find our registry
        const { blobs } = await list({ prefix: BLOB_FILENAME });

        if (blobs.length === 0) {
            console.log('📂 [Blob] No registry found, starting fresh');
            return [];
        }

        // Fetch the blob
        const response = await fetch(blobs[0].url);
        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
        }

        const entries = await response.json() as LocalCourseEntry[];
        console.log(`📂 [Blob] Loaded ${entries.length} courses from Vercel Blob`);
        return entries;
    } catch (error) {
        console.warn('⚠️ [Blob] Failed to load:', error);
        return [];
    }
}

/**
 * Save to Vercel Blob
 */
async function saveToBlob(): Promise<void> {
    if (saveInProgress) return;
    saveInProgress = true;

    try {
        const { put, del, list } = await import('@vercel/blob');

        const entries = Array.from(localRegistry.values());
        const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });

        // Delete old blob if exists
        const { blobs } = await list({ prefix: BLOB_FILENAME });
        for (const oldBlob of blobs) {
            await del(oldBlob.url);
        }

        // Upload new blob
        await put(BLOB_FILENAME, blob, {
            access: 'public',
            addRandomSuffix: false,
        });

        console.log(`💾 [Blob] Saved ${entries.length} courses to Vercel Blob`);
    } catch (error) {
        console.warn('⚠️ [Blob] Failed to save:', error);
    } finally {
        saveInProgress = false;
    }
}

/**
 * Load from local file (fallback for development)
 */
function loadFromFile(): LocalCourseEntry[] {
    try {
        const dir = path.dirname(LOCAL_REGISTRY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(LOCAL_REGISTRY_FILE)) {
            const data = fs.readFileSync(LOCAL_REGISTRY_FILE, 'utf-8');
            const entries = JSON.parse(data) as LocalCourseEntry[];
            console.log(`📂 [File] Loaded ${entries.length} courses from disk`);
            return entries;
        }
    } catch (error) {
        console.warn('⚠️ [File] Failed to load:', error);
    }
    return [];
}

/**
 * Save to local file (fallback for development)
 */
function saveToFile(): void {
    try {
        const dir = path.dirname(LOCAL_REGISTRY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const entries = Array.from(localRegistry.values());
        fs.writeFileSync(LOCAL_REGISTRY_FILE, JSON.stringify(entries, null, 2));
        console.log(`💾 [File] Saved ${entries.length} courses to disk`);
    } catch (error) {
        console.warn('⚠️ [File] Failed to save:', error);
    }
}

/**
 * Ensure registry is loaded from both file and blob
 */
async function ensureLoaded(): Promise<void> {
    if (loaded) return;

    console.log(`🔄 [Registry] Loading... (Blob enabled: ${isBlobEnabled()})`);

    // On Vercel, prioritize Blob since file doesn't persist
    if (isBlobEnabled()) {
        try {
            const blobEntries = await loadFromBlob();
            for (const entry of blobEntries) {
                localRegistry.set(entry.id, entry);
            }
            console.log(`📂 [Registry] Loaded ${blobEntries.length} entries from Blob`);
        } catch (error) {
            console.warn('⚠️ [Registry] Could not load from blob:', error);
        }
    }

    // Then merge with file entries (for local dev - file is faster)
    try {
        const fileEntries = loadFromFile();
        for (const entry of fileEntries) {
            // In dev, file is more recent. On prod, this won't find anything.
            if (!localRegistry.has(entry.id)) {
                localRegistry.set(entry.id, entry);
            }
        }
        if (fileEntries.length > 0) {
            console.log(`📂 [Registry] Merged ${fileEntries.length} entries from file`);
        }
    } catch {
        // File read can fail on Vercel - that's OK
    }

    console.log(`✅ [Registry] Total: ${localRegistry.size} courses`);
    loaded = true;
}

/**
 * Save registry - Always save to file first (instant), then to blob (cloud backup)
 */
async function save(): Promise<void> {
    // Always save to file first - this is instant and ensures immediate availability
    saveToFile();

    // Then save to blob for cloud persistence (async, don't block)
    if (isBlobEnabled()) {
        // Fire and forget - don't await, but log errors
        saveToBlob().catch(err => console.warn('⚠️ [Blob] Background save failed:', err));
    }
}

// ============ PUBLIC API ============

/**
 * Add course to local registry when Firestore save fails
 */
export async function addToLocalRegistry(
    courseId: string,
    tg_file_id: string,
    meta: LocalCourseEntry['meta'],
    sections: any[] = []
): Promise<void> {
    await ensureLoaded();

    localRegistry.set(courseId, {
        id: courseId,
        tg_file_id,
        meta,
        sections,
        createdAt: new Date().toISOString(),
        pending_sync: true,
    });

    await save();
    console.log(`📝 [Registry] Added ${courseId} (pending Firestore sync)`);
}

/**
 * Get course from local registry
 */
export async function getFromLocalRegistry(courseId: string): Promise<LocalCourseEntry | null> {
    await ensureLoaded();
    return localRegistry.get(courseId) || null;
}

/**
 * Get all courses from local registry
 */
export async function getAllLocalCourses(): Promise<LocalCourseEntry[]> {
    await ensureLoaded();
    return Array.from(localRegistry.values());
}

/**
 * Remove course from local registry (after successful Firestore sync)
 */
export async function removeFromLocalRegistry(courseId: string): Promise<void> {
    await ensureLoaded();

    if (localRegistry.delete(courseId)) {
        await save();
        console.log(`✅ [Registry] Removed ${courseId} (synced to Firestore)`);
    }
}

/**
 * Check if course exists in local registry
 */
export async function isInLocalRegistry(courseId: string): Promise<boolean> {
    await ensureLoaded();
    return localRegistry.has(courseId);
}

/**
 * Get registry stats
 */
export async function getLocalRegistryStats(): Promise<{ count: number; courses: string[] }> {
    await ensureLoaded();
    return {
        count: localRegistry.size,
        courses: Array.from(localRegistry.keys()),
    };
}

/**
 * Mark course as synced (but keep in registry for cache purposes)
 */
export async function markAsSynced(courseId: string): Promise<void> {
    await ensureLoaded();

    const entry = localRegistry.get(courseId);
    if (entry) {
        entry.pending_sync = false;
        await save();
    }
}

/**
 * Clear all entries (for testing)
 */
export async function clearLocalRegistry(): Promise<void> {
    localRegistry.clear();
    await save();
    console.log('🗑️ [Registry] Cleared all entries');
}
