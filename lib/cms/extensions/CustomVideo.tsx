"use client";

import { Node, mergeAttributes, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, X, Video, Trash2, Link } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/authenticated-fetch';

// Helper to check if URL is external (not from our server)
function isExternalUrl(url: string): boolean {
    if (!url || url === '') return false;
    if (url.startsWith('data:')) return false;
    if (url.startsWith('blob:')) return false;
    if (url.includes('/api/videos/')) return false;
    if (url.includes('/api/images/')) return false;
    if (url.includes('drive.google.com')) return false;
    if (url.includes('googleusercontent.com')) return false;
    if (url.includes('vercel.app')) return false;
    if (url.includes('gakuen')) return false;
    if (url.startsWith('/')) return false;
    return url.startsWith('http://') || url.startsWith('https://');
}

// Track which URLs have been uploaded to prevent infinite re-upload loops
const uploadedUrls = new Set<string>();

// Video Node View Component
function VideoNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track the last src we attempted to upload
    const lastUploadedSrcRef = useRef<string | null>(null);
    const isUploadingRef = useRef(false);

    const { src, poster } = node.attrs;
    const hasVideo = src && src !== '';

    // Auto-upload external videos via server (bypasses CORS)
    useEffect(() => {
        if (isUploadingRef.current || !src) return;
        if (lastUploadedSrcRef.current === src) return;
        if (uploadedUrls.has(src)) return;
        if (!isExternalUrl(src)) return;

        // Mark as processed IMMEDIATELY
        lastUploadedSrcRef.current = src;
        uploadedUrls.add(src);
        isUploadingRef.current = true;

        console.log('🔄 Sending external video URL to server for upload:', src);
        setIsUploading(true);
        setUploadProgress(20);

        (async () => {
            try {
                const response = await authenticatedFetch('/api/upload-video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ video: src }),
                });

                setUploadProgress(80);

                if (response.ok) {
                    const { url } = await response.json();
                    console.log('✅ Video upload successful:', url);
                    setUploadProgress(100);
                    updateAttributes({ src: url });
                } else {
                    console.warn('❌ Video upload failed, deleting node');
                    deleteNode();
                }
            } catch (error) {
                console.error('❌ Video auto-upload error:', error);
                deleteNode();
            } finally {
                isUploadingRef.current = false;
                setIsUploading(false);
                setUploadProgress(0);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate video type
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file');
            return;
        }

        // Max 100MB for video
        if (file.size > 100 * 1024 * 1024) {
            alert('Video too large. Max size: 100MB');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
            setUploadProgress(p => Math.min(p + 5, 90));
        }, 500);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'video');

            const response = await authenticatedFetch('/api/upload-video', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const { url } = await response.json();
                setUploadProgress(100);
                updateAttributes({ src: url });
            } else {
                const error = await response.text();
                alert(`Upload failed: ${error}`);
            }
        } catch (error) {
            console.error('Video upload error:', error);
            alert('Failed to upload video');
        } finally {
            clearInterval(progressInterval);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleUrlSubmit = async () => {
        if (!urlInput.trim()) return;

        // Check if it's a direct video URL
        const isVideoUrl = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(urlInput) ||
            urlInput.includes('video') ||
            urlInput.includes('.mp4') ||
            urlInput.includes('.webm');

        if (!isVideoUrl) {
            // Try to use it anyway - let the server validate
            console.log('URL may not be a video, attempting anyway:', urlInput);
        }

        updateAttributes({ src: urlInput });
        setShowUrlInput(false);
        setUrlInput('');
    };

    return (
        <NodeViewWrapper className="relative my-4">
            <div
                className={`group relative overflow-hidden rounded-xl transition-all ${
                    selected
                        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950'
                        : 'hover:ring-1 hover:ring-zinc-700'
                } ${!hasVideo ? 'min-h-[200px]' : ''}`}
            >
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {hasVideo ? (
                    /* Video Player */
                    <div className="relative bg-black rounded-xl overflow-hidden">
                        <video
                            src={src}
                            poster={poster}
                            controls
                            className="w-full max-h-[500px]"
                            preload="metadata"
                        >
                            Your browser does not support the video tag.
                        </video>

                        {/* Upload progress overlay */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                <span className="text-white text-sm">Re-uploading video... {uploadProgress}%</span>
                                <div className="w-48 h-1 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Hover controls */}
                        {!isUploading && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                                    title="Replace video"
                                >
                                    <Upload size={16} />
                                </button>
                                <button
                                    onClick={() => setShowUrlInput(true)}
                                    className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                                    title="Change URL"
                                >
                                    <Link size={16} />
                                </button>
                                <button
                                    onClick={() => deleteNode()}
                                    className="p-2 bg-red-600/60 hover:bg-red-600 rounded-full text-white transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Placeholder - no video yet */
                    <div
                        className="relative h-48 bg-gradient-to-br from-blue-950/50 to-zinc-900 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
                                <span className="text-zinc-400 text-sm">Uploading... {uploadProgress}%</span>
                                <div className="w-48 h-1 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-blue-600/20 rounded-full mb-3">
                                    <Video size={32} className="text-blue-500" />
                                </div>
                                <span className="text-zinc-400 text-sm">Click to upload video</span>
                                <span className="text-zinc-600 text-xs mt-1">or paste video URL</span>
                            </>
                        )}

                        {/* URL input button */}
                        {!isUploading && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUrlInput(true);
                                }}
                                className="absolute bottom-3 right-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
                            >
                                <Link size={12} />
                                URL
                            </button>
                        )}
                    </div>
                )}

                {/* URL Input Overlay */}
                {showUrlInput && (
                    <div
                        className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 z-10 rounded-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-full max-w-md space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    <Video size={16} className="text-blue-500" />
                                    Add Video URL
                                </h4>
                                <button
                                    onClick={() => setShowUrlInput(false)}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="Paste video URL... (mp4, webm, etc.)"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleUrlSubmit();
                                    }
                                }}
                                autoFocus
                            />
                            <button
                                onClick={handleUrlSubmit}
                                disabled={!urlInput.trim()}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Video size={16} />
                                Add Video
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}

// Custom Video Extension for TipTap
export const CustomVideo = Node.create({
    name: 'customVideo',

    group: 'block',

    atom: true,

    draggable: true,

    addAttributes() {
        return {
            src: {
                default: '',
            },
            poster: {
                default: '',
            },
            title: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'video[src]',
            },
            {
                tag: 'div[data-type="video"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(HTMLAttributes, { controls: true })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(VideoNodeView);
    },
});

export default CustomVideo;
