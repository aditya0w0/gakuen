"use client";

import { Course, Lesson, Section } from "@/lib/types";
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseSyllabusProps {
    course: Course;
    activeLesson?: Lesson;
    completedLessons: string[];
    onSelectLesson: (lessonId: string) => void;
}

export function CourseSyllabus({
    course,
    activeLesson,
    completedLessons,
    onSelectLesson,
}: CourseSyllabusProps) {
    // Track which sections are expanded - default all collapsed
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
        return new Set(); // Start with all collapsed
    });

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

    const getLessonById = (lessonId: string) => course.lessons.find(l => l.id === lessonId);

    const getSectionProgress = (section: Section) => {
        const completed = section.lessonIds.filter(id => isLessonCompleted(id)).length;
        return { completed, total: section.lessonIds.length };
    };

    const isSectionComplete = (section: Section) => {
        return section.lessonIds.every(id => isLessonCompleted(id));
    };

    // If no sections defined, fall back to flat list
    if (!course.sections || course.sections.length === 0) {
        return (
            <div className="space-y-1 w-full overflow-hidden">
                {course.lessons.map((lesson, index) => (
                    <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        isActive={activeLesson?.id === lesson.id}
                        isCompleted={isLessonCompleted(lesson.id)}
                        onSelect={() => onSelectLesson(lesson.id)}
                    />
                ))}
            </div>
        );
    }

    // SAFEGUARD: Ensure each lesson only appears in ONE section
    // If a lesson appears in multiple sections (data corruption), only show in first
    const seenLessonIds = new Set<string>();
    const dedupedSections = course.sections.map(section => {
        const uniqueLessonIds = section.lessonIds.filter(id => {
            if (seenLessonIds.has(id)) {
                console.warn(`⚠️ Duplicate lesson ${id} found in section ${section.title}, skipping`);
                return false;
            }
            seenLessonIds.add(id);
            return true;
        });
        return { ...section, lessonIds: uniqueLessonIds };
    });

    return (
        <div className="space-y-2 w-full overflow-hidden">
            {dedupedSections.map((section) => {
                const isExpanded = expandedSections.has(section.id);
                const { completed, total } = getSectionProgress(section);
                const sectionComplete = isSectionComplete(section);

                return (
                    <div key={section.id} className="border border-neutral-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between gap-2 p-3 bg-neutral-100 dark:bg-zinc-900/50 hover:bg-neutral-200 dark:hover:bg-zinc-800/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-neutral-500 dark:text-zinc-500 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-zinc-500 flex-shrink-0" />
                                )}
                                <span className="font-medium text-neutral-900 dark:text-white text-sm leading-snug">{section.title}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {sectionComplete ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <span className="text-xs text-zinc-500">
                                        {completed}/{total}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* Section Lessons */}
                        {isExpanded && (
                            <div className="border-t border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950/50">
                                {section.lessonIds.map((lessonId, index) => {
                                    const lesson = getLessonById(lessonId);
                                    if (!lesson) return null;

                                    return (
                                        <LessonItem
                                            key={lesson.id}
                                            lesson={lesson}
                                            index={index}
                                            isActive={activeLesson?.id === lesson.id}
                                            isCompleted={isLessonCompleted(lesson.id)}
                                            onSelect={() => onSelectLesson(lesson.id)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Individual lesson item
interface LessonItemProps {
    lesson: Lesson;
    index: number;
    isActive: boolean;
    isCompleted: boolean;
    onSelect: () => void;
}

function LessonItem({ lesson, index, isActive, isCompleted, onSelect }: LessonItemProps) {
    return (
        <button
            onClick={onSelect}
            title={lesson.title}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-all text-left min-w-0",
                isActive
                    ? "bg-teal-500/10 text-neutral-900 dark:text-white border-l-2 border-teal-500"
                    : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-300 border-l-2 border-transparent"
            )}
        >
            {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
                <span className="w-4 h-4 flex items-center justify-center text-neutral-500 dark:text-zinc-600 flex-shrink-0 text-xs font-medium">
                    {index + 1}
                </span>
            )}
            <span className="leading-snug">{lesson.title}</span>
        </button>
    );
}
