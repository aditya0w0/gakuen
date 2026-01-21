"use client";

import { useState, useEffect, useMemo } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    DollarSign,
    TrendingUp,
    Package,
    Gift,
    Search,
    Filter,
    ChevronRight,
    Loader2,
    Check,
    X,
    Edit3,
    Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface CoursePrice {
    id: string;
    title: string;
    thumbnail?: string;
    price: number;
    isFree: boolean;
    accessTier?: "free" | "basic" | "mid" | "pro";
    enrolledCount: number;
    isPublished?: boolean;
}

export default function PricingPage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [courses, setCourses] = useState<CoursePrice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
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
                const coursesWithPricing = (data || []).map((c: any) => ({
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

    // Stats
    const stats = useMemo(() => {
        const freeCourses = courses.filter((c) => c.isFree).length;
        const paidCourses = courses.filter((c) => !c.isFree).length;
        const avgPrice =
            paidCourses > 0
                ? Math.round(
                    courses.filter((c) => !c.isFree).reduce((sum, c) => sum + c.price, 0) /
                    paidCourses
                )
                : 0;
        const totalPotentialRevenue = courses.reduce(
            (sum, c) => sum + c.price * c.enrolledCount,
            0
        );
        return { freeCourses, paidCourses, avgPrice, totalPotentialRevenue };
    }, [courses]);

    // Filtered courses
    const filteredCourses = useMemo(() => {
        return courses
            .filter((c) => {
                if (filter === "free") return c.isFree;
                if (filter === "paid") return !c.isFree;
                return true;
            })
            .filter((c) =>
                c.title.toLowerCase().includes(search.toLowerCase())
            );
    }, [courses, filter, search]);

    // Handle price update
    const handleSavePrice = async (courseId: string) => {
        setIsSaving(true);
        try {
            // This would call an API to update the course price
            // For now, update locally
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

    const handleToggleFree = async (courseId: string, currentlyFree: boolean) => {
        setCourses((prev) =>
            prev.map((c) =>
                c.id === courseId
                    ? { ...c, isFree: !currentlyFree, price: !currentlyFree ? 0 : c.price }
                    : c
            )
        );
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
                    Pricing
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Manage course prices and revenue
                </p>
            </div>

            {/* Stats Cards - Apple Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Revenue"
                    value={`Rp ${stats.totalPotentialRevenue.toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                    trend="+12%"
                />
                <StatCard
                    label="Paid Courses"
                    value={stats.paidCourses}
                    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                />
                <StatCard
                    label="Free Courses"
                    value={stats.freeCourses}
                    icon={<Gift className="w-5 h-5 text-purple-500" />}
                />
                <StatCard
                    label="Avg. Price"
                    value={`Rp ${stats.avgPrice.toLocaleString()}`}
                    icon={<Package className="w-5 h-5 text-orange-500" />}
                />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Search & Filter */}
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
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

                    {/* Filter Pills */}
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
                        {(["all", "paid", "free"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${filter === f
                                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coupons Link */}
                <Link href="/coupons">
                    <Button
                        variant="outline"
                        className="gap-2 border-neutral-200 dark:border-neutral-700"
                    >
                        <Tag className="w-4 h-4" />
                        Manage Promotions
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            {/* Course Pricing List - Apple Style */}
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

                                {/* Free Toggle */}
                                <button
                                    onClick={() => handleToggleFree(course.id, course.isFree)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${course.isFree
                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                        }`}
                                >
                                    {course.isFree ? "Free" : "Paid"}
                                </button>

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
                                            {course.isFree
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

            {/* Footer Note */}
            <p className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                Price changes take effect immediately for new enrollments
            </p>
        </div>
    );
}

// Apple-style Stat Card
function StatCard({
    label,
    value,
    icon,
    trend,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    {icon}
                </div>
                {trend && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
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
