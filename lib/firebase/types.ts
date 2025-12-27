// Firebase type definitions
import { Timestamp } from "firebase/firestore";

export interface FirebaseUser {
    uid: string;
    email: string;
    name: string;
    role: "admin" | "user";
    enrolledCourses: string[];
    avatar?: string;
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
