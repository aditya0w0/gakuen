/**
 * Hook for Per-Block Native Editing
 * 
 * Enables granular block-level autosave directly to IndexedDB
 * using the normalized BlockCompact format.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { BlockCompact } from '@/lib/types/course-compact';
import {
    saveBlock,
    getCourseBlocks,
    saveLessonStructure,
    getLessonStructure,
    getDirtyBlocks
} from '@/lib/cache/block-cache';
import {
    tiptapToBlocks,
    blocksToTiptap,
    blocksDiffer
} from '@/lib/cms/tiptap-to-blocks';

interface UseBlockEditorOptions {
    courseId: string;
    lessonId: string;
    editor: Editor | null;
    debounceMs?: number;
}

interface UseBlockEditorResult {
    loading: boolean;
    saving: boolean;
    dirtyCount: number;
    lastSaved: Date | null;
    error: string | null;
    loadContent: () => Promise<void>;
    forceSync: () => Promise<void>;
}

export function useBlockEditor({
    courseId,
    lessonId,
    editor,
    debounceMs = 500,
}: UseBlockEditorOptions): UseBlockEditorResult {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirtyCount, setDirtyCount] = useState(0);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Track previous blocks for diffing
    const prevBlocksRef = useRef<Record<string, BlockCompact>>({});
    const blockIdsRef = useRef<string[]>([]);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load existing content from IndexedDB
    const loadContent = useCallback(async () => {
        if (!editor || !courseId || !lessonId) return;

        setLoading(true);
        setError(null);

        try {
            // Get lesson structure
            const lessonData = await getLessonStructure(courseId, lessonId);

            if (lessonData) {
                // Get blocks
                const blocks = await getCourseBlocks(courseId);

                // Filter to this lesson's blocks in order
                const lessonBlocks = lessonData.blockIds
                    .map(id => blocks[id])
                    .filter(Boolean);

                if (lessonBlocks.length > 0) {
                    // Convert to TipTap format and load
                    const doc = blocksToTiptap(lessonBlocks);
                    editor.commands.setContent(doc);

                    prevBlocksRef.current = blocks;
                    blockIdsRef.current = lessonData.blockIds;

                    console.log(`📂 [Blocks] Loaded ${lessonBlocks.length} blocks for ${lessonId}`);
                }
            }
        } catch (err) {
            console.error('Load blocks error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [editor, courseId, lessonId]);

    // Save changed blocks on editor update
    const handleEditorUpdate = useCallback(async () => {
        if (!editor || !courseId || !lessonId) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save
        saveTimeoutRef.current = setTimeout(async () => {
            setSaving(true);

            try {
                const doc = editor.getJSON();
                const { blocks, blockIds } = tiptapToBlocks(doc, courseId, blockIdsRef.current);

                // Save only changed blocks
                let savedCount = 0;
                for (const block of blocks) {
                    const prevBlock = prevBlocksRef.current[block.id];

                    if (!prevBlock || blocksDiffer(prevBlock, block)) {
                        await saveBlock(courseId, block.id, block);
                        prevBlocksRef.current[block.id] = block;
                        savedCount++;
                    }
                }

                // Save lesson structure if block order changed
                if (JSON.stringify(blockIds) !== JSON.stringify(blockIdsRef.current)) {
                    await saveLessonStructure(courseId, lessonId, '', blockIds);
                    blockIdsRef.current = blockIds;
                }

                if (savedCount > 0) {
                    setLastSaved(new Date());
                    console.log(`💾 [Blocks] Saved ${savedCount} changed block(s)`);
                }

                // Update dirty count
                const dirty = await getDirtyBlocks(courseId);
                setDirtyCount(dirty.length);

            } catch (err) {
                console.error('Save blocks error:', err);
                setError(err instanceof Error ? err.message : 'Failed to save');
            } finally {
                setSaving(false);
            }
        }, debounceMs);
    }, [editor, courseId, lessonId, debounceMs]);

    // Subscribe to editor updates
    useEffect(() => {
        if (!editor) return;

        editor.on('update', handleEditorUpdate);
        return () => {
            editor.off('update', handleEditorUpdate);
        };
    }, [editor, handleEditorUpdate]);

    // Load content on mount
    useEffect(() => {
        loadContent();
    }, [loadContent]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Force sync all dirty blocks
    const forceSync = useCallback(async () => {
        const dirty = await getDirtyBlocks(courseId);
        console.log(`🔄 Force sync: ${dirty.length} dirty blocks`);
        // TODO: Trigger checkpoint sync
        setDirtyCount(dirty.length);
    }, [courseId]);

    return {
        loading,
        saving,
        dirtyCount,
        lastSaved,
        error,
        loadContent,
        forceSync,
    };
}
