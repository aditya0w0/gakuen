/**
 * Dynamic AI Model Pricing
 * Fetches real-time pricing from OpenRouter API
 * Falls back to cached values if API unavailable
 */

interface ModelPricing {
    id: string;
    pricing: {
        prompt: string;      // Cost per token (as string, e.g. "0.000001")
        completion: string;  // Cost per token
        image?: string;      // Cost per image if applicable
    };
}

// Cache for model pricing
const pricingCache: Map<string, { input: number; output: number; image?: number }> = new Map();
let lastFetchTime = 0;
const CACHE_TTL = 3600000; // 1 hour

// Fallback pricing (Gemini 3.0 models) - per token, not per million
const FALLBACK_PRICING: Record<string, { input: number; output: number; image?: number }> = {
    // Gemini 3.0 models (user's actual models)
    'gemini-3-flash-preview': { input: 0.00000015, output: 0.0000006 },     // ~$0.15/1M in, $0.60/1M out
    'gemini-3-pro-preview': { input: 0.000002, output: 0.000012 },          // ~$2/1M in, $12/1M out

    // Image generation (per image, not per token)
    'imagen-3': { input: 0, output: 0, image: 0.04 },
    'imagen-3-fast': { input: 0, output: 0, image: 0.02 },

    // OpenRouter model names (common alternatives)
    'google/gemini-flash-1.5': { input: 0.000000075, output: 0.0000003 },
    'google/gemini-pro-1.5': { input: 0.00000125, output: 0.000005 },
};

/**
 * Fetch pricing from OpenRouter API
 * OpenRouter provides aggregated pricing for many models
 */
async function fetchOpenRouterPricing(): Promise<void> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data as ModelPricing[];

        // Clear and rebuild cache
        pricingCache.clear();

        for (const model of models) {
            if (model.pricing) {
                pricingCache.set(model.id, {
                    input: parseFloat(model.pricing.prompt) || 0,
                    output: parseFloat(model.pricing.completion) || 0,
                    image: model.pricing.image ? parseFloat(model.pricing.image) : undefined,
                });
            }
        }

        lastFetchTime = Date.now();
        console.log(`✅ Fetched pricing for ${pricingCache.size} models from OpenRouter`);
    } catch (error) {
        console.error('Failed to fetch OpenRouter pricing, using fallback:', error);
        // Use fallback pricing
        for (const [id, pricing] of Object.entries(FALLBACK_PRICING)) {
            pricingCache.set(id, pricing);
        }
    }
}

/**
 * Get pricing for a model
 * Fetches from API if cache expired
 */
export async function getModelPricing(modelId: string): Promise<{ input: number; output: number; image?: number }> {
    // Fetch if cache expired
    if (Date.now() - lastFetchTime > CACHE_TTL) {
        await fetchOpenRouterPricing();
    }

    // Try exact match
    let pricing = pricingCache.get(modelId);
    if (pricing) return pricing;

    // Try with google/ prefix
    pricing = pricingCache.get(`google/${modelId}`);
    if (pricing) return pricing;

    // Try partial match (e.g., "gemini-3-flash" matches "gemini-3-flash-preview")
    for (const [id, p] of pricingCache.entries()) {
        if (id.includes(modelId) || modelId.includes(id)) {
            return p;
        }
    }

    // Fall back to default
    return FALLBACK_PRICING[modelId] || FALLBACK_PRICING['gemini-3-flash-preview'];
}

/**
 * Calculate cost for an AI API call
 * Prices are per token
 */
export async function calculateDynamicCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): Promise<number> {
    const pricing = await getModelPricing(model);

    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;

    return Math.round((inputCost + outputCost) * 1000000) / 1000000;
}

/**
 * Calculate cost for image generation
 */
export async function calculateDynamicImageCost(model: string = 'imagen-3'): Promise<number> {
    const pricing = await getModelPricing(model);
    return pricing.image || 0.04; // Default $0.04/image
}

/**
 * Get all cached pricing (for admin dashboard)
 */
export function getAllPricing(): Record<string, { input: number; output: number; image?: number }> {
    return Object.fromEntries(pricingCache);
}
