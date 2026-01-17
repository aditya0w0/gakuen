/**
 * Admin Dashboard Cache
 * Provides instant loading with stale-while-revalidate pattern
 * Shows cached data immediately, fetches fresh data in background
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    isStale: boolean;
}

// Cache duration: 30 seconds before considered stale (but still usable)
const STALE_TIME = 30 * 1000;
// Max age: 5 minutes before cache is completely invalid
const MAX_AGE = 5 * 60 * 1000;

class DashboardCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private pendingRequests: Map<string, Promise<unknown>> = new Map();

    /**
     * Get data with stale-while-revalidate pattern
     * Returns cached data immediately (if available), then fetches fresh data
     */
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        onUpdate?: (data: T) => void
    ): Promise<T | null> {
        const cached = this.cache.get(key) as CacheEntry<T> | undefined;
        const now = Date.now();

        // Check if cache is completely expired
        const isExpired = cached && (now - cached.timestamp > MAX_AGE);

        // Check if cache is stale but usable
        const isStale = cached && (now - cached.timestamp > STALE_TIME);

        // If we have valid cached data, use it
        if (cached && !isExpired) {
            // If stale, trigger background refresh
            if (isStale && !this.pendingRequests.has(key)) {
                this.backgroundFetch(key, fetcher, onUpdate);
            }
            return cached.data;
        }

        // No cache or expired - fetch fresh
        return this.fetchAndCache(key, fetcher, onUpdate);
    }

    /**
     * Fetch data and update cache
     */
    private async fetchAndCache<T>(
        key: string,
        fetcher: () => Promise<T>,
        onUpdate?: (data: T) => void
    ): Promise<T | null> {
        // Check for pending request to avoid duplicate fetches
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key) as Promise<T>;
        }

        const fetchPromise = fetcher()
            .then((data) => {
                this.cache.set(key, {
                    data,
                    timestamp: Date.now(),
                    isStale: false,
                });
                this.pendingRequests.delete(key);
                onUpdate?.(data);
                return data;
            })
            .catch((error) => {
                this.pendingRequests.delete(key);
                console.error(`Dashboard cache fetch error for ${key}:`, error);
                return null;
            });

        this.pendingRequests.set(key, fetchPromise);
        return fetchPromise;
    }

    /**
     * Background fetch - doesn't block, just updates cache
     */
    private backgroundFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        onUpdate?: (data: T) => void
    ): void {
        this.fetchAndCache(key, fetcher, onUpdate);
    }

    /**
     * Invalidate specific cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidate all cache entries
     */
    invalidateAll(): void {
        this.cache.clear();
    }

    /**
     * Pre-warm cache (call on login or route change anticipation)
     */
    async preload<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
        const cached = this.cache.get(key);
        if (!cached || Date.now() - cached.timestamp > STALE_TIME) {
            this.fetchAndCache(key, fetcher);
        }
    }

    /**
     * Check if key has fresh data
     */
    hasFreshData(key: string): boolean {
        const cached = this.cache.get(key);
        if (!cached) return false;
        return Date.now() - cached.timestamp < STALE_TIME;
    }

    /**
     * Get cached data synchronously (for instant render)
     */
    getCached<T>(key: string): T | null {
        const cached = this.cache.get(key) as CacheEntry<T> | undefined;
        if (cached && Date.now() - cached.timestamp < MAX_AGE) {
            return cached.data;
        }
        return null;
    }
}

// Export singleton instance
export const dashboardCache = new DashboardCache();

// Cache keys
export const CACHE_KEYS = {
    COURSES: 'admin:courses',
    STATS: 'admin:stats',
    USERS: 'admin:users',
    FEATURES: 'admin:features',
} as const;

// Helper hook for React components
export function useCachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    deps: unknown[] = []
): { data: T | null; isLoading: boolean; refresh: () => void } {
    // This is a simplified version - the actual implementation is in the dashboard component
    return {
        data: dashboardCache.getCached<T>(key),
        isLoading: false,
        refresh: () => dashboardCache.invalidate(key),
    };
}
