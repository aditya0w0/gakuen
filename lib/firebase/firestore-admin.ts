// Server-side Firestore operations using Admin SDK
import { initAdmin } from "@/lib/auth/firebase-admin";
import { User, UserSubscription } from "@/lib/types";
import { Timestamp } from "firebase-admin/firestore";

interface FirebaseUser {
    uniqueId: string;
    email: string;
    role?: "admin" | "user" | "instructor";
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
            role: (data.role === "admin" ? "admin" : "user"),
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
 * Get aggregated course stats (enrollments, ratings) using Admin SDK
 */
export async function getCourseStats() {
    const { firestore } = initAdmin();
    const db = firestore();

    try {
        const [enrollmentsSnap, reviewsSnap] = await Promise.all([
            db.collection("enrollments").get(),
            db.collection("reviews").get()
        ]);

        const enrollmentCounts: Record<string, number> = {};
        enrollmentsSnap.forEach(doc => {
            const data = doc.data();
            if (data.courseId) {
                enrollmentCounts[data.courseId] = (enrollmentCounts[data.courseId] || 0) + 1;
            }
        });

        const courseRatings: Record<string, { sum: number; count: number }> = {};
        reviewsSnap.forEach(doc => {
            const data = doc.data();
            const { courseId, rating } = data;
            if (courseId && typeof rating === 'number') {
                if (!courseRatings[courseId]) {
                    courseRatings[courseId] = { sum: 0, count: 0 };
                }
                courseRatings[courseId].sum += rating;
                courseRatings[courseId].count += 1;
            }
        });

        return { enrollmentCounts, courseRatings };
    } catch (error) {
        console.error("Error fetching course stats:", error);
        return { enrollmentCounts: {}, courseRatings: {} };
    }
}
