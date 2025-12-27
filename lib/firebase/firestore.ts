// Firestore database operations
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { getFirebaseDB, isFirebaseEnabled } from "./config";
import { User } from "@/lib/constants/demo-data";
import type { FirebaseUser, FirebaseProgress } from "./types";

// User Operations
export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!isFirebaseEnabled()) return null;

    const db = getFirebaseDB();
    if (!db) return null;

    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data() as FirebaseUser;
        return {
            id: userId,
            email: data.email,
            name: data.name,
            role: data.role,
            avatar: data.avatar,
            enrolledCourses: data.enrolledCourses,
            completedLessons: [], // Loaded separately from progress
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        };
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const createUserProfile = async (user: User): Promise<void> => {
    if (!isFirebaseEnabled()) return;

    const db = getFirebaseDB();
    if (!db) return;

    try {
        // Build document, filtering out undefined values (Firestore doesn't accept them)
        const userDoc: Record<string, any> = {
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

        await setDoc(doc(db, "users", user.id), userDoc);
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};
export const updateUserProfile = async (
    userId: string,
    updates: Partial<Pick<User, "name" | "avatar" | "enrolledCourses">>
): Promise<void> => {
    if (!isFirebaseEnabled()) return;

    const db = getFirebaseDB();
    if (!db) return;

    try {
        // Filter out undefined values
        const cleanUpdates: Record<string, any> = { updatedAt: serverTimestamp() };
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        });

        await updateDoc(doc(db, "users", userId), cleanUpdates);
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
