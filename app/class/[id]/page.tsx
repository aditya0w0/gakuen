"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Lesson } from "@/lib/types";
import { MaterialViewer } from "@/components/course/MaterialViewer";
import { CourseSyllabus } from "@/components/course/CourseSyllabus";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { useAuth } from "@/components/auth/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle, ChevronLeft, ChevronDown, ChevronUp, List, PanelLeftClose, PanelLeftOpen, Home, Compass, BookOpen, Settings } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCourse } from "@/lib/hooks/useCourse";
import { CourseChatBot } from "@/components/ai/CourseChatBot";
import { SkeletonCourseContent, SkeletonLessonList } from "@/components/ui/Skeleton";
import { MiniNavRail } from "@/components/layout/MiniNavRail";

export default function ClassPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const courseId = params.id as string;

    const { course, isLoading } = useCourse(courseId);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
    const [isLessonListOpen, setIsLessonListOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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

    // Loading state - fullscreen
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex bg-neutral-50 dark:bg-zinc-950 overflow-hidden">
                {/* Mini Nav Rail - Desktop */}
                <MiniNavRail className="hidden lg:flex" />
                <div className="flex-1 flex">
                    <SkeletonCourseContent />
                </div>
                <div className="hidden lg:block w-80 border-l border-neutral-200 dark:border-zinc-800">
                    <SkeletonLessonList />
                </div>
            </div>
        );
    }

    // Not found state - fullscreen
    if (!course) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-neutral-50 dark:bg-zinc-950">
                <div className="text-center">
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">Course not found</p>
                    <Link href="/user" className="text-blue-500 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
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
        <div className="fixed inset-0 flex bg-neutral-50 dark:bg-zinc-950 overflow-hidden">
            {/* Mini Nav Rail - Desktop */}
            <MiniNavRail className="hidden lg:flex" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Mobile: Collapsible lesson header - STICKY */}
                <div className="lg:hidden sticky top-0 z-30 bg-neutral-100 dark:bg-zinc-950">
                    <button
                        onClick={() => setIsLessonListOpen(!isLessonListOpen)}
                        className="w-full flex items-center justify-between p-3 bg-white dark:bg-zinc-900/80 border-b border-neutral-200 dark:border-white/10"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-neutral-100 dark:bg-white/10 rounded-lg flex-shrink-0">
                                <List className="w-4 h-4 text-neutral-700 dark:text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-neutral-500">Lesson {currentLessonIndex + 1}/{course.lessons.length}</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{activeLesson?.title}</p>
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
                        <div className="bg-neutral-50 dark:bg-zinc-950 border-b border-neutral-200 dark:border-white/10 max-h-[50vh] overflow-y-auto">
                            <div className="p-2 space-y-1">
                                {course.lessons.map((lesson: Lesson, index: number) => {
                                    const completed = isCompleted(lesson.id);
                                    const isActive = activeLesson?.id === lesson.id;

                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleSelectLesson(lesson.id)}
                                            className={cn(
                                                "w-full flex items-center p-3 rounded-lg text-sm transition-all text-left",
                                                isActive ? "bg-teal-500/10 text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
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

                {/* Content Area - MAIN */}
                <div className={cn(
                    "flex-1 min-w-0 overflow-y-auto bg-white dark:bg-zinc-950 transition-all duration-300",
                    isChatSidebarOpen ? "lg:mr-[400px]" : "mr-0"
                )}>
                    {activeLesson ? (
                        <MaterialViewer
                            lesson={activeLesson}
                            isCompleted={isCompleted(activeLesson.id)}
                            onComplete={handleComplete}
                            courseId={courseId}
                            courseTitle={course.title}
                            quizzes={course.quizzes}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-neutral-500">
                            Select a lesson to start
                        </div>
                    )}
                </div>

                {/* Desktop: Collapsible Sidebar - RIGHT SIDE */}
                <div className={cn(
                    "hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-neutral-200 dark:border-zinc-800 transition-all duration-300 relative h-full",
                    isSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
                )}>
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-neutral-200 dark:border-zinc-800 flex-shrink-0">
                        <Link href="/user" className="text-xs text-neutral-500 dark:text-zinc-500 hover:text-neutral-900 dark:hover:text-white flex items-center mb-3 transition-colors">
                            <ChevronLeft className="w-3 h-3 mr-1" /> Back to Dashboard
                        </Link>
                        <h2 className="font-bold text-neutral-900 dark:text-white text-sm">{course.title}</h2>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-500 transition-all"
                                    style={{ width: `${hybridStorage.progress.getCourseProgress(courseId)}%` }}
                                />
                            </div>
                            <span className="text-xs text-neutral-500 dark:text-zinc-500">{hybridStorage.progress.getCourseProgress(courseId)}%</span>
                        </div>
                    </div>

                    {/* Syllabus - scrollable with hidden scrollbar */}
                    <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                        <CourseSyllabus
                            course={course}
                            activeLesson={activeLesson}
                            completedLessons={completedLessons}
                            onSelectLesson={handleSelectLesson}
                        />
                    </div>
                </div>

                {/* Toggle Button - Fixed on screen edge */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 items-center justify-center w-6 h-16 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 rounded-l-lg transition-all shadow-lg"
                    style={{ right: isSidebarCollapsed ? 0 : 'calc(320px)' }}
                >
                    {isSidebarCollapsed ? (
                        <PanelLeftClose className="w-4 h-4 text-neutral-600 dark:text-zinc-400" />
                    ) : (
                        <PanelLeftOpen className="w-4 h-4 text-neutral-600 dark:text-zinc-400" />
                    )}
                </button>

                {/* AI Chatbot */}
                <CourseChatBot
                    course={course}
                    onToggleSidebar={setIsChatSidebarOpen}
                />
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-white/10 flex items-center justify-around z-40 safe-area-pb">
                {[
                    { icon: Home, label: "Home", href: "/user" },
                    { icon: Compass, label: "Browse", href: "/browse" },
                    { icon: BookOpen, label: "Classes", href: "/my-classes" },
                    { icon: Settings, label: "Settings", href: "/settings" },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center flex-1 h-full transition-colors py-2 text-neutral-400 dark:text-neutral-500"
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}

