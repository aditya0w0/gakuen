import { NextRequest, NextResponse } from "next/server";
import { batchTranslate } from "@/lib/ai/gemini-flash";
import { initAdmin } from "@/lib/auth/firebase-admin";
import { trackAPICall } from "@/lib/analytics/firestore-analytics";
import { requireAuth, safeErrorResponse } from "@/lib/api/auth-guard";
import type { Language } from "@/lib/i18n/translations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_DAYS = 7;

// ========================================
// SERVER-SIDE REQUEST DEDUPLICATION
// Prevents concurrent duplicate translations
// ========================================
const inFlightServerRequests = new Map<string, Promise<NextResponse>>();

// Clean up stale entries every 5 minutes
setInterval(() => {
    inFlightServerRequests.clear();
    console.log("🧹 Cleared in-flight translation request cache");
}, 5 * 60 * 1000);

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

        // Validate languages
        const validLanguages: Language[] = ["en", "ja", "ko", "id"];
        if (!validLanguages.includes(targetLanguage)) {
            return NextResponse.json(
                { error: `Invalid target language. Must be one of: ${validLanguages.join(", ")}` },
                { status: 400 }
            );
        }

        // Cast to Language type after validation
        const typedTargetLanguage = targetLanguage as Language;
        const typedSourceLanguage = (validLanguages.includes(sourceLanguage) ? sourceLanguage : "en") as Language;

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

        console.log(`🔄 Cache MISS for lesson ${lessonId} (${targetLanguage}) - checking in-flight`);

        // SERVER-SIDE DEDUPLICATION: Check if this exact request is already being processed
        const requestKey = `${lessonId}_${targetLanguage}`;
        const existingRequest = inFlightServerRequests.get(requestKey);
        if (existingRequest) {
            console.log(`🔄 Server-side deduplication: Reusing in-flight request for ${requestKey}`);
            return existingRequest;
        }

        // Create the actual translation request as a promise
        const translationPromise = executeTranslation(lessonId, texts, typedTargetLanguage, typedSourceLanguage, cacheKey);

        // Store for deduplication
        inFlightServerRequests.set(requestKey, translationPromise);

        try {
            const result = await translationPromise;
            return result;
        } finally {
            // Clean up after a short delay to handle rapid re-requests
            setTimeout(() => {
                inFlightServerRequests.delete(requestKey);
            }, 2000);
        }
    } catch (error) {
        console.error("Batch translation API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Translation failed" },
            { status: 500 }
        );
    }
}

/**
 * Execute the actual translation (extracted for deduplication)
 */
async function executeTranslation(
    lessonId: string,
    texts: string[],
    targetLanguage: Language,
    sourceLanguage: Language,
    cacheKey: string
): Promise<NextResponse> {
    console.log(`🚀 Executing translation for lesson ${lessonId} (${targetLanguage})`);

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
