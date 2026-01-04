import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

// Cache duration: 30 days for images
const CACHE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Serve images by fileId
 * 
 * Supports two storage types:
 * 1. Google Drive: fileId is a Drive file ID, fetches from Drive API
 * 2. Local: fileId starts with 'local:', fetches from public/uploads/
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

        // Return binary image with caching headers
        return new NextResponse(uint8Array, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Length': buffer.length.toString(),
                // Cache for 30 days, allow revalidation
                'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE}`,
                // ETag for cache validation
                'ETag': `"${fileId}"`,
                // Prevent hotlinking from other domains (optional security)
                'X-Content-Type-Options': 'nosniff',
            },
        });

    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
    }
}
