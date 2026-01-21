/**
 * Fetch with retry, timeout, and offline fallback
 * Designed for unreliable networks and low-end devices
 */

interface FetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    offlineFallback?: () => any;
}

// Cache for offline support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resilientFetch<T = any>(
    url: string,
    options: FetchOptions = {}
): Promise<T> {
    const {
        timeout = 10000,
        retries = 3,
        retryDelay = 1000,
        offlineFallback,
        ...fetchOptions
    } = options;

    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Try cache first
        const cached = responseCache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('📦 Returning cached response (offline):', url);
            return cached.data;
        }

        // Use fallback if available
        if (offlineFallback) {
            console.log('📴 Offline, using fallback for:', url);
            return offlineFallback() as T;
        }

        throw new Error('No network connection and no cached data available');
    }

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful responses
            responseCache.set(url, { data, timestamp: Date.now() });

            return data;
        } catch (error) {
            lastError = error as Error;

            // Don't retry on abort (timeout) or 4xx errors
            if (lastError.name === 'AbortError') {
                console.warn(`⏱️ Request timeout (${timeout}ms):`, url);
            } else {
                console.warn(`🔄 Retry ${attempt + 1}/${retries}:`, url, lastError.message);
            }

            // Wait before retry (exponential backoff)
            if (attempt < retries - 1) {
                await new Promise(resolve =>
                    setTimeout(resolve, retryDelay * Math.pow(2, attempt))
                );
            }
        }
    }

    // All retries failed, try cache
    const cached = responseCache.get(url);
    if (cached) {
        console.log('📦 Returning stale cache after failures:', url);
        return cached.data;
    }

    throw lastError;
}

/**
 * Prefetch resources for better perceived performance
 */
export function prefetch(urls: string[]) {
    if (typeof window === 'undefined') return;

    // Use requestIdleCallback for non-blocking prefetch
    const doPreload = () => {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = url.endsWith('.js') ? 'script' :
                url.endsWith('.css') ? 'style' :
                    'fetch';
            document.head.appendChild(link);
        });
    };

    if ('requestIdleCallback' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).requestIdleCallback(doPreload);
    } else {
        setTimeout(doPreload, 1000);
    }
}

/**
 * Debounce function for expensive operations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle function for scroll/resize handlers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}

/**
 * Detect if device is low-end
 */
export function isLowEndDevice(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for low CPU cores
    const lowCores = (navigator.hardwareConcurrency || 4) <= 2;

    // Check for low memory (Chrome only)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lowMemory = (navigator as any).deviceMemory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (navigator as any).deviceMemory <= 2
        : false;

    // Check for slow connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (navigator as any).connection;
    const slowConnection = connection
        ? connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g'
        : false;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check for data saver
    const dataSaver = connection?.saveData === true;

    return lowCores || lowMemory || slowConnection || prefersReducedMotion || dataSaver;
}

/**
 * Get appropriate image quality based on device/network
 */
export function getOptimalImageQuality(): 'low' | 'medium' | 'high' {
    if (typeof window === 'undefined') return 'high';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (navigator as any).connection;

    if (!connection) return 'high';

    if (connection.saveData) return 'low';

    switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
            return 'low';
        case '3g':
            return 'medium';
        default:
            return 'high';
    }
}

/**
 * Request animation frame with fallback
 */
export function raf(callback: FrameRequestCallback): number {
    if (typeof window === 'undefined') return 0;

    return window.requestAnimationFrame?.(callback) ||
        window.setTimeout(() => callback(Date.now()), 16);
}

/**
 * Cancel animation frame with fallback
 */
export function cancelRaf(id: number): void {
    if (typeof window === 'undefined') return;

    if (window.cancelAnimationFrame) {
        window.cancelAnimationFrame(id);
    } else {
        window.clearTimeout(id);
    }
}
