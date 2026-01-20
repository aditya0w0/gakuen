/**
 * React Hook for Cached Course Fetching
 * 
 * Flow:
 * 1. Check IndexedDB cache for course
 * 2. Fetch metadata from API (version check)
 * 3. If version matches → use cache
 * 4. If version mismatch → fetch full course → update cache
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Course } from '@/lib/types';
import {
    getCachedCourse,
    setCachedCourse,
    isCacheValid
} from '@/lib/cache/course-cache';
import { blobToCourse } from '@/lib/storage/course-converter';
import { CourseBlob, CourseMeta, SectionCompact } from '@/lib/types/course-compact';

interface UseCachedCourseResult {
    course: Course | null;
    loading: boolean;
    error: string | null;
    isStale: boolean;
    refresh: () => Promise<void>;
}

interface CourseMetaResponse {
    id: string;
    meta: CourseMeta;
    sections: SectionCompact[];
    published?: {
        version: number;
        hash: string;
        tg_file_id: string;
    };
}

/**
 * Hook for fetching course with client-side caching
 */
export function useCachedCourse(courseId: string | null): UseCachedCourseResult {
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStale, setIsStale] = useState(false);

    const fetchCourse = useCallback(async (forceRefresh = false) => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Check cache first (for instant display)
            const cached = await getCachedCourse(courseId);

            if (cached && !forceRefresh) {
                console.log(`📦 [Hook] Found cached version ${cached.version}`);

                // Step 2: Fetch metadata ONLY to check version
                const metaResponse = await fetch(`/api/courses/${courseId}/meta`);

                if (metaResponse.ok) {
                    const meta = await metaResponse.json() as CourseMetaResponse;
                    const serverVersion = meta.published?.version || 0;

                    // Step 3: Version check
                    if (cached.version === serverVersion) {
                        console.log(`✅ [Hook] Cache valid (v${cached.version})`);
                        // Use cached blob - reconstruct full course
                        const fullCourse = blobToCourse(
                            courseId,
                            meta.meta,
                            meta.sections,
                            cached.blob
                        );
                        setCourse(fullCourse);
                        setIsStale(false);
                        setLoading(false);
                        return; // Done - used cache!
                    } else {
                        console.log(`🔄 [Hook] Version mismatch: cache v${cached.version} vs server v${serverVersion}`);
                        setIsStale(true);
                    }
                }
            }

            // Step 4: Fetch full course from API (cache miss or version mismatch)
            const response = await fetch(`/api/courses/${courseId}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch course: ${response.status}`);
            }

            const data = await response.json();
            setCourse(data);
            setIsStale(false);

            // Step 5: Update cache if course has blob structure
            if (data.published?.version) {
                console.log(`📥 [Hook] Fetched version ${data.published.version}, updating cache`);
            }
        } catch (err) {
            console.error('Course fetch error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');

            // Try to use stale cache on error
            const cached = await getCachedCourse(courseId);
            if (cached) {
                console.log('📦 [Hook] Using stale cache due to error');
                setIsStale(true);
            }
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    const refresh = useCallback(() => fetchCourse(true), [fetchCourse]);

    return { course, loading, error, isStale, refresh };
}

/**
 * Prefetch course into cache (for navigation optimization)
 */
export async function prefetchCourse(courseId: string): Promise<void> {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (response.ok) {
            console.log(`⚡ [Prefetch] Cached ${courseId}`);
        }
    } catch (error) {
        console.warn('Prefetch failed:', error);
    }
}
