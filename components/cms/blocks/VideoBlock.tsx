"use client";

import { VideoComponent } from "@/lib/cms/types";

interface VideoBlockProps {
    component: VideoComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;

    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\s]+)/,           // youtube.com/watch?v=VIDEO_ID
        /(?:youtube\.com\/embed\/)([^?\s]+)/,             // youtube.com/embed/VIDEO_ID
        /(?:youtube\.com\/v\/)([^?\s]+)/,                 // youtube.com/v/VIDEO_ID
        /(?:youtu\.be\/)([^?\s]+)/,                        // youtu.be/VIDEO_ID
        /(?:youtube\.com\/shorts\/)([^?\s]+)/,            // youtube.com/shorts/VIDEO_ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // If no pattern matches, assume the URL is already a video ID
    return url;
}

export function VideoBlock({ component, isEditing, isSelected, onSelect }: VideoBlockProps) {
    const containerStyle = {
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    const aspectRatioMap = {
        "16:9": "56.25%",
        "4:3": "75%",
        "1:1": "100%",
    };

    const paddingBottom = aspectRatioMap[component.aspectRatio || "16:9"];
    const videoId = getYouTubeVideoId(component.url);

    if (!videoId) {
        return (
            <div style={containerStyle} className="text-center text-neutral-400 p-8 bg-neutral-800 rounded-lg">
                Invalid YouTube URL
            </div>
        );
    }

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={containerStyle}
                className={`group cursor-pointer rounded-lg transition-all ${isSelected ? "ring-2 ring-indigo-500 p-2 bg-indigo-500/10" : "hover:bg-white/5 p-2"
                    }`}
            >
                <div className="relative w-full" style={{ paddingBottom }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="absolute inset-0 w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                {component.caption && <p className="text-sm text-neutral-400 mt-2">{component.caption}</p>}
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div className="relative w-full" style={{ paddingBottom }}>
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            {component.caption && <p className="text-sm text-neutral-400 mt-2">{component.caption}</p>}
        </div>
    );
}
