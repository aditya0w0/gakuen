import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

// Cache duration: 30 days for images (matches next.config.ts)
const CACHE_MAX_AGE = 2592000; // 30 * 24 * 60 * 60 = 2592000 seconds

/**
 * Generate ETag from file content for proper cache invalidation
 */
function generateETag(buffer: Buffer, fileId: string): string {
    const hash = createHash('md5').update(buffer).digest('hex').slice(0, 16);
    return `"${fileId}-${hash}"`;
}

/**
 * Serve images by fileId
 * 
 * Supports two storage types:
 * 1. Google Drive: fileId is a Drive file ID, fetches from Drive API
 * 2. Local: fileId starts with 'local-', fetches from public/uploads/
 * 
 * Returns binary image data with proper caching headers
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        const { fileId } = await params;

        if (!fileId) {
            return NextResponse.json({ error: 'File ID required' }, { status: 400 });
        }

        let buffer: Buffer;
        let mimeType: string;

        // Check if this is a local file reference
        if (fileId.startsWith('local-')) {
            // Local file storage
            // Format: local-{type}-{filename}
            // Example: local-avatars-abc123.webp
            const parts = fileId.split('-');
            if (parts.length < 3) {
                return NextResponse.json({ error: 'Invalid local file ID format' }, { status: 400 });
            }

            const type = parts[1]; // avatars, courses, lessons, cms
            const filename = parts.slice(2).join('-'); // Rest is the filename

            const filepath = join(process.cwd(), 'public', 'uploads', type, filename);

            if (!existsSync(filepath)) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            buffer = await readFile(filepath);
            mimeType = 'image/webp'; // All processed images are WebP

        } else {
            // Google Drive file
            const { isDriveEnabled, getFileFromDrive } = await import('@/lib/storage/google-drive');

            if (!isDriveEnabled()) {
                return NextResponse.json({ error: 'Drive storage not configured' }, { status: 503 });
            }

            const result = await getFileFromDrive(fileId);

            if (!result) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            buffer = result.buffer;
            mimeType = result.mimeType;
        }

        // Convert Buffer to Uint8Array for NextResponse compatibility
        const uint8Array = new Uint8Array(buffer);
        
        // Generate content-based ETag for proper cache invalidation
        const etag = generateETag(buffer, fileId);

        // Return binary image with caching headers
        return new NextResponse(uint8Array, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Length': buffer.length.toString(),
                // Cache for 30 days, allow revalidation
                'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE}`,
                // Content-based ETag for proper cache invalidation
                'ETag': etag,
                // Prevent MIME type sniffing
                'X-Content-Type-Options': 'nosniff',
            },
        });

    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
    }
}
