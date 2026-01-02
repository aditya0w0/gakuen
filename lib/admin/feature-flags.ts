/**
 * Admin Feature Flags
 * Stored in Firestore for real-time toggle capability
 */

import { initAdmin } from '@/lib/auth/firebase-admin';

export interface FeatureFlags {
    subscriptionsEnabled: boolean;
    aiEnabled: boolean;
    updatedAt: string;
    updatedBy?: string;
}

const DEFAULT_FLAGS: FeatureFlags = {
    subscriptionsEnabled: true,
    aiEnabled: true,
    updatedAt: new Date().toISOString(),
};

// In-memory cache with TTL
let cachedFlags: FeatureFlags | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get feature flags from Firestore (with caching)
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
    // Return cached if valid
    if (cachedFlags && Date.now() < cacheExpiry) {
        return cachedFlags;
    }

    try {
        const admin = initAdmin();
        if (!admin) {
            console.warn('Firebase Admin not initialized, using defaults');
            return DEFAULT_FLAGS;
        }

        const db = admin.firestore();
        const doc = await db.collection('config').doc('features').get();

        if (doc.exists) {
            cachedFlags = doc.data() as FeatureFlags;
        } else {
            // Create default if doesn't exist
            await db.collection('config').doc('features').set(DEFAULT_FLAGS);
            cachedFlags = DEFAULT_FLAGS;
        }

        cacheExpiry = Date.now() + CACHE_TTL;
        return cachedFlags;
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        return cachedFlags || DEFAULT_FLAGS;
    }
}

/**
 * Update feature flags in Firestore
 */
export async function updateFeatureFlags(
    updates: Partial<Omit<FeatureFlags, 'updatedAt'>>,
    updatedBy?: string
): Promise<FeatureFlags> {
    const admin = initAdmin();
    if (!admin) {
        throw new Error('Firebase Admin not initialized');
    }

    const db = admin.firestore();
    const newFlags: Partial<FeatureFlags> = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy,
    };

    await db.collection('config').doc('features').set(newFlags, { merge: true });

    // Invalidate cache
    cachedFlags = null;
    cacheExpiry = 0;

    return getFeatureFlags();
}

/**
 * Quick check if subscriptions are enabled
 */
export async function isSubscriptionsEnabled(): Promise<boolean> {
    const flags = await getFeatureFlags();
    return flags.subscriptionsEnabled;
}

/**
 * Quick check if AI features are enabled
 */
export async function isAIEnabled(): Promise<boolean> {
    const flags = await getFeatureFlags();
    return flags.aiEnabled;
}
