// Google Drive Storage for Images
// Uses service account or OAuth for server-side file storage

import { google } from 'googleapis';
import { Readable } from 'stream';

// Drive API client
let driveClient: ReturnType<typeof google.drive> | null = null;

/**
 * Initialize Google Drive client using OAuth2
 * For server-to-server, we use a refresh token stored in env
 */
function getDriveClient() {
    if (driveClient) return driveClient;

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    // If we have a refresh token, use it
    if (process.env.GOOGLE_REFRESH_TOKEN) {
        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
    }

    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return driveClient;
}

/**
 * Get OAuth URL for user authorization
 * User visits this URL to grant Drive access
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
 * Upload image to Google Drive
 * Returns the public URL of the uploaded file
 */
export async function uploadToDrive(
    buffer: Buffer,
    filename: string,
    mimeType: string = 'image/webp'
): Promise<{ fileId: string; url: string }> {
    const drive = getDriveClient();

    // Create readable stream from buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Upload file
    const response = await drive.files.create({
        requestBody: {
            name: filename,
            mimeType,
        },
        media: {
            mimeType,
            body: stream,
        },
        fields: 'id, webContentLink, webViewLink',
    });

    const fileId = response.data.id!;

    // Make file publicly accessible
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    // Get direct download link
    const url = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return { fileId, url };
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromDrive(fileId: string): Promise<boolean> {
    try {
        const drive = getDriveClient();
        await drive.files.delete({ fileId });
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
