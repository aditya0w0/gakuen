import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
    try {
        const { image, filename } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image data required' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename if not provided
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const finalFilename = filename || `img-${timestamp}-${randomStr}.png`;

        // Handle base64 data
        let imageBuffer: Buffer;
        if (image.startsWith('data:')) {
            // Extract base64 data from data URL
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // Assume it's already base64
            imageBuffer = Buffer.from(image, 'base64');
        }

        // Save file
        const filepath = join(uploadsDir, finalFilename);
        await writeFile(filepath, imageBuffer);

        // Return public URL
        const publicUrl = `/uploads/images/${finalFilename}`;
        console.log('✅ Image saved:', publicUrl);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('❌ Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
