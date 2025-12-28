"use client";

import { Course } from "@/lib/constants/demo-data";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { enrollmentManager } from "@/lib/storage/enrollment";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Clock, BarChart, Check, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { animate } from "@/components/animations/useAnime";
import { useAuth } from "../auth/AuthContext";

interface CourseCardProps {
    course: Course;
    index?: number;
    onEnrollChange?: () => void;
}

export function CourseCard({ course, index = 0, onEnrollChange }: CourseCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { user, refreshUser } = useAuth();
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const progress = hybridStorage.progress.getCourseProgress(course.id);

    useEffect(() => {
        setIsEnrolled(enrollmentManager.isEnrolled(course.id));
    }, [course.id, user]);

    useEffect(() => {
        if (cardRef.current) {
            animate(cardRef.current, {
                opacity: [0, 1],
                translateY: [20, 0],
                delay: index * 100,
                ease: "out-quad",
                duration: 800,
            });
        }
    }, [index]);

    const handleEnroll = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) return;

        setIsEnrolling(true);
        try {
            await enrollmentManager.enrollInCourse(user.id, course.id);
            setIsEnrolled(true);
            refreshUser();
            onEnrollChange?.();
        } catch (error) {
            console.error("Enrollment failed:", error);
        } finally {
            setIsEnrolling(false);
        }
    };

    return (
        <div ref={cardRef} className="h-full group">
            <Link href={isEnrolled ? `/class/${course.id}` : '#'} onClick={(e) => !isEnrolled && e.preventDefault()}>
                <div className="relative h-full flex flex-col overflow-hidden rounded-2xl bg-zinc-900/40 border border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-900/10 hover:border-white/10">

                    {/* Image Section - The Hero */}
                    <div className="relative h-48 w-full overflow-hidden">
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90" />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                                {course.level}
                            </span>
                            {isEnrolled && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-sm flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Enrolled
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content Section - Glassmorphic */}
                    <div className="flex-1 p-5 pt-2 flex flex-col">
                        <div className="flex items-center justify-between text-zinc-500 text-xs font-medium mb-3">
                            <span className="uppercase tracking-wider">{course.category}</span>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                                <span className="flex items-center gap-1"><BarChart size={12} /> {course.rating}</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                            {course.title}
                        </h3>

                        <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1">
                            {course.description}
                        </p>

                        {/* Footer Action */}
                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                            {isEnrolled ? (
                                <div className="flex-1">
                                    <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                                            Continue Learning <ChevronRight size={14} className="text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs font-bold text-white/50">
                                            {(course.instructor || "A")[0]}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            <span className="block text-zinc-300 font-medium">Instructor</span>
                                            {(course.instructor || "Admin").split(' ')[0]}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleEnroll}
                                        disabled={isEnrolling}
                                        className="relative overflow-hidden bg-white text-black px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {isEnrolling ? '...' : 'Enroll'}
                                            {!isEnrolling && <Plus size={14} className="transition-transform group-hover/btn:rotate-90" />}
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
