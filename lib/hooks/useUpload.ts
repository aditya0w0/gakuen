"use client";

import { useState, useCallback } from 'react';

interface UploadResult {
    url: string;
    width: number;
    height: number;
    size: number;
    filename: string;
}

interface UseUploadOptions {
    type: 'avatar' | 'course' | 'lesson' | 'cms';
    id?: string;
    courseId?: string; // For lesson uploads
    onSuccess?: (result: UploadResult) => void;
    onError?: (error: string) => void;
}

export function useUpload({ type, id, courseId, onSuccess, onError }: UseUploadOptions) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
        setIsUploading(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            if (id) formData.append('id', id);
            if (courseId) formData.append('courseId', courseId);

            setProgress(30);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            setProgress(80);

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setProgress(100);
            onSuccess?.(data);
            return data;

        } catch (error: any) {
            onError?.(error.message);
            return null;
        } finally {
            setIsUploading(false);
            setTimeout(() => setProgress(0), 500);
        }
    }, [type, id, courseId, onSuccess, onError]);

    return { upload, isUploading, progress };
}
