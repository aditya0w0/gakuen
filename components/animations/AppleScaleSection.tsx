"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ReactNode, useRef } from "react";

interface AppleScaleSectionProps {
    children: ReactNode;
    /** Initial scale (default: 1) */
    initialScale?: number;
    /** Final scale when scrolled past (default: 0.85) */
    finalScale?: number;
    /** Initial border radius (default: 0) */
    initialRadius?: number;
    /** Final border radius (default: 40) */
    finalRadius?: number;
    /** Height of the scrollable area */
    height?: string;
    /** CSS class for the wrapper */
    className?: string;
    /** CSS class for the content */
    contentClassName?: string;
}

/**
 * Apple-style sticky scale section
 * Content stays sticky and scales down as user scrolls past
 * Similar to Apple's product page transitions
 */
export function AppleScaleSection({
    children,
    initialScale = 1,
    finalScale = 0.85,
    initialRadius = 0,
    finalRadius = 40,
    height = "200vh",
    className = "",
    contentClassName = "",
}: AppleScaleSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const scale = useTransform(scrollYProgress, [0, 0.5], [initialScale, finalScale]);
    const borderRadius = useTransform(scrollYProgress, [0, 0.5], [initialRadius, finalRadius]);
    const opacity = useTransform(scrollYProgress, [0.3, 0.8], [1, 0.6]);

    if (prefersReducedMotion) {
        return (
            <div ref={ref} className={className} style={{ height }}>
                <div className={`sticky top-0 h-screen ${contentClassName}`}>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className={className} style={{ height }}>
            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                <motion.div
                    style={{ scale, borderRadius, opacity }}
                    className={`w-full h-full will-change-transform ${contentClassName}`}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}

interface AppleCardStackProps {
    /** Array of card contents */
    cards: ReactNode[];
    /** CSS class for the wrapper */
    className?: string;
    /** CSS class for each card */
    cardClassName?: string;
}

/**
 * Apple-style stacking cards on scroll
 * Cards stack on top of each other as user scrolls
 */
export function AppleCardStack({
    cards,
    className = "",
    cardClassName = "",
}: AppleCardStackProps) {
    const ref = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });

    if (prefersReducedMotion) {
        return (
            <div ref={ref} className={`relative ${className}`}>
                {cards.map((card, index) => (
                    <div key={index} className={cardClassName}>
                        {card}
                    </div>
                ))}
            </div>
        );
    }

    const cardHeight = 100 / cards.length;

    return (
        <div
            ref={ref}
            className={`relative ${className}`}
            style={{ height: `${cards.length * 100}vh` }}
        >
            {cards.map((card, index) => (
                <Card
                    key={index}
                    index={index}
                    totalCards={cards.length}
                    progress={scrollYProgress}
                    className={cardClassName}
                >
                    {card}
                </Card>
            ))}
        </div>
    );
}

function Card({
    children,
    index,
    totalCards,
    progress,
    className,
}: {
    children: ReactNode;
    index: number;
    totalCards: number;
    progress: ReturnType<typeof useScroll>["scrollYProgress"];
    className: string;
}) {
    const start = index / totalCards;
    const end = (index + 1) / totalCards;

    const scale = useTransform(
        progress,
        [start, end],
        [1, 0.9 - index * 0.02]
    );
    const y = useTransform(
        progress,
        [start, end],
        [0, -30 * (totalCards - index)]
    );
    const zIndex = totalCards - index;

    return (
        <motion.div
            className={`sticky top-20 will-change-transform ${className}`}
            style={{
                scale,
                y,
                zIndex,
            }}
        >
            {children}
        </motion.div>
    );
}
