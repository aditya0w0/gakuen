import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Upload types and their target folders
const UPLOAD_PATHS = {
    avatar: 'public/uploads/avatars',
    course: 'public/uploads/courses',
    lesson: 'public/uploads/courses',
    cms: 'public/uploads/cms'
} as const;

type UploadType = keyof typeof UPLOAD_PATHS;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as UploadType;
        const id = formData.get('id') as string; // userId, courseId, etc.

        if (!file || !type) {
            return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
        }

        // Get file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process with Sharp - convert to WebP, 90% quality (visually lossless)
        const processedBuffer = await sharp(buffer)
            .webp({ quality: 90 })
            .toBuffer();

        // Generate filename
        const filename = id
            ? `${id}-${uuidv4().slice(0, 8)}.webp`
            : `${uuidv4()}.webp`;

        // Determine folder path
        let folderPath = UPLOAD_PATHS[type] || 'public/uploads';

        // For courses/lessons, create subfolder structure
        if (type === 'course' && id) {
            folderPath = `public/uploads/courses/${id}`;
        } else if (type === 'lesson' && id) {
            const courseId = formData.get('courseId') as string;
            folderPath = `public/uploads/courses/${courseId}/lessons/${id}`;
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

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
