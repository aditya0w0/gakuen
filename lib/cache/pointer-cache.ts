/**
 * Course Pointer Cache
 * 
 * Caches courseId → tg_file_id mappings in memory.
 * Loads from Firestore ONCE, then serves from cache.
 * Invalidate on publish to refresh.
 * 
 * This eliminates Firestore reads for student course views!
 */

import { initAdmin } from '@/lib/auth/firebase-admin';

export interface PointerEntry {
    tg_file_id: string;
    version: number;
    hash?: string;
    // Include meta so we don't need Firestore for reads
    meta?: {
        title: string;
        description?: string;
        thumbnail?: string;
        instructor?: string;
        category?: string;
        level?: 'beginner' | 'intermediate' | 'advanced';
    };
    sections?: { id: string; t: string; l: string[] }[];
}

interface PointerMap {
    published: Record<string, PointerEntry>;  // For students
    draft: Record<string, PointerEntry>;      // For CMS
}

// In-memory cache
let pointerCache: PointerMap | null = null;
let lastLoadTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;  // 5 minutes

/**
 * Load all course pointers from Firestore (ONCE)
 */
async function loadPointers(): Promise<PointerMap> {
    console.log('📥 [PointerCache] Loading course pointers from Firestore...');

    const map: PointerMap = { published: {}, draft: {} };

    try {
        const admin = initAdmin();
        const db = admin.firestore();

        // Fetch pointers + meta + sections (still small, avoids per-course reads)
        const snapshot = await db.collection('courses')
            .select('published', 'draft_snapshot', 'meta', 'sections')
            .get();

        snapshot.forEach(doc => {
            const data = doc.data();

            if (data.published?.tg_file_id) {
                map.published[doc.id] = {
                    tg_file_id: data.published.tg_file_id,
                    version: data.published.version || 1,
                    hash: data.published.hash,
                    meta: data.meta,
                    sections: data.sections,
                };
            }

            if (data.draft_snapshot?.tg_file_id) {
                map.draft[doc.id] = {
                    tg_file_id: data.draft_snapshot.tg_file_id,
                    version: data.draft_snapshot.version || 1,
                    hash: data.draft_snapshot.hash,
                    meta: data.meta,
                    sections: data.sections,
                };
            }
        });

        console.log(`✅ [PointerCache] Loaded ${Object.keys(map.published).length} published, ${Object.keys(map.draft).length} drafts`);
        return map;
    } catch (error: any) {
        if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn('⚠️ [PointerCache] Firestore quota exhausted - using stale cache');
            return pointerCache || map;  // Return stale cache if available
        }
        console.error('❌ [PointerCache] Failed to load:', error);
        return map;
    }
}

/**
 * Get the pointer map (from cache or fresh load)
 */
async function getPointerMap(): Promise<PointerMap> {
    const now = Date.now();

    if (pointerCache && (now - lastLoadTime) < CACHE_TTL_MS) {
        return pointerCache;
    }

    pointerCache = await loadPointers();
    lastLoadTime = now;
    return pointerCache;
}

/**
 * Get Telegram file ID for a published course (for students)
 */
export async function getPublishedPointer(courseId: string): Promise<PointerEntry | null> {
    const map = await getPointerMap();
    return map.published[courseId] || null;
}

/**
 * Get Telegram file ID for a draft (for CMS)
 */
export async function getDraftPointer(courseId: string): Promise<PointerEntry | null> {
    const map = await getPointerMap();
    return map.draft[courseId] || null;
}

/**
 * Get any available pointer (draft preferred, fallback to published)
 */
export async function getAnyPointer(courseId: string): Promise<PointerEntry | null> {
    const map = await getPointerMap();
    return map.draft[courseId] || map.published[courseId] || null;
}

/**
 * Invalidate cache (call after publish)
 */
export function invalidatePointerCache(): void {
    console.log('🔄 [PointerCache] Invalidated');
    pointerCache = null;
    lastLoadTime = 0;
}

/**
 * Update cache entry without full reload (for instant updates after publish)
 */
export function updatePointerCache(courseId: string, type: 'published' | 'draft', entry: PointerEntry): void {
    if (pointerCache) {
        pointerCache[type][courseId] = entry;
        console.log(`📝 [PointerCache] Updated ${type} pointer for ${courseId}`);
    }
}

/**
 * Get cache stats
 */
export function getPointerCacheStats(): {
    loaded: boolean;
    age: number;
    publishedCount: number;
    draftCount: number;
} {
    return {
        loaded: pointerCache !== null,
        age: pointerCache ? Date.now() - lastLoadTime : 0,
        publishedCount: pointerCache ? Object.keys(pointerCache.published).length : 0,
        draftCount: pointerCache ? Object.keys(pointerCache.draft).length : 0,
    };
}

/**
 * Remove a course from cache (call after delete)
 */
export function removeFromPointerCache(courseId: string): void {
    if (pointerCache) {
        delete pointerCache.published[courseId];
        delete pointerCache.draft[courseId];
        console.log(`🗑️ [PointerCache] Removed ${courseId}`);
    }
}
