import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// ========================================
// GLOBAL RATE LIMITING FOR ALL GEMINI CALLS
// ========================================
let geminiRequestCount = 0;
let lastGeminiResetTime = Date.now();
const GEMINI_MAX_REQUESTS_PER_MINUTE = 60; // Overall limit across all functions

function checkGeminiRateLimit(functionName: string): boolean {
    const now = Date.now();
    if (now - lastGeminiResetTime > 60000) {
        geminiRequestCount = 0;
        lastGeminiResetTime = now;
    }
    if (geminiRequestCount >= GEMINI_MAX_REQUESTS_PER_MINUTE) {
        console.warn(`⚠️ Gemini rate limit reached in ${functionName}`);
        return false;
    }
    geminiRequestCount++;
    console.log(`📊 Gemini requests this minute: ${geminiRequestCount}/${GEMINI_MAX_REQUESTS_PER_MINUTE} (${functionName})`);
    return true;
}

// Request deduplication cache
const inFlightRequests = new Map<string, Promise<string>>();

/**
 * Wrap a function with deduplication
 */
async function deduplicatedCall<T>(
    cacheKey: string,
    fn: () => Promise<T>
): Promise<T> {
    const existing = inFlightRequests.get(cacheKey);
    if (existing) {
        console.log(`🔄 Deduplicating Gemini call: ${cacheKey.substring(0, 50)}`);
        return existing as Promise<T>;
    }

    const promise = fn();
    inFlightRequests.set(cacheKey, promise as Promise<string>);

    try {
        const result = await promise;
        return result;
    } finally {
        // Clean up after a short delay
        setTimeout(() => {
            inFlightRequests.delete(cacheKey);
        }, 1000);
    }
}

// Fix typos - lightweight, fast (Flash)
export async function fixTypos(text: string): Promise<string> {
    if (!checkGeminiRateLimit('fixTypos')) {
        return text; // Return original on rate limit
    }

    const cacheKey = `fixTypos_${text.substring(0, 100)}`;

    return deduplicatedCall(cacheKey, async () => {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `Fix any typos and grammatical errors in the following text. Return ONLY the corrected text, no explanations:\n\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    });
}

// Paraphrase - high quality, human-like (Pro)
export async function paraphraseText(text: string): Promise<string> {
    if (!checkGeminiRateLimit('paraphraseText')) {
        return text;
    }

    const cacheKey = `paraphrase_${text.substring(0, 100)}`;

    return deduplicatedCall(cacheKey, async () => {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

        const prompt = `Paraphrase the following text to make it sound more natural and engaging. Maintain the same meaning but improve the flow. Return ONLY the paraphrased text:\n\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    });
}

// General text improvement - high quality (Pro)
export async function improveText(text: string): Promise<string> {
    if (!checkGeminiRateLimit('improveText')) {
        return text;
    }

    const cacheKey = `improve_${text.substring(0, 100)}`;

    return deduplicatedCall(cacheKey, async () => {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

        const prompt = `Improve the following text by making it clearer, more concise, and more engaging. Fix any issues and enhance readability. Return ONLY the improved text:\n\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    });
}

// Image generation - expensive, needs strict limits
const imageGenerationCache = new Map<string, { url: string; timestamp: number }>();
const IMAGE_CACHE_TTL = 1000 * 60 * 60; // 1 hour cache for generated images

export async function generateImage(prompt: string): Promise<string> {
    // Check cache first for identical prompts
    const cachedImage = imageGenerationCache.get(prompt);
    if (cachedImage && Date.now() - cachedImage.timestamp < IMAGE_CACHE_TTL) {
        console.log('✅ Using cached generated image');
        return cachedImage.url;
    }

    if (!checkGeminiRateLimit('generateImage')) {
        throw new Error('Rate limit reached for image generation. Please try again in a minute.');
    }

    const cacheKey = `image_${prompt.substring(0, 100)}`;

    return deduplicatedCall(cacheKey, async () => {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

        console.log('🎨 Generating image with prompt:', prompt);

        const result = await model.generateContent(prompt);

        console.log('📦 Full result:', JSON.stringify(result, null, 2));

        const response = await result.response;
        console.log('📝 Response object:', JSON.stringify(response, null, 2));

        // Check for inline data (base64 image)
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.inlineData) {
            const img = candidate.content.parts[0].inlineData;
            const dataUrl = `data:${img.mimeType};base64,${img.data}`;
            console.log('✅ Found inline image data');

            // Cache the result
            imageGenerationCache.set(prompt, { url: dataUrl, timestamp: Date.now() });

            return dataUrl;
        }

        // Try text response
        const text = response.text();
        console.log('📄 Text response:', text);
        if (text && text.trim()) {
            return text.trim();
        }

        throw new Error('No image data found in response');
    });
}

// Recommendation engine with caching
const recommendationCache = new Map<string, { result: string; timestamp: number }>();
const RECOMMENDATION_CACHE_TTL = 1000 * 60 * 10; // 10 minute cache

export async function recommendCourses(userQuery: string, coursesJson: string): Promise<string> {
    const cacheKey = `recommend_${userQuery.substring(0, 50)}_${coursesJson.length}`;

    // Check cache
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < RECOMMENDATION_CACHE_TTL) {
        console.log('✅ Using cached recommendation');
        return cached.result;
    }

    if (!checkGeminiRateLimit('recommendCourses')) {
        // Return a fallback recommendation
        return JSON.stringify({
            courseId: "cs-101",
            reason: "Rate limit reached. Recommending our popular introductory course!"
        });
    }

    return deduplicatedCall(cacheKey, async () => {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `
    You are an expert educational advisor.
    
    Task: unique and specific recommendation based on the user's interest.
    
    User Query: "${userQuery}"
    
    Available Courses:
    ${coursesJson}
    
    Instructions:
    1. Analyze the user's intent.
    2. Pick the SINGLE best matching course from the list.
    3. If no course perfectly matches, pick the closest one or a fundamental one (like CS 101).
    4. Provide a short, encouraging reason why this fits them.
    
    Return JSON ONLY:
    {
        "courseId": "id-of-course",
        "reason": "One sentence explanation..."
    }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Cleanup markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Cache the result
        recommendationCache.set(cacheKey, { result: text, timestamp: Date.now() });

        return text;
    });
}
