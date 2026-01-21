/**
 * Pre-aggregated Admin Dashboard Stats
 * 
 * Single document: stats/admin_dashboard
 * Dashboard = 1 read, always.
 * 
 * Stats are updated via:
 * - API call (manual refresh)
 * - Could be Cloud Function on writes (future)
 */

import { initAdmin } from "@/lib/auth/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface AdminDashboardStats {
    // User stats
    totalUsers: number;
    subscriptions: {
        free: number;
        basic: number;
        mid: number;
        pro: number;
    };

    // Revenue stats
    totalRevenue: number;
    monthlyRevenue: number;

    // Course stats
    activeCourses: number;
    totalEnrollments: number;
    avgCompletion: number;

    // Meta
    lastUpdated: string;
    updatedBy: "manual" | "scheduled" | "trigger";
}

const STATS_DOC_PATH = "stats/admin_dashboard";

// In-memory cache with 30-min TTL
let cache: { data: AdminDashboardStats | null; timestamp: number } = {
    data: null,
    timestamp: 0,
};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get admin dashboard stats (1 Firestore read, cached 30min)
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
    const now = Date.now();

    // Return from cache if fresh
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
        console.log("📊 [AdminStats] Cache HIT");
        return cache.data;
    }

    console.log("📊 [AdminStats] Reading from Firestore...");

    try {
        const { firestore } = initAdmin();
        const db = firestore();

        const doc = await db.doc(STATS_DOC_PATH).get();

        if (!doc.exists) {
            console.log("📊 [AdminStats] Stats doc doesn't exist, returning defaults");
            return getDefaultStats();
        }

        const data = doc.data() as AdminDashboardStats & { lastUpdated: Timestamp };

        const stats: AdminDashboardStats = {
            ...data,
            lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
        };

        // Cache it
        cache = { data: stats, timestamp: now };

        return stats;
    } catch (error) {
        console.error("📊 [AdminStats] Error reading stats:", error);
        return cache.data || getDefaultStats();
    }
}

/**
 * Refresh admin dashboard stats (expensive - should be called sparingly)
 * Reads: users, payments collections
 * Writes: 1 (stats doc)
 */
export async function refreshAdminDashboardStats(
    updatedBy: "manual" | "scheduled" | "trigger" = "manual"
): Promise<AdminDashboardStats> {
    console.log(`📊 [AdminStats] Refreshing stats (${updatedBy})...`);

    const { firestore } = initAdmin();
    const db = firestore();

    const stats: AdminDashboardStats = {
        totalUsers: 0,
        subscriptions: { free: 0, basic: 0, mid: 0, pro: 0 },
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeCourses: 0,
        totalEnrollments: 0,
        avgCompletion: 0,
        lastUpdated: new Date().toISOString(),
        updatedBy,
    };

    try {
        // Only essential data - count + aggregate in batches
        // Users count and subscription breakdown
        const usersSnap = await db.collection("users").select("subscription").get();
        stats.totalUsers = usersSnap.size;

        usersSnap.forEach(doc => {
            const tier = doc.data()?.subscription?.tier || "free";
            if (stats.subscriptions[tier as keyof typeof stats.subscriptions] !== undefined) {
                stats.subscriptions[tier as keyof typeof stats.subscriptions]++;
            }
        });

        // Revenue from payments (completed only)
        const paymentsSnap = await db.collection("payments")
            .where("status", "==", "completed")
            .select("amount", "createdAt")
            .get();

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        paymentsSnap.forEach(doc => {
            const data = doc.data();
            const amount = data.amount || 0;
            stats.totalRevenue += amount;

            // Check if payment is this month
            const paymentDate = data.createdAt?.toDate?.() || new Date(0);
            if (paymentDate >= thisMonth) {
                stats.monthlyRevenue += amount;
            }
        });

        // Course stats from pre-aggregated collection
        const courseStatsSnap = await db.collection("course_stats").get();
        stats.activeCourses = courseStatsSnap.size;

        let totalEnrollments = 0;
        courseStatsSnap.forEach(doc => {
            totalEnrollments += doc.data()?.enrolledCount || 0;
        });
        stats.totalEnrollments = totalEnrollments;

        // Save to Firestore
        await db.doc(STATS_DOC_PATH).set({
            ...stats,
            lastUpdated: FieldValue.serverTimestamp(),
        });

        // Update cache
        cache = { data: stats, timestamp: Date.now() };

        console.log(`📊 [AdminStats] Refresh complete. Users: ${stats.totalUsers}, Revenue: $${stats.totalRevenue}`);

        return stats;
    } catch (error) {
        console.error("📊 [AdminStats] Refresh failed:", error);
        throw error;
    }
}

/**
 * Increment helpers for real-time updates (called from other APIs)
 */
export async function incrementUserCount(delta: number = 1): Promise<void> {
    const { firestore } = initAdmin();
    const db = firestore();

    await db.doc(STATS_DOC_PATH).update({
        totalUsers: FieldValue.increment(delta),
        "subscriptions.free": FieldValue.increment(delta), // New users start free
        lastUpdated: FieldValue.serverTimestamp(),
    });

    // Invalidate cache
    cache = { data: null, timestamp: 0 };
}

export async function incrementRevenue(amount: number, isMonthly: boolean = true): Promise<void> {
    const { firestore } = initAdmin();
    const db = firestore();

    const update: Record<string, any> = {
        totalRevenue: FieldValue.increment(amount),
        lastUpdated: FieldValue.serverTimestamp(),
    };

    if (isMonthly) {
        update.monthlyRevenue = FieldValue.increment(amount);
    }

    await db.doc(STATS_DOC_PATH).update(update);

    // Invalidate cache
    cache = { data: null, timestamp: 0 };
}

export async function updateSubscriptionTier(
    fromTier: "free" | "basic" | "mid" | "pro",
    toTier: "free" | "basic" | "mid" | "pro"
): Promise<void> {
    if (fromTier === toTier) return;

    const { firestore } = initAdmin();
    const db = firestore();

    await db.doc(STATS_DOC_PATH).update({
        [`subscriptions.${fromTier}`]: FieldValue.increment(-1),
        [`subscriptions.${toTier}`]: FieldValue.increment(1),
        lastUpdated: FieldValue.serverTimestamp(),
    });

    // Invalidate cache
    cache = { data: null, timestamp: 0 };
}

function getDefaultStats(): AdminDashboardStats {
    return {
        totalUsers: 0,
        subscriptions: { free: 0, basic: 0, mid: 0, pro: 0 },
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeCourses: 0,
        totalEnrollments: 0,
        avgCompletion: 0,
        lastUpdated: new Date().toISOString(),
        updatedBy: "manual",
    };
}
