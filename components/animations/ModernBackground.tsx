"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Detect if device is low-powered
const isLowPowerDevice = () => {
    if (typeof window === 'undefined') return false;

    // Check for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check hardware concurrency (CPU cores)
    const lowCores = (navigator.hardwareConcurrency || 4) <= 4;

    // Check device memory (if available)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lowMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory <= 4 : false;

    return isMobile || prefersReducedMotion || (lowCores && lowMemory);
};

export const ModernBackground = ({ className }: { className?: string }) => {
    const [mounted, setMounted] = useState(false);
    const [isLowPower, setIsLowPower] = useState(true); // Default to low power (safer)

    useEffect(() => {
        setMounted(true);
        setIsLowPower(isLowPowerDevice());
    }, []);

    // Don't render anything until after hydration to prevent mismatch
    if (!mounted) {
        return null;
    }

    // Ultra-lightweight mode for mobile/low-power devices
    if (isLowPower) {
        return (
            <div className={cn("fixed inset-0 -z-10 bg-neutral-950", className)}>
                {/* Static gradient - no animation, no blur */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-neutral-950 to-indigo-950/30" />

                {/* Subtle grid - static, no mask */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '4rem 4rem',
                    }}
                />
            </div>
        );
    }

    // Full experience for desktop/high-power devices
    return (
        <div className={cn("fixed inset-0 -z-10 overflow-hidden bg-neutral-950", className)}>
            {/* CSS-only animated orbs - no JavaScript */}
            <div
                className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-900/20 blur-2xl animate-float-slow"
                style={{ willChange: 'transform' }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-900/20 blur-2xl opacity-70 animate-float-slow-delay"
                style={{ willChange: 'transform' }}
            />
            <div
                className="absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-slate-800/20 blur-2xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"
                style={{ willChange: 'transform' }}
            />

            {/* Grid overlay - simplified */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '4rem 4rem',
                    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 110%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 110%)',
                }}
            />
        </div>
    );
};
