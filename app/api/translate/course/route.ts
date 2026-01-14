import { NextRequest, NextResponse } from "next/server";
import { translateCourse } from "@/lib/ai/translation";
import { requireAuth, safeErrorResponse } from "@/lib/api/auth-guard";
import { checkRateLimit, getClientIP } from "@/lib/api/rate-limit";
import type { Language } from "@/lib/i18n/translations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stricter rate limit for translation endpoints to prevent abuse
const TRANSLATION_RATE_LIMIT = { maxRequests: 20, windowMs: 60000 }; // 20 per minute

/**
 * POST /api/translate/course
 * Translate course title and description
 */
export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Rate limiting BEFORE auth to prevent DDoS
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`translate-course:${clientIP}`, TRANSLATION_RATE_LIMIT);
    if (!rateLimit.allowed) {
        console.warn(`⚠️ Rate limit exceeded for translate/course from IP: ${clientIP}`);
        return NextResponse.json(
            { error: 'Too many translation requests. Please wait before trying again.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
                    'X-RateLimit-Remaining': '0',
                }
            }
        );
    }

    // 🔒 SECURITY: Require authentication (uses AI credits)
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    try {
        const body = await request.json();
        const { courseId, title, description, targetLanguage, sourceLanguage = "en" } = body;

        // Validate required fields
        if (!courseId || !title || !description || !targetLanguage) {
            return NextResponse.json(
                { error: "Missing required fields: courseId, title, description, targetLanguage" },
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
        const translation = await translateCourse(
            courseId,
            title,
            description,
            targetLanguage,
            sourceLanguage
        );

        return NextResponse.json({
            success: true,
            translation,
        });
    } catch (error) {
        console.error("Course translation API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Translation failed" },
            { status: 500 }
        );
    }
}
