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
    AlertCircle,
    RefreshCw,
    CheckCircle2,
    X,
} from "lucide-react";
import Link from "next/link";
import { SimpleModal } from "@/components/ui/SimpleModal";

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

interface MigrationStats {
    total: number;
    migrated: number;
    failed: number;
    updatedDocs: number;
}

interface SystemStatus {
    firebase: "healthy" | "degraded" | "error" | "loading";
    drive: "healthy" | "degraded" | "error" | "loading";
    r2: "healthy" | "degraded" | "error" | "loading";
    telegram: "healthy" | "degraded" | "error" | "loading";
}

export default function AdminControlPage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [features, setFeatures] = useState<FeatureFlags | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTogglingFeature, setIsTogglingFeature] = useState<string | null>(null);
    const [status, setStatus] = useState<SystemStatus>({
        firebase: "loading",
        drive: "loading",
        r2: "loading",
        telegram: "loading",
    });

    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
    const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
    const [migrationError, setMigrationError] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    // Fetch system status
    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/status");
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch system status:", error);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchStatus();
        }
    }, [isAdmin, fetchStatus]);

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

    // Run migration
    const handleMigrate = async () => {
        setIsMigrationModalOpen(false);
        setIsMigrating(true);
        setMigrationStats(null);
        setMigrationError(null);

        try {
            const res = await fetch("/api/admin/migrate", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setMigrationStats(data.stats);
                setIsSuccessModalOpen(true);
                fetchStatus();
            } else {
                setMigrationError(data.error || "Unknown migration error");
            }
        } catch (error) {
            console.error("Migration error:", error);
            setMigrationError("Migration failed due to a network error.");
        } finally {
            setIsMigrating(false);
        }
    };

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
                        status={status.firebase}
                        icon={<Database className="w-4 h-4" />}
                    />
                    <StatusIndicator
                        label="Google Drive"
                        status={status.drive}
                        icon={<Cloud className="w-4 h-4" />}
                    />
                    <StatusIndicator
                        label="Cloudflare R2"
                        status={status.r2}
                        icon={<Cloud className="w-4 h-4" />}
                    />
                    <StatusIndicator
                        label="Telegram"
                        status={status.telegram}
                        icon={<Database className="w-4 h-4" />}
                    />
                </div>

                {/* Status-specific Alerts */}
                {(status.drive === 'error' || status.telegram === 'error' || status.r2 === 'error') && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900 dark:text-red-400">
                                    Connection Issues Detected
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-500/80 mt-1">
                                    {status.drive === 'error' && "Google Drive token has expired or is invalid. "}
                                    {status.r2 === 'error' && "Cloudflare R2 configuration is invalid or bucket is unreachable. "}
                                    {status.telegram === 'error' && "Telegram bot token is invalid or bot is not responding."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {/* System Actions & Migration */}
                <div className="p-4 bg-neutral-50/50 dark:bg-neutral-800/10 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-3">
                    {status.drive === 'error' && (
                        <Link
                            href="/api/admin/authorize-drive"
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-red-500/20"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Re-authorize Google Drive
                        </Link>
                    )}

                    {status.r2 === 'healthy' && (
                        <button
                            onClick={() => setIsMigrationModalOpen(true)}
                            disabled={isMigrating || status.drive !== 'healthy'}
                            className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${status.drive === 'healthy'
                                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                : "bg-neutral-500 shadow-neutral-500/20"
                                }`}
                        >
                            {isMigrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            {status.drive === 'healthy' ? "Migrate Drive to R2" : "Re-auth Drive to Enable Migration"}
                        </button>
                    )}

                    <button
                        onClick={fetchStatus}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-bold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Connection
                    </button>
                </div>

                {migrationStats && (
                    <div className="p-4 bg-emerald-50/30 dark:bg-emerald-500/5 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Last Migration Results:</p>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center p-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Total</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">{migrationStats.total}</p>
                            </div>
                            <div className="text-center p-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <p className="text-[10px] text-emerald-500 uppercase tracking-wider">Migrated</p>
                                <p className="text-lg font-bold text-emerald-500">{migrationStats.migrated}</p>
                            </div>
                            <div className="text-center p-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <p className="text-[10px] text-red-500 uppercase tracking-wider">Failed</p>
                                <p className="text-lg font-bold text-red-500">{migrationStats.failed}</p>
                            </div>
                            <div className="text-center p-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <p className="text-[10px] text-blue-500 uppercase tracking-wider">Updated</p>
                                <p className="text-lg font-bold text-blue-500">{migrationStats.updatedDocs}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Migration Confirmation Modal */}
            <SimpleModal
                isOpen={isMigrationModalOpen}
                onClose={() => setIsMigrationModalOpen(false)}
                onConfirm={handleMigrate}
                title="Migrate Images to R2"
                description="This will download all images from Google Drive and upload them to Cloudflare R2. Database references will be updated automatically. This process might take several minutes."
                confirmText="Start Migration"
                cancelText="Cancel"
                icon={<Cloud className="w-5 h-5" />}
                isLoading={isMigrating}
            />

            {/* Migration Success Modal */}
            <SimpleModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                onConfirm={() => setIsSuccessModalOpen(false)}
                title="Migration Complete"
                description="Successfully migrated your images from Google Drive to Cloudflare R2."
                confirmText="Done"
                icon={<CheckCircle2 className="w-5 h-5" />}
            />

            {/* Migration Error Alert */}
            {migrationError && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right duration-300">
                    <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                        <AlertCircle className="w-6 h-6" />
                        <div>
                            <p className="font-bold">Migration Failed</p>
                            <p className="text-sm opacity-90">{migrationError}</p>
                        </div>
                        <button
                            onClick={() => setMigrationError(null)}
                            className="ml-4 hover:opacity-70"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}


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
    status: "healthy" | "degraded" | "error" | "loading";
    icon: React.ReactNode;
}) {
    const statusColors = {
        healthy: "text-emerald-500",
        degraded: "text-amber-500",
        error: "text-red-500",
        loading: "text-neutral-400",
    };

    const statusLabels = {
        healthy: "Operational",
        degraded: "Degraded",
        error: "Error",
        loading: "Checking...",
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
