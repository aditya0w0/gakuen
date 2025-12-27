"use client";

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { useUpload } from '@/lib/hooks/useUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    type: 'course' | 'lesson' | 'cms';
    id?: string;
    courseId?: string;
    currentImage?: string;
    onUpload: (url: string, metadata?: { width: number; height: number }) => void;
    onRemove?: () => void;
    aspectRatio?: 'square' | 'video' | 'banner' | 'free';
    className?: string;
}

const ASPECT_RATIOS = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
    free: ''
};

export function ImageUpload({
    type,
    id,
    courseId,
    currentImage,
    onUpload,
    onRemove,
    aspectRatio = 'video',
    className
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const { upload, isUploading, progress } = useUpload({
        type,
        id,
        courseId,
        onSuccess: (result) => {
            setPreview(result.url);
            onUpload(result.url, { width: result.width, height: result.height });
        }
    });

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        // Show instant preview
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Upload
        await upload(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const displayImage = preview || currentImage;

    return (
        <div className={cn("relative group", className)}>
            <div
                onClick={() => !displayImage && inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative overflow-hidden rounded-xl border-2 border-dashed transition-all cursor-pointer",
                    ASPECT_RATIOS[aspectRatio],
                    displayImage
                        ? "border-transparent"
                        : isDragging
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-700 hover:border-zinc-600 bg-zinc-900",
                    isUploading && "pointer-events-none"
                )}
            >
                {displayImage ? (
                    <>
                        <img
                            src={displayImage}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                        />

                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    inputRef.current?.click();
                                }}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                            >
                                <ImagePlus className="w-5 h-5" />
                            </button>
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreview(null);
                                        onRemove();
                                    }}
                                    className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                        <ImageIcon className="w-10 h-10 mb-2" />
                        <span className="text-sm">Drop image or click to upload</span>
                        <span className="text-xs text-zinc-600 mt-1">Auto-converts to WebP</span>
                    </div>
                )}

                {/* Upload progress */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                        <div className="w-32 h-1 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-zinc-400 mt-2">Compressing...</span>
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    );
}
