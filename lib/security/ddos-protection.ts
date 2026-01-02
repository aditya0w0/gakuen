/**
 * DDoS Protection Middleware
 * Application-level fallback protection for when Cloudflare is bypassed
 * 
 * Features:
 * - IP-based request tracking
 * - Automatic blocking for suspicious activity
 * - Sliding window rate limiting
 * - Bot detection via headers
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory stores (use Redis in production for multi-instance)
const ipRequestCounts = new Map<string, { count: number; windowStart: number; blocked: boolean; blockedUntil: number }>();
const suspiciousPatterns = new Map<string, number>(); // Track suspicious behavior score

// Configuration
const CONFIG = {
    // Requests per window
    REQUESTS_PER_MINUTE: 120,
    REQUESTS_PER_SECOND: 20,

    // Blocking thresholds
    BLOCK_THRESHOLD_SCORE: 10,
    BLOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes

    // Suspicious patterns
    RAPID_FIRE_THRESHOLD: 10, // requests in 1 second

    // Cleanup interval
    CLEANUP_INTERVAL_MS: 60 * 1000, // 1 minute
};

// Protected paths (stricter limits)
const PROTECTED_PATHS = [
    '/api/ai/',
    '/api/payments/',
    '/api/admin/',
    '/api/auth/',
];

// Paths to skip (static assets, etc.)
const SKIP_PATHS = [
    '/_next/',
    '/favicon',
    '/logo',
    '/images/',
    '/fonts/',
];

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
    // Check Cloudflare headers first
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;

    // Check x-forwarded-for (proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Check x-real-ip
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;

    return 'unknown';
}

/**
 * Check if request looks like a bot
 */
function isSuspiciousRequest(request: NextRequest): { suspicious: boolean; score: number } {
    let score = 0;

    // No user agent = suspicious
    const userAgent = request.headers.get('user-agent');
    if (!userAgent) score += 3;

    // Known bot user agents
    const botPatterns = [
        /curl/i, /wget/i, /python/i, /scrapy/i,
        /bot(?!.*google)/i, /crawler/i, /spider/i
    ];
    if (userAgent && botPatterns.some(p => p.test(userAgent))) {
        score += 2;
    }

    // Missing common headers
    if (!request.headers.get('accept-language')) score += 1;
    if (!request.headers.get('accept')) score += 1;

    // Hitting sensitive endpoints rapidly
    const path = request.nextUrl.pathname;
    if (PROTECTED_PATHS.some(p => path.startsWith(p))) {
        score += 1;
    }

    return { suspicious: score >= 3, score };
}

/**
 * Check and update rate limits for an IP
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now();
    const entry = ipRequestCounts.get(ip);

    // Check if blocked
    if (entry?.blocked && entry.blockedUntil > now) {
        return {
            allowed: false,
            remaining: 0,
            retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
        };
    }

    // Reset if blocked expired
    if (entry?.blocked && entry.blockedUntil <= now) {
        ipRequestCounts.set(ip, { count: 1, windowStart: now, blocked: false, blockedUntil: 0 });
        return { allowed: true, remaining: CONFIG.REQUESTS_PER_MINUTE - 1 };
    }

    // New IP or expired window
    if (!entry || now - entry.windowStart >= 60000) {
        ipRequestCounts.set(ip, { count: 1, windowStart: now, blocked: false, blockedUntil: 0 });
        return { allowed: true, remaining: CONFIG.REQUESTS_PER_MINUTE - 1 };
    }

    // Check if over limit
    if (entry.count >= CONFIG.REQUESTS_PER_MINUTE) {
        return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.windowStart + 60000 - now) / 1000) };
    }

    // Increment count
    entry.count++;
    ipRequestCounts.set(ip, entry);

    return { allowed: true, remaining: CONFIG.REQUESTS_PER_MINUTE - entry.count };
}

/**
 * Block an IP for suspicious behavior
 */
function blockIP(ip: string): void {
    const entry = ipRequestCounts.get(ip) || { count: 0, windowStart: Date.now(), blocked: false, blockedUntil: 0 };
    entry.blocked = true;
    entry.blockedUntil = Date.now() + CONFIG.BLOCK_DURATION_MS;
    ipRequestCounts.set(ip, entry);

    console.warn(`⚠️ DDoS Protection: Blocked IP ${ip} for ${CONFIG.BLOCK_DURATION_MS / 1000 / 60} minutes`);
}

/**
 * Update suspicious score for an IP
 */
function updateSuspiciousScore(ip: string, additionalScore: number): void {
    const currentScore = suspiciousPatterns.get(ip) || 0;
    const newScore = currentScore + additionalScore;
    suspiciousPatterns.set(ip, newScore);

    if (newScore >= CONFIG.BLOCK_THRESHOLD_SCORE) {
        blockIP(ip);
        suspiciousPatterns.delete(ip);
    }
}

/**
 * Create blocked response
 */
function blockedResponse(retryAfter: number = 900): NextResponse {
    return new NextResponse(
        JSON.stringify({
            error: 'Too many requests. Please try again later.',
            retryAfter
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
            },
        }
    );
}

/**
 * Main DDoS protection middleware
 */
export function ddosProtection(request: NextRequest): NextResponse | null {
    const path = request.nextUrl.pathname;

    // Skip static assets
    if (SKIP_PATHS.some(p => path.startsWith(p))) {
        return null;
    }

    const ip = getClientIP(request);

    // Check rate limits
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
        return blockedResponse(rateLimit.retryAfter);
    }

    // Check for suspicious behavior
    const suspicion = isSuspiciousRequest(request);
    if (suspicion.suspicious) {
        updateSuspiciousScore(ip, suspicion.score);
    }

    // Return null to continue (no blocking)
    return null;
}

/**
 * Cleanup old entries periodically
 */
function cleanup(): void {
    const now = Date.now();

    // Clean up old request counts
    for (const [ip, entry] of ipRequestCounts.entries()) {
        if (!entry.blocked && now - entry.windowStart > 120000) {
            ipRequestCounts.delete(ip);
        }
        if (entry.blocked && entry.blockedUntil < now) {
            ipRequestCounts.delete(ip);
        }
    }

    // Clean up suspicious patterns (decay over time)
    for (const [ip, score] of suspiciousPatterns.entries()) {
        if (score <= 1) {
            suspiciousPatterns.delete(ip);
        } else {
            suspiciousPatterns.set(ip, score - 1);
        }
    }
}

// Run cleanup periodically (only in Node.js environment)
if (typeof setInterval !== 'undefined') {
    setInterval(cleanup, CONFIG.CLEANUP_INTERVAL_MS);
}

// Export config for testing
export { CONFIG as DDOS_CONFIG };
