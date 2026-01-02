// Firebase type definitions
import { Timestamp } from "firebase/firestore";

export interface FirebaseUser {
    uid: string;
    email: string;
    name: string;
    role: "admin" | "user";
    enrolledCourses: string[];
    avatar?: string;
    // Profile fields
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
    bio?: string;
    // Subscription
    subscription?: {
        tier: "free" | "basic" | "mid" | "pro";
        status: "active" | "cancelled" | "expired";
        startDate?: string;
        endDate?: string;
        billingCycle?: "monthly" | "yearly";
        aiUsage?: {
            proRequestsToday: number;
            flashRequestsToday: number;
            lastResetDate: string;
        };
        purchasedCourses?: string[];
        purchasedBundles?: string[];
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface FirebaseProgress {
    userId: string;
    completedLessons: string[];
    courseProgress: Record<string, number>;
    totalHours: number;
    currentStreak: number;
    lastActivity: Timestamp;
    updatedAt: Timestamp;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}
