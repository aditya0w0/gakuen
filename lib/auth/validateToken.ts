import { initAdmin } from './firebase-admin';

export interface DecodedToken {
    uid: string;
    email: string | undefined;
    role: string;
    name?: string;
}

/**
 * Validate Firebase ID token server-side
 * Returns decoded token with user info and custom claims
 */
/**
 * Validate Firebase ID token (stateless, short-lived)
 * Use this for initial login/signup verification
 */
export async function verifyIdToken(token: string): Promise<DecodedToken> {
    try {
        const admin = initAdmin();
        const decodedToken = await admin.auth().verifyIdToken(token);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: (decodedToken.role as string) || 'user',
            name: decodedToken.name as string | undefined,
        };
    } catch (error) {
        console.error('❌ ID Token validation failed:', error);
        throw new Error('Invalid or expired ID token');
    }
}

/**
 * Validate Firebase Session Cookie (stateful, long-lived)
 * Use this for authenticating API requests via cookies
 */
export async function verifySessionCookie(token: string): Promise<DecodedToken> {
    try {
        const admin = initAdmin();
        // verifySessionCookie(sessionCookie, checkRevoked)
        const decodedToken = await admin.auth().verifySessionCookie(token, true);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: (decodedToken.role as string) || 'user',
            name: decodedToken.name as string | undefined,
        };
    } catch (error) {
        // Don't log spam for expired sessions
        if ((error as any)?.code !== 'auth/session-cookie-expired') {
            console.error('❌ Session validation failed:', error);
        }
        throw new Error('Invalid or expired session');
    }
}

// Deprecated alias for backward compatibility (defaults to Session Cookie as that's the primary use case now)
export const validateFirebaseToken = verifySessionCookie;

/**
 * Set custom claims for a user (e.g., admin role)
 * Use this in a one-time script or admin API endpoint
 */
export async function setUserClaims(uid: string, claims: { role: string }) {
    try {
        const admin = initAdmin();
        await admin.auth().setCustomUserClaims(uid, claims);
        console.log(`✅ Custom claims set for user ${uid}:`, claims);
    } catch (error) {
        console.error('❌ Failed to set custom claims:', error);
        throw error;
    }
}
