import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy for Edge Runtime (formerly middleware)
 * 
 * Edge Runtime doesn't support Firebase Admin SDK (node:process not available)
 * So we just check if the token EXISTS here, not validate it
 * 
 * Actual validation happens in:
 * - API routes (Node.js runtime)
 * - Server components (Node.js runtime)
 * - useRequireAdmin hook (client-side)
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Admin routes that require authentication
    const adminRoutes = ['/courses', '/dashboard'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isAdminRoute) {
        // Just check if token exists (don't validate in Edge Runtime)
        const token = request.cookies.get('firebase-token')?.value;

        if (!token) {
            console.log('🚫 No Firebase token, redirecting to login');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Token exists - let them through
        // Validation will happen in API routes and useRequireAdmin hook
        console.log('✅ Token found, allowing access (validation in API routes)');
    }

    return NextResponse.next();
}

// Configure which routes to run proxy on
export const config = {
    matcher: [
        '/courses/:path*',
        '/dashboard/:path*',
    ],
};
