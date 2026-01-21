"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import {
    BookOpen,
    Clock,
    Trophy,
    Target,
    ChevronRight,
    Play,
    CheckCircle2,
    Circle
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

// Convert Google Drive URLs to proxy URLs
function getProxiedImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('/api/images/')) return url;
    const drivePatterns = [
        /drive\.google\.com\/file\/d\/([^/]+)/,
        /drive\.google\.com\/open\?id=([^&]+)/,
        /drive\.google\.com\/uc\?.*id=([^&]+)/,
    ];
    for (const pattern of drivePatterns) {
        const match = url.match(pattern);
        if (match && match[1]) return `/api/images/${match[1]}`;
    }
    if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) return `/api/images/${url}`;
    return url;
}

export default function UserDashboard() {
    const { user, isLoading: isUserLoading } = useAuth();
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        fetch('/api/courses', { next: { revalidate: 60 } })
            .then(res => res.json())
            .then(data => {
                setAllCourses(Array.isArray(data) ? data : []);
                setIsLoadingCourses(false);
            })
            .catch(() => {
                setAllCourses([]);
                setIsLoadingCourses(false);
            });
    }, []);

    const stats = useMemo(() => {
        if (!user) return { enrolled: 0, completed: 0, streak: 0, hours: 0 };
        const progress = hybridStorage.progress.get();
        return {
            enrolled: user.enrolledCourses?.length || 0,
            completed: progress?.completedLessons?.length || 0,
            streak: progress?.currentStreak || 0,
            hours: progress?.totalHours || 0,
        };
    }, [user]);

    const enrolledCourses = useMemo(() => {
        if (!user?.enrolledCourses?.length) return [];
        return allCourses.filter(c => user.enrolledCourses?.includes(c.id));
    }, [user, allCourses]);

    const courseProgress = useMemo(() => {
        const progress = hybridStorage.progress.get();
        return progress?.courseProgress || {};
    }, []);

    const recommendedCourses = useMemo(() => {
        if (!user?.enrolledCourses) return allCourses.slice(0, 4);
        return allCourses.filter(c => !user.enrolledCourses?.includes(c.id)).slice(0, 4);
    }, [user, allCourses]);

    // Get current course to continue
    const currentCourse = enrolledCourses.find(c => {
        const progress = courseProgress[c.id] || 0;
        return progress > 0 && progress < 100;
    }) || enrolledCourses[0];

    if (!mounted || (isUserLoading && !user)) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const firstName = user?.name?.split(" ")[0] || "Learner";

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#1D1D1F]">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

                {/* Hero Section - Apple Academy Style */}
                <section className="text-center py-6">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Welcome back, {firstName}
                    </h1>
                    <p className="text-lg text-neutral-500 dark:text-neutral-400 mt-2">
                        Keep up the great work!
                    </p>
                </section>

                {/* Today's Goal Card - Featured */}
                {currentCourse && (
                    <section>
                        <Link href={`/class/${currentCourse.id}`}>
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 text-white shadow-xl">
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-3">
                                        <Target className="w-4 h-4" />
                                        CONTINUE LEARNING
                                    </div>

                                    <h2 className="text-2xl font-bold mb-2 leading-tight">
                                        {currentCourse.title}
                                    </h2>

                                    <p className="text-white/60 text-sm mb-6">
                                        {currentCourse.category} • {currentCourse.instructor || 'Course'}
                                    </p>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-white/60">Progress</span>
                                            <span className="font-semibold">{courseProgress[currentCourse.id] || 0}%</span>
                                        </div>
                                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                                style={{ width: `${courseProgress[currentCourse.id] || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/60">
                                            {currentCourse.lessonsCount || 0} lessons
                                        </span>
                                        <div className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors">
                                            <Play className="w-4 h-4" fill="currentColor" />
                                            Resume
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                {/* Stats Row - Apple Education Style */}
                <section className="grid grid-cols-4 gap-3">
                    <StatPill icon="🔥" value={stats.streak} label="Streak" />
                    <StatPill icon="📚" value={stats.enrolled} label="Courses" />
                    <StatPill icon="✅" value={stats.completed} label="Done" />
                    <StatPill icon="⏱️" value={`${stats.hours}h`} label="Time" />
                </section>

                {/* My Courses */}
                {enrolledCourses.length > 0 && (
                    <section>
                        <SectionHeader title="My Courses" href="/my-classes" />
                        <div className="space-y-3">
                            {enrolledCourses.slice(0, 4).map((course) => (
                                <CourseRow
                                    key={course.id}
                                    course={course}
                                    progress={courseProgress[course.id] || 0}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Explore More */}
                {!isLoadingCourses && recommendedCourses.length > 0 && (
                    <section>
                        <SectionHeader title="Explore Courses" href="/browse" />
                        <div className="grid grid-cols-2 gap-3">
                            {recommendedCourses.slice(0, 4).map((course) => (
                                <ExploreCard key={course.id} course={course} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {enrolledCourses.length === 0 && !isLoadingCourses && (
                    <section className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl">
                        <div className="text-6xl mb-4">📖</div>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                            Start Learning Today
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                            Discover courses designed to help you grow your skills.
                        </p>
                        <Link
                            href="/browse"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors"
                        >
                            Browse Courses
                        </Link>
                    </section>
                )}
            </div>
        </div>
    );
}

// Stat Pill - Compact Apple Style
function StatPill({ icon, value, label }: { icon: string; value: number | string; label: string }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white">{value}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
        </div>
    );
}

// Section Header
function SectionHeader({ title, href }: { title: string; href: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h2>
            <Link href={href} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium">
                See All <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
    );
}

// Course Row - List Style
function CourseRow({ course, progress }: { course: any; progress: number }) {
    const isComplete = progress === 100;

    return (
        <Link href={`/class/${course.id}`}>
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                {/* Progress indicator */}
                <div className="flex-shrink-0">
                    {isComplete ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                        <div className="relative w-6 h-6">
                            <Circle className="w-6 h-6 text-neutral-200 dark:text-neutral-700" />
                            <svg className="absolute inset-0 w-6 h-6 -rotate-90">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${progress * 0.628} 62.8`}
                                    className="text-blue-500"
                                />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate text-sm">
                        {course.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {progress}% complete • {course.lessonsCount || 0} lessons
                    </p>
                </div>

                <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            </div>
        </Link>
    );
}

// Explore Card - Grid Style
function ExploreCard({ course }: { course: any }) {
    return (
        <Link href={`/course/${course.id}`}>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-3">
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-sm line-clamp-2 leading-tight">
                        {course.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {course.category}
                    </p>
                </div>
            </div>
        </Link>
    );
}
