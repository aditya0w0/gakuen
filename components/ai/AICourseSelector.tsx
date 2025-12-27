"use client";

import { useState } from "react";
import { Course } from "@/lib/constants/demo-data";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { CourseCard } from "@/components/course/CourseCard";
import { cn } from "@/lib/utils";

interface AICourseSelectorProps {
    courses: Course[];
}

export function AICourseSelector({ courses }: AICourseSelectorProps) {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<{ courseId: string; reason: string } | null>(null);

    const handleAskAI = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/ai/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, courses }),
            });
            const data = await res.json();
            setRecommendation(data);
        } catch (error) {
            console.error("AI Recommendation failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const recommendedCourse = recommendation
        ? courses.find(c => c.id === recommendation.courseId)
        : null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 md:p-8 mb-8 transition-all duration-500">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                {/* Input Section */}
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Not sure what to pick?</h3>
                    </div>

                    <p className="text-zinc-400 mb-6">
                        Tell our AI advisor what you're interested in, and we'll find the perfect course for you.
                    </p>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g., I want to build a mobile app..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-32 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                        <button
                            onClick={handleAskAI}
                            disabled={isLoading || !query.trim()}
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Thinking...
                                </>
                            ) : (
                                <>
                                    Ask AI
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    {recommendation && (
                        <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-in fade-in slide-in-from-top-2">
                            <p className="text-blue-200 text-sm">
                                <span className="font-bold text-blue-400">AI says:</span> " {recommendation.reason} "
                            </p>
                        </div>
                    )}
                </div>

                {/* Result Section - Only shows when result exists */}
                {recommendedCourse && (
                    <div className="w-full md:w-80 flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30"></div>
                            <CourseCard course={recommendedCourse} index={0} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
