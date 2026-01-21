"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import {
    BookOpen,
    Clock,
    Trophy,
    Flame,
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
            <div className="max-w-2xl mx-auto px-6 py-10 space-y-12">

                {/* Hero Section */}
                <header className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Welcome back, {firstName}
                    </h1>
                    <p className="text-lg text-neutral-500 dark:text-neutral-400">
                        Keep up the great work
                    </p>
                </header>

                {/* Stats Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon={<Flame className="w-6 h-6" />}
                        value={stats.streak}
                        label="Day Streak"
                        color="orange"
                    />
                    <StatCard
                        icon={<BookOpen className="w-6 h-6" />}
                        value={stats.enrolled}
                        label="Courses"
                        color="blue"
                    />
                    <StatCard
                        icon={<Trophy className="w-6 h-6" />}
                        value={stats.completed}
                        label="Lessons Done"
                        color="green"
                    />
                    <StatCard
                        icon={<Clock className="w-6 h-6" />}
                        value={`${stats.hours}h`}
                        label="Learning Time"
                        color="purple"
                    />
                </section>

                {/* Continue Learning - Featured Card */}
                {currentCourse && (
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Continue Learning
                        </h2>
                        <Link href={`/class/${currentCourse.id}`}>
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-8 text-white">
                                {/* Decorative blurs */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

                                <div className="relative z-10 space-y-4">
                                    <h3 className="text-2xl font-bold leading-tight">
                                        {currentCourse.title}
                                    </h3>

                                    <p className="text-white/60">
                                        {currentCourse.category} • {currentCourse.lessonsCount || 0} lessons
                                    </p>

                                    {/* Progress */}
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/60">Progress</span>
                                            <span className="font-semibold">{courseProgress[currentCourse.id] || 0}%</span>
                                        </div>
                                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white rounded-full transition-all"
                                                style={{ width: `${courseProgress[currentCourse.id] || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="pt-4">
                                        <span className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition-colors">
                                            <Play className="w-4 h-4" fill="currentColor" />
                                            Resume Course
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                {/* My Courses */}
                {enrolledCourses.length > 1 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                My Courses
                            </h2>
                            <Link href="/my-classes" className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                See All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {enrolledCourses.slice(0, 3).map((course) => (
                                <CourseListItem
                                    key={course.id}
                                    course={course}
                                    progress={courseProgress[course.id] || 0}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Explore */}
                {!isLoadingCourses && recommendedCourses.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                Explore Courses
                            </h2>
                            <Link href="/browse" className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                Browse All
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {recommendedCourses.slice(0, 4).map((course) => (
                                <ExploreCard key={course.id} course={course} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {enrolledCourses.length === 0 && !isLoadingCourses && (
                    <section className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl">
                        <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                            Start Learning Today
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm mx-auto">
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

// Stat Card - Clean Icon Style
function StatCard({
    icon,
    value,
    label,
    color
}: {
    icon: React.ReactNode;
    value: number | string;
    label: string;
    color: "orange" | "blue" | "green" | "purple";
}) {
    const colors = {
        orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
            <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {value}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {label}
            </div>
        </div>
    );
}

// Course List Item
function CourseListItem({ course, progress }: { course: any; progress: number }) {
    const isComplete = progress === 100;

    return (
        <Link href={`/class/${course.id}`}>
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl hover:shadow-md transition-shadow">
                {/* Progress Circle */}
                <div className="flex-shrink-0 w-10 h-10 relative">
                    {isComplete ? (
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    ) : (
                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                            <circle
                                cx="18" cy="18" r="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-neutral-200 dark:text-neutral-700"
                            />
                            <circle
                                cx="18" cy="18" r="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${progress} 100`}
                                strokeLinecap="round"
                                className="text-blue-500"
                            />
                        </svg>
                    )}
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {course.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {progress}% complete
                    </p>
                </div>

                <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            </div>
        </Link>
    );
}

// Explore Card
function ExploreCard({ course }: { course: any }) {
    return (
        <Link href={`/course/${course.id}`}>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                        {course.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                        {course.category}
                    </p>
                </div>
            </div>
        </Link>
    );
}
