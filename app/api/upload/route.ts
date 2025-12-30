import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { sanitizePath, validateFileType } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

// Upload types and their target folders
const UPLOAD_PATHS = {
    avatar: 'public/uploads/avatars',
    course: 'public/uploads/courses',
    lesson: 'public/uploads/courses',
    cms: 'public/uploads/cms'
} as const;

type UploadType = keyof typeof UPLOAD_PATHS;

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as UploadType;
        const id = formData.get('id') as string;

        if (!file || !type) {
            return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
        }

        // 🔒 SECURITY: Validate file type
        const fileValidation = validateFileType(file);
        if (!fileValidation.valid) {
            return NextResponse.json({ error: fileValidation.error }, { status: 400 });
        }

        // 🔒 SECURITY: Validate upload type
        if (!UPLOAD_PATHS[type]) {
            return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
        }

        // Get file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process with Sharp - convert to WebP, 90% quality (visually lossless)
        const processedBuffer = await sharp(buffer)
            .webp({ quality: 90 })
            .toBuffer();

        // 🔒 SECURITY: Sanitize ID to prevent path traversal
        const safeId = id ? sanitizePath(id) : '';

        // Generate filename with sanitized ID
        const filename = safeId
            ? `${safeId}-${uuidv4().slice(0, 8)}.webp`
            : `${uuidv4()}.webp`;

        // Determine folder path (verified safe paths only)
        let folderPath: string = UPLOAD_PATHS[type];

        // For courses/lessons, create subfolder structure with sanitized IDs
        if (type === 'course' && safeId) {
            folderPath = `public/uploads/courses/${safeId}`;
        } else if (type === 'lesson' && safeId) {
            const courseId = formData.get('courseId') as string;
            const safeCourseId = sanitizePath(courseId || '');
            if (safeCourseId) {
                folderPath = `public/uploads/courses/${safeCourseId}/lessons/${safeId}`;
            }
        }

        // Ensure directory exists
        await mkdir(folderPath, { recursive: true });

        // Write file
        const filePath = path.join(folderPath, filename);
        await writeFile(filePath, processedBuffer);

        // Return public URL (remove 'public' prefix)
        const publicUrl = '/' + filePath.replace('public/', '').replace(/\\/g, '/');

        // Get image metadata for response
        const metadata = await sharp(processedBuffer).metadata();

        return NextResponse.json({
            url: publicUrl,
            width: metadata.width,
            height: metadata.height,
            size: processedBuffer.length,
            filename
        });

    } catch (error: unknown) {
        // 🔒 SECURITY: Don't expose internal errors
        return safeErrorResponse(error, 'Upload failed');
    }
}
