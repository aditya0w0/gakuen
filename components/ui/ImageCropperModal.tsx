"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";

interface ImageCropperModalProps {
    imageUrl: string;
    isOpen: boolean;
    onClose: () => void;
    onApply: (croppedImageBlob: Blob) => void;
}

export function ImageCropperModal({
    imageUrl,
    isOpen,
    onClose,
    onApply,
}: ImageCropperModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isApplying, setIsApplying] = useState(false);

    const CROP_SIZE = 300;

    // Load image
    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImage(img);
            setPosition({ x: 0, y: 0 });
            const minDimension = Math.min(img.width, img.height);
            setZoom(CROP_SIZE / minDimension);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Draw preview
    useEffect(() => {
        if (!canvasRef.current || !image) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

        const scaledWidth = image.width * zoom;
        const scaledHeight = image.height * zoom;
        const x = (CROP_SIZE - scaledWidth) / 2 + position.x;
        const y = (CROP_SIZE - scaledHeight) / 2 + position.y;

        ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    }, [image, zoom, position]);

    // Drag handlers
    const handleDragStart = useCallback((clientX: number, clientY: number) => {
        setIsDragging(true);
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    }, [position]);

    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging) return;
        setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    }, [isDragging, dragStart]);

    const handleDragEnd = useCallback(() => setIsDragging(false), []);

    // Apply crop
    const handleApply = async () => {
        if (!canvasRef.current || !image) return;
        setIsApplying(true);

        const outputCanvas = document.createElement("canvas");
        const outputSize = 512;
        outputCanvas.width = outputSize;
        outputCanvas.height = outputSize;

        const ctx = outputCanvas.getContext("2d");
        if (!ctx) return;

        const scale = outputSize / CROP_SIZE;
        const scaledWidth = image.width * zoom * scale;
        const scaledHeight = image.height * zoom * scale;
        const x = (outputSize - scaledWidth) / 2 + position.x * scale;
        const y = (outputSize - scaledHeight) / 2 + position.y * scale;

        ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

        outputCanvas.toBlob((blob) => {
            if (blob) onApply(blob);
            setIsApplying(false);
        }, "image/jpeg", 0.9);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop - Apple blur */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal - Apple style */}
            <div className="relative bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-[28px] max-w-[380px] w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                {/* Header */}
                <div className="relative flex items-center justify-center px-4 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
                    <button
                        onClick={onClose}
                        className="absolute left-4 text-blue-500 dark:text-blue-400 font-medium text-[17px] hover:text-blue-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <h2 className="text-[17px] font-semibold text-neutral-900 dark:text-white">
                        Move and Scale
                    </h2>
                    <button
                        onClick={handleApply}
                        disabled={isApplying}
                        className="absolute right-4 text-blue-500 dark:text-blue-400 font-semibold text-[17px] hover:text-blue-600 transition-colors disabled:opacity-50"
                    >
                        {isApplying ? "..." : "Choose"}
                    </button>
                </div>

                {/* Crop Area */}
                <div className="p-6 flex flex-col items-center">
                    <div
                        className="relative overflow-hidden bg-black"
                        style={{
                            width: CROP_SIZE,
                            height: CROP_SIZE,
                            borderRadius: "50%",
                        }}
                        onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
                        onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                        onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
                        onTouchEnd={handleDragEnd}
                    >
                        <canvas
                            ref={canvasRef}
                            className="cursor-move"
                            style={{
                                width: CROP_SIZE,
                                height: CROP_SIZE,
                                borderRadius: "50%",
                            }}
                        />
                    </div>

                    {/* Zoom Slider - Apple style */}
                    <div className="w-full mt-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                            </div>
                            <input
                                type="range"
                                min={0.5}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-neutral-200 dark:bg-neutral-700"
                                style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - 0.5) / 2.5) * 100}%, #e5e5e5 ${((zoom - 0.5) / 2.5) * 100}%, #e5e5e5 100%)`,
                                }}
                            />
                            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-neutral-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
