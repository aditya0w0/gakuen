"use client";

import { Course } from "@/lib/types";
import { CourseCard } from "@/components/course/CourseCard";
import { Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { useAuth } from "@/components/auth/AuthContext";

interface RecommendedCoursesProps {
    limit?: number;
    showTitle?: boolean;
    className?: string;
}

export function RecommendedCourses({
    limit = 4,
    showTitle = true,
    className = ""
}: RecommendedCoursesProps) {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchRecommendations = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authenticatedFetch(`/api/recommendations?limit=${limit}`);
            const data = await response.json();

            if (data.recommendations && Array.isArray(data.recommendations)) {
                setCourses(data.recommendations);
            } else {
                setCourses([]);
            }
        } catch (err) {
            console.error("Failed to fetch recommendations:", err);
            setError("Couldn't load recommendations");
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchRecommendations();
    }, [user, limit]);

    // Don't render if not logged in
    if (!user) return null;

    // Loading state
    if (loading) {
        return (
            <div className={`${className}`}>
                {showTitle && (
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Finding recommendations...
                        </h2>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(limit)].map((_, i) => (
                        <div
                            key={i}
                            className="h-80 rounded-2xl bg-neutral-100 dark:bg-zinc-800/50 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // No recommendations
    if (courses.length === 0) {
        return null; // Don't show section if no recommendations
    }

    return (
        <div className={`${className}`}>
            {showTitle && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                                Recommended for You
                            </h2>
                            <p className="text-sm text-neutral-500 dark:text-zinc-400">
                                Based on your learning journey
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            // Refresh recommendations
                            authenticatedFetch('/api/recommendations', { method: 'POST' })
                                .then(() => fetchRecommendations());
                        }}
                        className="p-2 rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Refresh recommendations"
                    >
                        <RefreshCw className="w-4 h-4 text-neutral-500 dark:text-zinc-400" />
                    </button>
                </div>
            )}

            {/* Horizontal scrollable on mobile, grid on desktop */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {courses.map((course, index) => (
                    <div
                        key={course.id}
                        className="min-w-[280px] md:min-w-0 snap-start"
                    >
                        <CourseCard course={course} index={index} />
                    </div>
                ))}
            </div>
        </div>
    );
}
