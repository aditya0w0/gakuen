"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export function useRequireAdmin() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const hasCheckedRef = useRef(false);

    useEffect(() => {
        // Don't check until loading is complete
        if (isLoading) {
            console.log('⏳ useRequireAdmin: Still loading auth state...');
            return;
        }

        // Only check once after loading completes
        if (hasCheckedRef.current) return;
        hasCheckedRef.current = true;

        console.log('🔍 useRequireAdmin: Checking auth -', { user: user?.email, role: user?.role });

        if (!user) {
            console.warn('❌ No user, redirecting to login');
            router.push("/login");
            return;
        }

        if (user.role !== "admin") {
            console.warn(`❌ Access denied: User ${user.email} is not admin (role: ${user.role})`);
            router.push("/user");
        } else {
            console.log(`✅ Admin access granted for ${user.email}`);
        }
    }, [user, isLoading, router]);

    return { isAdmin: user?.role === "admin", isLoading };
}
