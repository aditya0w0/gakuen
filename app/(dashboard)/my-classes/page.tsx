"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { Course } from "@/lib/types";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, PlayCircle, CheckCircle2, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { CourseRatingModal } from "@/components/course/CourseRatingModal";

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

export default function MyClassesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
    const [filter, setFilter] = useState<"all" | "inProgress" | "completed">("all");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();

    // Rating modal state
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingCourse, setRatingCourse] = useState<Course | null>(null);
    const [ratedCourses, setRatedCourses] = useState<string[]>([]);

    // Handle rating submit
    const handleRatingSubmit = async (rating: number, review?: string) => {
        if (!ratingCourse || !user) return;

        await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId: ratingCourse.id,
                rating,
                review,
            }),
        });

        // Mark as rated
        setRatedCourses((prev) => [...prev, ratingCourse.id]);
    };

    // Fetch courses from API
    useEffect(() => {
        fetch('/api/courses', { next: { revalidate: 60 } })
            .then(res => res.json())
            .then(data => {
                setCourses(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (user) {
            const progress = hybridStorage.progress.get();
            setCourseProgress(progress.courseProgress || {});
        }
    }, [user]);

    const handleFilterChange = (newFilter: typeof filter) => {
        if (newFilter === filter) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setFilter(newFilter);
            setTimeout(() => setIsTransitioning(false), 50);
        }, 200);
    };

    if (!user || isLoading) {
        return <div className="text-neutral-400">{t.loading}</div>;
    }

    const enrolledCourses = courses.filter(c =>
        user.enrolledCourses?.includes(c.id)
    );

    const filteredCourses = enrolledCourses.filter(course => {
        const progress = courseProgress[course.id] || 0;
        if (filter === "inProgress") return progress > 0 && progress < 100;
        if (filter === "completed") return progress === 100;
        return true;
    });

    const stats = {
        total: enrolledCourses.length,
        inProgress: enrolledCourses.filter(c => {
            const p = courseProgress[c.id] || 0;
            return p > 0 && p < 100;
        }).length,
        completed: enrolledCourses.filter(c => courseProgress[c.id] === 100).length,
    };

    return (
        <div className="space-y-6">
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-3xl font-bold text-white">{t.myClasses.title}</h1>
                <p className="text-neutral-400 mt-1">
                    {enrolledCourses.length} {enrolledCourses.length === 1 ? t.course.enrolled : t.myClasses.totalCourses.toLowerCase()}
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400">{t.myClasses.totalCourses}</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400">{t.myClasses.inProgress}</p>
                            <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400">{t.myClasses.completed}</p>
                            <p className="text-2xl font-bold text-white">{stats.completed}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
                <button
                    onClick={() => handleFilterChange("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${filter === "all"
                        ? "bg-white/10 text-white scale-105"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    {t.myClasses.all}
                </button>
                <button
                    onClick={() => handleFilterChange("inProgress")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${filter === "inProgress"
                        ? "bg-white/10 text-white scale-105"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    {t.myClasses.inProgress}
                </button>
                <button
                    onClick={() => handleFilterChange("completed")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${filter === "completed"
                        ? "bg-white/10 text-white scale-105"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    {t.myClasses.completed}
                </button>
            </div>

            {/* Course List */}
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                {filteredCourses.length > 0 ? (
                    <div className="space-y-4">
                        {filteredCourses.map((course, index) => {
                            const progress = courseProgress[course.id] || 0;
                            const isCompleted = progress === 100;

                            return (
                                <Card
                                    key={course.id}
                                    className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                                    style={{
                                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                    }}
                                >
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={getProxiedImageUrl(course.thumbnail)}
                                                alt={course.title}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute top-2 left-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-white bg-blue-600/90 px-2 py-1 rounded">
                                                    {course.level}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-1">{course.title}</h3>
                                                <p className="text-sm text-neutral-400">{course.category} • {course.instructor || 'Unknown'}</p>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-neutral-400">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-4 h-4" />
                                                    {course.lessonsCount || course.lessons?.length || 0} lessons
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {course.duration}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-neutral-400">{t.course.progress}</span>
                                                    <span className="text-white font-medium">{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2 bg-white/10" />
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col gap-2 md:justify-center">
                                            <Link href={`/class/${course.id}`} className="flex-1 md:flex-initial">
                                                <Button className="w-full bg-white text-black hover:bg-neutral-200 transition-all duration-300 hover:scale-105">
                                                    <PlayCircle className="w-4 h-4 mr-2" />
                                                    {isCompleted ? "Review" : progress > 0 ? "Continue" : "Start"}
                                                </Button>
                                            </Link>
                                            {/* Rate button for completed courses */}
                                            {isCompleted && !ratedCourses.includes(course.id) && (
                                                <Button
                                                    onClick={() => {
                                                        setRatingCourse(course);
                                                        setRatingModalOpen(true);
                                                    }}
                                                    variant="outline"
                                                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                                                >
                                                    <Star className="w-4 h-4 mr-2" />
                                                    Rate
                                                </Button>
                                            )}
                                            {isCompleted && ratedCourses.includes(course.id) && (
                                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Rated
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-16 text-center animate-in fade-in duration-500">
                        <BookOpen className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                        <p className="text-neutral-400 mb-2">
                            {filter === "all"
                                ? "No enrolled courses yet"
                                : filter === "inProgress"
                                    ? "No courses in progress"
                                    : "No completed courses yet"}
                        </p>
                        {filter === "all" && (
                            <p className="text-sm text-neutral-500">
                                Go to Dashboard to browse and enroll in courses!
                            </p>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            {/* Rating Modal */}
            <CourseRatingModal
                courseId={ratingCourse?.id || ""}
                courseTitle={ratingCourse?.title || ""}
                isOpen={ratingModalOpen}
                onClose={() => {
                    setRatingModalOpen(false);
                    setRatingCourse(null);
                }}
                onSubmit={handleRatingSubmit}
            />
        </div>
    );
}
