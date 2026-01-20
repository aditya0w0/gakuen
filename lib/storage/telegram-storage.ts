/**
 * Telegram Bot Storage for Course Blobs
 * 
 * Uses Telegram as immutable blob storage for course content.
 * Files are uploaded as documents to a private channel/chat.
 * 
 * Setup:
 * 1. Create bot via @BotFather
 * 2. Create private channel, add bot as admin
 * 3. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
 */

import { CourseBlob } from '@/lib/types/course-compact';
import crypto from 'crypto';

// API base URL
const TG_API = 'https://api.telegram.org/bot';

/**
 * Check if Telegram storage is configured
 */
export function isTelegramEnabled(): boolean {
    return !!(
        process.env.TELEGRAM_BOT_TOKEN &&
        process.env.TELEGRAM_CHAT_ID
    );
}

/**
 * Upload course blob to Telegram
 * Returns file_id for later retrieval
 */
export async function uploadCourseBlob(
    courseId: string,
    blob: CourseBlob
): Promise<{ file_id: string; hash: string }> {
    if (!isTelegramEnabled()) {
        throw new Error('Telegram storage not configured');
    }

    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;

    // Convert blob to JSON
    const jsonString = JSON.stringify(blob);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');

    // Calculate hash for integrity
    const hash = crypto.createHash('md5').update(jsonString).digest('hex');

    // Create form data for file upload
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', new Blob([jsonBuffer], { type: 'application/json' }), `${courseId}.json`);
    formData.append('caption', `Course: ${courseId} | Hash: ${hash.slice(0, 8)}`);

    console.log(`📤 [Telegram] Uploading ${courseId}.json (${(jsonBuffer.length / 1024).toFixed(1)}KB)`);

    const response = await fetch(`${TG_API}${token}/sendDocument`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`❌ [Telegram] Upload failed:`, error);
        throw new Error(`Telegram upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.ok) {
        console.error(`❌ [Telegram] API error:`, result);
        throw new Error(`Telegram API error: ${result.description}`);
    }

    const file_id = result.result.document.file_id;
    console.log(`✅ [Telegram] Uploaded ${courseId} → ${file_id.slice(0, 20)}...`);

    return { file_id, hash };
}

/**
 * Download course blob from Telegram by file_id
 */
export async function downloadCourseBlob(file_id: string): Promise<CourseBlob | null> {
    if (!isTelegramEnabled()) {
        throw new Error('Telegram storage not configured');
    }

    const token = process.env.TELEGRAM_BOT_TOKEN!;

    console.log(`📥 [Telegram] Downloading ${file_id.slice(0, 20)}...`);

    // Step 1: Get file path
    const fileInfoResponse = await fetch(`${TG_API}${token}/getFile?file_id=${file_id}`);

    if (!fileInfoResponse.ok) {
        console.error(`❌ [Telegram] getFile failed:`, await fileInfoResponse.text());
        return null;
    }

    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok || !fileInfo.result.file_path) {
        console.error(`❌ [Telegram] Invalid file info:`, fileInfo);
        return null;
    }

    // Step 2: Download file content
    const filePath = fileInfo.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    const downloadResponse = await fetch(fileUrl);

    if (!downloadResponse.ok) {
        console.error(`❌ [Telegram] Download failed:`, await downloadResponse.text());
        return null;
    }

    const jsonText = await downloadResponse.text();

    try {
        const blob = JSON.parse(jsonText) as CourseBlob;
        console.log(`✅ [Telegram] Downloaded blob (${(jsonText.length / 1024).toFixed(1)}KB)`);
        return blob;
    } catch (e) {
        console.error(`❌ [Telegram] Invalid JSON:`, e);
        return null;
    }
}

/**
 * Verify blob integrity by comparing hash
 */
export function verifyBlobHash(blob: CourseBlob, expectedHash: string): boolean {
    const jsonString = JSON.stringify(blob);
    const actualHash = crypto.createHash('md5').update(jsonString).digest('hex');
    return actualHash === expectedHash;
}

/**
 * Calculate blob stats for Firestore metadata
 */
export function getBlobStats(blob: CourseBlob): {
    lessonCount: number;
    blockCount: number;
    sizeBytes: number;
    hash: string;
} {
    const jsonString = JSON.stringify(blob);
    return {
        lessonCount: Object.keys(blob.lessons || {}).length,
        blockCount: Object.keys(blob.blocks || {}).length,
        sizeBytes: Buffer.byteLength(jsonString, 'utf-8'),
        hash: crypto.createHash('md5').update(jsonString).digest('hex'),
    };
}
