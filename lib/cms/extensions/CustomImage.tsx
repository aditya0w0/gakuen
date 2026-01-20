"use client";

import { Node, mergeAttributes, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Upload, Wand2, Loader2, X, ImageIcon, Trash2, Pencil } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/authenticated-fetch';

// Helper to check if URL is external (not from our server)
function isExternalUrl(url: string): boolean {
    if (!url || url === '') return false;
    if (url.startsWith('data:')) return false;
    if (url.startsWith('blob:')) return false;
    if (url.includes('/api/images/')) return false;
    if (url.includes('drive.google.com')) return false;
    if (url.includes('googleusercontent.com')) return false;
    if (url.includes('vercel.app')) return false;
    if (url.includes('gakuen')) return false;
    if (url.startsWith('/')) return false;
    return url.startsWith('http://') || url.startsWith('https://');
}

// Track which URLs have been uploaded to prevent infinite re-upload loops
// This persists across component re-renders (module-level)
const uploadedUrls = new Set<string>();

// Custom Image Node View Component
function ImageNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPromptInput, setShowPromptInput] = useState(false);
    const [showEditInput, setShowEditInput] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [editPrompt, setEditPrompt] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track the last src we attempted to upload - survives re-renders
    const lastUploadedSrcRef = useRef<string | null>(null);
    const isUploadingRef = useRef(false);

    const { src, alt } = node.attrs;
    const hasImage = src && src !== '';

    // Auto-upload external images via server (bypasses CORS)
    // If upload fails, DELETE the image - never keep external URLs
    useEffect(() => {
        // Skip if already uploading, no src, or already processed this src
        if (isUploadingRef.current || !src) return;
        if (lastUploadedSrcRef.current === src) return;
        if (uploadedUrls.has(src)) return;
        if (!isExternalUrl(src)) return;

        // Mark as processed IMMEDIATELY (synchronously)
        lastUploadedSrcRef.current = src;
        uploadedUrls.add(src);
        isUploadingRef.current = true;

        console.log('🔄 Sending external image URL to server for upload:', src);
        setIsUploading(true);
        setUploadProgress(20);

        (async () => {
            try {
                const response = await authenticatedFetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: src }),
                });

                setUploadProgress(80);

                if (response.ok) {
                    const { url } = await response.json();
                    console.log('✅ Server-side upload successful:', url);
                    setUploadProgress(100);
                    updateAttributes({ src: url, alt: alt || 'Uploaded image' });
                } else {
                    console.warn('❌ Upload failed, deleting external image node');
                    deleteNode();
                }
            } catch (error) {
                console.error('❌ Auto-upload error, deleting node:', error);
                deleteNode();
            } finally {
                isUploadingRef.current = false;
                setIsUploading(false);
                setUploadProgress(0);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]); // Only depend on src - updateAttributes/deleteNode are stable

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(p => Math.min(p + 10, 90));
        }, 200);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'lesson');

            const response = await authenticatedFetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const { url } = await response.json();
                setUploadProgress(100);
                updateAttributes({ src: url, alt: file.name });
            } else {
                const error = await response.text();
                alert(`Upload failed: ${error}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            clearInterval(progressInterval);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            const response = await authenticatedFetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate image');
            }

            if (data.imageUrl) {
                // Upload to get permanent URL
                const uploadResponse = await authenticatedFetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: data.imageUrl }),
                });

                if (uploadResponse.ok) {
                    const { url } = await uploadResponse.json();
                    updateAttributes({ src: url, alt: prompt });
                } else {
                    updateAttributes({ src: data.imageUrl, alt: prompt });
                }

                setShowPromptInput(false);
                setPrompt("");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate image: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle AI image editing
    const handleEdit = async () => {
        if (!editPrompt.trim() || !src) return;

        setIsEditing(true);
        try {
            const response = await authenticatedFetch('/api/ai/edit-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: src, prompt: editPrompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to edit image');
            }

            if (data.imageUrl) {
                // Upload edited image to get permanent URL
                const uploadResponse = await authenticatedFetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: data.imageUrl }),
                });

                if (uploadResponse.ok) {
                    const { url } = await uploadResponse.json();
                    updateAttributes({ src: url, alt: alt || editPrompt });
                } else {
                    updateAttributes({ src: data.imageUrl, alt: alt || editPrompt });
                }

                setShowEditInput(false);
                setEditPrompt("");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to edit image: ${message}`);
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <NodeViewWrapper className="relative my-4">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            <div
                className={`group relative overflow-hidden rounded-xl transition-all ${selected
                    ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950'
                    : 'hover:ring-1 hover:ring-zinc-700'
                    } ${!hasImage || isUploading ? 'min-h-[200px]' : ''}`}
            >
                {hasImage && !isUploading ? (
                    /* Display image - external or local */
                    <img
                        src={src}
                        alt={alt || 'Image'}
                        className="max-w-full h-auto rounded-xl"
                        onError={(e) => {
                            console.warn('⚠️ Image failed to load:', src);
                            // If external URL failed, remove from Set so it can be retried
                            if (isExternalUrl(src)) {
                                uploadedUrls.delete(src);
                                lastUploadedSrcRef.current = null;
                            }
                            // Hide the broken image
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    /* Decorative placeholder - shown while uploading or no image */
                    <div className="relative h-48 bg-[#0f1014]">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-orange-500/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
                        <div className="absolute top-8 right-8 w-32 h-32 bg-orange-500/30 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-8 left-8 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"></div>
                    </div>
                )}

                {/* Upload Progress Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 rounded-xl">
                        <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
                        <div className="w-32 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <span className="text-xs text-zinc-400 mt-2">Uploading...</span>
                    </div>
                )}

                {/* Controls Overlay */}
                {!showPromptInput && !isUploading && (
                    <div className={`absolute inset-0 bg-black/40 ${hasImage ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm rounded-xl`}>
                        {/* Upload Button */}
                        <div
                            className="flex flex-col items-center justify-center space-y-2 text-white cursor-pointer hover:scale-105 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            <div className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                                <Upload size={24} />
                            </div>
                            <span className="text-sm font-medium">Upload</span>
                        </div>

                        {/* AI Generate Button */}
                        <div
                            className="flex flex-col items-center justify-center space-y-2 text-white cursor-pointer hover:scale-105 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPromptInput(true);
                            }}
                        >
                            <div className="p-3 bg-indigo-500/20 rounded-full backdrop-blur-md border border-indigo-400/30 shadow-xl text-indigo-300">
                                <Wand2 size={24} />
                            </div>
                            <span className="text-sm font-medium text-indigo-300">Generate</span>
                        </div>

                        {/* Edit Button (only when has image) */}
                        {hasImage && (
                            <div
                                className="flex flex-col items-center justify-center space-y-2 text-white cursor-pointer hover:scale-105 transition-transform"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEditInput(true);
                                }}
                            >
                                <div className="p-3 bg-amber-500/20 rounded-full backdrop-blur-md border border-amber-400/30 shadow-xl text-amber-300">
                                    <Pencil size={24} />
                                </div>
                                <span className="text-sm font-medium text-amber-300">Edit</span>
                            </div>
                        )}

                        {/* Delete Button (only when has image) */}
                        {hasImage && (
                            <div
                                className="flex flex-col items-center justify-center space-y-2 text-white cursor-pointer hover:scale-105 transition-transform"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNode();
                                }}
                            >
                                <div className="p-3 bg-red-500/20 rounded-full backdrop-blur-md border border-red-400/30 shadow-xl text-red-300">
                                    <Trash2 size={24} />
                                </div>
                                <span className="text-sm font-medium text-red-300">Delete</span>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Prompt Input Overlay */}
                {showPromptInput && (
                    <div
                        className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 z-10 rounded-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-full max-w-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    <Wand2 size={16} className="text-indigo-400" />
                                    Generate Image
                                </h4>
                                <button
                                    onClick={() => setShowPromptInput(false)}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want..."
                                className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleGenerate();
                                    }
                                }}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* AI Edit Prompt Input Overlay */}
                {showEditInput && (
                    <div
                        className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 z-10 rounded-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-full max-w-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    <Pencil size={16} className="text-amber-400" />
                                    Edit Image
                                </h4>
                                <button
                                    onClick={() => setShowEditInput(false)}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="Describe how to edit this image... e.g. 'make it more modern', 'add gradient background'"
                                className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleEdit();
                                    }
                                }}
                            />
                            <button
                                onClick={handleEdit}
                                disabled={isEditing || !editPrompt.trim()}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isEditing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Editing...
                                    </>
                                ) : (
                                    'Apply Edit'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}

// Custom Image Extension
export const CustomImage = Node.create({
    name: 'customImage',

    group: 'block',

    draggable: true,

    atom: true,

    addAttributes() {
        return {
            src: {
                default: '',
            },
            alt: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                // Match our custom image marker
                tag: 'img[data-custom-image]',
            },
            {
                // Match regular img tags with src (for pasted content)
                tag: 'img[src]',
                getAttrs: (dom: HTMLElement) => {
                    const src = dom.getAttribute('src');
                    // Skip data URLs that are too small (likely tracking pixels)
                    if (src?.startsWith('data:') && src.length < 100) {
                        return false;
                    }
                    // Skip common tracking/placeholder images
                    if (src?.includes('pixel') || src?.includes('spacer') || src?.includes('1x1')) {
                        return false;
                    }
                    return {
                        src: src || '',
                        alt: dom.getAttribute('alt') || '',
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes, { 'data-custom-image': '' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});

export default CustomImage;
