import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n";

interface TranslatedCourse {
    title: string;
    description: string;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to get translated course content
 * Automatically fetches translation when language changes
 * 
 * IMPORTANT: Uses refs for stable content tracking to prevent infinite loops
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

    // Track previous values to detect actual content changes
    const prevCourseIdRef = useRef(courseId);
    const prevLanguageRef = useRef(language);
    const prevTitleRef = useRef(originalTitle);
    const prevDescriptionRef = useRef(originalDescription);
    
    // Track if we've already fetched for current content+language combination
    const fetchKeyRef = useRef<string>('');

    // Current content refs (always up-to-date)
    const titleRef = useRef(originalTitle);
    const descriptionRef = useRef(originalDescription);
    titleRef.current = originalTitle;
    descriptionRef.current = originalDescription;

    useEffect(() => {
        // Generate a key for current fetch to prevent duplicate requests
        const currentFetchKey = `${courseId}:${language}:${originalTitle.slice(0, 50)}:${originalDescription.slice(0, 50)}`;
        
        // Skip if we already fetched for this exact combination
        if (fetchKeyRef.current === currentFetchKey) {
            return;
        }

        // If English, use original content
        if (language === "en") {
            fetchKeyRef.current = currentFetchKey;
            setState({
                title: titleRef.current,
                description: descriptionRef.current,
                loading: false,
                error: null,
            });
            return;
        }

        // Check if any relevant value actually changed
        const courseChanged = prevCourseIdRef.current !== courseId;
        const languageChanged = prevLanguageRef.current !== language;
        const titleChanged = prevTitleRef.current !== originalTitle;
        const descriptionChanged = prevDescriptionRef.current !== originalDescription;

        // Update previous refs
        prevCourseIdRef.current = courseId;
        prevLanguageRef.current = language;
        prevTitleRef.current = originalTitle;
        prevDescriptionRef.current = originalDescription;

        // Only fetch if something meaningful changed
        if (!courseChanged && !languageChanged && !titleChanged && !descriptionChanged) {
            return;
        }

        // Mark this fetch key to prevent duplicate requests
        fetchKeyRef.current = currentFetchKey;

        // Abort controller for cleanup
        const abortController = new AbortController();

        const fetchTranslation = async () => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const response = await fetch("/api/translate/course", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId,
                        title: titleRef.current,
                        description: descriptionRef.current,
                        targetLanguage: language,
                        sourceLanguage: "en",
                    }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                const data = await response.json();
                const { translation } = data;

                if (!abortController.signal.aborted) {
                    setState({
                        title: translation.title,
                        description: translation.description,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error) {
                // Ignore abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                console.error("Translation error:", error);
                // Clear fetch key to allow retry on next render
                fetchKeyRef.current = '';
                if (!abortController.signal.aborted) {
                    setState({
                        title: titleRef.current,
                        description: descriptionRef.current,
                        loading: false,
                        error: error instanceof Error ? error.message : "Translation failed",
                    });
                }
            }
        };

        fetchTranslation();

        // Cleanup: abort pending requests on unmount or when effect re-runs
        return () => {
            abortController.abort();
        };
    }, [courseId, language, originalTitle, originalDescription]);

    return state;
}

/**
 * Hook to get translated lesson content
 * 
 * IMPORTANT: Uses refs for stable content tracking to prevent infinite loops
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

    // Track previous values to detect actual content changes
    const prevLessonIdRef = useRef(lessonId);
    const prevLanguageRef = useRef(language);
    const prevTitleRef = useRef(originalTitle);
    const prevContentRef = useRef(originalContent);
    
    // Track if we've already fetched for current content+language combination
    const fetchKeyRef = useRef<string>('');

    // Current content refs (always up-to-date)
    const titleRef = useRef(originalTitle);
    const contentRef = useRef(originalContent);
    titleRef.current = originalTitle;
    contentRef.current = originalContent;

    useEffect(() => {
        // Generate a key for current fetch to prevent duplicate requests
        const currentFetchKey = `${lessonId}:${language}:${originalTitle.slice(0, 50)}:${originalContent.slice(0, 100)}`;
        
        // Skip if we already fetched for this exact combination
        if (fetchKeyRef.current === currentFetchKey) {
            return;
        }

        // If English, use original content
        if (language === "en") {
            fetchKeyRef.current = currentFetchKey;
            setState({
                title: titleRef.current,
                content: contentRef.current,
                loading: false,
                error: null,
            });
            return;
        }

        // Check if any relevant value actually changed
        const lessonChanged = prevLessonIdRef.current !== lessonId;
        const languageChanged = prevLanguageRef.current !== language;
        const titleChanged = prevTitleRef.current !== originalTitle;
        const contentChanged = prevContentRef.current !== originalContent;

        // Update previous refs
        prevLessonIdRef.current = lessonId;
        prevLanguageRef.current = language;
        prevTitleRef.current = originalTitle;
        prevContentRef.current = originalContent;

        // Only fetch if something meaningful changed
        if (!lessonChanged && !languageChanged && !titleChanged && !contentChanged) {
            return;
        }

        // Mark this fetch key to prevent duplicate requests
        fetchKeyRef.current = currentFetchKey;

        // Abort controller for cleanup
        const abortController = new AbortController();

        const fetchTranslation = async () => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const response = await fetch("/api/translate/lesson", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId,
                        title: titleRef.current,
                        content: contentRef.current,
                        targetLanguage: language,
                        sourceLanguage: "en",
                    }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                const data = await response.json();
                const { translation } = data;

                if (!abortController.signal.aborted) {
                    setState({
                        title: translation.title,
                        content: translation.content,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error) {
                // Ignore abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                console.error("Translation error:", error);
                // Clear fetch key to allow retry on next render
                fetchKeyRef.current = '';
                if (!abortController.signal.aborted) {
                    setState({
                        title: titleRef.current,
                        content: contentRef.current,
                        loading: false,
                        error: error instanceof Error ? error.message : "Translation failed",
                    });
                }
            }
        };

        fetchTranslation();

        // Cleanup: abort pending requests on unmount or when effect re-runs
        return () => {
            abortController.abort();
        };
    }, [lessonId, language, originalTitle, originalContent]);

    return state;
}
