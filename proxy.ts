import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy for Edge Runtime (formerly middleware)
 * 
 * Features:
 * - DDoS protection (Cloudflare fallback)
 * - Rate limiting per IP
 * - Authentication checks
 * - Security headers
 */

// ============================================
// DDoS Protection (In-Memory - Use Redis for production)
// ============================================

const ipRequestCounts = new Map<string, { count: number; windowStart: number; blocked: boolean; blockedUntil: number }>();

const RATE_LIMIT = {
    REQUESTS_PER_MINUTE: 600, // Increased for admin workflows
    BLOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes
};

function getClientIP(request: NextRequest): string {
    // Check Cloudflare headers first
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP;

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();

    return request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = ipRequestCounts.get(ip);

    // Check if blocked
    if (entry?.blocked && entry.blockedUntil > now) {
        return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
    }

    // Reset if block expired or new window
    if (!entry || entry.blocked || now - entry.windowStart >= 60000) {
        ipRequestCounts.set(ip, { count: 1, windowStart: now, blocked: false, blockedUntil: 0 });
        return { allowed: true };
    }

    // Check limit
    if (entry.count >= RATE_LIMIT.REQUESTS_PER_MINUTE) {
        // Block for repeated violations
        entry.blocked = true;
        entry.blockedUntil = now + RATE_LIMIT.BLOCK_DURATION_MS;
        ipRequestCounts.set(ip, entry);
        console.warn(`⚠️ DDoS: Blocked IP ${ip} for 15 min`);
        return { allowed: false, retryAfter: Math.ceil(RATE_LIMIT.BLOCK_DURATION_MS / 1000) };
    }

    entry.count++;
    return { allowed: true };
}

// Cleanup old entries every minute
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of ipRequestCounts.entries()) {
            if (now - entry.windowStart > 120000 && !entry.blocked) {
                ipRequestCounts.delete(ip);
            }
            if (entry.blocked && entry.blockedUntil < now) {
                ipRequestCounts.delete(ip);
            }
        }
    }, 60000);
}

// ============================================
// Route Configuration
// ============================================

const protectedRoutes = [
    "/user",
    "/browse",
    "/my-classes",
    "/settings",
    "/dashboard",
    "/users",
    "/class",
    "/courses",
];

const authRoutes = ["/login", "/signup"];

// Skip DDoS check for static assets
const skipDDoSPaths = ["/_next/", "/favicon", "/logo", "/images/", "/fonts/"];

// Skip rate limiting for admin routes and localhost
const skipRateLimitPaths = ["/dashboard", "/courses", "/users", "/api/admin", "/api/courses"];

function isLocalhost(ip: string): boolean {
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.');
}

// ============================================
// Main Proxy Function
// ============================================

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. DDoS Protection (skip static assets, localhost, and admin routes)
    const ip = getClientIP(request);
    const isLocal = isLocalhost(ip);
    const isAdminRoute = skipRateLimitPaths.some(p => pathname.startsWith(p));

    if (!skipDDoSPaths.some(p => pathname.startsWith(p)) && !isLocal && !isAdminRoute) {
        const rateLimit = checkRateLimit(ip);

        if (!rateLimit.allowed) {
            return new NextResponse(
                JSON.stringify({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(rateLimit.retryAfter || 900),
                    }
                }
            );
        }
    }

    // 2. Auth Checks
    const sessionCookie = request.cookies.get("user-session")?.value;
    const firebaseToken = request.cookies.get("firebase-token")?.value;
    const isAuthenticated = sessionCookie || firebaseToken;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/user", request.url));
    }

    // 3. Add Security Headers
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: [
        // All routes except static files
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};

