import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n";

interface TranslatedCourse {
    title: string;
    description: string;
    loading: boolean;
    error: string | null;
}

// Request deduplication cache for course translations
const courseTranslationCache = new Map<string, TranslatedCourse>();
const inFlightCourseRequests = new Map<string, Promise<any>>();

/**
 * Hook to get translated course content
 * Automatically fetches translation when language changes
 * 
 * RACE CONDITION FIXES:
 * 1. AbortController to cancel stale requests
 * 2. Request deduplication
 * 3. Memory cache to prevent re-fetches
 */
export function useTranslatedCourse(
    courseId: string,
    originalTitle: string,
    originalDescription: string
): TranslatedCourse {
    const { language } = useLanguage();
    const [state, setState] = useState<TranslatedCourse>({
        title: originalTitle,
        description: originalDescription,
        loading: false,
        error: null,
    });

    // Track the current request to avoid race conditions
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        // If English, use original
        if (language === "en") {
            setState({
                title: originalTitle,
                description: originalDescription,
                loading: false,
                error: null,
            });
            return;
        }

        const cacheKey = `course_${courseId}_${language}`;

        // Check memory cache first
        const cached = courseTranslationCache.get(cacheKey);
        if (cached) {
            setState(cached);
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

        // Check if there's already an in-flight request for this exact translation
        const existingRequest = inFlightCourseRequests.get(cacheKey);
        if (existingRequest) {
            console.log(`🔄 Reusing in-flight course translation request: ${cacheKey}`);
            existingRequest.then((data) => {
                if (requestIdRef.current === currentRequestId && !abortController.signal.aborted) {
                    const result = {
                        title: data.translation.title,
                        description: data.translation.description,
                        loading: false,
                        error: null,
                    };
                    courseTranslationCache.set(cacheKey, result);
                    setState(result);
                }
            }).catch(() => { });
            return;
        }

        // Fetch translation
        const fetchTranslation = async () => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const fetchPromise = fetch("/api/translate/course", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId,
                        title: originalTitle,
                        description: originalDescription,
                        targetLanguage: language,
                        sourceLanguage: "en",
                    }),
                    signal: abortController.signal,
                });

                // Store the promise for deduplication
                inFlightCourseRequests.set(cacheKey, fetchPromise.then(r => r.json()));

                const response = await fetchPromise;

                // Clean up in-flight tracking
                inFlightCourseRequests.delete(cacheKey);

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                // Check if this request is still current
                if (requestIdRef.current !== currentRequestId || abortController.signal.aborted) {
                    console.log(`🚫 Ignoring stale course translation response for ${courseId}`);
                    return;
                }

                const data = await response.json();
                const { translation } = data;

                const result = {
                    title: translation.title,
                    description: translation.description,
                    loading: false,
                    error: null,
                };

                // Cache the result
                courseTranslationCache.set(cacheKey, result);

                setState(result);
            } catch (error) {
                // Clean up in-flight tracking
                inFlightCourseRequests.delete(cacheKey);

                // Ignore abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log(`🚫 Course translation aborted for ${courseId}`);
                    return;
                }

                console.error("Translation error:", error);
                setState({
                    title: originalTitle,
                    description: originalDescription,
                    loading: false,
                    error: error instanceof Error ? error.message : "Translation failed",
                });
            }
        };

        fetchTranslation();

        // Cleanup function
        return () => {
            abortController.abort();
        };
    }, [courseId, originalTitle, originalDescription, language]);

    return state;
}

// Request deduplication cache for lesson translations
const lessonTranslationCache = new Map<string, { title: string; content: string; loading: boolean; error: string | null }>();
const inFlightLessonRequests = new Map<string, Promise<any>>();

/**
 * Hook to get translated lesson content
 * 
 * RACE CONDITION FIXES:
 * 1. AbortController to cancel stale requests
 * 2. Request deduplication
 * 3. Memory cache to prevent re-fetches
 */
export function useTranslatedLesson(
    lessonId: string,
    originalTitle: string,
    originalContent: string
): { title: string; content: string; loading: boolean; error: string | null } {
    const { language } = useLanguage();
    const [state, setState] = useState({
        title: originalTitle,
        content: originalContent,
        loading: false,
        error: null as string | null,
    });

    // Track the current request to avoid race conditions
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        // If English, use original
        if (language === "en") {
            setState({
                title: originalTitle,
                content: originalContent,
                loading: false,
                error: null,
            });
            return;
        }

        // Skip translation if content is empty (CMS-based lessons use components, not content)
        if (!originalContent || originalContent.trim() === "") {
            setState({
                title: originalTitle,
                content: originalContent,
                loading: false,
                error: null,
            });
            return;
        }

        const cacheKey = `lesson_${lessonId}_${language}`;

        // Check memory cache first
        const cached = lessonTranslationCache.get(cacheKey);
        if (cached) {
            setState(cached);
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

        // Check if there's already an in-flight request
        const existingRequest = inFlightLessonRequests.get(cacheKey);
        if (existingRequest) {
            console.log(`🔄 Reusing in-flight lesson translation request: ${cacheKey}`);
            existingRequest.then((data) => {
                if (requestIdRef.current === currentRequestId && !abortController.signal.aborted) {
                    const result = {
                        title: data.translation.title,
                        content: data.translation.content,
                        loading: false,
                        error: null,
                    };
                    lessonTranslationCache.set(cacheKey, result);
                    setState(result);
                }
            }).catch(() => { });
            return;
        }

        // Fetch translation
        const fetchTranslation = async () => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const fetchPromise = fetch("/api/translate/lesson", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId,
                        title: originalTitle,
                        content: originalContent,
                        targetLanguage: language,
                        sourceLanguage: "en",
                    }),
                    signal: abortController.signal,
                });

                // Store for deduplication
                inFlightLessonRequests.set(cacheKey, fetchPromise.then(r => r.json()));

                const response = await fetchPromise;

                // Clean up
                inFlightLessonRequests.delete(cacheKey);

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                // Check if still current
                if (requestIdRef.current !== currentRequestId || abortController.signal.aborted) {
                    console.log(`🚫 Ignoring stale lesson translation response for ${lessonId}`);
                    return;
                }

                const data = await response.json();
                const { translation } = data;

                const result = {
                    title: translation.title,
                    content: translation.content,
                    loading: false,
                    error: null,
                };

                // Cache result
                lessonTranslationCache.set(cacheKey, result);

                setState(result);
            } catch (error) {
                // Clean up
                inFlightLessonRequests.delete(cacheKey);

                // Ignore abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log(`🚫 Lesson translation aborted for ${lessonId}`);
                    return;
                }

                console.error("Translation error:", error);
                setState({
                    title: originalTitle,
                    content: originalContent,
                    loading: false,
                    error: error instanceof Error ? error.message : "Translation failed",
                });
            }
        };

        fetchTranslation();

        return () => {
            abortController.abort();
        };
    }, [lessonId, originalTitle, originalContent, language]);

    return state;
}
