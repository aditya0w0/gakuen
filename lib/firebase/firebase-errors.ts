/**
 * Firebase Error Message Mapper
 * Converts technical Firebase auth error codes to user-friendly messages
 */

// Map of Firebase auth error codes to user-friendly messages
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
    // Sign up errors
    'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',

    // Sign in errors
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-disabled': 'This account has been disabled.',

    // Rate limiting
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',

    // Network errors
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/timeout': 'Request timed out. Please try again.',

    // OAuth errors
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups for this site.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',

    // Re-authentication
    'auth/requires-recent-login': 'For security, please log in again to continue.',
    'auth/credential-already-in-use': 'This credential is already linked to another account.',

    // Token errors
    'auth/invalid-id-token': 'Session expired. Please log in again.',
    'auth/id-token-expired': 'Session expired. Please log in again.',
};

/**
 * Get a user-friendly error message from a Firebase error
 * @param error - The error object from Firebase
 * @returns A user-friendly error message
 */
export function getFirebaseErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
        return 'Something went wrong. Please try again.';
    }

    const firebaseError = error as { code?: string; message?: string };
    const code = firebaseError.code || '';

    // Check if we have a mapped message
    if (code && FIREBASE_ERROR_MESSAGES[code]) {
        return FIREBASE_ERROR_MESSAGES[code];
    }

    // For unmapped errors, try to extract a cleaner message
    if (firebaseError.message) {
        // Remove "Firebase: " prefix and error code suffix
        const cleanMessage = firebaseError.message
            .replace(/^Firebase:\s*/i, '')
            .replace(/\s*\([^)]+\)\s*\.?\s*$/g, '')
            .trim();

        if (cleanMessage && cleanMessage.length < 100) {
            return cleanMessage;
        }
    }

    // Default fallback
    return 'Something went wrong. Please try again.';
}

/**
 * Check if an error is a specific Firebase error code
 */
export function isFirebaseError(error: unknown, code: string): boolean {
    if (!error || typeof error !== 'object') return false;
    return (error as { code?: string }).code === code;
}
