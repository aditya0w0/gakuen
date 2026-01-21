"use client";

import { useRef, useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { useUpload } from '@/lib/hooks/useUpload';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
    userId: string;
    currentAvatar?: string;
    onUpload: (url: string) => void;
    size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
};

export function AvatarUpload({ userId, currentAvatar, onUpload, size = 'md' }: AvatarUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { upload, isUploading } = useUpload({
        type: 'avatar',
        id: userId,
        onSuccess: (result) => {
            setPreview(result.url);
            onUpload(result.url);
        }
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show instant preview
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Upload
        await upload(file);
    };

    const displayImage = preview || currentAvatar;

    return (
        <div className="relative group">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                    "rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center transition-all",
                    "hover:ring-2 hover:ring-blue-500/50",
                    SIZES[size]
                )}
            >
                {displayImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={displayImage}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User className="w-1/2 h-1/2 text-zinc-500" />
                )}

                {/* Overlay */}
                <div className={cn(
                    "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full",
                    isUploading && "opacity-100"
                )}>
                    {isUploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                        <Camera className="w-6 h-6 text-white" />
                    )}
                </div>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
