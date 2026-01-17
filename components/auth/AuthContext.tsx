"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { initFirebase } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            // Initialize Firebase with persistence (async)
            await initFirebase();

            // Load user from cache immediately (O(1))
            const cachedUser = hybridStorage.auth.getSession();
            if (cachedUser && mounted) {
                setUser(cachedUser);
                setIsLoading(false);

                // Sync cookie with localStorage (for existing sessions)
                import('@/lib/auth/cookies').then(({ authCookies }) => {
                    authCookies.set(cachedUser);
                });
            }

            // Listen to Firebase auth state for real-time sync & session restoration
            try {
                const { firebaseAuth } = await import('@/lib/firebase/auth');
                const { getUserProfile } = await import('@/lib/firebase/firestore');

                const unsubscribe = firebaseAuth.onAuthChange(async (firebaseUser) => {
                    if (!mounted) return;

                    if (firebaseUser) {
                        // User is signed in - get full profile
                        const profile = await getUserProfile(firebaseUser.uid);
                        if (profile && mounted) {
                            setUser(profile);
                            // Update localStorage to keep cache in sync
                            import('@/lib/storage/local-cache').then(({ localCache }) => {
                                localCache.user.set(profile);
                            });
                            // Also update cookie
                            import('@/lib/auth/cookies').then(({ authCookies }) => {
                                authCookies.set(profile);
                            });
                        }
                    } else if (!cachedUser) {
                        // Only clear user if we also don't have cached user
                        // This prevents flash during logout navigation
                        setUser(null);
                    }
                    setIsLoading(false);
                });

                return unsubscribe;
            } catch (error) {
                console.error('Failed to setup auth listener:', error);
                if (mounted) setIsLoading(false);
            }
        };

        // Set loading to false after timeout if Firebase takes too long
        const timeout = setTimeout(() => {
            if (mounted) setIsLoading(false);
        }, 2000);

        initAuth();

        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const loggedInUser = await hybridStorage.auth.login(email, password);
            console.log('✅ Login successful, user:', loggedInUser);

            // Set user state immediately after successful login
            setUser(loggedInUser);

            // CRITICAL: Set loading to false BEFORE navigation
            setIsLoading(false);

            console.log('✅ User state set, navigating...');

            // Small delay to ensure React has flushed the state updates
            await new Promise(resolve => setTimeout(resolve, 50));

            // Redirect based on role using replace to prevent back-button issues
            console.log(`🔄 Redirecting to ${loggedInUser.role === 'admin' ? '/dashboard' : '/user'}`);
            if (loggedInUser.role === "admin") {
                router.replace("/dashboard");
            } else {
                router.replace("/user");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Login failed";
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const newUser = await hybridStorage.auth.signup(email, password, name);
            console.log('✅ Signup successful, user:', newUser);

            // Set user state immediately
            setUser(newUser);

            // CRITICAL: Set loading to false BEFORE navigation
            setIsLoading(false);

            console.log('✅ User state set, navigating to user dashboard...');

            // Use replace to prevent back-button issues
            // Small delay to ensure React has flushed the state updates
            await new Promise(resolve => setTimeout(resolve, 100));

            // Force navigation to user dashboard
            router.replace("/user");
        } catch (err) {
            console.error('❌ Signup failed:', err);
            const errorMessage = err instanceof Error ? err.message : "Signup failed";
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUser(null); // Clear user first to prevent any re-auth race conditions
        setError(null);

        // Navigate BEFORE async logout to ensure immediate redirect
        router.replace("/login");

        // Then cleanup in background
        await hybridStorage.auth.logout();
        setIsLoading(false);
    };

    const refreshUser = async () => {
        try {
            const { getUserProfile } = await import('@/lib/firebase/firestore');
            const { firebaseAuth } = await import('@/lib/firebase/auth');
            const { localCache } = await import('@/lib/storage/local-cache');

            // Try to get user ID from multiple sources
            let userId: string | null = null;

            // First try: Current Firebase user
            const currentFirebaseUser = firebaseAuth.getCurrentUser();
            if (currentFirebaseUser) {
                userId = currentFirebaseUser.uid;
            }

            // Second try: Current React state
            if (!userId && user) {
                userId = user.id;
            }

            // Third try: Local cache
            if (!userId) {
                const cachedUser = localCache.user.get() as { id?: string } | null;
                if (cachedUser?.id) {
                    userId = cachedUser.id;
                }
            }

            if (!userId) {
                console.warn('⚠️ refreshUser: No user ID found from any source');
                return;
            }

            // Fetch FRESH profile from Firestore (bypasses any cache)
            const firebaseProfile = await getUserProfile(userId);
            if (firebaseProfile) {
                console.log('✅ refreshUser: Fetched fresh profile from Firestore', {
                    enrolledCourses: firebaseProfile.enrolledCourses?.length,
                    subscription: firebaseProfile.subscription?.tier
                });
                setUser(firebaseProfile);
                // CRITICAL: Update localStorage so other components see the change
                localCache.user.set(firebaseProfile);
            } else {
                console.warn('⚠️ refreshUser: User profile not found in Firestore');
            }
        } catch (error) {
            console.error('❌ refreshUser error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
