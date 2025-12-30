"use client";

import { motion, useReducedMotion, useInView } from "framer-motion";
import { ReactNode, useRef, useEffect, useState } from "react";

interface AppleScrollRevealProps {
    children: ReactNode;
    /** Delay before animation starts (in seconds) */
    delay?: number;
    /** Animation duration (in seconds) */
    duration?: number;
    /** Initial Y offset in pixels */
    yOffset?: number;
    /** CSS class for the wrapper */
    className?: string;
    /** Whether to only animate once */
    once?: boolean;
}

/**
 * Apple-style scroll reveal animation
 * Elements fade in and slide up when entering the viewport
 * Works correctly for content visible on initial page load
 */
export function AppleScrollReveal({
    children,
    delay = 0,
    duration = 0.8,
    yOffset = 40,
    className = "",
    once = true,
}: AppleScrollRevealProps) {
    const prefersReducedMotion = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount: 0.1 });
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (isInView && !hasAnimated) {
            setHasAnimated(true);
        }
    }, [isInView, hasAnimated]);

    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: yOffset }}
            animate={hasAnimated || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.4, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Container for staggered reveal animations
 * Wrap multiple AppleScrollRevealItem components
 */
export function AppleScrollRevealContainer({
    children,
    className = "",
    staggerDelay = 0.1,
}: {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}) {
    const prefersReducedMotion = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Individual item for staggered animations
 * Use inside AppleScrollRevealContainer
 */
export function AppleScrollRevealItem({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.6,
                        ease: [0.25, 0.4, 0.25, 1],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
