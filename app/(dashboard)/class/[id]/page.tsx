"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Lesson } from "@/lib/constants/demo-data";
import { MaterialViewer } from "@/components/course/MaterialViewer";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle, PlayCircle, FileText, ChevronLeft, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAnime } from "@/components/animations/useAnime";
import { useCourse } from "@/lib/hooks/useCourse";
import { CourseChatBot } from "@/components/ai/CourseChatBot";

export default function ClassPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const courseId = params.id as string;

    const { course, isLoading } = useCourse(courseId);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
    const { user, refreshUser } = useAuth(); // Get refreshUser

    // Auto-enroll on visit
    useEffect(() => {
        if (user && courseId) {
            import("@/lib/storage/enrollment").then(({ enrollmentManager }) => {
                if (!enrollmentManager.isEnrolled(courseId)) {
                    enrollmentManager.enrollInCourse(user.id, courseId)
                        .then(() => refreshUser())
                        .catch(err => console.error("Auto-enroll failed:", err));
                }
            });
        }
    }, [user, courseId]); // Dependency on user/courseId

    useEffect(() => {
        const progress = hybridStorage.progress.get();
        setCompletedLessons(progress.completedLessons);
    }, []);

    const activeLessonId = searchParams.get("lesson");
    const activeLesson = course?.lessons.find((l: Lesson) => l.id === activeLessonId) || course?.lessons[0];

    useAnime(".sidebar-item", {
        translateX: [-10, 0],
        opacity: [0, 1],
        delay: (el, i) => i * 50,
        ease: "out-quad"
    });

    if (isLoading) {
        return <div className="text-white flex items-center justify-center h-screen">Loading course...</div>;
    }

    if (!course) {
        return <div className="text-white">Course not found</div>;
    }

    const handleSelectLesson = (lessonId: string) => {
        router.push(`/class/${courseId}?lesson=${lessonId}`);
    };

    const handleComplete = () => {
        if (activeLesson && user) {
            // Calculate progress explicitly based on known lesson IDs
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


    return (
        <div className="flex flex-col md:flex-row gap-6 h-full relative">
            {/* Fixed Sidebar - stays in place */}
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 h-full overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex-shrink-0">
                    <Link href="/user" className="text-xs text-neutral-400 hover:text-white flex items-center mb-2 transition-colors">
                        <ChevronLeft className="w-3 h-3 mr-1" /> Back to Dashboard
                    </Link>
                    <h2 className="font-bold text-white line-clamp-1">{course.title}</h2>
                    <div className="mt-2 text-xs text-neutral-500 flex justify-between">
                        <span>Course Progress</span>
                        <span>{hybridStorage.progress.getCourseProgress(courseId)}%</span>
                    </div>
                </div>

                {/* Scrollable lesson list */}
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
                                        isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                                    )}
                                >
                                    {completed ? (
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                            {lesson.type === 'article' ? (
                                                <FileText className="w-3 h-3" />
                                            ) : (
                                                <ImageIcon className="w-3 h-3" />
                                            )}
                                        </div>
                                    )}
                                    <span className="line-clamp-1">{lesson.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Scrollable Content Area - Delegate scroll to MaterialViewer */}
            <div className={cn(
                "flex-1 min-w-0 h-full overflow-hidden bg-zinc-950/50 transition-all duration-300",
                isChatSidebarOpen ? "mr-[400px]" : "mr-0"
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
