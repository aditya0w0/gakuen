import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { withAuthTracked, safeErrorResponse } from '@/lib/api/auth-guard';
import { validateFileType } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

// Upload types
type UploadType = 'avatar' | 'course' | 'lesson' | 'cms';

// Max file sizes per type (in bytes)
const MAX_SIZES: Record<UploadType, number> = {
    avatar: 2 * 1024 * 1024,    // 2MB
    course: 5 * 1024 * 1024,    // 5MB  
    lesson: 5 * 1024 * 1024,    // 5MB
    cms: 5 * 1024 * 1024,       // 5MB
};

export const POST = withAuthTracked(async (request, { user }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = (formData.get('type') as UploadType) || 'cms';

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        // 🔒 SECURITY: Validate file type
        const fileValidation = validateFileType(file);
        if (!fileValidation.valid) {
            return NextResponse.json({ error: fileValidation.error }, { status: 400 });
        }

        // 🔒 SECURITY: Validate file size
        const maxSize = MAX_SIZES[type] || MAX_SIZES.cms;
        if (file.size > maxSize) {
            return NextResponse.json({
                error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`
            }, { status: 400 });
        }

        // Get file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process with Sharp - convert to WebP, 85% quality (good balance)
        const processedBuffer = await sharp(buffer)
            .resize({
                width: type === 'avatar' ? 400 : 1200,  // Smaller for avatars
                height: type === 'avatar' ? 400 : undefined,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toBuffer();

        // Get image metadata
        const metadata = await sharp(processedBuffer).metadata();

        // Convert to base64 data URL
        const base64 = processedBuffer.toString('base64');
        const dataUrl = `data:image/webp;base64,${base64}`;

        // Generate a fake filename for client reference
        const filename = `${uuidv4().slice(0, 8)}.webp`;

        return NextResponse.json({
            url: dataUrl,
            width: metadata.width,
            height: metadata.height,
            size: processedBuffer.length,
            filename,
            // Indicate this is a base64 URL (for client-side handling if needed)
            isBase64: true
        });

    } catch (error: unknown) {
        console.error('Upload error:', error);
        return safeErrorResponse(error, 'Upload failed');
    }
});
