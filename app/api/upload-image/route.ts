import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { sanitizePath } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

// Allowed base64 image prefixes
const ALLOWED_PREFIXES = [
    'data:image/png;base64,',
    'data:image/jpeg;base64,',
    'data:image/gif;base64,',
    'data:image/webp;base64,',
];

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { image, filename } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image data required' }, { status: 400 });
        }

        // 🔒 SECURITY: Validate image data format
        if (typeof image !== 'string') {
            return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
        }

        // 🔒 SECURITY: Check if it's a valid base64 image
        const isValidPrefix = ALLOWED_PREFIXES.some(prefix => image.startsWith(prefix));
        if (image.startsWith('data:') && !isValidPrefix) {
            return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
        }

        // 🔒 SECURITY: Limit base64 size (max 10MB)
        const MAX_BASE64_SIZE = 10 * 1024 * 1024 * 1.37; // ~10MB in base64
        if (image.length > MAX_BASE64_SIZE) {
            return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // 🔒 SECURITY: Generate safe filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);

        // If filename provided, sanitize it
        const safeName = filename ? sanitizePath(filename) : '';
        const finalFilename = safeName
            ? `${safeName}-${timestamp}.png`
            : `img-${timestamp}-${randomStr}.png`;

        // Handle base64 data
        let imageBuffer: Buffer;
        if (image.startsWith('data:')) {
            // Extract base64 data from data URL
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // Assume it's already base64
            imageBuffer = Buffer.from(image, 'base64');
        }

        // Save file
        const filepath = join(uploadsDir, finalFilename);
        await writeFile(filepath, imageBuffer);

        // Return public URL
        const publicUrl = `/uploads/images/${finalFilename}`;
        console.log('✅ Image saved:', publicUrl);

        return NextResponse.json({ url: publicUrl });
    } catch (error: unknown) {
        // 🔒 SECURITY: Don't expose internal errors
        return safeErrorResponse(error, 'Upload failed');
    }
}
