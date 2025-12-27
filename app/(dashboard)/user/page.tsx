"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { CourseCard } from "@/components/course/CourseCard";
import { BookOpen, TrendingUp, Award, Flame } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

export default function UserDashboard() {
    const { user, isLoading: isUserLoading } = useAuth();
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Mark as mounted (client-side only)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Load courses from API
    useEffect(() => {
        fetch('/api/courses')
            .then(res => res.json())
            .then(data => {
                setAllCourses(data);
                setIsLoadingCourses(false);
            })
            .catch(err => {
                console.error('Failed to load courses:', err);
                setIsLoadingCourses(false);
            });
    }, []);

    // Calculate stats directly from user and progress - no separate state needed
    const stats = useMemo(() => {
        if (!user || !isMounted) {
            return null;
        }
        const progress = hybridStorage.progress.get();
        return {
            coursesEnrolled: user.enrolledCourses?.length || 0,
            lessonsCompleted: progress?.completedLessons?.length || 0,
            hoursLearned: progress?.totalHours || 0,
            currentStreak: progress?.currentStreak || 7,
        };
    }, [user, isMounted]);

    const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);

    const enrolledCourses = useMemo(() => {
        if (!user?.enrolledCourses?.length) return [];
        return allCourses.filter(c => user.enrolledCourses.includes(c.id));
    }, [user, allCourses]);

    // ML Recommendation Logic
    useEffect(() => {
        async function fetchRecommendations() {
            if (enrolledCourses.length > 0 && allCourses.length > 0) {
                // Get recommendations based on the LAST enrolled course (most recent interest)
                const lastCourseId = enrolledCourses[enrolledCourses.length - 1].id;

                try {
                    const res = await fetch('/api/courses/related', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ courseId: lastCourseId, allCourses }),
                    });
                    const data = await res.json();

                    // Filter out already enrolled courses from recommendations
                    const newRecommendations = data.filter((c: any) => !user?.enrolledCourses?.includes(c.id));
                    setRecommendedCourses(newRecommendations);
                } catch (error) {
                    console.error("Failed to fetch ML recommendations", error);
                    // Fallback to basic shuffle if ML fails
                    setRecommendedCourses(allCourses.filter(c => !user?.enrolledCourses?.includes(c.id)).slice(0, 3));
                }
            } else if (allCourses.length > 0) {
                // New user? Just show top rated or random
                setRecommendedCourses(allCourses.slice(0, 3));
            }
        }

        if (allCourses.length > 0) {
            fetchRecommendations();
        }
    }, [enrolledCourses, allCourses, user]);

    // Show loading state while AuthContext is loading
    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-neutral-400">Loading...</div>
            </div>
        );
    }

    const firstName = user.name?.split(" ")[0] || "Student";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Welcome back, {firstName}!
                </h1>
                <p className="text-neutral-400 mt-1">Continue your learning journey</p>
            </div>

            {/* Stats Grid - Always render with actual values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 backdrop-blur-sm p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.coursesEnrolled ?? 0}</div>
                    <div className="text-sm text-neutral-400">Courses Enrolled</div>
                </div>

                <div className="bg-black/20 backdrop-blur-sm p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.hoursLearned ?? 0}h</div>
                    <div className="text-sm text-neutral-400">Hours Learned</div>
                </div>

                <div className="bg-black/20 backdrop-blur-sm p-5 rounded-xl border border-white/5 hover:border-green-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-green-500/10 rounded-lg">
                            <Award className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.lessonsCompleted ?? 0}</div>
                    <div className="text-sm text-neutral-400">Lessons Completed</div>
                </div>

                <div className="bg-black/20 backdrop-blur-sm p-5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-orange-500/10 rounded-lg">
                            <Flame className="w-5 h-5 text-orange-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.currentStreak ?? 7}</div>
                    <div className="text-sm text-neutral-400">Day Streak</div>
                </div>
            </div>

            {/* Continue Learning Section */}
            {enrolledCourses.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Continue Learning</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                showProgress
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended Courses (ML Powered) */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-white">Recommended for You</h2>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                            ML Powered
                        </span>
                    </div>
                    <Link
                        href="/browse"
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Browse All Courses →
                    </Link>
                </div>
                {isLoadingCourses ? (
                    <div className="text-neutral-400">Loading courses...</div>
                ) : recommendedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendedCourses.slice(0, 3).map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-neutral-400">No recommendations available</div>
                )}
            </div>
        </div>
    );
}
