import { NextRequest, NextResponse } from "next/server";
import { translateLesson } from "@/lib/ai/translation";
import { requireAuth, safeErrorResponse } from "@/lib/api/auth-guard";
import type { Language } from "@/lib/i18n/translations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/translate/lesson
 * Translate lesson title and content
 */
export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Require authentication (uses AI credits)
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    try {
        const body = await request.json();
        const { lessonId, title, content = "", targetLanguage, sourceLanguage = "en" } = body;

        // Validate required fields (content can be empty for CMS-based lessons)
        if (!lessonId || !title || !targetLanguage) {
            return NextResponse.json(
                { error: "Missing required fields: lessonId, title, targetLanguage" },
                { status: 400 }
            );
        }

        // Validate language
        const validLanguages: Language[] = ["en", "ja", "ko", "id"];
        if (!validLanguages.includes(targetLanguage)) {
            return NextResponse.json(
                { error: `Invalid target language. Must be one of: ${validLanguages.join(", ")}` },
                { status: 400 }
            );
        }

        // Translate
        const translation = await translateLesson(
            lessonId,
            title,
            content,
            targetLanguage,
            sourceLanguage
        );

        return NextResponse.json({
            success: true,
            translation,
        });
    } catch (error) {
        console.error("Lesson translation API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Translation failed" },
            { status: 500 }
        );
    }
}
