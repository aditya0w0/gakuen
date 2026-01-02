import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Language } from "@/lib/i18n/translations";

/**
 * Gemini Flash API Client
 * Uses Gemini 2.0 Flash for fast, cheap translations
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Use Flash 2.5 Lite - cheapest Gemini model
const MODEL_NAME = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash-lite";

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
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = buildTranslationPrompt(request);

    try {
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
        throw new Error(`Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslate(
    texts: string[],
    targetLanguage: Language,
    sourceLanguage: Language = "en",
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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedTexts = response.text().trim().split("\n");

        // Ensure we have the same number of translations
        if (translatedTexts.length !== texts.length) {
            console.warn("Batch translation count mismatch. Falling back to individual translations.");
            // Fallback to individual translations
            return Promise.all(
                texts.map((text) =>
                    translateWithGemini({ text, targetLanguage, sourceLanguage, context })
                        .then((r) => r.translatedText)
                )
            );
        }

        return translatedTexts;
    } catch (error) {
        console.error("Batch translation error:", error);
        // Fallback to individual translations
        return Promise.all(
            texts.map((text) =>
                translateWithGemini({ text, targetLanguage, sourceLanguage, context })
                    .then((r) => r.translatedText)
            )
        );
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
