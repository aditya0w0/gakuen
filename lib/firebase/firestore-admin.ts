// Server-side Firestore operations using Admin SDK
import { initAdmin } from "@/lib/auth/firebase-admin";
import { User, UserSubscription } from "@/lib/types";
import { Timestamp } from "firebase-admin/firestore";

interface FirebaseUser {
    uniqueId: string;
    email: string;
    role?: "admin" | "student" | "user" | "instructor";  // 'user' is legacy, will be normalized to 'student'
    name?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
    bio?: string;
    subscription?: UserSubscription;
    enrolledCourses?: string[];
    createdAt?: Timestamp | string;
}

/**
 * Get user profile using Admin SDK (bypasses Firestore rules)
 * Essential for Auth Guards where client SDK is unauthenticated
 */
export async function getAdminUserProfile(userId: string): Promise<User | null> {
    const { firestore } = initAdmin();
    const db = firestore();

    try {
        const docSnap = await db.collection("users").doc(userId).get();

        if (!docSnap.exists) return null;

        const data = docSnap.data() as FirebaseUser;

        return {
            id: userId,
            email: data.email,
            name: data.name || 'User',
            role: (data.role === "admin" ? "admin" : "student"),
            avatar: data.avatar,

            // Profile fields
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            phone: data.phone,
            bio: data.bio,

            // Subscription
            subscription: data.subscription,

            // Course data
            enrolledCourses: data.enrolledCourses || [],
            completedLessons: [], // Not loaded here to keep it light

            createdAt: data.createdAt
                ? (typeof data.createdAt === 'string' ? data.createdAt : (data.createdAt as Timestamp).toDate().toISOString())
                : new Date().toISOString(),
        };
    } catch (error) {
        console.error("Error fetching admin user profile:", error);
        return null;
    }
}

/**
 * Create user profile using Admin SDK
 */
export async function createAdminUserProfile(user: User): Promise<User> {
    const { firestore } = initAdmin();
    const db = firestore();

    try {
        const userDoc = {
            uid: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "student",
            enrolledCourses: user.enrolledCourses || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(user.avatar ? { avatar: user.avatar } : {})
        };

        await db.collection("users").doc(user.id).set(userDoc, { merge: true });
        return user;
    } catch (error) {
        console.error("Error creating admin user profile:", error);
        throw error;
    }
}

/**
 * Get aggregated course stats (enrollments, ratings)
 * 
 * OPTIMIZED: Reads from pre-aggregated course_stats collection
 * instead of scanning entire enrollments/reviews collections!
 * 
 * Stats are updated on:
 * - enrollment (incrementCourseEnrollCount)
 * - review submission (incrementCourseRating)
 */

// Cache for course stats with jittered TTL
let statsCache: {
    data: { enrollmentCounts: Record<string, number>; courseRatings: Record<string, { sum: number; count: number }> } | null;
    timestamp: number;
    ttl: number; // Jittered to prevent synchronized expiry
} = { data: null, timestamp: 0, ttl: 0 };

// Stampede protection
let inFlightFetch: Promise<{ enrollmentCounts: Record<string, number>; courseRatings: Record<string, { sum: number; count: number }> }> | null = null;

// Base TTL: 10 minutes + random jitter (0-3 min) to prevent synchronized expiry
function getJitteredTTL() {
    return 10 * 60 * 1000 + Math.random() * 3 * 60 * 1000;
}

export async function getCourseStats() {
    const now = Date.now();

    // Check cache first
    if (statsCache.data && (now - statsCache.timestamp) < statsCache.ttl) {
        return statsCache.data;
    }

    // Stampede protection: if already fetching, wait for that result
    if (inFlightFetch) {
        console.log(`📊 [Stats] Waiting for in-flight fetch...`);
        return inFlightFetch;
    }

    const { firestore } = initAdmin();
    const db = firestore();

    // Set in-flight to prevent stampede
    inFlightFetch = (async () => {
        try {
            console.log(`📊 [Stats] Fetching from course_stats collection...`);

            // Read pre-aggregated stats (1 doc per course, NOT entire collections!)
            const statsSnap = await db.collection('course_stats').get();

            const enrollmentCounts: Record<string, number> = {};
            const courseRatings: Record<string, { sum: number; count: number }> = {};

            statsSnap.forEach(doc => {
                const data = doc.data();
                const courseId = doc.id;

                if (data.enrolledCount) {
                    enrollmentCounts[courseId] = data.enrolledCount;
                }
                if (data.ratingSum !== undefined && data.ratingCount) {
                    courseRatings[courseId] = {
                        sum: data.ratingSum,
                        count: data.ratingCount
                    };
                }
            });

            // Cache with jittered TTL
            const result = { enrollmentCounts, courseRatings };
            statsCache = { data: result, timestamp: now, ttl: getJitteredTTL() };
            console.log(`✅ [Stats] Cached (${statsSnap.size} course stats docs)`);

            return result;
        } catch (error) {
            console.error("Error fetching course stats:", error);
            // Return stale cache if available, otherwise empty
            return statsCache.data || { enrollmentCounts: {}, courseRatings: {} };
        } finally {
            inFlightFetch = null;
        }
    })();

    return inFlightFetch;
}

/**
 * Increment course rating (called on review submission)
 */
export async function incrementCourseRating(courseId: string, rating: number) {
    const { firestore, FieldValue } = initAdmin();
    const db = firestore();

    try {
        await db.collection('course_stats').doc(courseId).set({
            ratingSum: FieldValue.increment(rating),
            ratingCount: FieldValue.increment(1),
            lastReview: new Date().toISOString(),
        }, { merge: true });
        console.log(`📊 [Stats] Added rating ${rating} to ${courseId}`);
    } catch (error) {
        console.warn(`⚠️ [Stats] Failed to update rating:`, error);
    }
}
