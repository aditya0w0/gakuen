// localStorage cache operations
import { User } from "@/lib/types";
const CACHE_KEYS = {
    USER: "gakuen_user_cache",
    PROGRESS: "gakuen_progress_cache",
    COURSES: "gakuen_courses_cache",
    SYNC_QUEUE: "gakuen_sync_queue",
} as const;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl?: number; // Time to live in ms
}

export const localCache = {
    // Set cache with optional TTL
    set<T>(key: string, data: T, ttl?: number): void {
        if (typeof window === 'undefined') return;
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl,
            };
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (error) {
            console.error("Cache set error:", error);
        }
    },

    // Get cache if not expired
    get<T>(key: string): T | null {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const entry: CacheEntry<T> = JSON.parse(stored);

            // Check if expired
            if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
                this.remove(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    },

    // Remove cache entry
    remove(key: string): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Cache remove error:", error);
        }
    },

    // Clear all cache
    clear(): void {
        if (typeof window === 'undefined') return;
        try {
            Object.values(CACHE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error("Cache clear error:", error);
        }
    },

    // User cache operations
    user: {
        set: (data: User) => localCache.set(CACHE_KEYS.USER, data, 24 * 60 * 60 * 1000), // 24h TTL
        get: () => localCache.get<User>(CACHE_KEYS.USER),
        remove: () => localCache.remove(CACHE_KEYS.USER),
    },

    // Progress cache operations
    progress: {
        set: (data: any) => localCache.set(CACHE_KEYS.PROGRESS, data),
        get: () => localCache.get(CACHE_KEYS.PROGRESS),
        remove: () => localCache.remove(CACHE_KEYS.PROGRESS),
    },

    // Sync queue operations
    syncQueue: {
        add: (operation: any) => {
            const queue = localCache.get<any[]>(CACHE_KEYS.SYNC_QUEUE) || [];
            queue.push(operation);
            localCache.set(CACHE_KEYS.SYNC_QUEUE, queue);
        },
        set: (operations: any[]) => localCache.set(CACHE_KEYS.SYNC_QUEUE, operations),
        get: () => localCache.get<any[]>(CACHE_KEYS.SYNC_QUEUE) || [],
        clear: () => localCache.remove(CACHE_KEYS.SYNC_QUEUE),
    },
};
