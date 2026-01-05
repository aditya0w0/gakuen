import { useState, useEffect } from "react";
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

        // Fetch translation
        const fetchTranslation = async () => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const response = await fetch("/api/translate/course", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId,
                        title: originalTitle,
                        description: originalDescription,
                        targetLanguage: language,
                        sourceLanguage: "en",
                    }),
                });

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                const data = await response.json();
                const { translation } = data;

                setState({
                    title: translation.title,
                    description: translation.description,
                    loading: false,
                    error: null,
                });
            } catch (error) {
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
    }, [courseId, originalTitle, originalDescription, language]);

    return state;
}

/**
 * Hook to get translated lesson content
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

        // Fetch translation
        const fetchTranslation = async () => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const response = await fetch("/api/translate/lesson", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId,
                        title: originalTitle,
                        content: originalContent,
                        targetLanguage: language,
                        sourceLanguage: "en",
                    }),
                });

                if (!response.ok) {
                    throw new Error("Translation failed");
                }

                const data = await response.json();
                const { translation } = data;

                setState({
                    title: translation.title,
                    content: translation.content,
                    loading: false,
                    error: null,
                });
            } catch (error) {
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
    }, [lessonId, originalTitle, originalContent, language]);

    return state;
}
