import { NextRequest, NextResponse } from "next/server";
import { batchTranslate } from "@/lib/ai/gemini-flash";
import { initAdmin } from "@/lib/auth/firebase-admin";
import { trackAPICall } from "@/lib/analytics/firestore-analytics";
import { requireAuth, safeErrorResponse } from "@/lib/api/auth-guard";
import type { Language } from "@/lib/i18n/translations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_DAYS = 7;

/**
 * POST /api/translate/batch
 * Batch translate multiple texts for a lesson with SHARED CACHING
 * Cache is shared across all users - first user pays, rest get free
 */
export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Require authentication (uses AI credits)
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    try {
        const body = await request.json();
        const { lessonId, texts, targetLanguage, sourceLanguage = "en" } = body;

        // Validate required fields
        if (!lessonId || !texts || !Array.isArray(texts) || !targetLanguage) {
            return NextResponse.json(
                { error: "Missing required fields: lessonId, texts (array), targetLanguage" },
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

        // If same language, return originals
        if (targetLanguage === sourceLanguage) {
            return NextResponse.json({
                success: true,
                translations: texts,
                cached: false,
            });
        }

        // Check SHARED cache first (Firestore)
        const cacheKey = `batch_${lessonId}_${targetLanguage}`;
        const cached = await getFromCache(cacheKey);

        if (cached && !isStale(cached.timestamp)) {
            console.log(`✅ Cache HIT for lesson ${lessonId} (${targetLanguage})`);
            return NextResponse.json({
                success: true,
                translations: cached.translations,
                cached: true,
            });
        }

        console.log(`🔄 Cache MISS for lesson ${lessonId} (${targetLanguage}) - calling Gemini`);

        // Filter out empty texts
        const textsToTranslate = texts.filter((t: string) => t && t.trim());

        if (textsToTranslate.length === 0) {
            return NextResponse.json({
                success: true,
                translations: texts,
                cached: false,
            });
        }

        // Batch translate with Gemini
        const translations = await batchTranslate(
            textsToTranslate,
            targetLanguage,
            sourceLanguage,
            "Educational lesson content"
        );

        // Map back to original indices (preserve empty positions)
        let translationIdx = 0;
        const result = texts.map((t: string) => {
            if (!t || !t.trim()) return t;
            return translations[translationIdx++] || t;
        });

        // Save to SHARED cache for all future users
        await saveToCache(cacheKey, result);

        // Track API usage for analytics
        await trackAPICall({
            endpoint: "/api/translate/batch",
            method: "POST",
            duration: 0, // We could time this
            statusCode: 200,
            model: "gemini-2.5-flash-lite",
            cost: textsToTranslate.length * 0.00001, // Estimate
        });

        return NextResponse.json({
            success: true,
            translations: result,
            cached: false,
        });
    } catch (error) {
        console.error("Batch translation API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Translation failed" },
            { status: 500 }
        );
    }
}

/**
 * Get translation from shared Firestore cache
 */
async function getFromCache(cacheKey: string): Promise<{ translations: string[]; timestamp: Date } | null> {
    try {
        const admin = initAdmin();
        if (!admin) return null;

        const db = admin.firestore();
        const doc = await db.collection("translationCache").doc(cacheKey).get();

        if (!doc.exists) return null;

        const data = doc.data();
        return {
            translations: data?.translations || [],
            timestamp: data?.timestamp?.toDate() || new Date(0),
        };
    } catch (error) {
        console.error("Cache read error:", error);
        return null;
    }
}

/**
 * Save translation to shared Firestore cache
 */
async function saveToCache(cacheKey: string, translations: string[]): Promise<void> {
    try {
        const admin = initAdmin();
        if (!admin) return;

        const db = admin.firestore();
        const { FieldValue } = await import('firebase-admin/firestore');

        await db.collection("translationCache").doc(cacheKey).set({
            translations,
            timestamp: FieldValue.serverTimestamp(),
        });

        console.log(`💾 Cached translations for ${cacheKey}`);
    } catch (error) {
        console.error("Cache write error:", error);
    }
}

/**
 * Check if cache is stale
 */
function isStale(timestamp: Date): boolean {
    const now = new Date();
    const diffDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > CACHE_TTL_DAYS;
}
