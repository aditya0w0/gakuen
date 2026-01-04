"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { CourseCard } from "@/components/course/CourseCard";
import { SubscriptionWidget } from "@/components/subscription/SubscriptionWidget";
import { BookOpen, TrendingUp, Award, Flame, Sparkles } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

// Apple-style spring animation config
const spring = {
    type: "spring",
    stiffness: 300,
    damping: 30,
};

// Stagger container variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

// Item fade up variants
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 30 },
    },
} as const;

// Stats card with number animation
function StatCard({ icon: Icon, value, label, color, delay = 0 }: {
    icon: typeof BookOpen;
    value: number | string;
    label: string;
    color: string;
    delay?: number;
}) {
    const colorClasses = {
        blue: { bg: "bg-blue-500/10 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "hover:border-blue-500/30" },
        indigo: { bg: "bg-indigo-500/10 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "hover:border-indigo-500/30" },
        green: { bg: "bg-green-500/10 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "hover:border-green-500/30" },
        orange: { bg: "bg-orange-500/10 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "hover:border-orange-500/30" },
    }[color] || { bg: "bg-blue-500/10 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "hover:border-blue-500/30" };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-white/80 dark:bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-neutral-200 dark:border-white/5 ${colorClasses.border} transition-colors cursor-default shadow-sm dark:shadow-none`}
        >
            <div className="flex items-center justify-between mb-3">
                <motion.div
                    className={`p-2.5 ${colorClasses.bg} rounded-xl`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                </motion.div>
            </div>
            <motion.div
                className="text-3xl font-bold text-neutral-900 dark:text-white mb-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: delay + 0.3 }}
            >
                {value}
            </motion.div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
        </motion.div>
    );
}

export default function UserDashboard() {
    const { user, isLoading: isUserLoading } = useAuth();
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [localUser, setLocalUser] = useState(user);
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    // Prevent hydration mismatch by deferring render
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user) setLocalUser(user);
    }, [user]);

    useEffect(() => {
        if (!user && !isUserLoading) {
            const cachedUser = hybridStorage.auth.getSession();
            if (cachedUser) setLocalUser(cachedUser);
        }
    }, [user, isUserLoading]);

    useEffect(() => {
        fetch('/api/courses', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                // DEFENSIVE: Ensure data is an array before setting state
                if (Array.isArray(data)) {
                    setAllCourses(data);
                } else {
                    console.error('Courses API returned non-array:', data);
                    setAllCourses([]); // Use empty array to prevent crash
                }
                setIsLoadingCourses(false);
            })
            .catch(err => {
                console.error('Failed to load courses:', err);
                setAllCourses([]); // Ensure state is always an array
                setIsLoadingCourses(false);
            });
    }, []);

    const currentUser = localUser || user;

    const stats = useMemo(() => {
        if (!currentUser) {
            return { coursesEnrolled: 0, lessonsCompleted: 0, hoursLearned: 0, currentStreak: 7 };
        }
        const progress = hybridStorage.progress.get();
        return {
            coursesEnrolled: currentUser.enrolledCourses?.length || 0,
            lessonsCompleted: progress?.completedLessons?.length || 0,
            hoursLearned: progress?.totalHours || 0,
            currentStreak: progress?.currentStreak || 7,
        };
    }, [currentUser]);

    const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);

    const enrolledCourses = useMemo(() => {
        if (!currentUser?.enrolledCourses?.length) return [];
        return allCourses.filter(c => currentUser.enrolledCourses?.includes(c.id));
    }, [currentUser, allCourses]);

    useEffect(() => {
        async function fetchRecommendations() {
            if (enrolledCourses.length > 0 && allCourses.length > 0) {
                const lastCourseId = enrolledCourses[enrolledCourses.length - 1].id;
                try {
                    const res = await fetch('/api/courses/related', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ courseId: lastCourseId, allCourses }),
                    });
                    const data = await res.json();
                    // DEFENSIVE: Ensure data is an array before calling .filter()
                    if (Array.isArray(data)) {
                        const newRecommendations = data.filter((c: any) => !currentUser?.enrolledCourses?.includes(c.id));
                        setRecommendedCourses(newRecommendations);
                    } else {
                        // API returned error object or non-array, use fallback
                        console.warn('ML recommendations API returned non-array:', data);
                        setRecommendedCourses(allCourses.filter(c => !currentUser?.enrolledCourses?.includes(c.id)).slice(0, 3));
                    }
                } catch (error) {
                    console.error("Failed to fetch ML recommendations", error);
                    setRecommendedCourses(allCourses.filter(c => !currentUser?.enrolledCourses?.includes(c.id)).slice(0, 3));
                }
            } else if (allCourses.length > 0) {
                setRecommendedCourses(allCourses.slice(0, 3));
            }
        }
        if (allCourses.length > 0) fetchRecommendations();
    }, [enrolledCourses, allCourses, currentUser]);

    // Show consistent loading state on server and client until mounted
    if (!mounted || (isUserLoading && !currentUser)) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const firstName = currentUser?.name?.split(" ")[0] || "Student";

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-10"
        >
            {/* Welcome Header */}
            <motion.div variants={itemVariants}>
                <motion.h1
                    className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.1 }}
                >
                    {t.userDash.welcomeBack}, {firstName}!
                </motion.h1>
                <motion.p
                    className="text-neutral-600 dark:text-neutral-400 mt-2 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {t.userDash.continueJourney}
                </motion.p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={containerVariants}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <StatCard icon={BookOpen} value={stats.coursesEnrolled} label={t.userDash.coursesEnrolled} color="blue" delay={0} />
                <StatCard icon={TrendingUp} value={`${stats.hoursLearned}h`} label={t.userDash.hoursLearned} color="indigo" delay={0.1} />
                <StatCard icon={Award} value={stats.lessonsCompleted} label={t.userDash.lessonsCompleted} color="green" delay={0.2} />
                <StatCard icon={Flame} value={stats.currentStreak} label={t.userDash.dayStreak} color="orange" delay={0.3} />
            </motion.div>

            {/* Subscription Widget - seamless for free users */}
            <motion.div variants={itemVariants}>
                <SubscriptionWidget />
            </motion.div>

            {/* Continue Learning Section */}
            {enrolledCourses.length > 0 && (
                <motion.div variants={itemVariants}>
                    <motion.h2
                        className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {t.userDash.continueLearning}
                    </motion.h2>
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {enrolledCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
                            >
                                <CourseCard course={course} index={index} />
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            )}

            {/* Recommended Courses (ML Powered) */}
            <motion.div variants={itemVariants}>
                <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{t.userDash.recommendedForYou}</h2>
                        <motion.span
                            className="text-xs bg-gradient-to-r from-indigo-500/20 to-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-3 h-3" />
                            {t.userDash.aiPowered}
                        </motion.span>
                    </div>
                    <Link
                        href="/browse"
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium"
                    >
                        {t.userDash.browseAll} →
                    </Link>
                </motion.div>

                {isLoadingCourses ? (
                    <motion.div
                        className="flex items-center gap-3 text-neutral-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <div className="w-5 h-5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                        {t.loading}
                    </motion.div>
                ) : recommendedCourses.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {recommendedCourses.slice(0, 3).map((course, index) => (
                            <motion.div
                                key={course.id}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
                            >
                                <CourseCard course={course} index={index} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        className="text-neutral-500 dark:text-neutral-400 py-8 text-center bg-neutral-50 dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {t.userDash.noRecommendations}
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
