/**
 * Simple in-memory rate limiter for API routes
 * Uses sliding window algorithm
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Store rate limit data in memory (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Cleanup every minute

export interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    maxRequests: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check rate limit for a given key (usually IP or user ID)
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // If no entry or expired, create new one
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime
    };
}

/**
 * Get IP address from request
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

/**
 * Rate limit presets for different endpoint types
 */
export const RateLimits = {
    /** AI endpoints: 30 requests per minute */
    AI: { maxRequests: 30, windowMs: 60000 },
    /** Gemini API calls: 60 per minute (global) */
    GEMINI: { maxRequests: 60, windowMs: 60000 },
    /** Upload endpoints: 10 uploads per minute */
    UPLOAD: { maxRequests: 10, windowMs: 60000 },
    /** Auth endpoints: 5 attempts per minute */
    AUTH: { maxRequests: 5, windowMs: 60000 },
    /** General API: 100 requests per minute */
    GENERAL: { maxRequests: 100, windowMs: 60000 },
    /** Logging: 100 logs per minute */
    LOG: { maxRequests: 100, windowMs: 60000 },
    /** Images: 200 requests per minute */
    IMAGES: { maxRequests: 200, windowMs: 60000 },
    /** Analytics tracking: 60 events per minute */
    ANALYTICS: { maxRequests: 60, windowMs: 60000 },
    /** Coupon validation: 20 attempts per minute (anti-brute-force) */
    COUPON: { maxRequests: 20, windowMs: 60000 },
} as const;
