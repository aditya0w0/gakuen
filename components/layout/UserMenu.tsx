"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLanguage, useTranslation } from "@/lib/i18n";
import { LogOut, Sun, Moon, Globe, ChevronDown, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface UserMenuProps {
    collapsed?: boolean;
}

const FLAG_ICONS: Record<string, string> = {
    en: "🇺🇸",
    ja: "🇯🇵",
    ko: "🇰🇷",
    id: "🇮🇩",
};

export function UserMenu({ collapsed = false }: UserMenuProps) {
    const { user, logout } = useAuth();
    const { resolvedTheme, setTheme } = useTheme();
    const { language, setLanguage, languages } = useLanguage();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [showLanguages, setShowLanguages] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowLanguages(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    if (!user) return null;

    return (
        <div ref={menuRef} className="relative">
            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-neutral-100 dark:hover:bg-white/5",
                    collapsed && "justify-center",
                    isOpen && "bg-neutral-100 dark:bg-white/5"
                )}
            >
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-white/10"
                    />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                        {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                )}
                {!collapsed && (
                    <>
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                {user.name || "User"}
                            </p>
                        </div>
                        <ChevronDown className={cn(
                            "w-4 h-4 text-neutral-400 transition-transform",
                            isOpen && "rotate-180"
                        )} />
                    </>
                )}
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            "absolute bottom-full mb-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-[100]",
                            collapsed ? "left-0 w-56" : "left-0 right-0"
                        )}
                    >
                        {/* User Info Header */}
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-3">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                                        {user.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            {/* Profile Link */}
                            <Link href="/settings" onClick={() => setIsOpen(false)}>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                    <User className="w-4 h-4" />
                                    <span>{t.settings}</span>
                                </button>
                            </Link>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {resolvedTheme === "dark" ? (
                                        <Moon className="w-4 h-4" />
                                    ) : (
                                        <Sun className="w-4 h-4" />
                                    )}
                                    <span>Appearance</span>
                                </div>
                                <div className="text-xs text-neutral-500 capitalize">{resolvedTheme}</div>
                            </button>

                            {/* Language Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowLanguages(!showLanguages)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4" />
                                        <span>Language</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-lg">{FLAG_ICONS[language]}</span>
                                        <span className="text-xs text-neutral-500 uppercase">{language}</span>
                                    </div>
                                </button>

                                {/* Language Options */}
                                <AnimatePresence>
                                    {showLanguages && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="py-1 pl-10 space-y-1">
                                                {languages.map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => {
                                                            setLanguage(lang.code);
                                                            setShowLanguages(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                                                            language === lang.code
                                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                                                        )}
                                                    >
                                                        <span className="text-lg">{FLAG_ICONS[lang.code]}</span>
                                                        <span>{lang.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Sign Out */}
                        <div className="p-2 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{t.logout}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
