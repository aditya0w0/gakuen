// Firebase initialization and configuration
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import type { FirebaseConfig } from "./types";

const firebaseConfig: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Check if Firebase should be enabled
export const isFirebaseEnabled = (): boolean => {
    return process.env.NEXT_PUBLIC_USE_FIREBASE === "true" &&
        !!firebaseConfig.apiKey &&
        !!firebaseConfig.projectId;
};

// Initialize Firebase app (singleton)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const initFirebase = () => {
    if (!isFirebaseEnabled()) {
        console.log("Firebase disabled - using local storage only");
        return { app: null, auth: null, db: null };
    }

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized");
    } else {
        app = getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);
    }

    return { app, auth, db };
};

// Export getters
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseDB = () => db;
