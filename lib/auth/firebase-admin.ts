import { initializeApp, getApps, cert, ServiceAccount, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function initAdmin() {
    // Check if already initialized
    if (adminApp) {
        return {
            app: adminApp,
            auth: () => getAuth(adminApp!),
            firestore: () => getFirestore(adminApp!),
        };
    }

    // Check if app already exists
    const apps = getApps();
    if (apps.length > 0) {
        adminApp = apps[0];
        return {
            app: adminApp,
            auth: () => getAuth(adminApp!),
            firestore: () => getFirestore(adminApp!),
        };
    }

    // Initialize from environment variables
    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    adminApp = initializeApp({
        credential: cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized');

    return {
        app: adminApp,
        auth: () => getAuth(adminApp!),
        firestore: () => getFirestore(adminApp!),
    };
}
