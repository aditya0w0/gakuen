"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirebaseAuth, isFirebaseEnabled } from "@/lib/firebase/config";
import { getUserProfile } from "@/lib/firebase/firestore";
import { firebaseAuth } from "@/lib/firebase/auth";
import { User } from "@/lib/types";
import { localCache } from "@/lib/storage/local-cache";
import { authCookies } from "@/lib/auth/cookies";
import { logger } from "@/lib/logger";

interface SessionContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    refreshSession: async () => { },
});

export const useSession = () => useContext(SessionContext);

// Cross-tab session sync channel
const SESSION_CHANNEL = "gakuen-session-sync";

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const authCheckCompleted = useRef(false);
    const isMountedRef = useRef(true); // Track mounted state to prevent setState after unmount

    // Broadcast session changes to other tabs
    const broadcastSessionChange = useCallback((action: "login" | "logout", userData?: User) => {
        if (typeof window === "undefined") return;
        try {
            const channel = new BroadcastChannel(SESSION_CHANNEL);
            channel.postMessage({ action, user: userData });
            channel.close();
        } catch (e) {
            // BroadcastChannel not supported - fallback to localStorage event
            localStorage.setItem("session-sync", JSON.stringify({ action, timestamp: Date.now() }));
        }
    }, []);

    // Handle session sync from other tabs
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data.action === "logout") {
                setUser(null);
                localCache.clear();
                authCookies.clear();
            } else if (event.data.action === "login" && event.data.user) {
                setUser(event.data.user);
                localCache.user.set(event.data.user);
            }
        };

        try {
            const channel = new BroadcastChannel(SESSION_CHANNEL);
            channel.addEventListener("message", handleMessage);
            return () => {
                channel.removeEventListener("message", handleMessage);
                channel.close();
            };
        } catch (e) {
            // Fallback: listen to storage events
            const handleStorage = (e: StorageEvent) => {
                if (e.key === "session-sync") {
                    // Reload session from cache
                    const cached = localCache.user.get() as User | null;
                    setUser(cached);
                }
            };
            window.addEventListener("storage", handleStorage);
            return () => window.removeEventListener("storage", handleStorage);
        }
    }, []);

    // Main Firebase auth state listener
    useEffect(() => {
        if (!isFirebaseEnabled()) {
            setIsLoading(false);
            return;
        }

        const auth = getFirebaseAuth();
        if (!auth) {
            setIsLoading(false);
            return;
        }

        // Failsafe: ensure loading completes even if Firebase hangs
        const timeout = setTimeout(() => {
            if (!authCheckCompleted.current) {
                logger.warn('Firebase auth timeout, setting loading to false', null, 'SessionProvider');
                authCheckCompleted.current = true;
                setIsLoading(false);
            }
        }, 3000); // 3 seconds timeout

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            // Mark auth check as completed
            authCheckCompleted.current = true;

            // Prevent setState on unmounted component
            if (!isMountedRef.current) return;

            if (firebaseUser) {
                // Firebase has a user - validate/update local session
                const localUser = localCache.user.get() as User | null;

                if (localUser && localUser.id === firebaseUser.uid) {
                    // Session matches - use local cache
                    setUser(localUser);
                } else {
                    // Session mismatch or new login - fetch fresh profile
                    // This happens after hard refresh when localStorage is cleared
                    try {
                        // CRITICAL: Refresh server-side httpOnly cookie first
                        // The proxy checks this cookie, and it may have expired or be missing
                        logger.info('Session mismatch detected, refreshing server-side cookie...', null, 'SessionProvider');
                        await firebaseAuth.refreshSession();

                        const profile = await getUserProfile(firebaseUser.uid);
                        if (profile) {
                            setUser(profile);
                            localCache.user.set(profile);
                            authCookies.set(profile);
                            broadcastSessionChange("login", profile);
                            logger.info('Session regenerated successfully', { userId: profile.id }, 'SessionProvider');
                        } else {
                            // User exists in Auth but not Firestore - CREATE the profile (hybrid sync)
                            logger.warn('User exists in Auth but not Firestore - creating profile', { uid: firebaseUser.uid }, 'SessionProvider');

                            const { createUserProfile } = await import('@/lib/firebase/firestore');
                            const newProfile = await createUserProfile({
                                id: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                name: firebaseUser.displayName || 'User',
                                role: 'user', // Default role, will be overridden by custom claims if admin
                            });

                            setUser(newProfile);
                            localCache.user.set(newProfile);
                            authCookies.set(newProfile);
                            broadcastSessionChange("login", newProfile);
                            logger.info('Profile created successfully', { userId: newProfile.id }, 'SessionProvider');
                        }
                    } catch (error) {
                        console.error("Failed to fetch user profile:", error);
                        setUser(null);
                    }
                }
            } else {
                // Firebase logged out - clear everything
                if (user) {
                    broadcastSessionChange("logout");
                }
                setUser(null);
                localCache.clear();
                authCookies.clear();
            }
            setIsLoading(false);
        });

        return () => {
            isMountedRef.current = false;
            clearTimeout(timeout);
            unsubscribe();
        };
    }, [broadcastSessionChange]); // Removed user and isLoading from deps to prevent infinite loops

    const refreshSession = useCallback(async () => {
        const cached = localCache.user.get() as User | null;
        setUser(cached);
    }, []);

    return (
        <SessionContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                refreshSession,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}
