"use client";

import { useState } from "react";
import { Star, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseRatingModalProps {
    courseId: string;
    courseTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, review?: string) => Promise<void>;
}

export function CourseRatingModal({
    courseId,
    courseTitle,
    isOpen,
    onClose,
    onSubmit,
}: CourseRatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit(rating, review);
            setSubmitted(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Failed to submit rating:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayRating = hoveredRating || rating;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {submitted ? (
                    // Success State
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                            Thank You!
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Your rating helps other learners
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Star className="w-8 h-8 text-white" fill="white" />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                                Rate This Course
                            </h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs mx-auto">
                                You&apos;ve completed{" "}
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                    {courseTitle}
                                </span>
                            </p>
                        </div>

                        {/* Star Rating */}
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-10 h-10 transition-colors ${star <= displayRating
                                                ? "text-amber-400 fill-amber-400"
                                                : "text-neutral-300 dark:text-neutral-600"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Rating Label */}
                        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-6 h-5">
                            {displayRating === 1 && "Poor"}
                            {displayRating === 2 && "Fair"}
                            {displayRating === 3 && "Good"}
                            {displayRating === 4 && "Very Good"}
                            {displayRating === 5 && "Excellent!"}
                        </p>

                        {/* Optional Review */}
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Share your experience (optional)"
                            className="w-full p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 resize-none text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                        />

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className="w-full mt-4 h-12 text-base font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Rating"}
                        </Button>

                        {/* Skip */}
                        <button
                            onClick={onClose}
                            className="w-full mt-3 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                        >
                            Maybe Later
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
