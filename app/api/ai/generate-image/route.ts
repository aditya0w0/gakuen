import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai/gemini';

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log('🚀 API: Generating image for prompt:', prompt);
        const imageUrl = await generateImage(prompt);
        console.log('✅ API: Returning imageUrl:', imageUrl.substring(0, 100) + '...');

        return NextResponse.json({ imageUrl });
    } catch (error: any) {
        console.error('❌ API: Image generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
