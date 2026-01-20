"use client";

import { Node, mergeAttributes, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useState } from 'react';
import { Youtube, Link, X, Trash2 } from 'lucide-react';

// Extract YouTube Video ID from various URL formats
function extractYouTubeId(url: string): string | null {
    if (!url) return null;

    // Handle various YouTube URL formats:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    // - https://www.youtube.com/v/VIDEO_ID
    // - https://youtube.com/shorts/VIDEO_ID

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/, // Just the ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

// Check if string is a YouTube URL
export function isYouTubeUrl(text: string): boolean {
    return (
        text.includes('youtube.com/watch') ||
        text.includes('youtu.be/') ||
        text.includes('youtube.com/embed') ||
        text.includes('youtube.com/shorts')
    );
}

// YouTube Node View Component
function YouTubeNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const { videoId, title } = node.attrs;
    const hasVideo = videoId && videoId !== '';

    const handleUrlSubmit = () => {
        const id = extractYouTubeId(urlInput);
        if (id) {
            updateAttributes({ videoId: id, title: title || 'YouTube Video' });
            setShowUrlInput(false);
            setUrlInput('');
        } else {
            alert('Invalid YouTube URL. Please enter a valid YouTube link.');
        }
    };

    return (
        <NodeViewWrapper className="relative my-4">
            <div
                className={`group relative overflow-hidden rounded-xl transition-all ${selected
                        ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950'
                        : 'hover:ring-1 hover:ring-zinc-700'
                    } ${!hasVideo ? 'min-h-[200px]' : ''}`}
            >
                {hasVideo ? (
                    /* YouTube Embed */
                    <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden">
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                            title={title || 'YouTube Video'}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />

                        {/* Hover controls */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={() => setShowUrlInput(true)}
                                className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                                title="Change video"
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
                    </div>
                ) : (
                    /* Placeholder - no video yet */
                    <div
                        className="relative h-48 bg-gradient-to-br from-red-950/50 to-zinc-900 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setShowUrlInput(true)}
                    >
                        <div className="p-4 bg-red-600/20 rounded-full mb-3">
                            <Youtube size={32} className="text-red-500" />
                        </div>
                        <span className="text-zinc-400 text-sm">Click to add YouTube video</span>
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
                                    <Youtube size={16} className="text-red-500" />
                                    Add YouTube Video
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
                                placeholder="Paste YouTube URL... (e.g., https://youtube.com/watch?v=...)"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
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
                                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Embed Video
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}

// Custom YouTube Extension
export const CustomYouTube = Node.create({
    name: 'customYoutube',

    group: 'block',

    draggable: true,

    atom: true,

    addAttributes() {
        return {
            videoId: {
                default: '',
            },
            title: {
                default: 'YouTube Video',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-youtube-embed]',
                getAttrs: (dom: HTMLElement) => ({
                    videoId: dom.getAttribute('data-video-id') || '',
                    title: dom.getAttribute('data-title') || 'YouTube Video',
                }),
            },
            {
                // Parse YouTube iframes from pasted HTML
                tag: 'iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]',
                getAttrs: (dom: HTMLElement) => {
                    const src = dom.getAttribute('src') || '';
                    const id = extractYouTubeId(src);
                    return id ? { videoId: id, title: dom.getAttribute('title') || 'YouTube Video' } : false;
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-youtube-embed': '',
            'data-video-id': HTMLAttributes.videoId,
            'data-title': HTMLAttributes.title,
        }),
            ['iframe', {
                src: `https://www.youtube.com/embed/${HTMLAttributes.videoId}?rel=0`,
                title: HTMLAttributes.title,
                frameborder: '0',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                allowfullscreen: 'true',
                style: 'width: 100%; aspect-ratio: 16/9;',
            }]
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(YouTubeNodeView);
    },
});

// Export helper for smart detection
export { extractYouTubeId };
export default CustomYouTube;
