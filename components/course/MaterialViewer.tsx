"use client";

import { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { animate } from "@/components/animations/useAnime";
import { ComponentRenderer } from "@/components/cms/ComponentRenderer";
import { useTimeTracker } from "@/lib/hooks/useTimeTracker";
import { useTranslatedLesson } from "@/lib/hooks/useTranslatedCourse";
import { useTranslatedComponents } from "@/lib/hooks/useTranslatedComponents";
import DOMPurify from "dompurify";

interface MaterialViewerProps {
    lesson: Lesson;
    onComplete: () => void;
    isCompleted: boolean;
}

export function MaterialViewer({ lesson, onComplete, isCompleted }: MaterialViewerProps) {
    useTimeTracker();

    // Auto-translate lesson content based on selected language
    const translated = useTranslatedLesson(
        lesson.id,
        lesson.title,
        lesson.content || ""
    );

    // Auto-translate CMS component content
    const translatedCms = useTranslatedComponents(lesson.id, lesson.components);

    const contentRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);

    useEffect(() => {
        if (contentRef.current) {
            animate(contentRef.current, {
                opacity: [0, 1],
                translateY: [20, 0],
                ease: "out-quad",
                duration: 600
            });
        }

        setScrollProgress(0);
        setHasReachedEnd(false);
    }, [lesson.id]);

    // Event-driven completion: Auto-complete when scrolled to end
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        // If content is shorter than or equal to view, we are technically "at the end"
        // Prevent division by zero if no scroll is possible
        const maxScroll = scrollHeight - clientHeight;
        const scrolled = maxScroll <= 0 ? 100 : (scrollTop / maxScroll) * 100;

        setScrollProgress(Math.min(100, Math.max(0, scrolled)));

        if (scrolled >= 90 && !hasReachedEnd && !isCompleted) {
            triggerCompletion();
        }
    };

    const triggerCompletion = () => {
        setHasReachedEnd(true);
        setTimeout(() => {
            onComplete();
        }, 1000);
    };

    // Check once on mount if content is already short enough to be "complete"
    useEffect(() => {
        if (!contentRef.current || isCompleted) return;

        const checkHeight = () => {
            if (contentRef.current) {
                const { scrollHeight, clientHeight } = contentRef.current;
                // If no scrollbar needed (content fits), mark complete
                if (scrollHeight <= clientHeight + 1) { // +1 for pixel rounding safety
                    triggerCompletion();
                }
            }
        };

        // Check immediately and after a short delay (for images/layout to settle)
        checkHeight();
        const timer = setTimeout(checkHeight, 500);

        return () => clearTimeout(timer);
    }, [lesson.id]);

    // Auto-complete for image lessons
    useEffect(() => {
        if (lesson.type === "image" && !isCompleted) {
            const timer = setTimeout(() => {
                onComplete();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [lesson.id, lesson.type, isCompleted, onComplete]);

    // Debug: Log lesson data to understand what's being passed
    console.log('📚 MaterialViewer lesson:', {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        hasComponents: !!(lesson.components && lesson.components.length > 0),
        componentsCount: lesson.components?.length || 0,
    });

    // Render component-based lessons with translation
    if (lesson.components && lesson.components.length > 0) {
        return (
            <div className="flex-1 relative">
                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto p-8"
                >
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Loading skeleton while translating CMS components */}
                        {translatedCms.loading ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="h-8 bg-neutral-700 rounded w-2/3" />
                                <div className="space-y-3">
                                    <div className="h-4 bg-neutral-700 rounded w-full" />
                                    <div className="h-4 bg-neutral-700 rounded w-5/6" />
                                    <div className="h-4 bg-neutral-700 rounded w-4/5" />
                                </div>
                                <div className="h-6 bg-neutral-700 rounded w-1/2" />
                                <div className="space-y-3">
                                    <div className="h-4 bg-neutral-700 rounded w-full" />
                                    <div className="h-4 bg-neutral-700 rounded w-3/4" />
                                </div>
                            </div>
                        ) : (
                            translatedCms.components.map((component) => (
                                <ComponentRenderer
                                    key={component.id}
                                    component={component}
                                    isEditing={false}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Legacy content rendering (for old lessons)
    if (lesson.type === "article") {
        return (
            <div className="flex-1 relative">
                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto p-8"
                >
                    <div className="max-w-3xl mx-auto prose prose-invert prose-neutral">
                        {/* Loading skeleton while translating */}
                        {translated.loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-6 bg-neutral-700 rounded w-2/3" />
                                <div className="h-4 bg-neutral-700 rounded w-full" />
                                <div className="h-4 bg-neutral-700 rounded w-5/6" />
                                <div className="h-4 bg-neutral-700 rounded w-4/5" />
                            </div>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(translated.content || lesson.content || "") }} />
                        )}
                    </div>
                </div>

                {/* Scroll Progress Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                    <div
                        className={cn(
                            "h-full transition-all",
                            scrollProgress >= 90 ? "bg-green-500" : "bg-blue-500"
                        )}
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>
            </div>
        );
    }

    // Image lessons
    if (lesson.type === "image") {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div ref={contentRef} className="max-w-4xl w-full">
                    <img
                        src={lesson.imageUrl}
                        alt={lesson.title}
                        className="w-full rounded-xl"
                    />
                    {lesson.content && (
                        <div className="mt-4 prose prose-invert prose-neutral">
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content) }} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Fallback for empty or CMS lessons with no content
    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-neutral-500">
                <p className="text-lg">This lesson is being prepared.</p>
                <p className="text-sm mt-2">Check back soon for content!</p>
            </div>
        </div>
    );
}
