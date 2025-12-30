"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Language, Translations } from "./translations";

interface LanguageContextType {
    language: Language;
    t: Translations;
    setLanguage: (lang: Language) => void;
    languages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "gakuen-language";

const languageOptions: { code: Language; name: string; flag: string }[] = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "id", name: "Indonesia", flag: "🇮🇩" },
];

// Detect browser language
function detectBrowserLanguage(): Language {
    if (typeof navigator === "undefined") return "en";

    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith("ja")) return "ja";
    if (browserLang.startsWith("ko")) return "ko";
    if (browserLang.startsWith("id")) return "id";

    return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");
    const [mounted, setMounted] = useState(false);

    // Load saved language or detect
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved && ["en", "ja", "ko", "id"].includes(saved)) {
            setLanguageState(saved);
        } else {
            setLanguageState(detectBrowserLanguage());
        }
        setMounted(true);
    }, []);

    // Update document lang attribute
    useEffect(() => {
        if (mounted) {
            document.documentElement.lang = language;
        }
    }, [language, mounted]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
    };

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, t, setLanguage, languages: languageOptions }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

// Shorthand hook for translations only
export function useTranslation() {
    const { t, language } = useLanguage();
    return { t, language };
}
