import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const PRIMARY_MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3-flash-preview';

async function generateWithFallback(prompt: string): Promise<string> {
    // Race both models concurrently - first successful response wins
    // This way user doesn't wait for primary to fail before trying fallback

    const primaryModel = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
    const fallbackModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });

    // Create promise for each model
    const tryModel = async (model: ReturnType<typeof genAI.getGenerativeModel>, name: string): Promise<{ result: string; model: string }> => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { result: response.text(), model: name };
    };

    // Race both models - first to succeed wins
    try {
        console.log(`🔄 Racing models: ${PRIMARY_MODEL} vs ${FALLBACK_MODEL}`);

        const result = await Promise.any([
            tryModel(primaryModel, PRIMARY_MODEL),
            tryModel(fallbackModel, FALLBACK_MODEL),
        ]);

        console.log(`✅ Winner: ${result.model}`);
        return result.result;
    } catch (aggregateError) {
        // All models failed - throw the first error
        if (aggregateError instanceof AggregateError && aggregateError.errors.length > 0) {
            throw aggregateError.errors[0];
        }
        throw aggregateError;
    }
}

export async function POST(request: Request) {
    try {
        if (!API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
        }

        const { text, style } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (text.length > 5000) {
            return NextResponse.json({ error: 'Text too long (max 5000 characters)' }, { status: 400 });
        }

        // Build prompt based on style
        let styleInstruction = 'Paraphrase the following text while maintaining its original meaning.';
        if (style && typeof style === 'string' && style.trim()) {
            styleInstruction = `Rewrite the following text with this instruction: "${style}". Maintain the core meaning.`;
        }

        const prompt = `${styleInstruction}
Keep it academic and professional. Do not add any explanations, markdown formatting, or comments - just return the rewritten text directly.
Maintain approximately the same length unless instructed otherwise.

Text to rewrite:
${text}`;

        console.log(`🔄 Paraphrasing with style: ${style || 'default'}`);

        const rewrittenText = await generateWithFallback(prompt);

        console.log(`✅ Paraphrase complete`);

        return NextResponse.json({ result: rewrittenText.trim() });
    } catch (error) {
        console.error('Paraphrase API error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to paraphrase: ${message}` },
            { status: 500 }
        );
    }
}
