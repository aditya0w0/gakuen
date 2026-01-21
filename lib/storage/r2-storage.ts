import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Client singleton
let r2Client: S3Client | null = null;

export type R2Folder = 'avatars' | 'courses' | 'lessons' | 'cms';

/**
 * Initialize S3 client for R2
 */
function getR2Client() {
    if (r2Client) return r2Client;

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        throw new Error('R2 configuration missing');
    }

    r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    return r2Client;
}

/**
 * Check if R2 is enabled
 */
export function isR2Enabled(): boolean {
    return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
    );
}

/**
 * Validate R2 connection
 */
export async function validateR2Connection(): Promise<boolean> {
    if (!isR2Enabled()) return false;

    try {
        const client = getR2Client();
        await client.send(new HeadBucketCommand({
            Bucket: process.env.R2_BUCKET_NAME,
        }));
        return true;
    } catch (error) {
        console.error('R2 connection validation failed:', error);
        return false;
    }
}

/**
 * Upload file to R2
 */
export async function uploadToR2(
    buffer: Buffer,
    filename: string,
    folder: R2Folder = 'cms',
    mimeType: string = 'image/webp'
): Promise<{ fileId: string; url: string }> {
    const client = getR2Client();
    const key = `${folder}/${filename}`;

    await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    }));

    const fileId = `r2-${key.replace(/\//g, ':')}`;
    const url = `/api/images/${fileId}`;

    return { fileId, url };
}

/**
 * Get file from R2
 */
export async function getFileFromR2(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
        const client = getR2Client();
        // r2-folder:filename -> folder/filename
        const key = fileId.replace('r2-', '').replace(':', '/');

        const response = await client.send(new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        }));

        if (!response.Body) return null;

        const bytes = await response.Body.transformToByteArray();
        return {
            buffer: Buffer.from(bytes),
            mimeType: response.ContentType || 'image/webp',
        };
    } catch (error) {
        console.error('Error fetching file from R2:', error);
        return null;
    }
}
