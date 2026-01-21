"use client";

import { useState, useEffect, useMemo } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    Package,
    Gift,
    Search,
    ChevronRight,
    Loader2,
    Check,
    X,
    Edit3,
    Tag,
    Crown,
    Sparkles,
    Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type AccessTier = "free" | "basic" | "mid" | "pro";

interface CoursePrice {
    id: string;
    title: string;
    thumbnail?: string;
    price: number;
    isFree: boolean;
    accessTier: AccessTier;
    enrolledCount: number;
    isPublished?: boolean;
}

const TIER_CONFIG: Record<AccessTier, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    free: {
        label: "Free",
        icon: <Gift className="w-4 h-4" />,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    basic: {
        label: "Basic",
        icon: <Star className="w-4 h-4" />,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    mid: {
        label: "Mid",
        icon: <Sparkles className="w-4 h-4" />,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    pro: {
        label: "Pro",
        icon: <Crown className="w-4 h-4" />,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
};

export default function PricingPage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [courses, setCourses] = useState<CoursePrice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | AccessTier>("all");
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch courses
    useEffect(() => {
        if (!isAdmin) return;

        fetch("/api/courses", { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
                const coursesWithPricing = (data || []).map((c: CoursePrice & { isFree?: boolean }) => ({
                    id: c.id,
                    title: c.title,
                    thumbnail: c.thumbnail,
                    price: c.price || 0,
                    isFree: c.isFree || c.price === 0,
                    accessTier: c.accessTier || "free",
                    enrolledCount: c.enrolledCount || 0,
                    isPublished: c.isPublished,
                }));
                setCourses(coursesWithPricing);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch courses:", err);
                setIsLoading(false);
            });
    }, [isAdmin]);

    // Stats by tier
    const tierStats = useMemo(() => {
        return {
            free: courses.filter((c) => c.accessTier === "free").length,
            basic: courses.filter((c) => c.accessTier === "basic").length,
            mid: courses.filter((c) => c.accessTier === "mid").length,
            pro: courses.filter((c) => c.accessTier === "pro").length,
            total: courses.length,
        };
    }, [courses]);

    // Filtered courses
    const filteredCourses = useMemo(() => {
        return courses
            .filter((c) => {
                if (filter === "all") return true;
                return c.accessTier === filter;
            })
            .filter((c) =>
                c.title.toLowerCase().includes(search.toLowerCase())
            );
    }, [courses, filter, search]);

    // Handle tier change
    const handleTierChange = async (courseId: string, newTier: AccessTier) => {
        // Optimistic update
        setCourses((prev) =>
            prev.map((c) =>
                c.id === courseId
                    ? { ...c, accessTier: newTier, isFree: newTier === "free" }
                    : c
            )
        );

        // Persist to API
        try {
            const res = await fetch(`/api/courses/${courseId}/pricing`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessTier: newTier }),
            });
            if (!res.ok) {
                throw new Error("Failed to update tier");
            }
        } catch (error) {
            console.error("Failed to save tier:", error);
            // Revert on error (optional: could refetch instead)
        }
    };

    // Handle price update
    const handleSavePrice = async (courseId: string) => {
        setIsSaving(true);
        try {
            // Call API first
            const res = await fetch(`/api/courses/${courseId}/pricing`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price: editPrice }),
            });

            if (!res.ok) {
                throw new Error("Failed to update price");
            }

            // Update local state on success
            setCourses((prev) =>
                prev.map((c) =>
                    c.id === courseId
                        ? { ...c, price: editPrice, isFree: editPrice === 0 }
                        : c
                )
            );
            setEditingId(null);
        } catch (error) {
            console.error("Failed to save price:", error);
        } finally {
            setIsSaving(false);
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
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                    Pricing & Tiers
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Manage course prices and subscription access
                </p>
            </div>

            {/* Tier Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <TierStatCard
                    tier="all"
                    count={tierStats.total}
                    label="All Courses"
                    isActive={filter === "all"}
                    onClick={() => setFilter("all")}
                />
                {(Object.keys(TIER_CONFIG) as AccessTier[]).map((tier) => (
                    <TierStatCard
                        key={tier}
                        tier={tier}
                        count={tierStats[tier]}
                        label={TIER_CONFIG[tier].label}
                        isActive={filter === tier}
                        onClick={() => setFilter(tier)}
                    />
                ))}
            </div>

            {/* Search & Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-white dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700"
                    />
                </div>

                <Link href="/coupons">
                    <Button
                        variant="outline"
                        className="gap-2 border-neutral-200 dark:border-neutral-700"
                    >
                        <Tag className="w-4 h-4" />
                        Promotions
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            {/* Course List */}
            <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <Package className="w-12 h-12 mb-4 opacity-50" />
                        <p>No courses found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex-shrink-0 overflow-hidden">
                                    {course.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-blue-500/60">
                                            {course.title.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Title & Meta */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {course.enrolledCount} enrolled
                                        {course.isPublished === false && (
                                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                                                Draft
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Tier Selector */}
                                <div className="flex items-center gap-1">
                                    {(Object.keys(TIER_CONFIG) as AccessTier[]).map((tier) => {
                                        const config = TIER_CONFIG[tier];
                                        const isActive = course.accessTier === tier;
                                        return (
                                            <button
                                                key={tier}
                                                onClick={() => handleTierChange(course.id, tier)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${isActive
                                                    ? `${config.bgColor} ${config.color}`
                                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                                    }`}
                                                title={config.label}
                                            >
                                                {config.icon}
                                                <span className="hidden sm:inline">{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Price Editor */}
                                {editingId === course.id ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-neutral-500">Rp</span>
                                        <Input
                                            type="number"
                                            value={editPrice}
                                            onChange={(e) =>
                                                setEditPrice(parseInt(e.target.value) || 0)
                                            }
                                            className="w-28 h-9 text-right"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSavePrice(course.id)}
                                            disabled={isSaving}
                                            className="p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-neutral-900 dark:text-white min-w-[100px] text-right">
                                            {course.accessTier === "free"
                                                ? "Free"
                                                : `Rp ${course.price.toLocaleString()}`}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setEditingId(course.id);
                                                setEditPrice(course.price);
                                            }}
                                            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tier Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
                {(Object.keys(TIER_CONFIG) as AccessTier[]).map((tier) => {
                    const config = TIER_CONFIG[tier];
                    return (
                        <div key={tier} className={`flex items-center gap-2 ${config.color}`}>
                            {config.icon}
                            <span>{config.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Tier Stat Card Component
function TierStatCard({
    tier,
    count,
    label,
    isActive,
    onClick,
}: {
    tier: AccessTier | "all";
    count: number;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    const config = tier === "all" ? null : TIER_CONFIG[tier];

    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-xl border transition-all text-left ${isActive
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                : "bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
        >
            <div className="flex items-center gap-2 mb-2">
                {config ? (
                    <div className={isActive ? "" : config.color}>{config.icon}</div>
                ) : (
                    <Package className="w-4 h-4" />
                )}
            </div>
            <p className="text-2xl font-bold">{count}</p>
            <p className={`text-xs ${isActive ? "opacity-70" : "text-neutral-500"}`}>
                {label}
            </p>
        </button>
    );
}
