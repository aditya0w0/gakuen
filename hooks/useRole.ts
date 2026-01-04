"use client";

import { useAuth } from "@/components/auth/AuthContext";

export function useRole() {
    const { user } = useAuth();

    return {
        role: user?.role,
        isAdmin: user?.role === "admin",
        isStudent: user?.role === "student",
        isAuthenticated: !!user,
    };
}
