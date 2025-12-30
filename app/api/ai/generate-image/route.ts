import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai/gemini';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { prompt } = await request.json();

        // 🔒 SECURITY: Validate input
        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 🔒 SECURITY: Limit prompt length
        if (prompt.length > 1000) {
            return NextResponse.json({ error: 'Prompt too long (max 1000 chars)' }, { status: 400 });
        }

        console.log(`🚀 User ${authResult.user.email} generating image: ${prompt.slice(0, 50)}...`);
        const imageUrl = await generateImage(prompt);

        return NextResponse.json({ imageUrl });
    } catch (error: unknown) {
        return safeErrorResponse(error, 'Image generation failed');
    }
}
