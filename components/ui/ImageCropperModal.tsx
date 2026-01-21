"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCropperModalProps {
    imageUrl: string;
    isOpen: boolean;
    onClose: () => void;
    onApply: (croppedImageBlob: Blob) => void;
    aspectRatio?: number; // 1 for square, undefined for free
}

export function ImageCropperModal({
    imageUrl,
    isOpen,
    onClose,
    onApply,
    aspectRatio = 1,
}: ImageCropperModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isApplying, setIsApplying] = useState(false);

    const CROP_SIZE = 280; // Size of the crop area

    // Load image when URL changes
    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImage(img);
            // Center the image initially
            setPosition({ x: 0, y: 0 });
            // Set initial zoom to fit the crop area
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

        // Clear canvas
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

        // Calculate scaled dimensions
        const scaledWidth = image.width * zoom;
        const scaledHeight = image.height * zoom;

        // Draw image centered with offset
        const x = (CROP_SIZE - scaledWidth) / 2 + position.x;
        const y = (CROP_SIZE - scaledHeight) / 2 + position.y;

        ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    }, [image, zoom, position]);

    // Handle mouse/touch drag
    const handleDragStart = useCallback((clientX: number, clientY: number) => {
        setIsDragging(true);
        setDragStart({
            x: clientX - position.x,
            y: clientY - position.y,
        });
    }, [position]);

    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging) return;
        setPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    // Apply crop
    const handleApply = async () => {
        if (!canvasRef.current || !image) return;

        setIsApplying(true);

        // Create output canvas at higher resolution
        const outputCanvas = document.createElement("canvas");
        const outputSize = 512; // Output size
        outputCanvas.width = outputSize;
        outputCanvas.height = outputSize;

        const ctx = outputCanvas.getContext("2d");
        if (!ctx) return;

        // Scale factor from preview to output
        const scale = outputSize / CROP_SIZE;

        // Calculate scaled dimensions
        const scaledWidth = image.width * zoom * scale;
        const scaledHeight = image.height * zoom * scale;

        // Draw image
        const x = (outputSize - scaledWidth) / 2 + position.x * scale;
        const y = (outputSize - scaledHeight) / 2 + position.y * scale;

        ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

        // Convert to blob
        outputCanvas.toBlob(
            (blob) => {
                if (blob) {
                    onApply(blob);
                }
                setIsApplying(false);
            },
            "image/jpeg",
            0.9
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        Adjust Image
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Crop Area */}
                <div
                    ref={containerRef}
                    className="relative mx-auto mb-6 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800"
                    style={{ width: CROP_SIZE, height: CROP_SIZE }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Canvas for preview */}
                    <canvas
                        ref={canvasRef}
                        className="cursor-move"
                        style={{ width: CROP_SIZE, height: CROP_SIZE }}
                    />

                    {/* Circular overlay mask */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.6) 45%)`,
                        }}
                    />

                    {/* Border */}
                    <div
                        className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    >
                        <div
                            className="border-2 border-white/80 rounded-full"
                            style={{ width: CROP_SIZE * 0.9, height: CROP_SIZE * 0.9 }}
                        />
                    </div>
                </div>

                {/* Zoom Slider */}
                <div className="flex items-center gap-4 mb-6 px-4">
                    <ZoomOut className="w-4 h-4 text-neutral-400" />
                    <input
                        type="range"
                        min={0.5}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <ZoomIn className="w-4 h-4 text-neutral-400" />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={isApplying}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isApplying ? "Applying..." : "Apply"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
