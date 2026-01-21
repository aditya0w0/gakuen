// Firestore database operations
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    FieldValue,
} from "firebase/firestore";
import { getFirebaseDB, isFirebaseEnabled } from "./config";
import { User } from "@/lib/types";
import type { FirebaseUser, FirebaseProgress } from "./types";

// ============================================
// USER PROFILE CACHE (prevents excessive Firestore reads)
// ============================================
interface CachedProfile {
    user: User;
    cachedAt: number;
}

const profileCache = new Map<string, CachedProfile>();
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(userId: string): User | null {
    const cached = profileCache.get(userId);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.cachedAt > PROFILE_CACHE_TTL) {
        profileCache.delete(userId);
        return null;
    }

    return cached.user;
}

function setCachedProfile(userId: string, user: User): void {
    profileCache.set(userId, {
        user,
        cachedAt: Date.now(),
    });
}

export function invalidateProfileCache(userId: string): void {
    profileCache.delete(userId);
}

// User Operations
export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!isFirebaseEnabled()) return null;

    // Check cache first (prevents repeated Firestore reads)
    const cached = getCachedProfile(userId);
    if (cached) {
        console.log(`📦 [ProfileCache] Hit for ${userId.slice(0, 8)}...`);
        return cached;
    }

    const db = getFirebaseDB();
    if (!db) return null;

    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data() as FirebaseUser;
        // Normalize role: 'user' is legacy, map it to 'student'
        const normalizedRole: "admin" | "student" = data.role === 'admin' ? 'admin' : 'student';
        const user: User = {
            id: userId,
            email: data.email,
            name: data.name,
            role: normalizedRole,
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
            enrolledCourses: data.enrolledCourses,
            completedLessons: [], // Loaded separately from progress
            createdAt: data.createdAt
                ? (data.createdAt as Timestamp).toDate().toISOString()
                : new Date().toISOString(),
        };

        // Cache the profile
        setCachedProfile(userId, user);
        console.log(`🔥 [Firestore] Fetched profile for ${userId.slice(0, 8)}... (now cached)`);

        return user;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const createUserProfile = async (user: User): Promise<User> => {
    if (!isFirebaseEnabled()) return user;

    const db = getFirebaseDB();
    if (!db) return user;

    try {
        // Build document, filtering out undefined values (Firestore doesn't accept them)
        const userDoc: Record<string, string | string[] | FieldValue> = {
            uid: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "student", // Default to student if no role
            enrolledCourses: user.enrolledCourses || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Only add avatar if it's defined
        if (user.avatar) {
            userDoc.avatar = user.avatar;
        }

        // Use merge to avoid overwriting existing data during race conditions
        // (e.g., multiple concurrent API calls creating profile simultaneously)
        await setDoc(doc(db, "users", user.id), userDoc, { merge: true });
        return user;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};
export const updateUserProfile = async (
    userId: string,
    updates: Partial<Pick<User, "name" | "avatar" | "enrolledCourses" | "firstName" | "lastName" | "username" | "phone" | "bio" | "subscription">>
): Promise<void> => {
    if (!isFirebaseEnabled()) return;

    const db = getFirebaseDB();
    if (!db) return;

    try {
        // Filter out undefined values
        const cleanUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        });

        // Use setDoc with merge instead of updateDoc
        // This ensures the update works even if the profile doesn't exist yet
        await setDoc(doc(db, "users", userId), cleanUpdates, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

// Progress Operations
export const getProgress = async (userId: string): Promise<FirebaseProgress | null> => {
    if (!isFirebaseEnabled()) return null;

    const db = getFirebaseDB();
    if (!db) return null;

    try {
        const docSnap = await getDoc(doc(db, "progress", userId));
        if (!docSnap.exists()) return null;

        return docSnap.data() as FirebaseProgress;
    } catch (error) {
        console.error("Error fetching progress:", error);
        return null;
    }
};

export const updateProgress = async (
    userId: string,
    progress: {
        completedLessons: string[];
        courseProgress: Record<string, number>;
        totalHours?: number;
        currentStreak?: number;
    }
): Promise<void> => {
    if (!isFirebaseEnabled()) return;

    const db = getFirebaseDB();
    if (!db) return;

    try {
        await setDoc(
            doc(db, "progress", userId),
            {
                userId,
                ...progress,
                lastActivity: serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );
    } catch (error) {
        console.error("Error updating progress:", error);
        throw error;
    }
};

// Course Metadata Operations
export interface CourseMetadata {
    courseId: string;
    title: string;
    description: string;
    instructor: string;
    isPublished: boolean;
    lessonsCount: number;
    enrolledCount: number;
    createdBy: string;
}

export const saveCourseMetadata = async (metadata: CourseMetadata): Promise<void> => {
    if (!isFirebaseEnabled()) return;

    const db = getFirebaseDB();
    if (!db) return;

    try {
        await setDoc(
            doc(db, "courseMetadata", metadata.courseId),
            {
                ...metadata,
                lastModified: serverTimestamp(),
                createdAt: serverTimestamp(),
            },
            { merge: true }
        );
    } catch (error) {
        console.error("Error saving course metadata:", error);
        throw error;
    }
};

export const updateCourseMetadata = async (courseId: string, updates: Partial<CourseMetadata>): Promise<void> => {
    if (!isFirebaseEnabled()) return;

    const db = getFirebaseDB();
    if (!db) return;

    try {
        await updateDoc(doc(db, "courseMetadata", courseId), {
            ...updates,
            lastModified: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating course metadata:", error);
        throw error;
    }
};
