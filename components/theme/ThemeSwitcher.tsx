"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeSwitcherProps {
    /** CSS class for the wrapper */
    className?: string;
    /** Size of the toggle */
    size?: "sm" | "md" | "lg";
}

/**
 * Single dynamic theme toggle button
 * Switches between light and dark mode with smooth animation
 */
export function ThemeSwitcher({ className = "", size = "md" }: ThemeSwitcherProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
                ${sizeClasses[size]}
                relative flex items-center justify-center
                rounded-full
                bg-neutral-100 dark:bg-neutral-800
                hover:bg-neutral-200 dark:hover:bg-neutral-700
                border border-neutral-200 dark:border-neutral-700
                transition-all duration-300
                group
                ${className}
            `}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {/* Sun icon - visible in dark mode */}
            <Sun
                className={`
                    ${iconSizes[size]}
                    absolute
                    text-amber-500
                    transition-all duration-300
                    ${isDark
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 rotate-90 scale-0"
                    }
                `}
            />

            {/* Moon icon - visible in light mode */}
            <Moon
                className={`
                    ${iconSizes[size]}
                    absolute
                    text-blue-600
                    transition-all duration-300
                    ${isDark
                        ? "opacity-0 -rotate-90 scale-0"
                        : "opacity-100 rotate-0 scale-100"
                    }
                `}
            />
        </button>
    );
}
