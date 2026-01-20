"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

/**
 * Hook to ensure admin access. Waits for auth to fully load before checking.
 * Fixed race condition: now waits for role to be definitively set.
 */
export function useRequireAdmin() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isResolved, setIsResolved] = useState(false);
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        // Still loading - don't do anything yet
        if (isLoading) {
            console.log('⏳ useRequireAdmin: Still loading...');
            return;
        }

        // Already redirected - don't check again
        if (hasRedirected) return;

        // No user at all - redirect to login
        if (!user) {
            console.warn('❌ No user, redirecting to login');
            setHasRedirected(true);
            router.replace("/login");
            return;
        }

        // User exists but role might still be loading from server
        // If role is undefined/null, wait for it (Firebase will update)
        if (!user.role) {
            console.log('⏳ useRequireAdmin: User exists but role not set yet, waiting...');
            return;
        }

        // Role is now definitively known
        console.log(`🔍 useRequireAdmin: Role verified as "${user.role}" for ${user.email}`);

        if (user.role !== "admin") {
            console.warn(`❌ Access denied: ${user.email} is ${user.role}, not admin`);
            setHasRedirected(true);
            router.replace("/user");
        } else {
            console.log(`✅ Admin access granted for ${user.email}`);
            setIsResolved(true);
        }
    }, [user, user?.role, isLoading, router, hasRedirected]);

    // Only return isAdmin=true when we've definitively verified admin role
    return {
        isAdmin: isResolved && user?.role === "admin",
        isLoading: isLoading || (!isResolved && !hasRedirected)
    };
}

