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
    CheckCircle2
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
        <div className="space-y-10">
            {/* Hero Section */}
            <header>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                    Welcome back, {firstName}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Keep up the great work
                </p>
            </header>

            {/* Stats Grid - 4 columns on desktop */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Flame className="w-5 h-5" />}
                    value={stats.streak}
                    label="Day Streak"
                    color="orange"
                />
                <StatCard
                    icon={<BookOpen className="w-5 h-5" />}
                    value={stats.enrolled}
                    label="Courses"
                    color="blue"
                />
                <StatCard
                    icon={<Trophy className="w-5 h-5" />}
                    value={stats.completed}
                    label="Lessons Done"
                    color="green"
                />
                <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    value={`${stats.hours}h`}
                    label="Learning Time"
                    color="purple"
                />
            </section>

            {/* Continue Learning - Featured Card */}
            {currentCourse && (
                <section>
                    <SectionHeader title="Continue Learning" />
                    <Link href={`/class/${currentCourse.id}`}>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white hover:shadow-lg transition-shadow">
                            {/* Decorative blurs */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                                {/* Thumbnail */}
                                <div className="w-full md:w-48 aspect-video md:aspect-square rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                                    <img
                                        src={getProxiedImageUrl(currentCourse.thumbnail) || "/placeholder.svg"}
                                        alt={currentCourse.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold leading-tight">
                                            {currentCourse.title}
                                        </h3>
                                        <p className="text-white/60 mt-1">
                                            {currentCourse.category} • {currentCourse.lessonsCount || 0} lessons
                                        </p>
                                    </div>

                                    {/* Progress */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-white/60">Progress</span>
                                            <span className="font-medium">{courseProgress[currentCourse.id] || 0}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white rounded-full transition-all"
                                                style={{ width: `${courseProgress[currentCourse.id] || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="inline-flex items-center gap-2 bg-white text-neutral-900 px-5 py-2.5 rounded-full font-semibold text-sm">
                                        <Play className="w-4 h-4" fill="currentColor" />
                                        Resume
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </section>
            )}

            {/* My Courses */}
            {enrolledCourses.length > 1 && (
                <section>
                    <SectionHeader title="My Courses" href="/my-classes" />
                    <div className="grid gap-4">
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
                <section>
                    <SectionHeader title="Explore Courses" href="/browse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {recommendedCourses.slice(0, 4).map((course) => (
                            <ExploreCard key={course.id} course={course} />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {enrolledCourses.length === 0 && !isLoadingCourses && (
                <section className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        Start Learning Today
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                        Discover courses designed to help you grow your skills.
                    </p>
                    <Link
                        href="/browse"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
                    >
                        Browse Courses
                    </Link>
                </section>
            )}
        </div>
    );
}

// Stat Card
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
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
            <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {value}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {label}
            </div>
        </div>
    );
}

// Section Header
function SectionHeader({ title, href }: { title: string; href?: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
            {href && (
                <Link href={href} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium">
                    See All <ChevronRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    );
}

// Course List Item
function CourseListItem({ course, progress }: { course: any; progress: number }) {
    const isComplete = progress === 100;

    return (
        <Link href={`/class/${course.id}`}>
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                {/* Progress Circle */}
                <div className="flex-shrink-0 w-8 h-8 relative">
                    {isComplete ? (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    ) : (
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                            <circle
                                cx="18" cy="18" r="15"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-neutral-200 dark:text-neutral-700"
                            />
                            <circle
                                cx="18" cy="18" r="15"
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
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                        {course.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
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
            <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={getProxiedImageUrl(course.thumbnail) || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-3">
                    <h3 className="font-medium text-neutral-900 dark:text-white line-clamp-2 text-sm leading-snug">
                        {course.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                        {course.category}
                    </p>
                </div>
            </div>
        </Link>
    );
}
