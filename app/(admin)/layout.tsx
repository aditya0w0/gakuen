"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
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

        // If no user, redirect to login
        if (!user) {
            router.replace("/login");
            return;
        }

        // If user is not admin, redirect to user dashboard
        if (user.role !== "admin") {
            router.replace("/user");
            return;
        }

        // User is authenticated and is admin
        setIsChecking(false);
    }, [user, isLoading, router]);

    // Show loading while checking auth
    if (isLoading || isChecking) {
        return (
            <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // User is not authenticated or not admin (will redirect)
    if (!user || user.role !== "admin") {
        return null;
    }

    return <DashboardShell>{children}</DashboardShell>;
}
