// Google Drive Storage for Images
// Uses OAuth for server-side file storage with organized folders

import { google } from 'googleapis';
import { Readable } from 'stream';

// Drive API client (singleton)
let driveClient: ReturnType<typeof google.drive> | null = null;

// Folder ID cache to avoid repeated lookups
const folderCache: Record<string, string> = {};

// Root folder name for all Gakuen uploads
const ROOT_FOLDER = 'Gakuen';

// Subfolder types
export type UploadFolder = 'avatars' | 'courses' | 'lessons' | 'cms';

/**
 * Initialize Google Drive client using OAuth2
 */
function getDriveClient() {
    if (driveClient) return driveClient;

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    if (process.env.GOOGLE_REFRESH_TOKEN) {
        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
    }

    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return driveClient;
}

/**
 * Find or create a folder by name
 */
async function getOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const cacheKey = parentId ? `${parentId}/${name}` : name;

    if (folderCache[cacheKey]) {
        return folderCache[cacheKey];
    }

    const drive = getDriveClient();

    // Search for existing folder
    const query = parentId
        ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
        : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

    const search = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
    });

    if (search.data.files && search.data.files.length > 0) {
        const folderId = search.data.files[0].id!;
        folderCache[cacheKey] = folderId;
        return folderId;
    }

    // Create new folder
    const folder = await drive.files.create({
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined
        },
        fields: 'id'
    });

    const folderId = folder.data.id!;
    folderCache[cacheKey] = folderId;
    console.log(`📁 Created Drive folder: ${name}`);
    return folderId;
}

/**
 * Get the folder ID for a specific upload type
 * Creates folder structure: Gakuen/avatars, Gakuen/courses, etc.
 */
async function getUploadFolderId(folder: UploadFolder): Promise<string> {
    // Get or create root "Gakuen" folder
    const rootId = await getOrCreateFolder(ROOT_FOLDER);

    // Get or create subfolder
    const subfolderId = await getOrCreateFolder(folder, rootId);

    return subfolderId;
}

/**
 * Get OAuth URL for user authorization
 */
export function getAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
        prompt: 'consent'
    });
}

/**
 * Exchange authorization code for tokens
 */
export async function handleCallback(code: string): Promise<{ refreshToken: string }> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
        throw new Error('No refresh token received. Try revoking access and re-authorizing.');
    }

    return { refreshToken: tokens.refresh_token };
}

/**
 * Upload image to Google Drive in organized folder
 * Files are kept PRIVATE - accessed only through our backend API
 * Returns fileId to be stored in database
 */
export async function uploadToDrive(
    buffer: Buffer,
    filename: string,
    folder: UploadFolder = 'cms',
    mimeType: string = 'image/webp'
): Promise<{ fileId: string; url: string }> {
    const startTime = Date.now();
    console.log(`📤 [UPLOAD START] ${filename} (${buffer.length} bytes) to ${folder}`);

    try {
        console.log(`📤 [STEP 1] Getting Drive client... (${Date.now() - startTime}ms)`);
        const drive = getDriveClient();

        console.log(`📤 [STEP 2] Getting folder ID for '${folder}'... (${Date.now() - startTime}ms)`);
        const folderId = await getUploadFolderId(folder);
        console.log(`📤 [STEP 2 DONE] Folder ID: ${folderId} (${Date.now() - startTime}ms)`);

        // Create readable stream from buffer
        console.log(`📤 [STEP 3] Creating upload stream... (${Date.now() - startTime}ms)`);
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload file to folder (PRIVATE - no public permissions)
        console.log(`📤 [STEP 4] Uploading to Drive... (${Date.now() - startTime}ms)`);
        const response = await drive.files.create({
            requestBody: {
                name: filename,
                mimeType,
                parents: [folderId]
            },
            media: {
                mimeType,
                body: stream,
            },
            fields: 'id',
        });

        const fileId = response.data.id!;
        console.log(`📤 [STEP 4 DONE] File ID: ${fileId} (${Date.now() - startTime}ms)`);

        // Generate URL that points to our image serving API (not direct Drive URL)
        // This allows us to control access, add caching headers, and serve binary data
        const url = `/api/images/${fileId}`;

        console.log(`📤 [UPLOAD SUCCESS] ${folder}/${filename} -> ${fileId} (total: ${Date.now() - startTime}ms)`);
        return { fileId, url };
    } catch (error) {
        console.error(`📤 [UPLOAD ERROR] After ${Date.now() - startTime}ms:`, error);
        throw error;
    }
}

/**
 * Fetch file binary data from Google Drive by fileId
 * Returns the file buffer and metadata
 */
export async function getFileFromDrive(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
        const drive = getDriveClient();

        console.log(`📥 Fetching file from Drive: ${fileId}`);

        // Get file metadata first
        const metadata = await drive.files.get({
            fileId,
            fields: 'mimeType, name, size'
        });

        const mimeType = metadata.data.mimeType || 'image/webp';
        const expectedSize = metadata.data.size ? parseInt(metadata.data.size) : null;
        console.log(`📋 File metadata: name=${metadata.data.name}, mimeType=${mimeType}, expectedSize=${expectedSize}`);

        // Download file content
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        // Check if response.data exists and is valid
        if (!response.data) {
            console.error(`❌ No data received for file ${fileId}`);
            return null;
        }

        const buffer = Buffer.from(response.data as ArrayBuffer);
        console.log(`📦 Downloaded buffer size: ${buffer.length} bytes`);

        // Sanity check: if buffer is too small, something went wrong
        if (buffer.length < 100) {
            console.error(`❌ Buffer too small (${buffer.length} bytes), might be error response`);
            // Log first bytes as string to see if it's an error message
            console.error(`📝 First bytes as text: ${buffer.toString('utf8').slice(0, 100)}`);
        }

        return { buffer, mimeType };
    } catch (error) {
        console.error(`Error fetching file ${fileId} from Drive:`, error);
        return null;
    }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromDrive(fileId: string): Promise<boolean> {
    try {
        const drive = getDriveClient();
        await drive.files.delete({ fileId });
        console.log(`🗑️ Deleted from Drive: ${fileId}`);
        return true;
    } catch (error) {
        console.error('Error deleting from Drive:', error);
        return false;
    }
}

/**
 * Check if Drive integration is configured
 */
export function isDriveEnabled(): boolean {
    return !!(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN
    );
}
