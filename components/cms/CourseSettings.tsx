"use client";

import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { useState } from "react";
import { Upload, Wand2, Loader2, X, Plus } from "lucide-react";

// Available course categories
const COURSE_CATEGORIES = [
    "Computer Science",
    "Web Development",
    "Data Science",
    "Machine Learning",
    "Mobile Development",
    "DevOps",
    "Cybersecurity",
    "Game Development",
    "UI/UX Design",
    "Cloud Computing",
];

// Available course levels
const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
type CourseLevel = typeof COURSE_LEVELS[number];

interface CourseSettingsProps {
    courseTitle: string;
    courseDescription: string;
    courseThumbnail?: string;
    courseAuthor?: string;
    courseCategory?: string;
    courseLevel?: CourseLevel;
    onTitleChange: (title: string) => void;
    onDescriptionChange: (description: string) => void;
    onThumbnailChange?: (url: string) => void;
    onAuthorChange?: (author: string) => void;
    onCategoryChange?: (category: string) => void;
    onLevelChange?: (level: CourseLevel) => void;
    createdAt?: string;
    lastModified?: string;
    isPublished?: boolean;
}

export function CourseSettings({
    courseTitle,
    courseDescription,
    courseThumbnail,
    courseAuthor,
    courseCategory,
    courseLevel,
    onTitleChange,
    onDescriptionChange,
    onThumbnailChange,
    onAuthorChange,
    onCategoryChange,
    onLevelChange,
    createdAt,
    lastModified,
    isPublished,
}: CourseSettingsProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [prompt, setPrompt] = useState("");

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleGenerateThumbnail = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            // Generate image
            const response = await authenticatedFetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error('Failed to generate');

            const data = await response.json();

            // Upload to get permanent URL (type: 'course' for course thumbnails)
            const uploadResponse = await authenticatedFetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: data.imageUrl, type: 'course' }),
            });

            if (uploadResponse.ok) {
                const { url } = await uploadResponse.json();
                onThumbnailChange?.(url);
                setShowPrompt(false);
                setPrompt("");
            } else {
                const error = await uploadResponse.text();
                alert(`Upload failed: ${error}`);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate thumbnail: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Status:</span>
                <span
                    className={`px-2 py-1 rounded text-xs font-medium ${isPublished
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                        }`}
                >
                    {isPublished ? "Published" : "Draft"}
                </span>
            </div>

            {/* Thumbnail */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Course Thumbnail
                </label>
                <div className="relative w-full h-64 bg-zinc-800 rounded-xl overflow-hidden group">
                    {/* Image or Placeholder */}
                    {courseThumbnail && courseThumbnail !== 'https://placehold.co/800x400' ? (
                        <img
                            src={courseThumbnail}
                            alt="Course thumbnail"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        /* Same decorative background as ImageBlock */
                        <div className="absolute inset-0 bg-[#0f1014]">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-orange-500/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
                            <div className="absolute top-10 right-10 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-10 left-10 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl"></div>
                        </div>
                    )}

                    {/* Controls Overlay - Same as ImageBlock */}
                    {!showPrompt && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                            {/* Upload Button */}
                            <div className="flex flex-col items-center justify-center space-y-2 text-white cursor-pointer hover:scale-105 transition-transform">
                                <div className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                                    <Upload size={24} />
                                </div>
                                <span className="text-sm font-medium">Upload</span>
                            </div>

                            {/* AI Generate Button */}
                            <div className="flex flex-col items-center justify-center space-y-2 text-white cursor-pointer hover:scale-105 transition-transform"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPrompt(true);
                                }}>
                                <div className="p-3 bg-indigo-500/20 rounded-full backdrop-blur-md border border-indigo-400/30 shadow-xl text-indigo-300">
                                    <Wand2 size={24} />
                                </div>
                                <span className="text-sm font-medium text-indigo-300">Generate</span>
                            </div>
                        </div>
                    )}

                    {/* AI Prompt Overlay - Same as ImageBlock */}
                    {showPrompt && (
                        <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 z-10" onClick={e => e.stopPropagation()}>
                            <div className="w-full max-w-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-white font-medium flex items-center gap-2">
                                        <Wand2 size={16} className="text-indigo-400" />
                                        Generate Thumbnail
                                    </h4>
                                    <button onClick={() => setShowPrompt(false)} className="text-zinc-500 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the thumbnail image..."
                                    className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerateThumbnail();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleGenerateThumbnail}
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
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Course Title
                </label>
                <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter course title"
                />
            </div>

            {/* Author */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Author / Instructor
                </label>
                <input
                    type="text"
                    value={courseAuthor || ''}
                    onChange={(e) => onAuthorChange?.(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter instructor name"
                />
            </div>

            {/* Category and Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Category
                    </label>
                    {showCustomCategory ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Enter custom category"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    if (customCategory.trim()) {
                                        onCategoryChange?.(customCategory.trim());
                                        setCustomCategory("");
                                    }
                                    setShowCustomCategory(false);
                                }}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setCustomCategory("");
                                    setShowCustomCategory(false);
                                }}
                                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <select
                                value={courseCategory || 'Uncategorized'}
                                onChange={(e) => onCategoryChange?.(e.target.value)}
                                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                            >
                                <option value="Uncategorized">Uncategorized</option>
                                {COURSE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                                {/* Show current category if it's custom and not in the list */}
                                {courseCategory && 
                                 !COURSE_CATEGORIES.includes(courseCategory) && 
                                 courseCategory !== 'Uncategorized' && (
                                    <option value={courseCategory}>{courseCategory}</option>
                                )}
                            </select>
                            <button
                                onClick={() => setShowCustomCategory(true)}
                                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center gap-1"
                                title="Add custom category"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Level */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Level
                    </label>
                    <select
                        value={courseLevel || 'beginner'}
                        onChange={(e) => onLevelChange?.(e.target.value as CourseLevel)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer capitalize"
                    >
                        {COURSE_LEVELS.map((level) => (
                            <option key={level} value={level} className="capitalize">
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                </label>
                <textarea
                    value={courseDescription}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Enter course description"
                />
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Metadata</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Created:</span>
                        <span className="text-zinc-300">{formatDate(createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Last Modified:</span>
                        <span className="text-zinc-300">{formatDate(lastModified)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
