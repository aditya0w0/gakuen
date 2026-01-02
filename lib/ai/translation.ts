import { translateWithGemini, batchTranslate } from "./gemini-flash";
import type { Language } from "@/lib/i18n/translations";
import { initAdmin } from "@/lib/auth/firebase-admin";

/**
 * Translation Service
 * Handles course and lesson content translation with caching
 */

export interface CourseTranslation {
    courseId: string;
    language: Language;
    title: string;
    description: string;
    cached: boolean;
    lastUpdated: Date;
}

export interface LessonTranslation {
    lessonId: string;
    language: Language;
    title: string;
    content: string;
    cached: boolean;
    lastUpdated: Date;
}

const CACHE_TTL_DAYS = 7; // Cache for 7 days

/**
 * Translate course metadata (title, description)
 */
export async function translateCourse(
    courseId: string,
    title: string,
    description: string,
    targetLanguage: Language,
    sourceLanguage: Language = "en"
): Promise<CourseTranslation> {
    // If target is same as source, return as-is
    if (targetLanguage === sourceLanguage) {
        return {
            courseId,
            language: targetLanguage,
            title,
            description,
            cached: false,
            lastUpdated: new Date(),
        };
    }

    // Check cache first
    const cached = await getCachedCourseTranslation(courseId, targetLanguage);
    if (cached && !isTranslationStale(cached.lastUpdated)) {
        return cached;
    }

    // Translate with Gemini Flash
    const [translatedTitle, translatedDescription] = await batchTranslate(
        [title, description],
        targetLanguage,
        sourceLanguage,
        "Educational course"
    );

    const translation: CourseTranslation = {
        courseId,
        language: targetLanguage,
        title: translatedTitle,
        description: translatedDescription,
        cached: true,
        lastUpdated: new Date(),
    };

    // Store in cache
    await cacheCourseTranslation(translation);

    return translation;
}

/**
 * Translate lesson content
 */
export async function translateLesson(
    lessonId: string,
    title: string,
    content: string,
    targetLanguage: Language,
    sourceLanguage: Language = "en"
): Promise<LessonTranslation> {
    // If target is same as source, return as-is
    if (targetLanguage === sourceLanguage) {
        return {
            lessonId,
            language: targetLanguage,
            title,
            content,
            cached: false,
            lastUpdated: new Date(),
        };
    }

    // Check cache first
    const cached = await getCachedLessonTranslation(lessonId, targetLanguage);
    if (cached && !isTranslationStale(cached.lastUpdated)) {
        return cached;
    }

    // Translate with Gemini Flash
    const [translatedTitle, translatedContent] = await batchTranslate(
        [title, content],
        targetLanguage,
        sourceLanguage,
        "Educational lesson content"
    );

    const translation: LessonTranslation = {
        lessonId,
        language: targetLanguage,
        title: translatedTitle,
        content: translatedContent,
        cached: true,
        lastUpdated: new Date(),
    };

    // Store in cache
    await cacheLessonTranslation(translation);

    return translation;
}

/**
 * Get cached course translation from Firestore
 */
async function getCachedCourseTranslation(
    courseId: string,
    language: Language
): Promise<CourseTranslation | null> {
    try {
        const admin = await initAdmin();
        if (!admin) return null;

        const docId = `${courseId}_${language}`;
        const db = admin.firestore();
        const doc = await db
            .collection("courseTranslations")
            .doc(docId)
            .get();

        if (!doc.exists) return null;

        const data = doc.data();
        return {
            courseId: data?.courseId,
            language: data?.language,
            title: data?.title,
            description: data?.description,
            cached: true,
            lastUpdated: data?.lastUpdated?.toDate() || new Date(),
        };
    } catch (error) {
        console.error("Error getting cached course translation:", error);
        return null;
    }
}

/**
 * Get cached lesson translation from Firestore
 */
async function getCachedLessonTranslation(
    lessonId: string,
    language: Language
): Promise<LessonTranslation | null> {
    try {
        const admin = await initAdmin();
        if (!admin) return null;

        const docId = `${lessonId}_${language}`;
        const db = admin.firestore();
        const doc = await db
            .collection("lessonTranslations")
            .doc(docId)
            .get();

        if (!doc.exists) return null;

        const data = doc.data();
        return {
            lessonId: data?.lessonId,
            language: data?.language,
            title: data?.title,
            content: data?.content,
            cached: true,
            lastUpdated: data?.lastUpdated?.toDate() || new Date(),
        };
    } catch (error) {
        console.error("Error getting cached lesson translation:", error);
        return null;
    }
}

/**
 * Cache course translation in Firestore
 */
async function cacheCourseTranslation(translation: CourseTranslation): Promise<void> {
    try {
        const admin = await initAdmin();
        if (!admin) return;

        const docId = `${translation.courseId}_${translation.language}`;
        const db = admin.firestore();
        const { FieldValue } = await import('firebase-admin/firestore');
        await db
            .collection("courseTranslations")
            .doc(docId)
            .set({
                courseId: translation.courseId,
                language: translation.language,
                title: translation.title,
                description: translation.description,
                lastUpdated: FieldValue.serverTimestamp(),
            });
    } catch (error) {
        console.error("Error caching course translation:", error);
    }
}

/**
 * Cache lesson translation in Firestore
 */
async function cacheLessonTranslation(translation: LessonTranslation): Promise<void> {
    try {
        const admin = await initAdmin();
        if (!admin) return;

        const docId = `${translation.lessonId}_${translation.language}`;
        const db = admin.firestore();
        const { FieldValue } = await import('firebase-admin/firestore');
        await db
            .collection("lessonTranslations")
            .doc(docId)
            .set({
                lessonId: translation.lessonId,
                language: translation.language,
                title: translation.title,
                content: translation.content,
                lastUpdated: FieldValue.serverTimestamp(),
            });
    } catch (error) {
        console.error("Error caching lesson translation:", error);
    }
}

/**
 * Check if translation is stale (older than CACHE_TTL_DAYS)
 */
function isTranslationStale(lastUpdated: Date): boolean {
    const now = new Date();
    const diffDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > CACHE_TTL_DAYS;
}
