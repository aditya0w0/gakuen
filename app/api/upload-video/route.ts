import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { isDriveEnabled, uploadToDrive } from '@/lib/storage/google-drive';

export const dynamic = 'force-dynamic';

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
];

// Max video size: 100MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle JSON body (external URL upload)
    if (contentType.includes('application/json')) {
      const { video } = await request.json();

      if (!video || typeof video !== 'string') {
        return NextResponse.json(
          { error: 'Video URL required' },
          { status: 400 }
        );
      }

      // Fetch the external video
      console.log(`📥 Fetching external video: ${video}`);

      try {
        const response = await fetch(video, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          console.error(`❌ Failed to fetch video: ${response.status}`);
          return NextResponse.json(
            { error: `Failed to fetch video: ${response.status}` },
            { status: 400 }
          );
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('video/')) {
          return NextResponse.json(
            { error: 'URL does not point to a video' },
            { status: 400 }
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Check size
        if (buffer.length > MAX_VIDEO_SIZE) {
          return NextResponse.json(
            { error: 'Video too large (max 100MB)' },
            { status: 400 }
          );
        }

        console.log(
          `✅ Fetched video: ${buffer.length} bytes, type: ${contentType}`
        );

        // Determine extension from content type
        let ext = 'mp4';
        if (contentType.includes('webm')) ext = 'webm';
        else if (contentType.includes('ogg')) ext = 'ogg';
        else if (contentType.includes('quicktime')) ext = 'mov';

        // Upload to Google Drive if available
        if (isDriveEnabled()) {
          const result = await uploadToDrive(
            buffer,
            `video-${uuidv4()}.${ext}`,
            'cms',
            contentType
          );
          if (result.url) {
            return NextResponse.json({ url: result.url });
          }
        }

        // Fallback to local storage
        const filename = `video-${uuidv4()}.${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos');

        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        await writeFile(join(uploadDir, filename), buffer);

        return NextResponse.json({ url: `/uploads/videos/${filename}` });
      } catch (fetchError) {
        console.error('❌ Error fetching external video:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch external video' },
          { status: 400 }
        );
      }
    }

    // Handle FormData (file upload)
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate video type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid video type: ${file.type}. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        {
          error: `Video too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 100MB`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension
    let ext = 'mp4';
    if (file.type.includes('webm')) ext = 'webm';
    else if (file.type.includes('ogg')) ext = 'ogg';
    else if (file.type.includes('quicktime')) ext = 'mov';

    const filename = `video-${uuidv4()}.${ext}`;

    console.log(
      `📹 Uploading video: ${filename} (${(file.size / 1024 / 1024).toFixed(1)}MB)`
    );

    // Upload to Google Drive if available
    if (isDriveEnabled()) {
      const result = await uploadToDrive(buffer, filename, 'cms', file.type);
      if (result.url) {
        console.log(`✅ Video uploaded to Drive: ${result.url}`);
        return NextResponse.json({ url: result.url });
      }
    }

    // Fallback to local storage
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(join(uploadDir, filename), buffer);

    console.log(`✅ Video saved locally: /uploads/videos/${filename}`);
    return NextResponse.json({ url: `/uploads/videos/${filename}` });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Video upload failed');
  }
}
