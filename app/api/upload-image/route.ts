import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { isDriveEnabled, uploadToDrive, type UploadFolder } from '@/lib/storage/google-drive';

export const dynamic = 'force-dynamic';

// Allowed base64 image prefixes
const ALLOWED_PREFIXES = [
    'data:image/png;base64,',
    'data:image/jpeg;base64,',
    'data:image/gif;base64,',
    'data:image/webp;base64,',
];

// Upload type for AI-generated images (used for CMS/course thumbnails)
// Maps to Google Drive folder names
type UploadType = 'cms' | 'course';

// Map request type to Drive folder name
const FOLDER_MAP: Record<UploadType, UploadFolder> = {
    cms: 'cms',
    course: 'courses',  // Course thumbnails go to 'courses' folder
};

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { image, type = 'cms' } = await request.json();

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

        // Detect mime type - will be determined below
        let mimeType = 'image/png';
        let imageBuffer: Buffer;

        // Check if it's an HTTP URL (external image)
        if (image.startsWith('http://') || image.startsWith('https://')) {
            console.log(`📥 Fetching external image: ${image}`);

            try {
                const response = await fetch(image, {
                    headers: {
                        // Some servers require a user agent
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.ok) {
                    console.error(`❌ Failed to fetch external image: ${response.status} ${response.statusText}`);
                    return NextResponse.json({ error: `Failed to fetch image: ${response.status}` }, { status: 400 });
                }

                // Get content type from response
                const contentType = response.headers.get('content-type') || 'image/png';
                mimeType = contentType.split(';')[0].trim();

                // Get the image as an ArrayBuffer
                const arrayBuffer = await response.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);

                console.log(`✅ Fetched external image: ${imageBuffer.length} bytes, type: ${mimeType}`);

                if (imageBuffer.length < 100) {
                    console.error(`❌ Fetched image too small (${imageBuffer.length} bytes), likely an error`);
                    return NextResponse.json({ error: 'Failed to fetch valid image' }, { status: 400 });
                }
            } catch (fetchError) {
                console.error('❌ Error fetching external image:', fetchError);
                return NextResponse.json({ error: 'Failed to fetch external image' }, { status: 400 });
            }
        } else if (image.startsWith('data:')) {
            // Handle base64 data URL
            if (image.startsWith('data:image/jpeg')) mimeType = 'image/jpeg';
            else if (image.startsWith('data:image/webp')) mimeType = 'image/webp';
            else if (image.startsWith('data:image/gif')) mimeType = 'image/gif';
            else if (image.startsWith('data:image/png')) mimeType = 'image/png';

            // Extract base64 data from data URL
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // Assume it's raw base64
            imageBuffer = Buffer.from(image, 'base64');
        }

        // Get file extension from mime type
        const extMap: Record<string, string> = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/webp': 'webp',
            'image/gif': 'gif',
        };
        const ext = extMap[mimeType] || 'png';

        // Generate unique filename (UUID-based for security - prevents path traversal)
        const generatedFilename = `${uuidv4().slice(0, 8)}-${Date.now()}.${ext}`;

        // Determine folder based on type
        const uploadType: UploadType = type === 'course' ? 'course' : 'cms';
        const folderName = FOLDER_MAP[uploadType];

        // Try Google Drive first, fallback to local storage
        if (isDriveEnabled()) {
            try {
                const { url, fileId } = await uploadToDrive(
                    imageBuffer,
                    generatedFilename,
                    folderName,
                    mimeType
                );

                console.log(`✅ AI image uploaded to Drive: ${url}`);

                return NextResponse.json({
                    url,
                    fileId,
                    size: imageBuffer.length,
                    filename: generatedFilename,
                    storage: 'drive'
                });
            } catch (driveError) {
                console.error('Drive upload failed, falling back to local storage:', driveError);
                // Fall through to local storage
            }
        }

        // Fallback: Save to local file storage
        const uploadsDir = join(process.cwd(), 'public', 'uploads', folderName);

        // Create directory if it doesn't exist
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate filename with user ID for organization
        const localFilename = `${authResult.user.id}-${uuidv4().slice(0, 8)}.${ext}`;
        const filepath = join(uploadsDir, localFilename);

        // Write binary file
        await writeFile(filepath, imageBuffer);

        // Generate a local file ID that points to our image serving API
        // Format: local-{type}-{filename}
        const localFileId = `local-${folderName}-${localFilename}`;
        const publicUrl = `/api/images/${localFileId}`;

        console.log(`✅ AI image saved locally: ${publicUrl}`);

        return NextResponse.json({
            url: publicUrl,
            fileId: localFileId,
            size: imageBuffer.length,
            filename: localFilename,
            storage: 'local'
        });
    } catch (error: unknown) {
        // Log the actual error for debugging
        console.error('Upload-image error:', error);
        // 🔒 SECURITY: Don't expose internal errors
        return safeErrorResponse(error, 'Upload failed');
    }
}
