// Firebase Auth operations - Email/Password and Google Sign-In
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseAuthUser,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseEnabled } from "./config";
import { User } from "@/lib/constants/demo-data";
import { getUserProfile, createUserProfile } from "./firestore";

export const firebaseAuth = {
    // Sign in with email/password
    async signIn(email: string, password: string): Promise<User | null> {
        if (!isFirebaseEnabled()) return null;

        const auth = getFirebaseAuth();
        if (!auth) return null;

        const credential = await signInWithEmailAndPassword(auth, email, password);

        // Get Firebase ID token
        const idToken = await credential.user.getIdToken();

        // Set httpOnly cookie via API (secure)
        const tokenResponse = await fetch('/api/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to set auth token');
        }

        const profile = await getUserProfile(credential.user.uid);
        return profile;
    },

    // Sign up new user with email/password
    async signUp(email: string, password: string, name: string): Promise<User> {
        if (!isFirebaseEnabled()) {
            throw new Error("Firebase is not enabled");
        }

        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase auth not initialized");

        const credential = await createUserWithEmailAndPassword(auth, email, password);

        const newUser: User = {
            id: credential.user.uid,
            email,
            name,
            role: "user",
            enrolledCourses: [],
            completedLessons: [],
            createdAt: new Date().toISOString(),
        };

        await createUserProfile(newUser);
        return newUser;
    },

    // Sign in with Google
    async signInWithGoogle(): Promise<User | null> {
        if (!isFirebaseEnabled()) return null;

        const auth = getFirebaseAuth();
        if (!auth) return null;

        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(auth, provider);

        // Get Firebase ID token
        const idToken = await credential.user.getIdToken();

        // Set httpOnly cookie via API (secure)
        const tokenResponse = await fetch('/api/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to set auth token');
        }

        // Check if user exists
        let profile = await getUserProfile(credential.user.uid);

        // If new user, create profile
        if (!profile) {
            const newUser: User = {
                id: credential.user.uid,
                email: credential.user.email || "",
                name: credential.user.displayName || "User",
                role: "user",
                avatar: credential.user.photoURL || undefined,
                enrolledCourses: [],
                completedLessons: [],
                createdAt: new Date().toISOString(),
            };

            await createUserProfile(newUser);
            profile = newUser;
        }

        return profile;
    },

    // Sign out
    async signOut(): Promise<void> {
        if (!isFirebaseEnabled()) return;

        const auth = getFirebaseAuth();
        if (!auth) return;

        await signOut(auth);
    },

    // Listen to auth state changes
    onAuthChange(callback: (user: FirebaseAuthUser | null) => void) {
        if (!isFirebaseEnabled()) return () => { };

        const auth = getFirebaseAuth();
        if (!auth) return () => { };

        return onAuthStateChanged(auth, callback);
    },

    // Get current user
    getCurrentUser(): FirebaseAuthUser | null {
        if (!isFirebaseEnabled()) return null;

        const auth = getFirebaseAuth();
        return auth?.currentUser || null;
    },
};
