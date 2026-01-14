import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Language } from "@/lib/i18n/translations";

/**
 * Gemini Flash API Client
 * Uses Gemini 2.0 Flash for fast, cheap translations
 * 
 * IMPORTANT: This module includes request deduplication to prevent
 * race conditions and duplicate API calls that can cause massive bills.
 */

const API_KEY = process.env.GEMINI_API_KEY;

// Validate API key at module load
if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in environment!");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

// Use Flash 2.5 Lite - cheapest Gemini model
const MODEL_NAME = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash-lite";

// ========================================
// REQUEST DEDUPLICATION & RATE LIMITING
// ========================================

// In-flight request cache to prevent duplicate API calls
const inFlightRequests = new Map<string, Promise<string[]>>();

// Request counter for rate limiting (reset every minute)
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 30; // Conservative limit

function checkRateLimit(): boolean {
    const now = Date.now();
    if (now - lastResetTime > 60000) {
        requestCount = 0;
        lastResetTime = now;
    }
    return requestCount < MAX_REQUESTS_PER_MINUTE;
}

function incrementRequestCount(): void {
    requestCount++;
    console.log(`📊 Gemini requests this minute: ${requestCount}/${MAX_REQUESTS_PER_MINUTE}`);
}

// ========================================

interface TranslationRequest {
    text: string;
    targetLanguage: Language;
    sourceLanguage?: Language;
    context?: string; // Optional context for better translations
}

interface TranslationResponse {
    translatedText: string;
    sourceLanguage: Language;
    targetLanguage: Language;
    model: string;
}

/**
 * Translate text using Gemini Flash
 */
export async function translateWithGemini(
    request: TranslationRequest
): Promise<TranslationResponse> {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured. Add it to your .env file.");
    }

    // Rate limit check
    if (!checkRateLimit()) {
        console.warn("⚠️ Rate limit reached, returning original text");
        return {
            translatedText: request.text,
            sourceLanguage: request.sourceLanguage || "en",
            targetLanguage: request.targetLanguage,
            model: MODEL_NAME,
        };
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = buildTranslationPrompt(request);

    try {
        console.log(`🔄 Translating to ${request.targetLanguage} using ${MODEL_NAME}...`);
        incrementRequestCount();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text().trim();

        return {
            translatedText,
            sourceLanguage: request.sourceLanguage || "en",
            targetLanguage: request.targetLanguage,
            model: MODEL_NAME,
        };
    } catch (error) {
        console.error("Gemini translation error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Translation failed (${MODEL_NAME}): ${errorMessage}`);
    }
}

/**
 * Batch translate multiple texts with REQUEST DEDUPLICATION
 * 
 * CRITICAL: This function now:
 * 1. Deduplicates identical in-flight requests
 * 2. Has rate limiting
 * 3. NO LONGER falls back to individual API calls (which caused huge bills)
 */
export async function batchTranslate(
    texts: string[],
    targetLanguage: Language,
    sourceLanguage: Language = "en",
    context?: string
): Promise<string[]> {
    // Generate cache key for deduplication
    const cacheKey = `batch_${targetLanguage}_${texts.join('|||').substring(0, 200)}`;

    // Check if this exact request is already in flight
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
        console.log(`🔄 Deduplicating: Reusing in-flight request for ${targetLanguage}`);
        return existingRequest;
    }

    // Rate limit check
    if (!checkRateLimit()) {
        console.warn("⚠️ Rate limit reached, returning original texts");
        return texts;
    }

    // Create the request promise
    const requestPromise = executeBatchTranslate(texts, targetLanguage, sourceLanguage, context);

    // Store in cache
    inFlightRequests.set(cacheKey, requestPromise);

    try {
        const result = await requestPromise;
        return result;
    } finally {
        // Clean up cache after completion (with delay to handle rapid re-calls)
        setTimeout(() => {
            inFlightRequests.delete(cacheKey);
        }, 1000);
    }
}

/**
 * Internal batch translation execution
 * IMPORTANT: Does NOT fallback to individual calls anymore
 */
async function executeBatchTranslate(
    texts: string[],
    targetLanguage: Language,
    sourceLanguage: Language,
    context?: string
): Promise<string[]> {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = buildBatchTranslationPrompt({
        texts,
        targetLanguage,
        sourceLanguage,
        context,
    });

    try {
        console.log(`🔄 Batch translating ${texts.length} texts to ${targetLanguage}...`);
        incrementRequestCount();

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text().trim();

        // Parse translations - handle both newline and numbered formats
        let translatedTexts = responseText.split("\n")
            .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove "1. " prefixes
            .filter(line => line.length > 0);

        // If count mismatch, try to salvage what we have
        if (translatedTexts.length !== texts.length) {
            console.warn(`⚠️ Batch translation count mismatch: got ${translatedTexts.length}, expected ${texts.length}`);

            // If we got fewer, pad with originals
            if (translatedTexts.length < texts.length) {
                console.warn("⚠️ Padding with original texts");
                while (translatedTexts.length < texts.length) {
                    translatedTexts.push(texts[translatedTexts.length]);
                }
            } else {
                // If we got more, truncate
                translatedTexts = translatedTexts.slice(0, texts.length);
            }
        }

        return translatedTexts;
    } catch (error) {
        console.error("❌ Batch translation error:", error);
        // CRITICAL FIX: Return originals instead of making N individual API calls!
        console.warn("⚠️ Returning original texts due to error (NOT falling back to individual calls)");
        return texts;
    }
}

/**
 * Build translation prompt
 */
function buildTranslationPrompt(request: TranslationRequest): string {
    const languageNames: Record<Language, string> = {
        en: "English",
        ja: "Japanese",
        ko: "Korean",
        id: "Indonesian",
    };

    const targetLang = languageNames[request.targetLanguage];
    const sourceLang = request.sourceLanguage ? languageNames[request.sourceLanguage] : "English";

    let prompt = `You are a professional translator specializing in educational content.\n\n`;

    if (request.context) {
        prompt += `Context: ${request.context}\n\n`;
    }

    prompt += `Translate the following text from ${sourceLang} to ${targetLang}.\n`;
    prompt += `Preserve formatting, technical terms, and code snippets.\n`;
    prompt += `Provide ONLY the translation, no explanations.\n\n`;
    prompt += `Text to translate:\n${request.text}\n\n`;
    prompt += `Translation:`;

    return prompt;
}

/**
 * Build batch translation prompt
 */
function buildBatchTranslationPrompt({
    texts,
    targetLanguage,
    sourceLanguage,
    context,
}: {
    texts: string[];
    targetLanguage: Language;
    sourceLanguage: Language;
    context?: string;
}): string {
    const languageNames: Record<Language, string> = {
        en: "English",
        ja: "Japanese",
        ko: "Korean",
        id: "Indonesian",
    };

    const targetLang = languageNames[targetLanguage];
    const sourceLang = languageNames[sourceLanguage];

    let prompt = `You are a professional translator specializing in educational content.\n\n`;

    if (context) {
        prompt += `Context: ${context}\n\n`;
    }

    prompt += `Translate the following ${texts.length} texts from ${sourceLang} to ${targetLang}.\n`;
    prompt += `Preserve formatting, technical terms, and code snippets.\n`;
    prompt += `Provide ONLY the translations, one per line, no explanations or numbering.\n\n`;
    prompt += `Texts to translate:\n`;
    texts.forEach((text, i) => {
        prompt += `${i + 1}. ${text}\n`;
    });
    prompt += `\nTranslations (one per line):`;

    return prompt;
}

/**
 * Get language name in English
 */
export function getLanguageName(lang: Language): string {
    const names: Record<Language, string> = {
        en: "English",
        ja: "Japanese",
        ko: "Korean",
        id: "Indonesian",
    };
    return names[lang];
}
