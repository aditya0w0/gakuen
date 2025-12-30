import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/constants/demo-data';

/**
 * Authentication result type
 */
type AuthResult =
    | { authenticated: true; user: User }
    | { authenticated: false; response: NextResponse };

/**
 * Validate user session from cookie
 * Returns user data if authenticated, error response if not
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
    try {
        // Get session cookie
        const sessionCookie = request.cookies.get('user-session')?.value;

        if (!sessionCookie) {
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                )
            };
        }

        // Parse session data
        const user = JSON.parse(decodeURIComponent(sessionCookie)) as User;

        if (!user || !user.id) {
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: 'Invalid session' },
                    { status: 401 }
                )
            };
        }

        return { authenticated: true, user };
    } catch (error) {
        console.error('Auth guard error:', error);
        return {
            authenticated: false,
            response: NextResponse.json(
                { error: 'Authentication failed' },
                { status: 401 }
            )
        };
    }
}

/**
 * Check if user has admin role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
    const authResult = await requireAuth(request);

    if (!authResult.authenticated) {
        return authResult;
    }

    if (authResult.user.role !== 'admin') {
        return {
            authenticated: false,
            response: NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        };
    }

    return authResult;
}

/**
 * Safe error response - never expose internal details
 */
export function safeErrorResponse(error: unknown, defaultMessage = 'Internal server error'): NextResponse {
    // Log full error internally
    console.error('API Error:', error);

    // Return generic message to client
    return NextResponse.json(
        { error: defaultMessage },
        { status: 500 }
    );
}

/**
 * Verify request signature (HMAC)
 * Use this for sensitive endpoints that need tamper-proof requests
 */
export async function requireSignedRequest(request: NextRequest): Promise<{ valid: boolean; response?: NextResponse }> {
    const signature = request.headers.get('X-Signature');
    const timestampStr = request.headers.get('X-Timestamp');

    if (!signature || !timestampStr) {
        return {
            valid: false,
            response: NextResponse.json(
                { error: 'Missing request signature' },
                { status: 401 }
            )
        };
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
        return {
            valid: false,
            response: NextResponse.json(
                { error: 'Invalid timestamp' },
                { status: 400 }
            )
        };
    }

    // Get request details for signature verification
    const { pathname } = new URL(request.url);
    const method = request.method;

    // Clone request to read body
    const body = request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.clone().text()
        : '';

    // Import and verify signature
    const { verifySignature } = await import('./signing');
    const result = await verifySignature(method, pathname, body, timestamp, signature);

    if (!result.valid) {
        console.warn(`⚠️ Invalid signature for ${method} ${pathname}: ${result.error}`);
        return {
            valid: false,
            response: NextResponse.json(
                { error: result.error || 'Invalid signature' },
                { status: 401 }
            )
        };
    }

    return { valid: true };
}

