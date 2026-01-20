/**
 * Client-Side Course Cache (IndexedDB)
 * 
 * Features:
 * - Version-based invalidation
 * - LRU eviction at 200MB cap
 * - Offline-first reads
 * - Automatic stale detection
 */

import { CourseBlob } from '@/lib/types/course-compact';

const DB_NAME = 'gakuen-course-cache';
const DB_VERSION = 1;
const STORE_NAME = 'courses';
const MAX_CACHE_SIZE = 200 * 1024 * 1024; // 200MB

interface CachedCourse {
    courseId: string;
    version: number;
    hash: string;
    blob: CourseBlob;
    lastAccessed: number;
    sizeBytes: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB
 */
function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'courseId' });
                store.createIndex('lastAccessed', 'lastAccessed');
            }
        };
    });

    return dbPromise;
}

/**
 * Get cached course blob
 */
export async function getCachedCourse(courseId: string): Promise<CachedCourse | null> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(courseId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result as CachedCourse | undefined;

                if (result) {
                    // Update lastAccessed (fire and forget)
                    updateLastAccessed(courseId);
                }

                resolve(result || null);
            };
        });
    } catch (error) {
        console.error('IndexedDB get error:', error);
        return null;
    }
}

/**
 * Cache course blob
 */
export async function setCachedCourse(
    courseId: string,
    version: number,
    hash: string,
    blob: CourseBlob
): Promise<void> {
    try {
        const db = await getDB();
        const sizeBytes = new Blob([JSON.stringify(blob)]).size;

        // Enforce size cap
        await enforceSizeLimit(sizeBytes);

        const cached: CachedCourse = {
            courseId,
            version,
            hash,
            blob,
            lastAccessed: Date.now(),
            sizeBytes,
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(cached);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log(`📦 [Cache] Stored ${courseId} (${(sizeBytes / 1024).toFixed(1)}KB)`);
                resolve();
            };
        });
    } catch (error) {
        console.error('IndexedDB set error:', error);
    }
}

/**
 * Check if cached version matches
 */
export async function isCacheValid(
    courseId: string,
    expectedVersion: number,
    expectedHash?: string
): Promise<boolean> {
    const cached = await getCachedCourse(courseId);

    if (!cached) return false;
    if (cached.version !== expectedVersion) return false;
    if (expectedHash && cached.hash !== expectedHash) return false;

    return true;
}

/**
 * Update lastAccessed timestamp
 */
async function updateLastAccessed(courseId: string): Promise<void> {
    try {
        const db = await getDB();

        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(courseId);

        request.onsuccess = () => {
            const cached = request.result as CachedCourse;
            if (cached) {
                cached.lastAccessed = Date.now();
                store.put(cached);
            }
        };
    } catch (error) {
        // Non-critical, ignore
    }
}

/**
 * Enforce size limit via LRU eviction
 */
async function enforceSizeLimit(incomingSize: number): Promise<void> {
    try {
        const db = await getDB();

        // Get total size
        const allCourses = await new Promise<CachedCourse[]>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });

        let totalSize = allCourses.reduce((sum, c) => sum + c.sizeBytes, 0);

        if (totalSize + incomingSize <= MAX_CACHE_SIZE) {
            return; // Under limit
        }

        // Sort by lastAccessed (oldest first)
        allCourses.sort((a, b) => a.lastAccessed - b.lastAccessed);

        // Evict until under limit
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const course of allCourses) {
            if (totalSize + incomingSize <= MAX_CACHE_SIZE) break;

            store.delete(course.courseId);
            totalSize -= course.sizeBytes;
            console.log(`🗑️ [Cache] Evicted ${course.courseId} (LRU)`);
        }
    } catch (error) {
        console.error('Cache eviction error:', error);
    }
}

/**
 * Clear all cached courses
 */
export async function clearCache(): Promise<void> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('🗑️ [Cache] Cleared all courses');
                resolve();
            };
        });
    } catch (error) {
        console.error('Cache clear error:', error);
    }
}

/**
 * Get cache stats
 */
export async function getCacheStats(): Promise<{
    count: number;
    totalSizeBytes: number;
    courses: { id: string; size: number; lastAccessed: number }[];
}> {
    try {
        const db = await getDB();

        const allCourses = await new Promise<CachedCourse[]>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });

        return {
            count: allCourses.length,
            totalSizeBytes: allCourses.reduce((sum, c) => sum + c.sizeBytes, 0),
            courses: allCourses.map(c => ({
                id: c.courseId,
                size: c.sizeBytes,
                lastAccessed: c.lastAccessed,
            })),
        };
    } catch (error) {
        console.error('Cache stats error:', error);
        return { count: 0, totalSizeBytes: 0, courses: [] };
    }
}
