import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
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
                console.error('Drive upload failed, falling back to local storage:', driveError);
                // Fall through to local storage
            }
        }

        // Fallback: Save to local file storage (binary file, not base64)
        // Determine the upload directory based on type (uses same folder names as Drive)
        const uploadSubdir = DRIVE_FOLDERS[type]; // Will always be valid: avatars, courses, lessons, or cms
        const uploadsDir = join(process.cwd(), 'public', 'uploads', uploadSubdir);
        
        // Create directory if it doesn't exist
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate filename with user ID for organization
        const localFilename = `${user.id}-${uuidv4().slice(0, 8)}.webp`;
        const filepath = join(uploadsDir, localFilename);
        
        // Write binary file (NOT base64)
        await writeFile(filepath, processedBuffer);
        
        // Generate a local file ID that points to our image serving API
        // Format: local-{type}-{filename}
        const localFileId = `local-${uploadSubdir}-${localFilename}`;
        const publicUrl = `/api/images/${localFileId}`;
        console.log(`✅ Image saved locally: ${publicUrl}`);

        return NextResponse.json({
            url: publicUrl,
            fileId: localFileId,
            width: metadata.width,
            height: metadata.height,
            size: processedBuffer.length,
            filename: localFilename,
            storage: 'local',
            replaced: wasReplaced
        });

    } catch (error: unknown) {
        console.error('Upload error:', error);
        return safeErrorResponse(error, 'Upload failed');
    }
});
