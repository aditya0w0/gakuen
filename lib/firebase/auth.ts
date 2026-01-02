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
// import { User } from "@/lib/types"; // Removed
import { getUserProfile, createUserProfile } from "./firestore";

export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user";
    avatar?: string;
    username?: string;
    [key: string]: any;
}

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

        let profile = await getUserProfile(credential.user.uid);

        // FALLBACK: Create profile if user exists in Firebase Auth but not Firestore
        // This handles legacy/migrated users who have Auth but no Firestore profile
        if (!profile) {
            console.log('📝 Creating Firestore profile for legacy user:', credential.user.uid);
            const newUser: User = {
                id: credential.user.uid,
                email: credential.user.email || email,
                name: credential.user.displayName || email.split('@')[0],
                role: "user",
                enrolledCourses: [],
                completedLessons: [],
                createdAt: new Date().toISOString(),
            };
            await createUserProfile(newUser);
            profile = newUser;
        }

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

        // Get Firebase ID token
        const idToken = await credential.user.getIdToken();

        // Set httpOnly cookie via API (secure)
        const tokenResponse = await fetch('/api/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (!tokenResponse.ok) {
            console.error('Failed to set auth cookie during signup');
            // Don't throw - user is created, just might need to login again if middleware is strict
            // But ideally we want auto-login
        }

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

        // Google's photo URL (always get latest from Google)
        const googleAvatar = credential.user.photoURL || undefined;

        // If new user, create profile
        if (!profile) {
            const newUser: User = {
                id: credential.user.uid,
                email: credential.user.email || "",
                name: credential.user.displayName || "User",
                role: "user",
                avatar: googleAvatar,
                enrolledCourses: [],
                completedLessons: [],
                createdAt: new Date().toISOString(),
            };

            await createUserProfile(newUser);
            profile = newUser;
        } else {
            // Existing user - ALWAYS update avatar from Google (it might have changed)
            if (googleAvatar) {
                profile = { ...profile, avatar: googleAvatar };
                // Update in Firestore
                const { updateUserProfile } = await import('./firestore');
                await updateUserProfile(credential.user.uid, { avatar: googleAvatar });
            }
        }

        // CRITICAL: Save profile with avatar to localStorage for immediate display
        const { localCache } = await import('@/lib/storage/local-cache');
        localCache.user.set(profile);

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

    // Refresh the server-side session cookie using client SDK
    // Call this when you get a 401 or want to extend the session
    async refreshSession(): Promise<boolean> {
        if (!isFirebaseEnabled()) return false;

        const auth = getFirebaseAuth();
        const user = auth?.currentUser;

        if (!user) return false;

        try {
            // Force refresh ID token
            const idToken = await user.getIdToken(true);

            // Set new httpOnly cookie
            const res = await fetch('/api/auth/set-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            return res.ok;
        } catch (e) {
            console.error("Failed to refresh session", e);
            return false;
        }
    }
};
