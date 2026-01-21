"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import {
    BookOpen,
    Clock,
    Award,
    Flame,
    ChevronRight,
    PlayCircle,
    Sparkles
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

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetch('/api/courses', { next: { revalidate: 60 } })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAllCourses(data);
                } else {
                    setAllCourses([]);
                }
                setIsLoadingCourses(false);
            })
            .catch(() => {
                setAllCourses([]);
                setIsLoadingCourses(false);
            });
    }, []);

    const stats = useMemo(() => {
        if (!user) {
            return { coursesEnrolled: 0, lessonsCompleted: 0, hoursLearned: 0, currentStreak: 0 };
        }
        const progress = hybridStorage.progress.get();
        return {
            coursesEnrolled: user.enrolledCourses?.length || 0,
            lessonsCompleted: progress?.completedLessons?.length || 0,
            hoursLearned: progress?.totalHours || 0,
            currentStreak: progress?.currentStreak || 0,
        };
    }, [user]);

    const enrolledCourses = useMemo(() => {
        if (!user?.enrolledCourses?.length) return [];
        return allCourses.filter(c => user.enrolledCourses?.includes(c.id));
    }, [user, allCourses]);

    const recommendedCourses = useMemo(() => {
        if (!user?.enrolledCourses) return allCourses.slice(0, 4);
        return allCourses.filter(c => !user.enrolledCourses?.includes(c.id)).slice(0, 4);
    }, [user, allCourses]);

    const courseProgress = useMemo(() => {
        const progress = hybridStorage.progress.get();
        return progress?.courseProgress || {};
    }, []);

    if (!mounted || (isUserLoading && !user)) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const firstName = user?.name?.split(" ")[0] || "there";
    const greeting = getGreeting();

    return (
        <div className="max-w-4xl mx-auto space-y-8 px-4 pb-8">
            {/* Header */}
            <header className="pt-2">
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {greeting}
                </p>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                    {firstName} 👋
                </h1>
            </header>

            {/* Quick Stats - Apple Widget Style */}
            <section className="grid grid-cols-2 gap-3">
                <StatWidget
                    icon={<Flame className="w-5 h-5" />}
                    value={stats.currentStreak}
                    label="Day Streak"
                    gradient="from-orange-500 to-red-500"
                />
                <StatWidget
                    icon={<Clock className="w-5 h-5" />}
                    value={`${stats.hoursLearned}h`}
                    label="Learning Time"
                    gradient="from-blue-500 to-indigo-500"
                />
                <StatWidget
                    icon={<BookOpen className="w-5 h-5" />}
                    value={stats.coursesEnrolled}
                    label="Courses"
                    gradient="from-green-500 to-emerald-500"
                />
                <StatWidget
                    icon={<Award className="w-5 h-5" />}
                    value={stats.lessonsCompleted}
                    label="Lessons Done"
                    gradient="from-purple-500 to-pink-500"
                />
            </section>

            {/* Continue Learning - Apple iOS Style */}
            {enrolledCourses.length > 0 && (
                <section>
                    <SectionHeader title="Continue Learning" href="/my-classes" />
                    <div className="space-y-3">
                        {enrolledCourses.slice(0, 3).map((course) => (
                            <ContinueCourseCard
                                key={course.id}
                                course={course}
                                progress={courseProgress[course.id] || 0}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Recommended For You */}
            {!isLoadingCourses && recommendedCourses.length > 0 && (
                <section>
                    <SectionHeader
                        title="Recommended"
                        href="/browse"
                        badge={<><Sparkles className="w-3 h-3" /> AI</>}
                    />
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                        {recommendedCourses.map((course) => (
                            <RecommendedCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {enrolledCourses.length === 0 && !isLoadingCourses && (
                <section className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                        Start Your Journey
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
                        Discover courses that match your interests and start learning today.
                    </p>
                    <Link
                        href="/browse"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
                    >
                        Browse Courses
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </section>
            )}
        </div>
    );
}

// Get time-based greeting
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

// Stat Widget Component - Apple Fitness Style
function StatWidget({
    icon,
    value,
    label,
    gradient,
}: {
    icon: React.ReactNode;
    value: number | string;
    label: string;
    gradient: string;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {value}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {label}
            </div>
        </div>
    );
}

// Section Header with Link
function SectionHeader({
    title,
    href,
    badge,
}: {
    title: string;
    href: string;
    badge?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {title}
                </h2>
                {badge && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <Link
                href={href}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium"
            >
                See All
                <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
    );
}

// Continue Course Card - Apple Music/Podcast Style
function ContinueCourseCard({
    course,
    progress,
}: {
    course: any;
    progress: number;
}) {
    return (
        <Link href={`/class/${course.id}`}>
            <div className="flex gap-4 p-3 bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {course.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        {course.instructor || course.category}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Play Button */}
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <PlayCircle className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </Link>
    );
}

// Recommended Course Card - Horizontal Scroll Style
function RecommendedCourseCard({ course }: { course: any }) {
    return (
        <Link href={`/course/${course.id}`} className="flex-shrink-0 w-64">
            <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="p-3">
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-sm line-clamp-2 leading-tight">
                        {course.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {course.instructor || course.category}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {course.lessonsCount || 0} lessons
                        </span>
                        {course.rating && (
                            <>
                                <span className="text-neutral-300 dark:text-neutral-600">•</span>
                                <span className="text-xs text-amber-500">★ {course.rating}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
