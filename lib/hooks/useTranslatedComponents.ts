"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/lib/i18n";
import { Component, SyllabusComponent } from "@/lib/cms/types";
import type { Language } from "@/lib/i18n/translations";

interface TranslatedComponents {
    components: Component[];
    loading: boolean;
    error: string | null;
}

// Request deduplication cache
const componentTranslationCache = new Map<string, Component[]>();
const inFlightComponentRequests = new Map<string, Promise<any>>();

/**
 * Hook to translate CMS component content
 * Translates all text/header/syllabus components in a lesson
 * 
 * RACE CONDITION FIXES:
 * 1. AbortController to cancel stale requests
 * 2. Request deduplication
 * 3. Memory cache to prevent re-fetches
 * 4. Stable component key to prevent infinite loops
 */
export function useTranslatedComponents(
    lessonId: string,
    originalComponents: Component[] | undefined
): TranslatedComponents {
    const { language } = useLanguage();
    const [translatedComponents, setTranslatedComponents] = useState<Component[]>(originalComponents || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track requests to avoid race conditions
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

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

        // Skip if no translatable content
        if (textsToTranslate.length === 0) {
            setTranslatedComponents(originalComponents);
            setLoading(false);
            return;
        }

        const cacheKey = `components_${lessonId}_${language}_${componentsKey.substring(0, 100)}`;

        // Check memory cache first
        const cached = componentTranslationCache.get(cacheKey);
        if (cached) {
            console.log(`✅ Using cached component translations for ${lessonId}`);
            setTranslatedComponents(cached);
            setLoading(false);
            return;
        }

        // Cancel any previous in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const currentRequestId = ++requestIdRef.current;

        // Check for existing in-flight request
        const existingRequest = inFlightComponentRequests.get(cacheKey);
        if (existingRequest) {
            console.log(`🔄 Reusing in-flight component translation request: ${lessonId}`);
            existingRequest.then((data) => {
                if (requestIdRef.current === currentRequestId && !abortController.signal.aborted) {
                    const mapped = mapTranslationsToComponents(originalComponents, textsToTranslate, data.translations);
                    componentTranslationCache.set(cacheKey, mapped);
                    setTranslatedComponents(mapped);
                    setLoading(false);
                }
            }).catch(() => {
                setLoading(false);
            });
            setLoading(true);
            return;
        }

        const translateComponents = async () => {
            setLoading(true);
            setError(null);

            try {
                const fetchPromise = fetch("/api/translate/batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId,
                        texts: textsToTranslate.map(t => t.text),
                        targetLanguage: language,
                        sourceLanguage: "en" as Language,
                    }),
                    signal: abortController.signal,
                });

                // Store for deduplication
                inFlightComponentRequests.set(cacheKey, fetchPromise.then(r => r.json()));

                const response = await fetchPromise;

                // Clean up
                inFlightComponentRequests.delete(cacheKey);

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                // Check if still current
                if (requestIdRef.current !== currentRequestId || abortController.signal.aborted) {
                    console.log(`🚫 Ignoring stale component translation response for ${lessonId}`);
                    return;
                }

                const data = await response.json();
                const translatedTexts = data.translations as string[];

                // Map translations back to components
                const translated = mapTranslationsToComponents(originalComponents, textsToTranslate, translatedTexts);

                // Cache the result
                componentTranslationCache.set(cacheKey, translated);

                setTranslatedComponents(translated);
            } catch (err) {
                // Clean up
                inFlightComponentRequests.delete(cacheKey);

                // Ignore abort errors
                if (err instanceof Error && err.name === 'AbortError') {
                    console.log(`🚫 Component translation aborted for ${lessonId}`);
                    return;
                }

                console.error("Component translation error:", err);
                setError(err instanceof Error ? err.message : "Translation failed");
                setTranslatedComponents(originalComponents); // Fallback to original
            } finally {
                setLoading(false);
            }
        };

        translateComponents();

        return () => {
            abortController.abort();
        };
        // Use stable componentsKey instead of originalComponents object reference
    }, [lessonId, language, componentsKey]);

    return {
        components: translatedComponents,
        loading,
        error,
    };
}

/**
 * Map translated texts back to component structure
 */
function mapTranslationsToComponents(
    originalComponents: Component[],
    textsToTranslate: { id: string; type: string; text: string; itemIndex?: number }[],
    translatedTexts: string[]
): Component[] {
    return originalComponents.map(comp => {
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
}
