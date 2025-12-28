"use client";

import { VideoComponent } from "@/lib/cms/types";
import { useState } from "react";

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
        /(?:youtube\.com\/live\/)([^?\s]+)/,              // youtube.com/live/VIDEO_ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            // Clean up the video ID (remove any trailing characters)
            return match[1].split('?')[0].split('&')[0];
        }
    }

    // If no pattern matches, check if it's already a valid video ID (11 chars alphanumeric)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

export function VideoBlock({ component, isEditing, isSelected, onSelect }: VideoBlockProps) {
    const [hasError, setHasError] = useState(false);

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
                <p className="font-medium">Invalid YouTube URL</p>
                <p className="text-sm mt-1 text-neutral-500">Please check the video URL</p>
            </div>
        );
    }

    // Build embed URL with proper parameters to avoid Error 150/153
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

    if (hasError) {
        return (
            <div style={containerStyle} className="text-center text-neutral-400 p-8 bg-neutral-800 rounded-lg">
                <p className="font-medium">Video unavailable</p>
                <p className="text-sm mt-1 text-neutral-500">This video cannot be embedded</p>
                <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                >
                    Watch on YouTube →
                </a>
            </div>
        );
    }

    const iframeElement = (
        <div className="relative w-full" style={{ paddingBottom }}>
            <iframe
                src={embedUrl}
                title={component.caption || "YouTube video"}
                className="absolute inset-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                onError={() => setHasError(true)}
            />
        </div>
    );

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={containerStyle}
                className={`group cursor-pointer rounded-lg transition-all ${isSelected ? "ring-2 ring-indigo-500 p-2 bg-indigo-500/10" : "hover:bg-white/5 p-2"
                    }`}
            >
                {iframeElement}
                {component.caption && <p className="text-sm text-neutral-400 mt-2">{component.caption}</p>}
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {iframeElement}
            {component.caption && <p className="text-sm text-neutral-400 mt-2">{component.caption}</p>}
        </div>
    );
}
