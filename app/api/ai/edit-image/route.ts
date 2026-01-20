import { NextRequest, NextResponse } from 'next/server';
import { editImage } from '@/lib/ai/gemini';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { imageUrl, prompt } = await request.json();

        // 🔒 SECURITY: Validate inputs
        if (!imageUrl || typeof imageUrl !== 'string') {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Edit prompt is required' }, { status: 400 });
        }

        // 🔒 SECURITY: Limit prompt length
        if (prompt.length > 500) {
            return NextResponse.json({ error: 'Prompt too long (max 500 chars)' }, { status: 400 });
        }

        console.log(`✏️ User ${authResult.user.email} editing image: ${prompt.slice(0, 50)}...`);

        // Fetch image and convert to base64 if it's a URL
        let imageBase64 = imageUrl;

        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/api/')) {
            // Fetch the image
            const fetchUrl = imageUrl.startsWith('/api/')
                ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${imageUrl}`
                : imageUrl;

            const response = await fetch(fetchUrl);
            if (!response.ok) {
                return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
            }

            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = response.headers.get('content-type') || 'image/png';
            imageBase64 = `data:${contentType};base64,${base64}`;
        }

        // Call Gemini to edit the image
        const editedImageUrl = await editImage(imageBase64, prompt);

        return NextResponse.json({ imageUrl: editedImageUrl });
    } catch (error: unknown) {
        return safeErrorResponse(error, 'Image editing failed');
    }
}
