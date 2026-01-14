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
    // Track which sections are expanded - default all open
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
        const sections = course.sections || [];
        return new Set(sections.map(s => s.id));
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
            <div className="space-y-1">
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

    return (
        <div className="space-y-2">
            {course.sections.map((section) => {
                const isExpanded = expandedSections.has(section.id);
                const { completed, total } = getSectionProgress(section);
                const sectionComplete = isSectionComplete(section);

                return (
                    <div key={section.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                )}
                                <span className="font-medium text-white">{section.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {sectionComplete ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <span className="text-sm text-zinc-400">
                                        {completed}/{total}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* Section Lessons */}
                        {isExpanded && (
                            <div className="border-t border-zinc-800 bg-zinc-950/50">
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
            className={cn(
                "w-full flex items-center gap-3 p-3 text-sm transition-all text-left",
                isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
            )}
        >
            {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
                <span className="w-4 h-4 flex items-center justify-center text-zinc-500 flex-shrink-0 text-xs">
                    {index + 1}
                </span>
            )}
            <span className="truncate">{lesson.title}</span>
        </button>
    );
}
