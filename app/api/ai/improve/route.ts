import { NextRequest, NextResponse } from 'next/server';
import { improveText, fixTypos, paraphraseText } from '@/lib/ai/gemini';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { text, action } = await request.json();

        // 🔒 SECURITY: Validate input
        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // 🔒 SECURITY: Limit text length
        if (text.length > 10000) {
            return NextResponse.json({ error: 'Text too long (max 10000 chars)' }, { status: 400 });
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
    } catch (error: unknown) {
        return safeErrorResponse(error, 'Text improvement failed');
    }
}
