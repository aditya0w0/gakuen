import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth/validateToken';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to set httpOnly cookie with Firebase Session Cookie
 * Called after successful login on client side
 * 
 * SECURITY:
 * - Rate limited to 5 attempts per minute per IP
 * - httpOnly cookie prevents XSS token theft
 * - sameSite=strict prevents CSRF attacks
 */
export async function POST(request: NextRequest) {
    // Rate limiting - prevent brute force attacks
    const clientIP = getClientIP(request);
    const rateLimitKey = `login:${clientIP}`;
    const rateCheck = checkRateLimit(rateLimitKey, RateLimits.AUTH);

    if (!rateCheck.allowed) {
        console.warn(`⚠️ Login rate limit exceeded for IP: ${clientIP}`);
        return NextResponse.json(
            { error: 'Too many login attempts. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
                    'X-RateLimit-Remaining': '0',
                }
            }
        );
    }

    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token required' },
                { status: 400 }
            );
        }

        // 1. Validate the ID token server-side (ensure it's fresh via verifyIdToken)
        const user = await verifyIdToken(idToken);

        // 2. Create a Session Cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const admin = initAdmin();

        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

        // Create response with httpOnly cookie
        const response = NextResponse.json({
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                role: user.role,
            },
        });

        // Set httpOnly cookie with security hardening
        response.cookies.set({
            name: 'firebase-token',
            value: sessionCookie,
            httpOnly: true,  // Prevents XSS access to token
            secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
            sameSite: 'strict',  // CSRF protection (stricter than 'lax')
            path: '/',
            maxAge: 60 * 60 * 24 * 5, // 5 days
        });

        console.log(`✅ Token cookie set for user: ${user.email}`);

        return response;
    } catch (error: any) {
        console.error('❌ Set token error:', error);
        // SECURITY: Generic error message - don't reveal details to attackers
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
        );
    }
}
