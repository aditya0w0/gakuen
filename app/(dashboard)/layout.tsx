"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Wait for auth to load
        if (isLoading) return;

        // If no user, check localStorage before redirecting
        // This prevents race conditions during navigation
        if (!user) {
            // Double-check localStorage in case Firebase is slow
            const cachedUser = typeof window !== 'undefined'
                ? localStorage.getItem('gakuen_user')
                : null;

            if (cachedUser) {
                // User exists in cache, wait for Firebase to catch up
                console.log('⏳ [Dashboard] User in cache, waiting for Firebase...');
                return;
            }

            // No user anywhere, redirect to login
            router.replace("/login");
            return;
        }

        // User is authenticated
        setIsChecking(false);
    }, [user, isLoading, router]);

    // Show loading while checking auth
    if (isLoading || isChecking) {
        return (
            <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Verifying access...</p>
                </div>
            </div>
        );
    }

    // User is not authenticated (will redirect)
    if (!user) {
        return null;
    }

    return <DashboardShell>{children}</DashboardShell>;
}
