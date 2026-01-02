// Subscription and pricing tier constants

export type SubscriptionTier = 'free' | 'basic' | 'mid' | 'pro';
export type PurchaseType = 'subscription' | 'course' | 'bundle';

// AI Model identifiers
export const AI_MODELS = {
    FLASH_LITE: 'gemini-2.0-flash-lite',
    FLASH: 'gemini-2.0-flash',
    PRO: 'gemini-2.0-flash', // Using flash as default, can switch to pro when available
} as const;

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        priceMonthly: 0,
        priceYearly: 0,
        description: 'Get started with learning',
        features: [
            'Browse course catalog',
            'Preview course content',
            'AI Assistant (Flash Lite)',
            '20 AI requests/day',
        ],
        courseAccessPercent: 0, // No paid courses
        aiModel: AI_MODELS.FLASH_LITE,
        aiLimits: {
            proRequestsPerDay: 0,
            flashRequestsPerDay: 20,
        },
        badge: null,
        recommended: false,
    },
    basic: {
        id: 'basic',
        name: 'Basic',
        price: 9.99,
        priceMonthly: 9.99,
        priceYearly: 99.99, // 2 months free
        description: 'Perfect for getting started',
        features: [
            'Access to beginner courses',
            '~30% course catalog',
            'AI Assistant (Flash)',
            '60 AI requests/day',
            'Progress tracking',
            'Certificates',
        ],
        courseAccessPercent: 30,
        accessTiers: ['free', 'basic'] as SubscriptionTier[],
        aiModel: AI_MODELS.FLASH,
        aiLimits: {
            proRequestsPerDay: 0,
            flashRequestsPerDay: 60,
        },
        badge: 'POPULAR',
        recommended: false,
    },
    mid: {
        id: 'mid',
        name: 'Standard',
        price: 19.99,
        priceMonthly: 19.99,
        priceYearly: 199.99, // 2 months free
        description: 'Most popular for serious learners',
        features: [
            'Access to 50% courses',
            'Beginner + Intermediate',
            'AI Assistant (Pro + Flash)',
            '30 Pro requests/day',
            'Unlimited Flash requests',
            'Priority support',
        ],
        courseAccessPercent: 50,
        accessTiers: ['free', 'basic', 'mid'] as SubscriptionTier[],
        aiModel: AI_MODELS.PRO,
        aiLimits: {
            proRequestsPerDay: 30,
            flashRequestsPerDay: -1, // Unlimited
        },
        badge: 'BEST VALUE',
        recommended: true,
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 49.99,
        priceMonthly: 49.99,
        priceYearly: 499.99, // 2 months free
        description: 'Full access to everything',
        features: [
            'All courses unlocked',
            'All difficulty levels',
            'AI Assistant (Pro + Flash)',
            '120 Pro requests/day',
            'Unlimited Flash requests',
            'Priority support',
            'Early access to new courses',
            '1-on-1 mentoring sessions',
        ],
        courseAccessPercent: 100,
        accessTiers: ['free', 'basic', 'mid', 'pro'] as SubscriptionTier[],
        aiModel: AI_MODELS.PRO,
        aiLimits: {
            proRequestsPerDay: 120,
            flashRequestsPerDay: -1, // Unlimited
        },
        badge: 'UNLIMITED',
        recommended: false,
    },
} as const;

// Course tier mapping (based on difficulty)
export const COURSE_TIER_MAP: Record<string, SubscriptionTier> = {
    beginner: 'basic',
    intermediate: 'mid',
    advanced: 'pro',
};

// User subscription interface
export interface UserSubscription {
    tier: SubscriptionTier;
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: string; // ISO date
    endDate: string; // ISO date
    billingCycle: 'monthly' | 'yearly';
    aiUsage: {
        proRequestsToday: number;
        flashRequestsToday: number;
        lastResetDate: string; // ISO date for daily reset
    };
    purchasedCourses: string[]; // Course IDs purchased individually
    purchasedBundles: string[]; // Bundle IDs purchased
}

// Coupon interface
export interface Coupon {
    code: string;
    discountPercent: number; // 20 = 20% off
    discountAmount?: number; // Fixed amount off (alternative)
    validFrom: string;
    validUntil: string;
    maxUses: number;
    usedCount: number;
    applicableTo: PurchaseType | 'all';
    applicableTiers?: SubscriptionTier[]; // Only for specific tiers
    minPurchaseAmount?: number;
    isActive: boolean;
}

// Bundle interface
export interface Bundle {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    courseIds: string[];
    originalPrice: number; // Sum of individual prices
    bundlePrice: number; // Discounted bundle price
    savings: number; // How much user saves
    isActive: boolean;
    featured: boolean;
}

// Sample bundles (hardcoded for now)
export const BUNDLES: Bundle[] = [
    {
        id: 'web-dev-track',
        name: 'Web Development Track',
        description: 'Master modern web development from beginner to pro',
        thumbnail: 'https://picsum.photos/seed/webdev/800/600',
        courseIds: ['cs-101', 'web-202'],
        originalPrice: 129.98,
        bundlePrice: 99.99,
        savings: 29.99,
        isActive: true,
        featured: true,
    },
    {
        id: 'data-science-track',
        name: 'Data Science Track',
        description: 'Complete data science and machine learning path',
        thumbnail: 'https://picsum.photos/seed/datascience/800/600',
        courseIds: ['cs-101', 'py-300'],
        originalPrice: 119.98,
        bundlePrice: 89.99,
        savings: 29.99,
        isActive: true,
        featured: true,
    },
];

// Helper functions
export function getTierConfig(tier: SubscriptionTier) {
    return SUBSCRIPTION_TIERS[tier];
}

export function canAccessCourse(
    userTier: SubscriptionTier,
    courseTier: SubscriptionTier,
    purchasedCourses: string[] = [],
    courseId: string
): boolean {
    // If user purchased this course individually, they can access it
    if (purchasedCourses.includes(courseId)) {
        return true;
    }

    // Check subscription tier access
    const tierHierarchy: SubscriptionTier[] = ['free', 'basic', 'mid', 'pro'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const courseTierIndex = tierHierarchy.indexOf(courseTier);

    return userTierIndex >= courseTierIndex;
}

export function getAIModelForTier(tier: SubscriptionTier, hasPurchasedCourse: boolean = false): string {
    // Per-course purchase users only get Flash
    if (hasPurchasedCourse && tier === 'free') {
        return AI_MODELS.FLASH;
    }

    return SUBSCRIPTION_TIERS[tier].aiModel;
}

export function checkAILimit(
    tier: SubscriptionTier,
    usage: UserSubscription['aiUsage'],
    modelType: 'pro' | 'flash'
): { allowed: boolean; remaining: number } {
    const limits = SUBSCRIPTION_TIERS[tier].aiLimits;
    const limit = modelType === 'pro' ? limits.proRequestsPerDay : limits.flashRequestsPerDay;
    const used = modelType === 'pro' ? usage.proRequestsToday : usage.flashRequestsToday;

    if (limit === -1) {
        return { allowed: true, remaining: -1 }; // Unlimited
    }

    return {
        allowed: used < limit,
        remaining: Math.max(0, limit - used),
    };
}

// Default subscription for new users
export const DEFAULT_SUBSCRIPTION: UserSubscription = {
    tier: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 100 years
    billingCycle: 'monthly',
    aiUsage: {
        proRequestsToday: 0,
        flashRequestsToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
    },
    purchasedCourses: [],
    purchasedBundles: [],
};
