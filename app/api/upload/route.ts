import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { withAuthTracked, safeErrorResponse } from '@/lib/api/auth-guard';
import { validateFileType } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

// Upload types (maps to Drive folders)
type UploadType = 'avatar' | 'course' | 'lesson' | 'cms';

// Drive folder mapping
const DRIVE_FOLDERS: Record<UploadType, 'avatars' | 'courses' | 'lessons' | 'cms'> = {
    avatar: 'avatars',
    course: 'courses',
    lesson: 'lessons',
    cms: 'cms'
};

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

        // Process with Sharp - convert to WebP, 85% quality
        const imageToProcess = buffer;
        let wasReplaced = false;

        const processedBuffer = await sharp(imageToProcess)
            .resize({
                width: type === 'avatar' ? 400 : 1200,
                height: type === 'avatar' ? 400 : undefined,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toBuffer();

        // Get image metadata
        const metadata = await sharp(processedBuffer).metadata();

        // Generate unique filename
        const filename = `${uuidv4().slice(0, 8)}-${Date.now()}.webp`;

        // Try Google Drive first, fallback to base64
        const { isDriveEnabled, uploadToDrive } = await import('@/lib/storage/google-drive');

        if (isDriveEnabled()) {
            // 🔒 SECURITY: Only run NSFW moderation for public Drive uploads
            const { moderateImage } = await import('@/lib/moderation/content-filter');
            const moderation = await moderateImage(buffer);

            let bufferToUpload = processedBuffer;

            // If NSFW detected, replace with meme image
            if (moderation.shouldReplace) {
                console.log(`🎭 Replacing NSFW upload from user ${user.id} with meme: ${moderation.reason}`);
                const fs = await import('fs/promises');
                const path = await import('path');
                const memePath = path.join(process.cwd(), 'public', 'images', 'nsfw-replacement.jpg');
                const memeBuffer = await fs.readFile(memePath);
                bufferToUpload = await sharp(memeBuffer).webp({ quality: 85 }).toBuffer();
                wasReplaced = true;
            }

            try {
                const driveFolder = DRIVE_FOLDERS[type];
                const { url, fileId } = await uploadToDrive(
                    bufferToUpload,
                    filename,
                    driveFolder,
                    'image/webp'
                );

                return NextResponse.json({
                    url,
                    fileId,
                    width: metadata.width,
                    height: metadata.height,
                    size: processedBuffer.length,
                    filename,
                    storage: 'drive',
                    replaced: wasReplaced  // True if NSFW was replaced with meme
                });
            } catch (driveError) {
                console.error('Drive upload failed, falling back to base64:', driveError);
                // Fall through to base64
            }
        }

        // Fallback: Convert to base64 data URL
        const base64 = processedBuffer.toString('base64');
        const dataUrl = `data:image/webp;base64,${base64}`;

        return NextResponse.json({
            url: dataUrl,
            width: metadata.width,
            height: metadata.height,
            size: processedBuffer.length,
            filename,
            storage: 'base64',
            replaced: wasReplaced
        });

    } catch (error: unknown) {
        console.error('Upload error:', error);
        return safeErrorResponse(error, 'Upload failed');
    }
});
