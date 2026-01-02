"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/i18n";
import { Component } from "@/lib/cms/types";
import type { Language } from "@/lib/i18n/translations";

interface TranslatedComponents {
    components: Component[];
    loading: boolean;
    error: string | null;
}

/**
 * Hook to translate CMS component content
 * Translates all text/header components in a lesson
 */
export function useTranslatedComponents(
    lessonId: string,
    originalComponents: Component[] | undefined
): TranslatedComponents {
    const { language } = useLanguage();
    const [translatedComponents, setTranslatedComponents] = useState<Component[]>(originalComponents || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create a stable key based on component structure (not object reference)
    // This prevents infinite loops when parent re-renders with same data
    const componentsKey = useMemo(() => {
        if (!originalComponents) return '';
        return originalComponents.map(c => `${c.id}:${c.type}`).join('|');
    }, [originalComponents]);

    // Extract all translatable text from components
    const textsToTranslate = useMemo(() => {
        if (!originalComponents) return [];
        return originalComponents
            .filter(c => c.type === "header" || c.type === "text")
            .map(c => ({
                id: c.id,
                type: c.type,
                text: c.type === "header" ? (c as any).text : (c as any).content
            }));
    }, [originalComponents]);

    useEffect(() => {
        // If English or no components, use originals
        if (language === "en" || !originalComponents || originalComponents.length === 0) {
            setTranslatedComponents(originalComponents || []);
            setLoading(false);
            return;
        }

        const translateComponents = async () => {
            setLoading(true);
            setError(null);

            try {
                // Batch translate all texts
                const response = await fetch("/api/translate/batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId,
                        texts: textsToTranslate.map(t => t.text),
                        targetLanguage: language,
                        sourceLanguage: "en" as Language,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                const data = await response.json();
                const translatedTexts = data.translations as string[];

                // Map translations back to components
                const translated = originalComponents.map(comp => {
                    const matchIdx = textsToTranslate.findIndex(t => t.id === comp.id);
                    if (matchIdx === -1) return comp;

                    if (comp.type === "header") {
                        return { ...comp, text: translatedTexts[matchIdx] || (comp as any).text };
                    } else if (comp.type === "text") {
                        return { ...comp, content: translatedTexts[matchIdx] || (comp as any).content };
                    }
                    return comp;
                });

                setTranslatedComponents(translated);
            } catch (err) {
                console.error("Component translation error:", err);
                setError(err instanceof Error ? err.message : "Translation failed");
                setTranslatedComponents(originalComponents); // Fallback to original
            } finally {
                setLoading(false);
            }
        };

        translateComponents();
        // Use stable componentsKey instead of originalComponents object reference
        // textsToTranslate is derived from originalComponents, so we don't need it here
    }, [lessonId, language, componentsKey]);

    return {
        components: translatedComponents,
        loading,
        error,
    };
}
