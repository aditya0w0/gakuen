"use client";

import { useState, useEffect, useCallback } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    Shield,
    Zap,
    CreditCard,
    Gift,
    Gauge,
    Sparkles,
    Loader2,
    ChevronRight,
    Server,
    Database,
    Cloud,
    Users,
    Settings,
    Bell,
} from "lucide-react";
import Link from "next/link";

interface FeatureFlags {
    subscriptionsEnabled: boolean;
    aiEnabled: boolean;
    freeCoursesMode: boolean;
    disableRateLimits: boolean;
    aiUnlimitedMode: boolean;
    aiUnlockUntil?: string;
    aiWhitelist: string[];
    updatedAt: string;
    updatedBy?: string;
}

interface SystemStatus {
    firebase: "healthy" | "degraded" | "error";
    telegram: "healthy" | "degraded" | "error";
    ai: "healthy" | "degraded" | "error";
}

export default function AdminControlPage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [features, setFeatures] = useState<FeatureFlags | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTogglingFeature, setIsTogglingFeature] = useState<string | null>(null);
    const [systemStatus] = useState<SystemStatus>({
        firebase: "healthy",
        telegram: "healthy",
        ai: "healthy",
    });

    // Fetch features
    useEffect(() => {
        if (!isAdmin) return;

        fetch("/api/admin/features")
            .then((res) => res.json())
            .then((data) => {
                setFeatures(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch features:", err);
                setIsLoading(false);
            });
    }, [isAdmin]);

    // Toggle feature
    const handleToggle = useCallback(
        async (feature: keyof FeatureFlags) => {
            if (!features || isTogglingFeature) return;

            setIsTogglingFeature(feature);
            try {
                const res = await fetch("/api/admin/features", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [feature]: !features[feature] }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setFeatures(data.flags);
                }
            } catch (error) {
                console.error("Failed to toggle feature:", error);
            } finally {
                setIsTogglingFeature(null);
            }
        },
        [features, isTogglingFeature]
    );

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                    Admin Control
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    System settings and feature controls
                </p>
            </div>

            {/* System Status - Apple Style */}
            <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                    <Server className="w-5 h-5 text-neutral-500" />
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                        System Status
                    </h2>
                </div>
                <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
                    <StatusIndicator
                        label="Firebase"
                        status={systemStatus.firebase}
                        icon={<Database className="w-4 h-4" />}
                    />
                    <StatusIndicator
                        label="Telegram"
                        status={systemStatus.telegram}
                        icon={<Cloud className="w-4 h-4" />}
                    />
                    <StatusIndicator
                        label="AI Services"
                        status={systemStatus.ai}
                        icon={<Sparkles className="w-4 h-4" />}
                    />
                </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-neutral-500" />
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                        Feature Flags
                    </h2>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        <FeatureToggle
                            label="Subscriptions"
                            description="Enable subscription payment system"
                            icon={<CreditCard className="w-5 h-5 text-blue-500" />}
                            enabled={features?.subscriptionsEnabled ?? false}
                            isToggling={isTogglingFeature === "subscriptionsEnabled"}
                            onToggle={() => handleToggle("subscriptionsEnabled")}
                        />
                        <FeatureToggle
                            label="AI Features"
                            description="Enable AI-powered recommendations and paraphrasing"
                            icon={<Sparkles className="w-5 h-5 text-purple-500" />}
                            enabled={features?.aiEnabled ?? false}
                            isToggling={isTogglingFeature === "aiEnabled"}
                            onToggle={() => handleToggle("aiEnabled")}
                        />
                        <FeatureToggle
                            label="Free Courses Mode"
                            description="Make all courses free (bypass payments)"
                            icon={<Gift className="w-5 h-5 text-emerald-500" />}
                            enabled={features?.freeCoursesMode ?? false}
                            isToggling={isTogglingFeature === "freeCoursesMode"}
                            onToggle={() => handleToggle("freeCoursesMode")}
                        />
                        <FeatureToggle
                            label="Disable Rate Limits"
                            description="Remove API rate limiting (dev mode)"
                            icon={<Gauge className="w-5 h-5 text-orange-500" />}
                            enabled={features?.disableRateLimits ?? false}
                            isToggling={isTogglingFeature === "disableRateLimits"}
                            onToggle={() => handleToggle("disableRateLimits")}
                        />
                        <FeatureToggle
                            label="AI Unlimited Mode"
                            description="Remove AI usage limits"
                            icon={<Zap className="w-5 h-5 text-amber-500" />}
                            enabled={features?.aiUnlimitedMode ?? false}
                            isToggling={isTogglingFeature === "aiUnlimitedMode"}
                            onToggle={() => handleToggle("aiUnlimitedMode")}
                        />
                    </div>
                )}

                {features?.updatedAt && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500">
                        Last updated: {new Date(features.updatedAt).toLocaleString()}
                        {features.updatedBy && ` by ${features.updatedBy}`}
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                    <Settings className="w-5 h-5 text-neutral-500" />
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                        Quick Access
                    </h2>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <QuickLink
                        href="/users"
                        label="User Management"
                        description="Manage user accounts and roles"
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                    />
                    <QuickLink
                        href="/notifications"
                        label="Notifications"
                        description="Send push notifications to users"
                        icon={<Bell className="w-5 h-5 text-purple-500" />}
                    />
                    <QuickLink
                        href="/analytics"
                        label="Analytics"
                        description="View API and usage analytics"
                        icon={<Gauge className="w-5 h-5 text-emerald-500" />}
                    />
                </div>
            </div>
        </div>
    );
}

// Apple-style Toggle
function FeatureToggle({
    label,
    description,
    icon,
    enabled,
    isToggling,
    onToggle,
}: {
    label: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    isToggling: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    {icon}
                </div>
                <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{label}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {description}
                    </p>
                </div>
            </div>

            <button
                onClick={onToggle}
                disabled={isToggling}
                className={`relative w-14 h-8 rounded-full transition-colors ${enabled
                        ? "bg-emerald-500"
                        : "bg-neutral-300 dark:bg-neutral-600"
                    } ${isToggling ? "opacity-50" : ""}`}
            >
                <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${enabled ? "left-7" : "left-1"
                        }`}
                />
                {isToggling && (
                    <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-white" />
                )}
            </button>
        </div>
    );
}

// Status Indicator
function StatusIndicator({
    label,
    status,
    icon,
}: {
    label: string;
    status: "healthy" | "degraded" | "error";
    icon: React.ReactNode;
}) {
    const statusColors = {
        healthy: "text-emerald-500",
        degraded: "text-amber-500",
        error: "text-red-500",
    };

    const statusLabels = {
        healthy: "Operational",
        degraded: "Degraded",
        error: "Error",
    };

    return (
        <div className="p-4 text-center">
            <div className={`flex items-center justify-center gap-2 ${statusColors[status]} mb-2`}>
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
                <span
                    className={`w-2 h-2 rounded-full ${status === "healthy"
                            ? "bg-emerald-500"
                            : status === "degraded"
                                ? "bg-amber-500"
                                : "bg-red-500"
                        }`}
                />
                <span className="text-xs text-neutral-500">{statusLabels[status]}</span>
            </div>
        </div>
    );
}

// Quick Link
function QuickLink({
    href,
    label,
    description,
    icon,
}: {
    href: string;
    label: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    {icon}
                </div>
                <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{label}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {description}
                    </p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
        </Link>
    );
}
