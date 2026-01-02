"use client";

import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { ImageComponent } from "@/lib/cms/types";
import { Upload, ImageIcon, Wand2, Loader2, X } from "lucide-react";
import { useState, useRef } from "react";
import { useUpload } from "@/lib/hooks/useUpload";

interface ImageBlockProps {
    component: ImageComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onUpdate?: (component: ImageComponent) => void;
    onSelect?: () => void;
}

export function ImageBlock({
    component,
    isEditing,
    isSelected,
    onUpdate,
    onSelect,
}: ImageBlockProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPromptInput, setShowPromptInput] = useState(false);
    const [prompt, setPrompt] = useState("");

    // File upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload, isUploading, progress } = useUpload({
        type: 'cms',
        id: component.id,
        onSuccess: (result) => {
            if (onUpdate) {
                onUpdate({ ...component, url: result.url });
            }
        }
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await upload(file);
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

            if (data.imageUrl && onUpdate) {
                // Upload image to get permanent URL
                const uploadResponse = await authenticatedFetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: data.imageUrl }),
                });

                if (uploadResponse.ok) {
                    const { url } = await uploadResponse.json();
                    onUpdate({ ...component, url });
                } else {
                    // Fallback to data URL if upload fails
                    onUpdate({ ...component, url: data.imageUrl });
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

    const containerStyle = {
        textAlign: component.align || "center",
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    const imgStyle = {
        width: component.width === "auto" ? "100%" : `${component.width}px`,
        borderRadius: component.borderRadius ? `${component.borderRadius}px` : undefined,
    };

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={containerStyle}
                className={`group relative rounded-xl transition-all ${isSelected ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950" : "hover:ring-1 hover:ring-zinc-700"
                    }`}
            >
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Image or Placeholder */}
                <div className={`relative overflow-hidden bg-zinc-800 ${!component.url || component.url === "https://placehold.co/800x400" ? "h-64" : ""}`} style={{ borderRadius: component.borderRadius ? `${component.borderRadius}px` : '8px' }}>
                    {component.url && component.url !== "https://placehold.co/800x400" ? (
                        <img
                            src={component.url}
                            alt={component.alt || "Image"}
                            style={imgStyle}
                            className="max-w-full h-auto"
                        />
                    ) : (
                        /* Abstract decorative background from reference */
                        <div className="absolute inset-0 bg-[#0f1014]">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-orange-500/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
                            <div className="absolute top-10 right-10 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-10 left-10 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl"></div>
                        </div>
                    )}

                    {/* Upload Progress Overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                            <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
                            <div className="w-32 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-zinc-400 mt-2">Converting to WebP...</span>
                        </div>
                    )}

                    {/* Controls Overlay */}
                    {!showPromptInput && !isUploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
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
                            <div className="flex flex-col items-center justify-center space-y-2 text-white cursor-pointer hover:scale-105 transition-transform"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPromptInput(true);
                                }}>
                                <div className="p-3 bg-indigo-500/20 rounded-full backdrop-blur-md border border-indigo-400/30 shadow-xl text-indigo-300">
                                    <Wand2 size={24} />
                                </div>
                                <span className="text-sm font-medium text-indigo-300">Generate</span>
                            </div>
                        </div>
                    )}

                    {/* AI Prompt Input Overlay */}
                    {showPromptInput && (
                        <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 z-10" onClick={e => e.stopPropagation()}>
                            <div className="w-full max-w-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-white font-medium flex items-center gap-2">
                                        <Wand2 size={16} className="text-indigo-400" />
                                        Generate Image
                                    </h4>
                                    <button onClick={() => setShowPromptInput(false)} className="text-zinc-500 hover:text-white">
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
                </div>

                {component.caption && (
                    <p className="text-sm text-zinc-500 mt-2 text-center">{component.caption}</p>
                )}
            </div>
        );
    }

    // View Mode
    return (
        <div style={containerStyle}>
            {component.url && component.url !== "https://placehold.co/800x400" ? (
                <img
                    src={component.url}
                    alt={component.alt || "Image"}
                    style={imgStyle}
                    className="max-w-full h-auto"
                />
            ) : (
                <div className="w-full h-64 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                    <ImageIcon size={48} />
                </div>
            )}
            {component.caption && (
                <p className="text-sm text-zinc-500 mt-2 text-center">{component.caption}</p>
            )}
        </div>
    );
}
