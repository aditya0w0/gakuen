import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Available models with their use cases
const MODELS = {
    'pro': process.env.GEMINI_PRO_MODEL || 'gemini-3-pro-preview',
    'flash': process.env.GEMINI_FLASH_MODEL || 'gemini-3-flash-preview',
    'lite': 'gemini-2.5-flash-lite',
} as const;

type ModelType = keyof typeof MODELS;

async function generateWithModel(prompt: string, modelType: ModelType = 'flash'): Promise<string> {
    const modelName = MODELS[modelType] || MODELS.flash;
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`🔄 Using model: ${modelName}`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

export async function POST(request: Request) {
    try {
        if (!API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
        }

        const { text, style, model: requestedModel } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (text.length > 5000) {
            return NextResponse.json({ error: 'Text too long (max 5000 characters)' }, { status: 400 });
        }

        // Determine which model to use
        const modelType: ModelType = ['pro', 'flash', 'lite'].includes(requestedModel)
            ? requestedModel as ModelType
            : 'flash';

        // Check if this is a persona prompt (contains CRITICAL: Keep)
        const isPersonaPrompt = style && style.includes('CRITICAL: Keep the SAME LANGUAGE');

        let prompt: string;

        if (isPersonaPrompt) {
            // PERSONA MODE: Keep the persona's style instruction as the main prompt
            prompt = `${style}

---
TEXT TO REWRITE:
${text}
---

REWRITTEN TEXT (same language as input, casual tone):`;
        } else if (style && typeof style === 'string' && style.trim()) {
            // CUSTOM INSTRUCTION MODE: User has full control - can translate, restyle, anything
            prompt = `You are a helpful text assistant. Follow the user's instruction exactly.

USER INSTRUCTION: "${style}"

---
TEXT TO PROCESS:
${text}
---

OUTPUT (follow the instruction above, return ONLY the result text, no explanations):`;
        } else {
            // DEFAULT MODE: Simple paraphrase preserving language
            prompt = `Rewrite this text naturally while keeping the same language and meaning.
Return ONLY the rewritten text, no explanations.

TEXT:
${text}

REWRITTEN:`;
        }

        console.log(`🔄 Paraphrasing with model: ${modelType}, style: ${style || 'default'}`);

        const rewrittenText = await generateWithModel(prompt, modelType);

        console.log(`✅ Paraphrase complete using ${MODELS[modelType]}`);

        return NextResponse.json({
            result: rewrittenText.trim(),
            model: MODELS[modelType]
        });
    } catch (error) {
        console.error('Paraphrase API error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to paraphrase: ${message}` },
            { status: 500 }
        );
    }
}

