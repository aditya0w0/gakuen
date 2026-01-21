"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface AppleTextRevealProps {
    /** Text to reveal (string or ReactNode with text) */
    children: string;
    /** Type of reveal animation */
    type?: "words" | "chars" | "lines";
    /** CSS class for the wrapper */
    className?: string;
    /** CSS class for each word/char */
    itemClassName?: string;
    /** Whether to only animate once */
    once?: boolean;
}

/**
 * Apple-style text reveal animation
 * Text reveals word-by-word or character-by-character as user scrolls
 */
export function AppleTextReveal({
    children,
    type = "words",
    className = "",
    itemClassName = "",
    once = true,
}: AppleTextRevealProps) {
    const prefersReducedMotion = useReducedMotion();
    const text = typeof children === "string" ? children : "";

    const items = type === "chars"
        ? text.split("")
        : type === "lines"
            ? text.split("\n")
            : text.split(" ");

    if (prefersReducedMotion) {
        return <span className={className}>{text}</span>;
    }

    return (
        <motion.span
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: "-50px" }}
            className={`inline-flex flex-wrap ${className}`}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: type === "chars" ? 0.02 : 0.08,
                    },
                },
            }}
        >
            {items.map((item, index) => (
                <motion.span
                    key={index}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                duration: 0.5,
                                ease: [0.25, 0.4, 0.25, 1],
                            },
                        },
                    }}
                    className={`inline-block ${itemClassName}`}
                >
                    {item}
                    {type === "words" && index < items.length - 1 ? "\u00A0" : ""}
                </motion.span>
            ))}
        </motion.span>
    );
}

interface AppleTextHighlightProps {
    children: string;
    /** Color to highlight with */
    highlightColor?: string;
    /** CSS class for the wrapper */
    className?: string;
}

/**
 * Apple-style text highlight on scroll
 * Text gradually highlights as user scrolls past it
 */
export function AppleTextHighlight({
    children,
    highlightColor = "rgb(255, 255, 255)",
    className = "",
}: AppleTextHighlightProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 0.9", "start 0.25"],
    });

    const text = typeof children === "string" ? children : "";
    const words = text.split(" ");

    if (prefersReducedMotion) {
        return <span className={className}>{text}</span>;
    }

    return (
        <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
            {words.map((word, index) => {
                const start = index / words.length;
                const end = start + 1 / words.length;

                return (
                    <Word
                        key={index}
                        progress={scrollYProgress}
                        range={[start, end]}
                        highlightColor={highlightColor}
                    >
                        {word}
                    </Word>
                );
            })}
        </span>
    );
}

function Word({
    children,
    progress,
    range,
    highlightColor,
}: {
    children: string;
    progress: ReturnType<typeof useScroll>["scrollYProgress"];
    range: [number, number];
    highlightColor: string;
}) {
    const opacity = useTransform(progress, range, [0.3, 1]);
    const color = useTransform(progress, range, ["rgb(100, 100, 100)", highlightColor]);

    return (
        <motion.span
            style={{ opacity, color }}
            className="mr-[0.25em] inline-block will-change-[opacity,color]"
        >
            {children}
        </motion.span>
    );
}
