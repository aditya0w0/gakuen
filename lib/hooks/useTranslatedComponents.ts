"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/i18n";
import { Component, SyllabusComponent } from "@/lib/cms/types";
import type { Language } from "@/lib/i18n/translations";

interface TranslatedComponents {
    components: Component[];
    loading: boolean;
    error: string | null;
}

/**
 * Hook to translate CMS component content
 * Translates all text/header/syllabus components in a lesson
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
        const texts: { id: string; type: string; text: string; itemIndex?: number }[] = [];
        
        originalComponents.forEach(c => {
            if (c.type === "header") {
                texts.push({ id: c.id, type: c.type, text: (c as any).text });
            } else if (c.type === "text") {
                texts.push({ id: c.id, type: c.type, text: (c as any).content });
            } else if (c.type === "syllabus") {
                const syllabus = c as SyllabusComponent;
                // Add syllabus title
                if (syllabus.title) {
                    texts.push({ id: c.id, type: "syllabus-title", text: syllabus.title });
                }
                // Add each item's title and description
                syllabus.items.forEach((item, index) => {
                    texts.push({ id: c.id, type: "syllabus-item-title", text: item.title, itemIndex: index });
                    if (item.description) {
                        texts.push({ id: c.id, type: "syllabus-item-desc", text: item.description, itemIndex: index });
                    }
                });
            }
        });
        
        return texts;
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
                    if (comp.type === "header") {
                        const matchIdx = textsToTranslate.findIndex(t => t.id === comp.id && t.type === "header");
                        if (matchIdx !== -1) {
                            return { ...comp, text: translatedTexts[matchIdx] || (comp as any).text };
                        }
                    } else if (comp.type === "text") {
                        const matchIdx = textsToTranslate.findIndex(t => t.id === comp.id && t.type === "text");
                        if (matchIdx !== -1) {
                            return { ...comp, content: translatedTexts[matchIdx] || (comp as any).content };
                        }
                    } else if (comp.type === "syllabus") {
                        const syllabus = comp as SyllabusComponent;
                        let translatedTitle = syllabus.title;
                        
                        // Find translated title
                        const titleIdx = textsToTranslate.findIndex(t => t.id === comp.id && t.type === "syllabus-title");
                        if (titleIdx !== -1) {
                            translatedTitle = translatedTexts[titleIdx] || syllabus.title;
                        }
                        
                        // Translate items
                        const translatedItems = syllabus.items.map((item, index) => {
                            const titleMatchIdx = textsToTranslate.findIndex(
                                t => t.id === comp.id && t.type === "syllabus-item-title" && t.itemIndex === index
                            );
                            const descMatchIdx = textsToTranslate.findIndex(
                                t => t.id === comp.id && t.type === "syllabus-item-desc" && t.itemIndex === index
                            );
                            
                            return {
                                ...item,
                                title: titleMatchIdx !== -1 ? (translatedTexts[titleMatchIdx] || item.title) : item.title,
                                description: descMatchIdx !== -1 ? (translatedTexts[descMatchIdx] || item.description) : item.description,
                            };
                        });
                        
                        return { ...syllabus, title: translatedTitle, items: translatedItems };
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
