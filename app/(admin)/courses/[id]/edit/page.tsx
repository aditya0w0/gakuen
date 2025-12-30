"use client";

import { Lesson, Course } from "@/lib/constants/demo-data";
import { Component } from "@/lib/cms/types";
import {
    ChevronDown,
    Eye,
    Save,
    ChevronLeft,
    Plus,
    GripVertical
} from "lucide-react";
import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ComponentRenderer } from "@/components/cms/ComponentRenderer";
import { ComponentPalette } from "@/components/cms/ComponentPalette";
import { DesignControls } from "@/components/cms/DesignControls";
import { ContextMenu } from "@/components/cms/ContextMenu";
import { CourseSettings } from "@/components/cms/CourseSettings";
import { fetchCourse, updateCourse } from "@/lib/api/courseApi";
import { saveCourseMetadata } from \"@/lib/firebase/firestore\";\n\n// --- Sub-components for Layout ---


const TopBar = ({
    onSave,
    isSaving,
    onPreview,
    isPreview,
    activeView,
    onViewChange,
    isPublished
}: {
    onSave: () => void;
    isSaving: boolean;
    onPreview: () => void;
    isPreview: boolean;
    activeView: 'content' | 'settings';
    onViewChange: (view: 'content' | 'settings') => void;
    isPublished: boolean;
}) => (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-3">
            <Link href="/courses" className="text-zinc-500 hover:text-white transition-colors">
                <ChevronLeft size={20} />
            </Link>
            <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
                <button
                    onClick={() => onViewChange('content')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeView === 'content' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Content
                </button>
                <button
                    onClick={() => onViewChange('settings')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeView === 'settings' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Settings
                </button>
            </div>
        </div>

        <div className="flex items-center space-x-3">
            <span className="text-xs text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 hidden md:inline-block">
                {isSaving ? "Saving..." : "Saved"}
            </span>

            <button
                onClick={onPreview}
                className={`text-zinc-400 hover:text-white transition-colors p-1.5 rounded ${isPreview ? 'bg-indigo-500/10 text-indigo-400' : ''}`}
                title="Toggle Preview"
            >
                <Eye size={18} />
            </button>

            <button
                onClick={onSave}
                disabled={isSaving}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-lg ${isPublished
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                    }`}
            >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : isPublished ? 'Update' : 'Publish'}</span>
            </button>

            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border border-zinc-800"></div>
        </div>
    </header>
);

// --- Main Page Component ---

export default function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: courseId } = use(params);

    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: string } | null>(null);
    const [copiedComponent, setCopiedComponent] = useState<Component | null>(null);
    const [activeView, setActiveView] = useState<'content' | 'settings'>('content');
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseThumbnail, setCourseThumbnail] = useState('');
    const [courseAuthor, setCourseAuthor] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const idCounterRef = useRef(0);


    // Load course from API
    useEffect(() => {
        fetchCourse(courseId).then(serverCourse => {
            if (serverCourse) {
                setCourse(serverCourse);
                setLessons(serverCourse.lessons || []);
                setCourseTitle(serverCourse.title);
                setCourseDescription(serverCourse.description);
                setCourseThumbnail(serverCourse.thumbnail || '');
                setCourseAuthor(serverCourse.instructor || '');
                setIsPublished(serverCourse.isPublished || false);

                if (serverCourse.lessons && serverCourse.lessons.length > 0) {
                    setEditingIndex(0);
                }
            }
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, [courseId]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-500">Loading...</div>;
    }

    if (!course) return <div className="text-zinc-500 p-10">Course not found</div>;

    const currentLesson = editingIndex !== null ? lessons[editingIndex] : null;
    const components = currentLesson?.components || [];
    const selectedComponent = components.find(c => c.id === selectedComponentId);

    const handleSave = async () => {
        setIsSaving(true);

        const updatedCourse = {
            ...course,
            title: courseTitle,
            description: courseDescription,
            thumbnail: courseThumbnail,
            instructor: courseAuthor,
            lessons,
            isPublished: true,
            publishedAt: new Date().toISOString(),
        };

        // Publish to server
        const success = await updateCourse(courseId, updatedCourse);

        if (success) {
            setIsPublished(true);
            console.log('✅ Course published');
        } else {
            console.error('❌ Publish failed');
        }

        // Fire-and-forget Firebase sync
        saveCourseMetadata({
            courseId,
            title: courseTitle,
            description: courseDescription,
            instructor: courseAuthor,
            isPublished: true,
            lessonsCount: lessons.length,
            enrolledCount: course.enrolledCount || 0,
            createdBy: "admin",
        }).catch(() => { }); // Silent fail

        setIsSaving(false);
    };

    const handleAddLesson = () => {
        const newLesson: Lesson = {
            id: `${courseId}-lesson-${lessons.length + 1}`,
            title: `Lesson ${lessons.length + 1}`,
            type: "cms",
            duration: "10 min",
            content: "",
            order: lessons.length + 1,
            components: [],
        };
        setLessons([...lessons, newLesson]);
        setEditingIndex(lessons.length);
    };

    const handleUpdateLesson = async (index: number, updates: Partial<Lesson>) => {
        setIsSaving(true); // Show saving state
        const updated = [...lessons];
        updated[index] = { ...updated[index], ...updates };
        setLessons(updated);

        const updatedCourse = {
            ...course,
            title: courseTitle,
            description: courseDescription,
            lessons: updated,
        };

        await updateCourse(courseId, updatedCourse);
        setIsSaving(false); // Hide saving state
    };

    const handleDeleteLesson = (index: number) => {
        if (confirm("Delete this lesson?")) {
            const newLessons = lessons.filter((_, i) => i !== index);
            setLessons(newLessons);
            setEditingIndex(newLessons.length > 0 ? 0 : null);

            // Trigger save
            const updatedCourse = {
                ...course,
                title: courseTitle,
                description: courseDescription,
                lessons: newLessons,
            };
            updateCourse(courseId, updatedCourse);
        }
    };

    const handleAddComponent = (component: Component) => {
        if (editingIndex === null) return;
        const newComponents = [...components, component];
        handleUpdateLesson(editingIndex, { components: newComponents });
        setSelectedComponentId(component.id);
    };

    const handleUpdateComponent = (updatedComponent: Component) => {
        if (editingIndex === null) return;
        const newComponents = components.map(c =>
            c.id === updatedComponent.id ? updatedComponent : c
        );
        handleUpdateLesson(editingIndex, { components: newComponents });
    };

    const handleDeleteComponent = () => {
        if (editingIndex === null || !selectedComponentId) return;
        const newComponents = components.filter(c => c.id !== selectedComponentId);
        handleUpdateLesson(editingIndex, { components: newComponents });
        setSelectedComponentId(null);
    };

    // Context menu handlers
    const handleDuplicateComponent = (component: Component) => {
        if (editingIndex === null) return;
        idCounterRef.current += 1;
        const newComponent = { ...component, id: `${component.type}-dup-${idCounterRef.current}` };
        const index = components.findIndex(c => c.id === component.id);
        const newComponents = [...components];
        newComponents.splice(index + 1, 0, newComponent);
        handleUpdateLesson(editingIndex, { components: newComponents });
        setContextMenu(null);
    };

    const handleDeleteFromContextMenu = (component: Component) => {
        if (editingIndex === null) return;
        const newComponents = components.filter(c => c.id !== component.id);
        handleUpdateLesson(editingIndex, { components: newComponents });
        setContextMenu(null);
    };

    const handleMoveComponentUp = (component: Component) => {
        if (editingIndex === null) return;
        const index = components.findIndex(c => c.id === component.id);
        if (index <= 0) return;
        const newComponents = [...components];
        [newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]];
        handleUpdateLesson(editingIndex, { components: newComponents });
        setContextMenu(null);
    };

    const handleMoveComponentDown = (component: Component) => {
        if (editingIndex === null) return;
        const index = components.findIndex(c => c.id === component.id);
        if (index >= components.length - 1) return;
        const newComponents = [...components];
        [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
        handleUpdateLesson(editingIndex, { components: newComponents });
        setContextMenu(null);
    };

    const handleCopyComponent = (component: Component) => {
        navigator.clipboard.writeText(JSON.stringify(component, null, 2));
        setContextMenu(null);
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-gray-300 font-sans antialiased overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 20px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #52525b; }
            `}</style>

            <TopBar
                title={course.title}
                onSave={handleSave}
                isSaving={isSaving}
                onPreview={() => setPreviewMode(!previewMode)}
                isPreview={previewMode}
                activeView={activeView}
                onViewChange={setActiveView}
                isPublished={isPublished}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Main Editor Area */}
                <main
                    className="flex-1 overflow-y-auto bg-zinc-900/30 custom-scrollbar"
                    onContextMenu={(e) => {
                        if ((e.target as HTMLElement).closest('[data-component-wrapper]')) {
                            return;
                        }
                        e.preventDefault();
                    }}
                >
                    {activeView === 'content' ? (
                        <div className="max-w-5xl mx-auto px-8 py-6">
                            {/* Lesson Header */}
                            {currentLesson && (
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/50">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 text-zinc-500 text-xs mb-1.5">
                                            <span className="text-zinc-600">{course.title}</span>
                                            <ChevronDown size={10} className="-rotate-90" />
                                            <span className="text-indigo-400">{currentLesson.title}</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={currentLesson.title}
                                            onChange={(e) => {
                                                const updated = [...lessons];
                                                updated[editingIndex!] = { ...updated[editingIndex!], title: e.target.value };
                                                setLessons(updated);
                                            }}
                                            onBlur={() => handleUpdateLesson(editingIndex!, { title: currentLesson.title })}
                                            className="text-xl font-bold text-white tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 placeholder-zinc-700 w-full"
                                            placeholder="Lesson Title"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <select
                                            className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={editingIndex ?? ""}
                                            onChange={(e) => {
                                                setEditingIndex(Number(e.target.value));
                                                setSelectedComponentId(null);
                                            }}
                                        >
                                            {lessons.map((l, idx) => (
                                                <option key={l.id} value={idx}>{l.title}</option>
                                            ))}
                                        </select>
                                        <button onClick={handleAddLesson} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Components Canvas */}
                            <div className="space-y-4">
                                {components.length === 0 ? (
                                    <div
                                        className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/20 cursor-context-menu"
                                        onContextMenu={(e) => {
                                            if (!previewMode) {
                                                e.preventDefault();
                                                document.querySelector<HTMLButtonElement>('[data-add-block-btn]')?.click();
                                            }
                                        }}
                                    >
                                        <p className="text-zinc-500 mb-3 text-sm">Start building your lesson</p>
                                        <p className="text-zinc-600 text-xs mb-3">Right-click or use button below to add components</p>
                                        <ComponentPalette onAddComponent={handleAddComponent} />
                                    </div>
                                ) : (
                                    <DragDropContext onDragEnd={(result) => {
                                        if (!result.destination || editingIndex === null) return;
                                        const newComponents = Array.from(components);
                                        const [removed] = newComponents.splice(result.source.index, 1);
                                        newComponents.splice(result.destination.index, 0, removed);
                                        handleUpdateLesson(editingIndex, { components: newComponents });
                                    }}>
                                        <Droppable droppableId="components">
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                                    {components.map((component, index) => (
                                                        <Draggable key={component.id} draggableId={component.id} index={index}>
                                                            {(dragProvided, snapshot) => (
                                                                <div
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    className={`group relative flex items-start gap-2 ${snapshot.isDragging ? 'opacity-75' : ''}`}
                                                                >
                                                                    <div
                                                                        {...dragProvided.dragHandleProps}
                                                                        className="mt-3 p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Drag to reorder"
                                                                    >
                                                                        <GripVertical size={16} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0" data-component-wrapper>
                                                                        <ComponentRenderer
                                                                            component={component}
                                                                            isEditing={!previewMode}
                                                                            isSelected={selectedComponentId === component.id}
                                                                            onUpdate={handleUpdateComponent}
                                                                            onSelect={() => setSelectedComponentId(component.id)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}

                                {!previewMode && components.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                        <ComponentPalette onAddComponent={handleAddComponent} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <CourseSettings
                            courseTitle={courseTitle}
                            courseDescription={courseDescription}
                            courseThumbnail={courseThumbnail}
                            courseAuthor={courseAuthor}
                            onTitleChange={setCourseTitle}
                            onDescriptionChange={setCourseDescription}
                            onThumbnailChange={setCourseThumbnail}
                            onAuthorChange={setCourseAuthor}
                            createdAt={course.createdAt}
                            lastModified={new Date().toISOString()}
                            isPublished={isPublished}
                        />
                    )}
                </main>

                {/* Right Panel */}
                <aside className="w-80 shrink-0">
                    <DesignControls
                        component={selectedComponent || null}
                        onUpdate={handleUpdateComponent}
                        onDelete={handleDeleteComponent}
                    />
                </aside>
            </div>

            {/* Context Menu */}
            {contextMenu && (() => {
                const component = components.find(c => c.id === contextMenu.componentId) || null;
                return (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        component={component}
                        onClose={() => setContextMenu(null)}
                        onDuplicate={() => component && handleDuplicateComponent(component)}
                        onDelete={() => component && handleDeleteFromContextMenu(component)}
                        onMoveUp={() => component && handleMoveComponentUp(component)}
                        onMoveDown={() => component && handleMoveComponentDown(component)}
                        onCopy={() => component && handleCopyComponent(component)}
                        canMoveUp={components.findIndex(c => c.id === contextMenu.componentId) > 0}
                        canMoveDown={components.findIndex(c => c.id === contextMenu.componentId) < components.length - 1}
                    />
                );
            })()}
        </div>
    );
}