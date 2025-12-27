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
export async function validateFirebaseToken(token: string): Promise<DecodedToken> {
    try {
        const adminAuth = initAdmin();
        const decodedToken = await adminAuth.verifyIdToken(token);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: (decodedToken.role as string) || 'user', // From custom claims
            name: decodedToken.name as string | undefined,
        };
    } catch (error) {
        console.error('❌ Token validation failed:', error);
        throw new Error('Invalid or expired token');
    }
}

/**
 * Set custom claims for a user (e.g., admin role)
 * Use this in a one-time script or admin API endpoint
 */
export async function setUserClaims(uid: string, claims: { role: string }) {
    try {
        const adminAuth = initAdmin();
        await adminAuth.setCustomUserClaims(uid, claims);
        console.log(`✅ Custom claims set for user ${uid}:`, claims);
    } catch (error) {
        console.error('❌ Failed to set custom claims:', error);
        throw error;
    }
}
