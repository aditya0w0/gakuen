"use client";

import { useLanguage } from "./LanguageProvider";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface LanguageSwitcherProps {
    /** CSS class for the wrapper */
    className?: string;
}

/**
 * Single dynamic language toggle dropdown
 * Shows current language flag and cycles through options
 */
export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
    const { language, setLanguage, languages } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const current = languages.find(l => l.code === language) || languages[0];

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                    flex items-center gap-2
                    px-3 py-2
                    rounded-full
                    bg-neutral-100 dark:bg-neutral-800
                    hover:bg-neutral-200 dark:hover:bg-neutral-700
                    border border-neutral-200 dark:border-neutral-700
                    transition-all duration-200
                "
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
            >
                <span className="text-lg">{current.flag}</span>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hidden sm:inline">
                    {current.code.toUpperCase()}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg z-50 overflow-hidden">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 text-left
                                    hover:bg-neutral-50 dark:hover:bg-neutral-800
                                    transition-colors
                                    ${language === lang.code ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                                `}
                                role="option"
                                aria-selected={language === lang.code}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span className={`text-sm ${language === lang.code
                                        ? "text-blue-600 dark:text-blue-400 font-medium"
                                        : "text-neutral-700 dark:text-neutral-300"
                                    }`}>
                                    {lang.name}
                                </span>
                                {language === lang.code && (
                                    <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
