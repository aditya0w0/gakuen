import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RateLimits } from './rate-limit';

// Minimal User interface to replace dependency on demo-data
export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user";
    avatar?: string;
    username?: string;
    enrolledCourses?: string[];
    completedLessons?: string[];
    subscription?: {
        tier: string;
        status: string;
    };
    [key: string]: any;
}

// In-memory set to track users with pending/completed profile creation
// Prevents log spam from concurrent API requests
const profileCreationPending = new Set<string>();

/**
 * Authentication result type
 */
type AuthResult =
    | { authenticated: true; user: User }
    | { authenticated: false; response: NextResponse };

/**
 * Validate user session from cookie and fetch real profile from Firestore
 * Returns user data if authenticated, error response if not
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
    try {
        // Get session cookie
        const token = request.cookies.get('firebase-token')?.value;

        if (!token) {
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                )
            };
        }

        // Validate token (Session Cookie - created via createSessionCookie in /api/auth/set-token)
        const { verifySessionCookie } = await import('@/lib/auth/validateToken');
        const decodedUser = await verifySessionCookie(token);

        if (!decodedUser || !decodedUser.uid) {
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: 'Invalid session' },
                    { status: 401 }
                )
            };
        }

        // Fetch user profile from Firestore (preferred) or fall back to JWT claims
        const { getUserProfile } = await import('@/lib/firebase/firestore');
        const profile = await getUserProfile(decodedUser.uid);

        let user: User;

        if (profile) {
            // Use real profile data from Firestore (most common case)
            user = {
                id: profile.id,
                name: profile.name || 'User',
                email: profile.email || decodedUser.email || '',
                role: profile.role || 'user',
                avatar: profile.avatar,
                username: profile.username,
                enrolledCourses: profile.enrolledCourses || [],
                completedLessons: profile.completedLessons || [],
                subscription: profile.subscription,
                createdAt: profile.createdAt,
            };
        } else {
            // User exists in Auth but not Firestore
            user = {
                id: decodedUser.uid,
                name: decodedUser.name || 'User',
                email: decodedUser.email || '',
                role: (decodedUser.role as "admin" | "user") || 'user',
                enrolledCourses: [],
                completedLessons: [],
            };

            // Only create profile if not already pending (prevents log spam from concurrent requests)
            if (!profileCreationPending.has(decodedUser.uid)) {
                profileCreationPending.add(decodedUser.uid);
                console.log(`📝 Creating Firestore profile for legacy user: ${decodedUser.uid} (${decodedUser.email})`);

                // Create profile in background (don't await - non-blocking for fast API response)
                const { createUserProfile } = await import('@/lib/firebase/firestore');
                createUserProfile({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    enrolledCourses: [],
                    completedLessons: [],
                    createdAt: new Date().toISOString(),
                }).then(() => {
                    console.log(`✅ Created Firestore profile for legacy user: ${user.id}`);
                }).catch((err) => {
                    console.error(`❌ Failed to create Firestore profile for legacy user: ${user.id}`, err);
                    // Remove from pending so it can be retried on next request
                    profileCreationPending.delete(user.id);
                });
            }
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
 * Role is verified from Firestore (not just JWT claims)
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
    const authResult = await requireAuth(request);

    if (!authResult.authenticated) {
        return authResult;
    }

    // Role is now from Firestore (not JWT), making role changes immediate
    if (authResult.user.role !== 'admin') {
        // Log unauthorized admin access attempts
        const clientIP = getClientIP(request);
        console.warn(`⚠️ Unauthorized admin access attempt by: ${authResult.user.email} (IP: ${clientIP})`);
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

/**
 * Type for API route handler
 */
type APIHandler = (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => Promise<NextResponse | void>;

/**
 * Wrapper that combines authentication + analytics tracking
 * Use this for all protected API routes to automatically track usage
 * 
 * @example
 * export const POST = withAuthTracked(async (request, { user }) => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true });
 * });
 */
export function withAuthTracked(
    handler: (request: NextRequest, context: { user: User; params?: Promise<Record<string, string>> }) => Promise<NextResponse | void>,
    options?: { requireAdmin?: boolean }
): APIHandler {
    return async (request: NextRequest, routeContext?: { params?: Promise<Record<string, string>> }) => {
        const startTime = Date.now();
        const { pathname } = new URL(request.url);
        const method = request.method;

        // Authenticate
        const authResult = options?.requireAdmin
            ? await requireAdmin(request)
            : await requireAuth(request);

        if (!authResult.authenticated) {
            // Track failed auth attempts too
            trackAPICallBackground({
                endpoint: pathname,
                method,
                duration: Date.now() - startTime,
                statusCode: 401,
            });
            return authResult.response;
        }

        try {
            // Await params if they are a promise (Next.js 15)
            const params = await routeContext?.params;

            // Execute handler
            const response = await handler(request, {
                user: authResult.user,
                params: params
            });

            // Track successful call
            trackAPICallBackground({
                endpoint: pathname,
                method,
                userId: authResult.user.id,
                userEmail: authResult.user.email,
                duration: Date.now() - startTime,
                statusCode: response?.status ?? 204,
            });

            return response;
        } catch (error) {
            // Track errors
            trackAPICallBackground({
                endpoint: pathname,
                method,
                userId: authResult.user.id,
                userEmail: authResult.user.email,
                duration: Date.now() - startTime,
                statusCode: 500,
            });
            throw error;
        }
    };
}

/**
 * Track API call in background (non-blocking)
 */
function trackAPICallBackground(data: {
    endpoint: string;
    method: string;
    userId?: string;
    userEmail?: string;
    duration: number;
    statusCode: number;
    model?: string;
    cost?: number;
}): void {
    // Import and track asynchronously to not block the response
    import('@/lib/analytics/firestore-analytics').then(({ trackAPICall }) => {
        trackAPICall(data).catch(err => {
            console.error('Failed to track API call:', err);
        });
    });
}

