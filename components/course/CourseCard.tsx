"use client";

import { Course } from "@/lib/types";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { enrollmentManager } from "@/lib/storage/enrollment";
import { Clock, BarChart, Check, Plus, ChevronRight, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { animate } from "@/components/animations/useAnime";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { useTranslatedCourse } from "@/lib/hooks/useTranslatedCourse";
import Image from "next/image";

// Convert Google Drive URLs to proxy URLs
function getProxiedImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;

    // Already a proxy URL
    if (url.startsWith('/api/images/')) return url;

    // Extract Google Drive file ID from various URL formats
    const drivePatterns = [
        /drive\.google\.com\/file\/d\/([^/]+)/,
        /drive\.google\.com\/open\?id=([^&]+)/,
        /drive\.google\.com\/uc\?.*id=([^&]+)/,
    ];

    for (const pattern of drivePatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `/api/images/${match[1]}`;
        }
    }

    // If it's just a file ID (no URL)
    if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) {
        return `/api/images/${url}`;
    }

    // Return original URL for non-Drive images
    return url;
}

interface CourseCardProps {
    course: Course;
    index?: number;
    onEnrollChange?: () => void;
}

export function CourseCard({ course, index = 0, onEnrollChange }: CourseCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [imageError, setImageError] = useState(false);
    const progress = hybridStorage.progress.getCourseProgress(course.id);
    const { t } = useTranslation();

    // Auto-translate course content
    const translated = useTranslatedCourse(course.id, course.title, course.description);

    // Check if user has subscription that grants full course access
    const subscriptionTier = user?.subscription?.tier || 'free';
    const hasActiveSubscription = user?.subscription?.status === 'active' && subscriptionTier !== 'free';
    // Pro = 100% access, Mid = 50% access, Basic = 30% access - for simplicity, treat active subscription as having access
    const hasSubscriptionAccess = hasActiveSubscription && (subscriptionTier === 'pro' || subscriptionTier === 'mid');

    useEffect(() => {
        // User has access if: enrolled, OR has active paid subscription (mid/pro)
        const enrolled = enrollmentManager.isEnrolled(course.id);
        setIsEnrolled(enrolled || hasSubscriptionAccess);
    }, [course.id, user, hasSubscriptionAccess]);

    // Reset image error state when thumbnail changes
    useEffect(() => {
        setImageError(false);
    }, [course.thumbnail]);

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
            const result = await enrollmentManager.enrollInCourse(user.id, course.id);

            if (result.success) {
                setIsEnrolled(true);
                // Wait a moment for API to complete before refreshing
                await refreshUser();
                onEnrollChange?.();
            } else {
                console.error("Enrollment failed:", result.error);
                alert(result.error || "Failed to enroll. Please try again.");
            }
        } catch (error) {
            console.error("Enrollment error:", error);
            alert("Failed to enroll. Please try again.");
        } finally {
            setIsEnrolling(false);
        }
    };

    // Determine if we should show the fallback
    const showFallback = !course.thumbnail || imageError;

    // Debug: Log thumbnail URL
    if (course.thumbnail) {
        console.log(`[CourseCard] ${course.title}: Original URL:`, course.thumbnail);
        console.log(`[CourseCard] ${course.title}: Proxied URL:`, getProxiedImageUrl(course.thumbnail));
    }

    return (
        <div ref={cardRef} className="h-full group">
            <Link href={isEnrolled ? `/class/${course.id}` : '#'} onClick={(e) => !isEnrolled && e.preventDefault()}>
                <div className="relative h-full flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/40 border border-neutral-200 dark:border-white/5 shadow-lg dark:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-blue-900/10 hover:border-neutral-300 dark:hover:border-white/10">

                    {/* Image Section - The Hero */}
                    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-100 dark:from-blue-900/50 to-indigo-100 dark:to-indigo-900/50">
                        {/* Always render the fallback behind the image */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${showFallback ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-4xl font-bold text-neutral-300 dark:text-white/20">{course.title.charAt(0)}</span>
                        </div>
                        {/* Render image on top if thumbnail exists */}
                        {course.thumbnail && !imageError && (
                            <div className="absolute inset-0">
                                <Image
                                    src={getProxiedImageUrl(course.thumbnail) || ''}
                                    alt={course.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onError={() => setImageError(true)}
                                />
                            </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-white/20 dark:via-zinc-950/20 to-transparent opacity-90" />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 dark:text-white/90 bg-white/80 dark:bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-200 dark:border-white/10 shadow-sm">
                                {course.level || 'Beginner'}
                            </span>
                            {isEnrolled && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-sm flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Enrolled
                                </span>
                            )}
                        </div>

                        {/* Price Badge */}
                        <div className="absolute top-3 right-3">
                            {course.isFree || course.price === 0 ? (
                                <span className="text-xs font-bold text-white bg-green-500 px-2.5 py-1 rounded-full shadow-lg">
                                    Free
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1 rounded-full shadow-lg">
                                    ${course.price}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content Section - Glassmorphic */}
                    <div className="flex-1 p-5 pt-2 flex flex-col">
                        <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-500 text-xs font-medium mb-3">
                            <span className="uppercase tracking-wider">{course.category}</span>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                                <span className="flex items-center gap-1"><BarChart size={12} /> {course.rating}</span>
                            </div>
                        </div>

                        {/* Title with loading skeleton */}
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {translated.loading ? (
                                <span className="inline-block w-3/4 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                            ) : (
                                translated.title
                            )}
                        </h3>

                        {/* Description with loading skeleton */}
                        <p className="text-sm text-neutral-600 dark:text-zinc-400 line-clamp-2 mb-6 flex-1">
                            {translated.loading ? (
                                <span className="space-y-2 block">
                                    <span className="inline-block w-full h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                                    <span className="inline-block w-2/3 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                                </span>
                            ) : (
                                translated.description
                            )}
                        </p>

                        {/* Footer Action */}
                        <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
                            {isEnrolled ? (
                                <div className="flex-1">
                                    <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                        <span>{t.course.progress}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                                            {t.course.continueLearning} <ChevronRight size={14} className="text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        {course.instructorAvatar ? (
                                            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-neutral-200 dark:border-white/10">
                                                <Image
                                                    src={course.instructorAvatar}
                                                    alt={course.instructor || "Instructor"}
                                                    fill
                                                    className="object-cover"
                                                    sizes="32px"
                                                    onError={(e) => {
                                                        // Fallback to initial on error
                                                        const target = e.currentTarget as HTMLImageElement;
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            parent.style.display = 'none';
                                                            parent.nextElementSibling?.classList.remove('hidden');
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : null}
                                        <div className={`h-8 w-8 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-white/5 flex items-center justify-center text-xs font-bold text-neutral-400 dark:text-white/50 ${course.instructorAvatar ? 'hidden' : ''}`}>
                                            {(course.instructor || "A")[0]}
                                        </div>
                                        <div className="text-xs text-neutral-500 dark:text-zinc-500">
                                            <span className="block text-neutral-700 dark:text-zinc-300 font-medium">{t.course.instructor}</span>
                                            {(course.instructor || "Admin").split(' ')[0]}
                                        </div>
                                    </div>

                                    {course.isFree || course.price === 0 ? (
                                        <button
                                            onClick={handleEnroll}
                                            disabled={isEnrolling}
                                            className="relative overflow-hidden bg-neutral-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                {isEnrolling ? '...' : t.course.enroll}
                                                {!isEnrolling && <Plus size={14} className="transition-transform group-hover/btn:rotate-90" />}
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                router.push(`/checkout/${course.id}`);
                                            }}
                                            className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:from-blue-700 hover:to-indigo-700 transition-colors group/btn"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                ${course.price}
                                                <ShoppingCart size={14} />
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
