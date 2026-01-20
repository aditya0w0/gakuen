/**
 * Google Drive fallback storage for courses
 * Used when Firestore quota is exceeded
 * Stores course data as JSON files in Google Drive
 */

import { google } from 'googleapis';
import { Readable } from 'stream';
import { Course } from '@/lib/types';

// Drive API client (singleton)
let driveClient: ReturnType<typeof google.drive> | null = null;

// Folder ID cache
const folderCache: Record<string, string> = {};

/**
 * Initialize Google Drive client
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
 * Check if Drive storage is available
 */
export function isDriveStorageEnabled(): boolean {
    return !!(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN
    );
}

/**
 * Find or create a folder
 */
async function getOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const cacheKey = parentId ? `${parentId}/${name}` : name;

    if (folderCache[cacheKey]) {
        return folderCache[cacheKey];
    }

    const drive = getDriveClient();

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
 * Get the courses folder ID in GDrive
 */
async function getCoursesFolder(): Promise<string> {
    const rootId = await getOrCreateFolder('Gakuen');
    return await getOrCreateFolder('courses-data', rootId);
}

/**
 * Save course to Google Drive as JSON
 */
export async function saveCourseToGDrive(id: string, course: Course): Promise<boolean> {
    if (!isDriveStorageEnabled()) {
        console.error('GDrive storage not enabled');
        return false;
    }

    try {
        const startTime = Date.now();
        console.log(`📤 [GDrive] Saving course ${id}...`);

        const drive = getDriveClient();
        const folderId = await getCoursesFolder();

        const courseJson = JSON.stringify(course, null, 2);
        const buffer = Buffer.from(courseJson, 'utf-8');
        const filename = `${id}.json`;

        // Check if file already exists
        const existingSearch = await drive.files.list({
            q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive'
        });

        if (existingSearch.data.files && existingSearch.data.files.length > 0) {
            // Update existing file
            const existingFileId = existingSearch.data.files[0].id!;
            const stream = new Readable();
            stream.push(buffer);
            stream.push(null);

            await drive.files.update({
                fileId: existingFileId,
                media: {
                    mimeType: 'application/json',
                    body: stream,
                },
            });
            console.log(`📤 [GDrive] Updated course ${id} (${Date.now() - startTime}ms)`);
        } else {
            // Create new file
            const stream = new Readable();
            stream.push(buffer);
            stream.push(null);

            await drive.files.create({
                requestBody: {
                    name: filename,
                    mimeType: 'application/json',
                    parents: [folderId]
                },
                media: {
                    mimeType: 'application/json',
                    body: stream,
                },
                fields: 'id',
            });
            console.log(`📤 [GDrive] Created course ${id} (${Date.now() - startTime}ms)`);
        }

        return true;
    } catch (error) {
        console.error(`❌ [GDrive] Error saving course ${id}:`, error);
        return false;
    }
}

/**
 * Get course from Google Drive
 */
export async function getCourseFromGDrive(id: string): Promise<Course | null> {
    if (!isDriveStorageEnabled()) {
        return null;
    }

    try {
        const drive = getDriveClient();
        const folderId = await getCoursesFolder();
        const filename = `${id}.json`;

        // Find the file
        const search = await drive.files.list({
            q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive'
        });

        if (!search.data.files || search.data.files.length === 0) {
            return null;
        }

        const fileId = search.data.files[0].id!;

        // Download file content
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'text' }
        );

        const course = JSON.parse(response.data as string) as Course;
        console.log(`📥 [GDrive] Loaded course ${id}`);
        return course;
    } catch (error) {
        console.error(`❌ [GDrive] Error getting course ${id}:`, error);
        return null;
    }
}

/**
 * List all courses from Google Drive
 */
export async function listCoursesFromGDrive(): Promise<Course[]> {
    if (!isDriveStorageEnabled()) {
        return [];
    }

    try {
        const drive = getDriveClient();
        const folderId = await getCoursesFolder();

        const search = await drive.files.list({
            q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (!search.data.files || search.data.files.length === 0) {
            return [];
        }

        const courses: Course[] = [];

        for (const file of search.data.files) {
            try {
                const response = await drive.files.get(
                    { fileId: file.id!, alt: 'media' },
                    { responseType: 'text' }
                );
                const course = JSON.parse(response.data as string) as Course;
                courses.push(course);
            } catch (e) {
                console.error(`Error loading course ${file.name}:`, e);
            }
        }

        console.log(`📥 [GDrive] Loaded ${courses.length} courses`);
        return courses;
    } catch (error) {
        console.error('❌ [GDrive] Error listing courses:', error);
        return [];
    }
}

/**
 * Delete course from Google Drive
 */
export async function deleteCourseFromGDrive(id: string): Promise<boolean> {
    if (!isDriveStorageEnabled()) {
        return false;
    }

    try {
        const drive = getDriveClient();
        const folderId = await getCoursesFolder();
        const filename = `${id}.json`;

        const search = await drive.files.list({
            q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive'
        });

        if (search.data.files && search.data.files.length > 0) {
            await drive.files.delete({ fileId: search.data.files[0].id! });
            console.log(`🗑️ [GDrive] Deleted course ${id}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ [GDrive] Error deleting course ${id}:`, error);
        return false;
    }
}
