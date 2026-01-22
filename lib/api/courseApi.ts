/**
 * Course API - Now with IndexedDB-first caching
 * 
 * - fetchCourse: Local cache first, API fallback
 * - updateCourse: Saves to local cache, shows as "saved" instantly
 * - publishCourse: Uploads to Telegram via API
 */

import { Course } from '@/lib/types';
import {
    saveDraftLocal,
    getDraftLocal,
    markDraftSynced
} from '@/lib/cache/draft-cache';
import { uploadCourseChunked } from '@/lib/cache/chunked-upload';

/**
 * Fetch course by ID
 * Tries local cache first, then API
 */
export async function fetchCourse(id: string): Promise<Course | null> {
    try {
        // Try local cache first (instant, no API)
        const localDraft = await getDraftLocal(id);
        if (localDraft) {
            console.log(`📂 [Local] Using cached draft for ${id}`);
            return localDraft;
        }

        // Fallback to API
        console.log(`🌐 [API] Fetching ${id} from server`);
        const response = await fetch(`/api/courses/${id}`, { next: { revalidate: 60 } });
        if (!response.ok) {
            console.error(`❌ API fetch failed: ${response.status}`);
            return null;
        }

        const course = await response.json();

        // Cache locally for future
        await saveDraftLocal(id, course);
        await markDraftSynced(id);

        return course;
    } catch (error) {
        console.error(`Error fetching course ${id}:`, error);
        return null;
    }
}

/**
 * Update course - saves to LOCAL CACHE only (instant, no API)
 * Use publishCourse() to sync to server
 */
export async function updateCourse(id: string, course: Course): Promise<boolean> {
    try {
        // Save to local cache only (instant, no network)
        await saveDraftLocal(id, course);
        console.log(`💾 [Local] Draft saved for ${id}`);
        return true;
    } catch (error) {
        console.error(`Error saving draft ${id}:`, error);
        return false;
    }
}

/**
 * Publish course to server (Telegram upload)
 * Only call this on explicit "Publish" action
 */
export async function publishCourse(id: string, course: Course): Promise<boolean> {
    try {
        console.log(`📤 [Publish] Uploading ${id} to server...`);

        // First save to local
        await saveDraftLocal(id, course);

        // Use chunked upload to handle large payloads
        const result = await uploadCourseChunked(id, course, 'publish');

        if (!result.success) {
            throw new Error(result.error || 'Publish failed');
        }

        console.log(`✅ [Publish] ${id} published:`, result.result);

        // Mark as synced
        await markDraftSynced(id);

        return true;
    } catch (error) {
        console.error(`❌ Publish failed:`, error);
        throw error;  // Re-throw so UI can show error message
    }
}

/**
 * Fetch all courses (list view - always from API)
 */
export async function fetchAllCourses(): Promise<Course[]> {
    try {
        const response = await fetch('/api/courses', { next: { revalidate: 60 } });
        if (!response.ok) {
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
}
