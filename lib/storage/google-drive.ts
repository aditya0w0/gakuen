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
    const drive = getDriveClient();

    // Get the target folder
    const folderId = await getUploadFolderId(folder);

    // Create readable stream from buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Upload file to folder (PRIVATE - no public permissions)
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

    // Generate URL that points to our image serving API (not direct Drive URL)
    // This allows us to control access, add caching headers, and serve binary data
    const url = `/api/images/${fileId}`;

    console.log(`📤 Uploaded to Drive: ${folder}/${filename} (fileId: ${fileId})`);
    return { fileId, url };
}

/**
 * Fetch file binary data from Google Drive by fileId
 * Returns the file buffer and metadata
 */
export async function getFileFromDrive(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
        const drive = getDriveClient();

        // Get file metadata first
        const metadata = await drive.files.get({
            fileId,
            fields: 'mimeType, name'
        });

        const mimeType = metadata.data.mimeType || 'image/webp';

        // Download file content
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        const buffer = Buffer.from(response.data as ArrayBuffer);

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
