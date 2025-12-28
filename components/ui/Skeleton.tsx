import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("skeleton rounded-lg", className)} />
    );
}

// Pre-built skeleton patterns
export function SkeletonCard() {
    return (
        <div className="bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

export function SkeletonCourseContent() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
            </div>

            {/* Image placeholder */}
            <Skeleton className="w-full h-64 rounded-xl" />

            {/* Text content */}
            <div className="space-y-4">
                <SkeletonText lines={4} />
                <SkeletonText lines={3} />
            </div>

            {/* Code block placeholder */}
            <Skeleton className="w-full h-32 rounded-lg" />

            <SkeletonText lines={2} />
        </div>
    );
}

export function SkeletonLessonList() {
    return (
        <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-8 p-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-zinc-900/50 rounded-xl border border-white/5 p-4">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>

            {/* Course cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}
