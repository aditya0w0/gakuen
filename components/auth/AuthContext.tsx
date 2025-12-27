"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/constants/demo-data";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { initFirebase } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Initialize Firebase
        initFirebase();

        // Load user from cache immediately (O(1))
        const currentUser = hybridStorage.auth.getSession();
        if (currentUser) {
            setUser(currentUser);

            // Sync cookie with localStorage (for existing sessions)
            import('@/lib/auth/cookies').then(({ authCookies }) => {
                authCookies.set(currentUser);
            });
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const user = await hybridStorage.auth.login(email, password);
            console.log('✅ Login successful, user:', user);

            // Set user state immediately after successful login
            setUser(user);
            console.log('✅ User state set in AuthContext');

            // Small delay to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));

            // Redirect based on role
            console.log(`🔄 Redirecting to ${user.role === 'admin' ? '/dashboard' : '/user'}`);
            if (user.role === "admin") {
                router.push("/dashboard");
            } else {
                router.push("/user");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Login failed";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const user = await hybridStorage.auth.signup(email, password, name);
            console.log('✅ Signup successful, user:', user);

            // Set user state immediately
            setUser(user);
            console.log('✅ User state set in AuthContext');

            // Small delay to ensure state propagates
            await new Promise(resolve => setTimeout(resolve, 100));

            // Redirect to user dashboard
            router.push("/user");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Signup failed";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await hybridStorage.auth.logout();
        setUser(null);
        setError(null);
        setIsLoading(false);
        router.push("/");
    };

    const refreshUser = () => {
        const currentUser = hybridStorage.auth.getSession();
        if (currentUser) {
            setUser(currentUser);
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
