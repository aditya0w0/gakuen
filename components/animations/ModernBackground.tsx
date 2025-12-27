"use client";

import React, { useEffect, useRef } from "react";
import { animate, stagger, random } from "animejs";
import { cn } from "@/lib/utils";

export const ModernBackground = ({ className }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Moving orbs
        animate(".bg-orb", {
            translateX: () => random(-200, 200),
            translateY: () => random(-200, 200),
            scale: () => random(1, 2),
            ease: "in-out-quad",
            duration: 5000,
            alternate: true,
            loop: true,
            delay: stagger(200),
        });
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                "fixed inset-0 -z-10 overflow-hidden bg-neutral-950",
                className
            )}
        >
            {/* Gradient Orbs */}
            <div className="bg-orb absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl" />
            <div className="bg-orb absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-900/20 blur-3xl opacity-70" />
            <div className="bg-orb absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-slate-800/20 blur-3xl -translate-x-1/2 -translate-y-1/2" />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

            {/* Noise texture (optional, minimal) */}
            <div className="opacity-[0.03] absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};
