import { NextResponse } from 'next/server';
import { improveText, fixTypos, paraphraseText } from '@/lib/ai/gemini';

export async function POST(request: Request) {
    try {
        const { text, action } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        let result: string;

        switch (action) {
            case 'fix-typos':
                result = await fixTypos(text);
                break;
            case 'paraphrase':
                result = await paraphraseText(text);
                break;
            case 'improve':
                result = await improveText(text);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ result });
    } catch (error: any) {
        console.error('AI improvement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
