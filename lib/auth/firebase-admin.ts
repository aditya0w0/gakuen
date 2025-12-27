import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminInitialized = false;

export function initAdmin() {
    if (adminInitialized) {
        return getAuth();
    }

    // Check if already initialized
    if (getApps().length > 0) {
        adminInitialized = true;
        return getAuth();
    }

    // Initialize from environment variables
    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    initializeApp({
        credential: cert(serviceAccount),
    });

    adminInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');

    return getAuth();
}
