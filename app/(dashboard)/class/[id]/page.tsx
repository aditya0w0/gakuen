"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Lesson } from "@/lib/types";
import { MaterialViewer } from "@/components/course/MaterialViewer";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { useAuth } from "@/components/auth/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle, FileText, ChevronLeft, ChevronDown, ChevronUp, ImageIcon, List } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCourse } from "@/lib/hooks/useCourse";
import { CourseChatBot } from "@/components/ai/CourseChatBot";
import { SkeletonCourseContent, SkeletonLessonList } from "@/components/ui/Skeleton";

export default function ClassPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const courseId = params.id as string;

    const { course, isLoading } = useCourse(courseId);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
    const [isLessonListOpen, setIsLessonListOpen] = useState(false);
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        if (user && courseId) {
            import("@/lib/storage/enrollment").then(({ enrollmentManager }) => {
                if (!enrollmentManager.isEnrolled(courseId)) {
                    enrollmentManager.enrollInCourse(user.id, courseId)
                        .then((result) => {
                            if (result.success) {
                                refreshUser();
                            } else if (result.error) {
                                console.error("Auto-enroll failed:", result.error);
                            }
                        });
                }
            });
        }
    }, [user, courseId, refreshUser]);

    useEffect(() => {
        const progress = hybridStorage.progress.get();
        setCompletedLessons(progress.completedLessons);
    }, []);

    const activeLessonId = searchParams.get("lesson");
    const activeLesson = course?.lessons.find((l: Lesson) => l.id === activeLessonId) || course?.lessons[0];

    if (isLoading) {
        return (
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                <div className="hidden lg:block w-80 flex-shrink-0">
                    <SkeletonLessonList />
                </div>
                <div className="flex-1">
                    <SkeletonCourseContent />
                </div>
            </div>
        );
    }

    if (!course) {
        return <div className="text-white">Course not found</div>;
    }

    const handleSelectLesson = (lessonId: string) => {
        router.push(`/class/${courseId}?lesson=${lessonId}`);
        setIsLessonListOpen(false);
    };

    const handleComplete = () => {
        if (activeLesson && user) {
            const allLessonIds = course.lessons.map((l: Lesson) => l.id);
            const currentCompleted = new Set(completedLessons);
            currentCompleted.add(activeLesson.id);

            const completedCount = allLessonIds.filter((id: string) => currentCompleted.has(id)).length;
            const progressPercent = Math.round((completedCount / allLessonIds.length) * 100);

            hybridStorage.progress.completeLesson(
                user.id,
                activeLesson.id,
                courseId,
                course.lessons.length,
                progressPercent
            );

            const progress = hybridStorage.progress.get();
            setCompletedLessons([...progress.completedLessons]);
        }
    };

    const isCompleted = (lessonId: string) => completedLessons.includes(lessonId);
    const currentLessonIndex = course.lessons.findIndex((l: Lesson) => l.id === activeLesson?.id);

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden relative">
            {/* Mobile: Collapsible lesson header - STICKY */}
            <div className="lg:hidden sticky top-0 z-30 bg-zinc-950">
                <button
                    onClick={() => setIsLessonListOpen(!isLessonListOpen)}
                    className="w-full flex items-center justify-between p-3 bg-zinc-900/80 border-b border-white/10"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                            <List className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-neutral-500">Lesson {currentLessonIndex + 1}/{course.lessons.length}</p>
                            <p className="text-sm font-medium text-white truncate">{activeLesson?.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-neutral-500">{hybridStorage.progress.getCourseProgress(courseId)}%</span>
                        {isLessonListOpen ? (
                            <ChevronUp className="w-5 h-5 text-neutral-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-400" />
                        )}
                    </div>
                </button>

                {/* Collapsible lesson list */}
                {isLessonListOpen && (
                    <div className="bg-zinc-950 border-b border-white/10 max-h-[50vh] overflow-y-auto">
                        <div className="p-2 space-y-1">
                            {course.lessons.map((lesson, index) => {
                                const completed = isCompleted(lesson.id);
                                const isActive = activeLesson?.id === lesson.id;

                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => handleSelectLesson(lesson.id)}
                                        className={cn(
                                            "w-full flex items-center p-3 rounded-lg text-sm transition-all text-left",
                                            isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5"
                                        )}
                                    >
                                        {completed ? (
                                            <CheckCircle className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <span className="w-4 h-4 mr-3 flex items-center justify-center text-neutral-500 flex-shrink-0 text-xs">
                                                {index + 1}
                                            </span>
                                        )}
                                        <span className="truncate">{lesson.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop: Fixed Sidebar */}
            <div className="hidden lg:flex w-80 flex-shrink-0 flex-col bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 h-full overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex-shrink-0">
                    <Link href="/user" className="text-xs text-neutral-400 hover:text-white flex items-center mb-2 transition-colors">
                        <ChevronLeft className="w-3 h-3 mr-1" /> Back to Dashboard
                    </Link>
                    <h2 className="font-bold text-white line-clamp-1">{course.title}</h2>
                    <div className="mt-2 text-xs text-neutral-500 flex justify-between">
                        <span>Progress</span>
                        <span>{hybridStorage.progress.getCourseProgress(courseId)}%</span>
                    </div>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-2">
                        {course.lessons.map((lesson, index) => {
                            const completed = isCompleted(lesson.id);
                            const isActive = activeLesson?.id === lesson.id;

                            return (
                                <button
                                    key={lesson.id}
                                    onClick={() => handleSelectLesson(lesson.id)}
                                    className={cn(
                                        "w-full flex items-center p-3 rounded-lg text-sm transition-all text-left",
                                        isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5"
                                    )}
                                >
                                    {completed ? (
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <span className="w-4 h-4 mr-2 flex items-center justify-center text-neutral-500 text-xs">
                                            {index + 1}
                                        </span>
                                    )}
                                    <span className="line-clamp-1">{lesson.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Content Area - SCROLLABLE on mobile */}
            <div className={cn(
                "flex-1 min-w-0 overflow-y-auto bg-zinc-950/50 transition-all duration-300",
                isChatSidebarOpen ? "lg:mr-[400px]" : "mr-0"
            )}>
                {activeLesson ? (
                    <MaterialViewer
                        lesson={activeLesson}
                        isCompleted={isCompleted(activeLesson.id)}
                        onComplete={handleComplete}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500">
                        Select a lesson to start
                    </div>
                )}
            </div>

            {/* AI Chatbot */}
            <CourseChatBot
                course={course}
                onToggleSidebar={setIsChatSidebarOpen}
            />
        </div>
    );
}
