"use client";

import { Course, Lesson } from "@/lib/constants/demo-data";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, GripVertical, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";

interface CourseEditorProps {
    course: Course | null;
    onClose: () => void;
    onSave: (course: Course) => void;
}

export function CourseEditor({ course, onClose, onSave }: CourseEditorProps) {
    const [formData, setFormData] = useState<Partial<Course>>({});
    const [currentTab, setCurrentTab] = useState<"details" | "content">("details");
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    useEffect(() => {
        if (course) {
            setFormData(course);
            setLessons(course.lessons || []);
        }
    }, [course]);

    if (!course) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedCourse = { ...formData, lessons } as Course;
        onSave(updatedCourse);
    };

    const handleChange = (field: keyof Course, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddLesson = () => {
        const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            title: "New Lesson",
            type: "article",
            duration: "10 min",
            content: "Lesson content goes here...",
        };
        setLessons([...lessons, newLesson]);
        setEditingLesson(newLesson);
    };

    const handleUpdateLesson = (updatedLesson: Lesson) => {
        setLessons(lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l));
        setEditingLesson(null);
    };

    const handleDeleteLesson = (lessonId: string) => {
        if (confirm("Delete this lesson?")) {
            setLessons(lessons.filter(l => l.id !== lessonId));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Course Editor</h2>
                        <p className="text-sm text-neutral-400 mt-1">Edit course details and content</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 px-6 pt-4 border-b border-white/10">
                    <button
                        onClick={() => setCurrentTab("details")}
                        className={`pb-3 px-1 text-sm font-medium transition-all ${currentTab === "details"
                                ? "text-white border-b-2 border-blue-500"
                                : "text-neutral-400 hover:text-white"
                            }`}
                    >
                        Course Details
                    </button>
                    <button
                        onClick={() => setCurrentTab("content")}
                        className={`pb-3 px-1 text-sm font-medium transition-all ${currentTab === "content"
                                ? "text-white border-b-2 border-blue-500"
                                : "text-neutral-400 hover:text-white"
                            }`}
                    >
                        Lessons & Content ({lessons.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {currentTab === "details" ? (
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title || ""}
                                        onChange={(e) => handleChange("title", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Category</label>
                                    <select
                                        value={formData.category || ""}
                                        onChange={(e) => handleChange("category", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Web Development">Web Development</option>
                                        <option value="Data Science">Data Science</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Level</label>
                                    <select
                                        value={formData.level || ""}
                                        onChange={(e) => handleChange("level", e.target.value as any)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Instructor</label>
                                    <input
                                        type="text"
                                        value={formData.instructor || ""}
                                        onChange={(e) => handleChange("instructor", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value={formData.duration || ""}
                                        onChange={(e) => handleChange("duration", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Rating</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={formData.rating || 0}
                                        onChange={(e) => handleChange("rating", parseFloat(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Thumbnail URL</label>
                                    <input
                                        type="url"
                                        value={formData.thumbnail || ""}
                                        onChange={(e) => handleChange("thumbnail", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                                    <textarea
                                        value={formData.description || ""}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-neutral-400">Manage course lessons and content</p>
                                <Button
                                    onClick={handleAddLesson}
                                    className="bg-blue-600 hover:bg-700 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Lesson
                                </Button>
                            </div>

                            {lessons.length > 0 ? (
                                <div className="space-y-2">
                                    {lessons.map((lesson, index) => (
                                        <div
                                            key={lesson.id}
                                            className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-neutral-600 cursor-move" />
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{lesson.title}</p>
                                                    <p className="text-xs text-neutral-400 mt-0.5">
                                                        {lesson.type} • {lesson.duration}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setEditingLesson(lesson)}
                                                        className="p-2 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                        className="p-2 rounded hover:bg-white/10 text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <p className="text-neutral-400 mb-4">No lessons yet</p>
                                    <Button onClick={handleAddLesson} variant="outline">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Lesson
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                    <Button variant="ghost" onClick={onClose} className="text-neutral-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save Course
                    </Button>
                </div>
            </div>

            {/* Lesson Editor Modal */}
            {editingLesson && (
                <LessonEditor
                    lesson={editingLesson}
                    onClose={() => setEditingLesson(null)}
                    onSave={handleUpdateLesson}
                />
            )}
        </div>
    );
}

// Lesson Editor Component
interface LessonEditorProps {
    lesson: Lesson;
    onClose: () => void;
    onSave: (lesson: Lesson) => void;
}

function LessonEditor({ lesson, onClose, onSave }: LessonEditorProps) {
    const [formData, setFormData] = useState<Lesson>(lesson);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white">Edit Lesson</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as "article" | "image" })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="article">Article</option>
                                <option value="image">Image</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Duration</label>
                            <input
                                type="text"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="e.g., 10 min"
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {formData.type === "image" && (
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Image URL</label>
                            <input
                                type="url"
                                value={formData.imageUrl || ""}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Content</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={12}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                            placeholder={formData.type === "article" ? "Write your lesson content here (supports HTML)..." : "Image description or caption..."}
                        />
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                    <Button variant="ghost" onClick={onClose} className="text-neutral-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save Lesson
                    </Button>
                </div>
            </div>
        </div>
    );
}
