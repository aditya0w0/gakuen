"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ReactNode, useRef } from "react";

interface AppleParallaxProps {
    children: ReactNode;
    /** Speed multiplier (0.5 = half speed, 2 = double speed). Negative for opposite direction */
    speed?: number;
    /** CSS class for the wrapper */
    className?: string;
    /** Whether to apply parallax on horizontal axis */
    horizontal?: boolean;
}

/**
 * Apple-style parallax scrolling effect
 * Elements move at different speeds creating depth illusion
 */
export function AppleParallax({
    children,
    speed = 0.5,
    className = "",
    horizontal = false,
}: AppleParallaxProps) {
    const ref = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    // Map scroll progress to transform values
    const range = 100 * speed;
    const y = useTransform(scrollYProgress, [0, 1], [range, -range]);
    const x = useTransform(scrollYProgress, [0, 1], [range, -range]);

    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion) {
        return <div ref={ref} className={className}>{children}</div>;
    }

    return (
        <div ref={ref} className={`overflow-hidden ${className}`}>
            <motion.div
                style={horizontal ? { x } : { y }}
                className="will-change-transform"
            >
                {children}
            </motion.div>
        </div>
    );
}

interface AppleParallaxHeroProps {
    /** Background content (image, video, etc.) */
    background: ReactNode;
    /** Foreground content (text, buttons, etc.) */
    children: ReactNode;
    /** Background parallax speed */
    backgroundSpeed?: number;
    /** Foreground parallax speed */
    foregroundSpeed?: number;
    /** Height of the hero section */
    height?: string;
    /** CSS class for the wrapper */
    className?: string;
}

/**
 * Apple-style hero section with layered parallax
 * Background moves slower than foreground for depth effect
 */
export function AppleParallaxHero({
    background,
    children,
    backgroundSpeed = 0.3,
    foregroundSpeed = 0.6,
    height = "100vh",
    className = "",
}: AppleParallaxHeroProps) {
    const ref = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const backgroundY = useTransform(
        scrollYProgress,
        [0, 1],
        [0, 100 * backgroundSpeed]
    );
    const foregroundY = useTransform(
        scrollYProgress,
        [0, 1],
        [0, 100 * foregroundSpeed]
    );
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    if (prefersReducedMotion) {
        return (
            <div ref={ref} className={`relative ${className}`} style={{ height }}>
                <div className="absolute inset-0">{background}</div>
                <div className="relative z-10">{children}</div>
            </div>
        );
    }

    return (
        <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ height }}>
            {/* Background layer - moves slower */}
            <motion.div
                className="absolute inset-0 will-change-transform"
                style={{ y: backgroundY }}
            >
                {background}
            </motion.div>

            {/* Foreground layer - moves faster with fade out */}
            <motion.div
                className="relative z-10 will-change-transform"
                style={{ y: foregroundY, opacity }}
            >
                {children}
            </motion.div>
        </div>
    );
}
