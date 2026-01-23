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

// Max file sizes per type (in bytes) - generous limits since Sharp compresses
const MAX_SIZES: Record<UploadType, number> = {
    avatar: 30 * 1024 * 1024,   // 30MB - Sharp will compress to WebP
    course: 30 * 1024 * 1024,   // 30MB  
    lesson: 30 * 1024 * 1024,   // 30MB
    cms: 30 * 1024 * 1024,      // 30MB
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
        const inputSizeMB = buffer.length / (1024 * 1024);

        // Smart compression based on input size
        // Larger files get more aggressive compression
        let quality: number;
        let maxWidth: number;

        if (type === 'avatar') {
            // Avatars are always small
            quality = 85;
            maxWidth = 400;
        } else if (inputSizeMB > 20) {
            // Very large files (20-30MB): aggressive compression
            quality = 70;
            maxWidth = 1600;
            console.log(`📦 Large file (${inputSizeMB.toFixed(1)}MB) - using aggressive compression (quality: ${quality})`);
        } else if (inputSizeMB > 10) {
            // Large files (10-20MB): moderate compression  
            quality = 75;
            maxWidth = 1800;
            console.log(`📦 Medium-large file (${inputSizeMB.toFixed(1)}MB) - using moderate compression (quality: ${quality})`);
        } else if (inputSizeMB > 5) {
            // Medium files (5-10MB): light compression
            quality = 80;
            maxWidth = 2000;
        } else {
            // Small files (<5MB): high quality
            quality = 85;
            maxWidth = 2400;
        }

        // Check if this is a GIF (preserve animation - don't convert to WebP)
        const isGif = file.type === 'image/gif';
        
        // Process with Sharp - convert PNG/JPG/etc to WebP with smart quality
        // GIFs are preserved as-is to maintain animation
        const imageToProcess = buffer;
        let wasReplaced = false;
        let processedBuffer: Buffer;
        let outputFormat: 'webp' | 'gif';
        let mimeType: string;

        if (isGif) {
            // GIF: Preserve original to maintain animation
            // Only resize if needed, keep as GIF format
            const metadata = await sharp(buffer, { animated: true }).metadata();
            const needsResize = metadata.width && metadata.width > maxWidth;
            
            if (needsResize) {
                processedBuffer = await sharp(buffer, { animated: true })
                    .resize({
                        width: type === 'avatar' ? 400 : maxWidth,
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .gif()
                    .toBuffer();
                console.log(`🎬 Resized GIF: ${inputSizeMB.toFixed(1)}MB → ${(processedBuffer.length / 1024 / 1024).toFixed(1)}MB`);
            } else {
                // Use original buffer for GIFs that don't need resizing
                processedBuffer = buffer;
                console.log(`🎬 Preserved GIF as-is: ${inputSizeMB.toFixed(1)}MB`);
            }
            outputFormat = 'gif';
            mimeType = 'image/gif';
        } else {
            // Non-GIF: Convert to WebP for compression
            processedBuffer = await sharp(imageToProcess)
                .resize({
                    width: type === 'avatar' ? 400 : maxWidth,
                    height: type === 'avatar' ? 400 : undefined,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality })
                .toBuffer();
            outputFormat = 'webp';
            mimeType = 'image/webp';
            
            const outputSizeKB = processedBuffer.length / 1024;
            console.log(`✨ Compressed: ${inputSizeMB.toFixed(1)}MB → ${outputSizeKB.toFixed(0)}KB (${((1 - processedBuffer.length / buffer.length) * 100).toFixed(0)}% reduction)`);
        }

        // Get image metadata
        const metadata = await sharp(processedBuffer, isGif ? { animated: true } : {}).metadata();

        // Generate unique filename
        const filename = `${uuidv4().slice(0, 8)}-${Date.now()}.${outputFormat}`;

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
                    mimeType
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
                console.error('Drive upload failed, trying R2 fallback:', driveError);
                // Fall through to R2
            }
        }

        // --- CLOUDFLARE R2 FALLBACK ---
        const { isR2Enabled, uploadToR2 } = await import('@/lib/storage/r2-storage');

        if (isR2Enabled()) {
            try {
                const r2Folder = DRIVE_FOLDERS[type]; // Uses same folder names
                const { url, fileId } = await uploadToR2(
                    processedBuffer, // Use the same processed buffer
                    filename,
                    r2Folder as any,
                    mimeType
                );

                console.log(`✅ Image uploaded to R2: ${fileId}`);
                return NextResponse.json({
                    url,
                    fileId,
                    width: metadata.width,
                    height: metadata.height,
                    size: processedBuffer.length,
                    filename,
                    storage: 'r2',
                    replaced: wasReplaced
                });
            } catch (r2Error) {
                console.error('R2 upload failed, falling back to local storage:', r2Error);
                // Fall through to local
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
        const localFilename = `${user.id}-${uuidv4().slice(0, 8)}.${outputFormat}`;
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
