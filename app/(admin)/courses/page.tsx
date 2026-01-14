"use client";

import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, BookOpen, Loader2, Download, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { SimpleModal } from "@/components/ui/SimpleModal";

export default function CoursesManagementPage() {
    const router = useRouter();
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [isCreating, setIsCreating] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/courses?id=${deleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');

            // Remove from state immediately
            setCourses(prev => prev.filter(c => c.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete course');
        } finally {
            setIsDeleting(false);
        }
    };

    // Load courses from API - MUST be before any early returns!
    useEffect(() => {
        if (!isAdmin) return; // Don't fetch if not admin yet

        fetch('/api/courses', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                // DEFENSIVE: Ensure data is an array
                setCourses(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to load courses:', err);
                setCourses([]); // Ensure state is always an array
                setIsLoading(false);
            });
    }, [isAdmin]);

    // Show loading while checking auth - AFTER all hooks
    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const handleCreateCourse = async () => {
        setIsCreating(true);
        try {
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Untitled Course',
                    description: 'Start building your course...',
                }),
            });

            if (!response.ok) throw new Error('Failed to create course');

            const { id } = await response.json();
            router.push(`/editor/${id}`);
        } catch (error) {
            console.error('Creation failed:', error);
            alert('Failed to create course');
            setIsCreating(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/admin/courses/bulk');
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `courses-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export courses');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const courses = JSON.parse(text);

            const response = await fetch('/api/admin/courses/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courses),
            });

            if (!response.ok) throw new Error('Import failed');

            const result = await response.json();
            alert(`Import complete!\n${result.message}`);

            // Reload courses
            window.location.reload();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import courses. Check JSON format.');
        } finally {
            setIsImporting(false);
            e.target.value = ''; // Reset file input
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen text-neutral-500">Loading courses...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Content Management</h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage all courses and content</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        variant="outline"
                        className="text-neutral-700 dark:text-neutral-300"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export JSON'}
                    </Button>
                    <label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                            disabled={isImporting}
                        />
                        <Button
                            asChild
                            variant="outline"
                            className="text-neutral-700 dark:text-neutral-300 cursor-pointer"
                        >
                            <span>
                                <Upload className="w-4 h-4 mr-2" />
                                {isImporting ? 'Importing...' : 'Import JSON'}
                            </span>
                        </Button>
                    </label>
                    <Button
                        onClick={handleCreateCourse}
                        disabled={isCreating}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {isCreating ? 'Creating...' : 'Add Course'}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Courses</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{courses.length}</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Published</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{courses.filter(c => c.isPublished).length}</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Lessons</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                        {courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                                Course
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                                Lessons
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                                Level
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {courses.map((course) => (
                            <tr key={course.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-[200px]">{course.title}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{course.instructor}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{course.category}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                        <span className="text-sm text-neutral-900 dark:text-white">{course.lessons.length}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${course.level === "Beginner"
                                            ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                                            : course.level === "Intermediate"
                                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                                : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                                            }`}
                                    >
                                        {course.level}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/editor/${course.id}`}>
                                            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setDeleteId(course.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <SimpleModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Course?"
                description="This action cannot be undone. This will permanently delete the course and all its lessons."
                isDestructive
                isLoading={isDeleting}
            />
        </div >
    );
}
