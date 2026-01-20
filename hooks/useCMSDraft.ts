/**
 * Hook for CMS Draft Management
 * 
 * Uses IndexedDB for instant autosave (no API calls)
 * Only syncs to Telegram on explicit publish
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Course } from '@/lib/types';
import {
    saveDraftLocal,
    getDraftLocal,
    hasDirtyDraft,
    markDraftSynced
} from '@/lib/cache/draft-cache';

interface UseCMSDraftResult {
    course: Course | null;
    loading: boolean;
    saving: boolean;
    dirty: boolean;
    error: string | null;
    saveDraft: (course: Course) => void;
    publishDraft: () => Promise<boolean>;
    lastSaved: Date | null;
}

export function useCMSDraft(courseId: string | null): UseCMSDraftResult {
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load course: Local draft first, then API fallback
    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        const loadCourse = async () => {
            setLoading(true);
            setError(null);

            try {
                // Try local draft first (instant, no API)
                const localDraft = await getDraftLocal(courseId);

                if (localDraft) {
                    console.log('📂 Using local draft');
                    setCourse(localDraft);
                    setDirty(await hasDirtyDraft(courseId));
                    setLoading(false);
                    return;
                }

                // Fallback to API (may fail with quota)
                console.log('🌐 Fetching from API');
                const response = await fetch(`/api/courses/${courseId}`);

                if (!response.ok) {
                    throw new Error(`Failed to load: ${response.status}`);
                }

                const data = await response.json();
                setCourse(data);

                // Cache locally for future
                await saveDraftLocal(courseId, data);
                await markDraftSynced(courseId);

            } catch (err) {
                console.error('Load error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load course');
            } finally {
                setLoading(false);
            }
        };

        loadCourse();
    }, [courseId]);

    // Debounced autosave to IndexedDB (500ms delay)
    const saveDraft = useCallback((updatedCourse: Course) => {
        setCourse(updatedCourse);
        setDirty(true);

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save
        saveTimeoutRef.current = setTimeout(async () => {
            if (!courseId) return;

            setSaving(true);
            try {
                await saveDraftLocal(courseId, updatedCourse);
                setLastSaved(new Date());
            } catch (err) {
                console.error('Autosave error:', err);
            } finally {
                setSaving(false);
            }
        }, 500);
    }, [courseId]);

    // Publish: Upload to Telegram via API
    const publishDraft = useCallback(async (): Promise<boolean> => {
        if (!courseId || !course) return false;

        setSaving(true);
        setError(null);

        try {
            // Use the no-auth test endpoint for now
            const response = await fetch(`/api/admin/migrate-test?courseId=${courseId}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Publish failed');
            }

            const result = await response.json();
            console.log('✅ Published:', result);

            // Mark local draft as synced
            await markDraftSynced(courseId);
            setDirty(false);

            return true;
        } catch (err) {
            console.error('Publish error:', err);
            setError(err instanceof Error ? err.message : 'Publish failed');
            return false;
        } finally {
            setSaving(false);
        }
    }, [courseId, course]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        course,
        loading,
        saving,
        dirty,
        error,
        saveDraft,
        publishDraft,
        lastSaved,
    };
}
