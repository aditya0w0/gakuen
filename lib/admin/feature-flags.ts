/**
 * Admin Feature Flags
 * Stored in Firestore for real-time toggle capability
 */

import { initAdmin } from '@/lib/auth/firebase-admin';

export interface FeatureFlags {
    // Master toggles
    subscriptionsEnabled: boolean;
    aiEnabled: boolean;

    // Enhanced options
    freeCoursesMode: boolean;        // When true, all courses are free (for testing/promo)
    disableRateLimits: boolean;      // When true, rate limits are bypassed
    aiUnlimitedMode: boolean;        // When true, all users get pro-tier AI
    aiUnlockUntil?: string;          // ISO date - unlock AI for all until this date
    aiWhitelist: string[];           // User IDs that bypass AI restrictions

    // Meta
    updatedAt: string;
    updatedBy?: string;
}

const DEFAULT_FLAGS: FeatureFlags = {
    subscriptionsEnabled: true,
    aiEnabled: true,
    freeCoursesMode: false,
    disableRateLimits: false,
    aiUnlimitedMode: false,
    aiWhitelist: [],
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
            // Merge with defaults to ensure all fields exist
            cachedFlags = { ...DEFAULT_FLAGS, ...doc.data() } as FeatureFlags;
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
 * Check if courses should be free (for promo/testing)
 */
export async function isFreeCoursesMode(): Promise<boolean> {
    const flags = await getFeatureFlags();
    // Free courses when: explicitly enabled OR subscriptions disabled
    return flags.freeCoursesMode || !flags.subscriptionsEnabled;
}

/**
 * Quick check if AI features are enabled
 */
export async function isAIEnabled(): Promise<boolean> {
    const flags = await getFeatureFlags();
    return flags.aiEnabled;
}

/**
 * Check if rate limits should be bypassed
 */
export async function shouldBypassRateLimits(): Promise<boolean> {
    const flags = await getFeatureFlags();
    return flags.disableRateLimits;
}

/**
 * Check if user should get unlimited AI access
 * Returns true if: aiUnlimitedMode is on, user is whitelisted, or within unlock period
 */
export async function shouldUnlockAI(userId?: string): Promise<boolean> {
    const flags = await getFeatureFlags();

    // Global unlimited mode
    if (flags.aiUnlimitedMode) return true;

    // Check unlock period
    if (flags.aiUnlockUntil) {
        const unlockDate = new Date(flags.aiUnlockUntil);
        if (Date.now() < unlockDate.getTime()) {
            return true;
        }
    }

    // Check whitelist
    if (userId && flags.aiWhitelist?.includes(userId)) {
        return true;
    }

    return false;
}

/**
 * Add user to AI whitelist
 */
export async function addToAIWhitelist(userId: string, updatedBy?: string): Promise<FeatureFlags> {
    const flags = await getFeatureFlags();
    const whitelist = [...(flags.aiWhitelist || [])];

    if (!whitelist.includes(userId)) {
        whitelist.push(userId);
    }

    return updateFeatureFlags({ aiWhitelist: whitelist }, updatedBy);
}

/**
 * Remove user from AI whitelist
 */
export async function removeFromAIWhitelist(userId: string, updatedBy?: string): Promise<FeatureFlags> {
    const flags = await getFeatureFlags();
    const whitelist = (flags.aiWhitelist || []).filter(id => id !== userId);

    return updateFeatureFlags({ aiWhitelist: whitelist }, updatedBy);
}
