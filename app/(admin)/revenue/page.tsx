"use client";

import { useState, useEffect } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    DollarSign,
    CreditCard,
    Loader2,
    Package,
    Users,
} from "lucide-react";
import Link from "next/link";

interface RevenueData {
    totalRevenue: number;
    breakdown: {
        subscriptions: number;
        courses: number;
        bundles: number;
    };
    tierBreakdown: {
        basic: number;
        mid: number;
        pro: number;
    };
    monthlyRevenue: {
        month: string;
        revenue: number;
        subscriptions: number;
        courses: number;
    }[];
}

export default function RevenuePage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [data, setData] = useState<RevenueData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) return;

        fetch("/api/admin/revenue", { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch revenue:", err);
                setIsLoading(false);
            });
    }, [isAdmin]);

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                    Revenue
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Track earnings and financial performance
                </p>
            </div>

            {/* Stats Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-neutral-900/50 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 animate-pulse"
                        >
                            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4" />
                            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Revenue - Hero Card */}
                    <div className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <DollarSign className="w-5 h-5" />
                            <span className="text-sm font-medium">Total Revenue</span>
                        </div>
                        <p className="text-4xl font-bold">
                            Rp {(data?.totalRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-sm opacity-75 mt-2">All time earnings</p>
                    </div>

                    {/* Subscriptions */}
                    <StatCard
                        label="Subscriptions"
                        value={`Rp ${(data?.breakdown.subscriptions || 0).toLocaleString()}`}
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                    />

                    {/* Courses */}
                    <StatCard
                        label="Course Sales"
                        value={`Rp ${(data?.breakdown.courses || 0).toLocaleString()}`}
                        icon={<Package className="w-5 h-5 text-purple-500" />}
                    />
                </div>
            )}

            {/* Revenue by Tier */}
            <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                        Revenue by Subscription Tier
                    </h2>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
                        <TierCard
                            tier="Basic"
                            amount={data?.tierBreakdown.basic || 0}
                            color="blue"
                        />
                        <TierCard
                            tier="Mid"
                            amount={data?.tierBreakdown.mid || 0}
                            color="purple"
                        />
                        <TierCard
                            tier="Pro"
                            amount={data?.tierBreakdown.pro || 0}
                            color="emerald"
                        />
                    </div>
                )}
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                        Monthly Revenue
                    </h2>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : data?.monthlyRevenue?.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No revenue data yet</p>
                    </div>
                ) : (
                    <div className="p-6">
                        {/* Simple bar chart */}
                        <div className="flex items-end justify-between gap-4 h-48">
                            {data?.monthlyRevenue?.map((item, i) => {
                                const maxRevenue = Math.max(
                                    ...data.monthlyRevenue.map((m) => m.revenue),
                                    1
                                );
                                const height = (item.revenue / maxRevenue) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500"
                                            style={{ height: `${Math.max(height, 4)}%` }}
                                        />
                                        <span className="text-xs text-neutral-500">
                                            {item.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-neutral-600 dark:text-neutral-400">Revenue</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="flex items-center justify-center gap-4">
                <Link
                    href="/course-pricing"
                    className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                >
                    Manage Pricing →
                </Link>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <Link
                    href="/coupons"
                    className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                >
                    Promotions →
                </Link>
            </div>
        </div>
    );
}

// Apple-style Stat Card
function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-neutral-500 mb-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {value}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {label}
            </p>
        </div>
    );
}

// Tier revenue card
function TierCard({
    tier,
    amount,
    color,
}: {
    tier: string;
    amount: number;
    color: "blue" | "purple" | "emerald";
}) {
    const colorClasses = {
        blue: "text-blue-600 dark:text-blue-400",
        purple: "text-purple-600 dark:text-purple-400",
        emerald: "text-emerald-600 dark:text-emerald-400",
    };

    return (
        <div className="p-6 text-center">
            <p className={`text-sm font-medium ${colorClasses[color]} mb-2`}>{tier}</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                Rp {amount.toLocaleString()}
            </p>
        </div>
    );
}
