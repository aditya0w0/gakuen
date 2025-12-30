"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system" | "auto";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "gakuen-theme";

// Get hour-based theme (light: 6am-6pm, dark: 6pm-6am)
function getTimeBasedTheme(): "light" | "dark" {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "light" : "dark";
}

// Get system preference
function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    // Load saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (saved && ["light", "dark", "system", "auto"].includes(saved)) {
            setThemeState(saved);
        }
        setMounted(true);
    }, []);

    // Resolve theme and apply to document
    useEffect(() => {
        if (!mounted) return;

        let resolved: "light" | "dark";

        switch (theme) {
            case "light":
                resolved = "light";
                break;
            case "dark":
                resolved = "dark";
                break;
            case "system":
                resolved = getSystemTheme();
                break;
            case "auto":
                resolved = getTimeBasedTheme();
                break;
            default:
                resolved = "light";
        }

        setResolvedTheme(resolved);

        // Apply to document
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolved);
        root.style.colorScheme = resolved;

        // Also set data attribute for CSS selectors
        root.setAttribute("data-theme", resolved);
    }, [theme, mounted]);

    // Listen for system preference changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            setResolvedTheme(e.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [theme]);

    // Auto theme: check time every minute
    useEffect(() => {
        if (theme !== "auto") return;

        const interval = setInterval(() => {
            setResolvedTheme(getTimeBasedTheme());
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
