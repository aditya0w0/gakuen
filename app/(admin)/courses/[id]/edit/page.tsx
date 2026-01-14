"use client";

import { Lesson, Course, Section } from "@/lib/types";
import { Component } from "@/lib/cms/types";
import {
    ChevronDown,
    ChevronUp,
    Eye,
    Save,
    ChevronLeft,
    Plus,
    GripVertical,
    Trash2,
    FolderOpen
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
import { saveCourseMetadata } from "@/lib/firebase/firestore";
import { createComponent } from "@/lib/cms/registry";


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
    activeView: 'content' | 'settings' | 'sections';
    onViewChange: (view: 'content' | 'settings' | 'sections') => void;
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
                <button
                    onClick={() => onViewChange('sections')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeView === 'sections' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Sections
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

            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full border border-zinc-800"></div>
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
    const [copiedComponent, setCopiedComponent] = useState<Component | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [activeView, setActiveView] = useState<'content' | 'settings' | 'sections'>('content');
    const [sections, setSections] = useState<Section[]>([]);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseThumbnail, setCourseThumbnail] = useState('');
    const [courseAuthor, setCourseAuthor] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [inlineTyping, setInlineTyping] = useState(false);
    const inlineInputRef = useRef<HTMLTextAreaElement>(null);
    // Reserved for future use - auto-save functionality
    const _saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
    const idCounterRef = useRef(0);
    const addMenuRef = useRef<HTMLDivElement>(null);


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
                setSections(serverCourse.sections || []);
                setExpandedSections(new Set((serverCourse.sections || []).map(s => s.id)));
            }
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, [courseId]);

    // Close add menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setAddMenuOpen(false);
            }
        };

        if (addMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [addMenuOpen]);

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
            sections,
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
        }).catch(() => {
            // Intentional silent fail - metadata save is non-critical, main save already succeeded
        });

        setIsSaving(false);
    };

    const handleAddLesson = () => {
        const newLesson: Lesson = {
            id: `${courseId}-lesson-${Date.now()}`,
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
                onSave={handleSave}
                isSaving={isSaving}
                onPreview={() => setPreviewMode(!previewMode)}
                isPreview={previewMode}
                activeView={activeView}
                onViewChange={setActiveView}
                isPublished={isPublished}
            />

            <div className="flex-1 flex overflow-hidden">
                <main
                    className="flex-1 overflow-y-auto bg-zinc-900/30 custom-scrollbar p-0"
                    onClick={(e) => {
                        // Deselect if clicking on blank area (not a component)
                        if (!(e.target as HTMLElement).closest('[data-component-wrapper]')) {
                            setSelectedComponentId(null);
                        }
                    }}
                    onContextMenu={(e) => {
                        // Always prevent browser context menu in editor
                        e.preventDefault();
                    }}
                >
                    {activeView === 'content' ? (
                        <div
                            className="max-w-5xl mx-auto"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const componentType = e.dataTransfer.getData('componentType');
                                if (componentType && editingIndex !== null) {
                                    const newComponent = createComponent(componentType);
                                    handleAddComponent(newComponent);
                                }
                            }}
                        >
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

                                        {/* Add Menu Button */}
                                        <div className="relative" ref={addMenuRef}>
                                            <button
                                                onClick={() => setAddMenuOpen(!addMenuOpen)}
                                                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white transition-colors"
                                                title="Add"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            {addMenuOpen && (
                                                <div className="absolute right-0 mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                                                    <button
                                                        onClick={() => {
                                                            handleAddLesson();
                                                            setAddMenuOpen(false);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800 rounded-t-lg"
                                                    >
                                                        + Add Lesson
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveView('sections');
                                                            setAddMenuOpen(false);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800 rounded-b-lg border-t border-zinc-700"
                                                    >
                                                        + Add Section
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* DELETE BUTTON - Always visible */}
                                        <button
                                            onClick={() => handleDeleteLesson(editingIndex!)}
                                            disabled={lessons.length <= 1}
                                            className={`p-1.5 rounded-md transition-colors ${lessons.length <= 1
                                                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-500 text-white'
                                                }`}
                                            title={lessons.length <= 1 ? "Can't delete last lesson" : "Delete Lesson"}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Components Canvas */}
                            <div className="space-y-4">
                                {components.length === 0 ? (
                                    <div className="min-h-[200px] p-4 border border-zinc-800/50 rounded-lg bg-zinc-900/10 transition-colors">
                                        {inlineTyping ? (
                                            <textarea
                                                ref={inlineInputRef}
                                                autoFocus
                                                placeholder="Type something... (press Escape to cancel)"
                                                className="w-full min-h-[120px] bg-transparent text-white text-base resize-none focus:outline-none placeholder:text-zinc-600"
                                                onBlur={(e) => {
                                                    const text = e.target.value.trim();
                                                    if (text) {
                                                        const textBlock = createComponent("text");
                                                        (textBlock as any).content = `<p>${text}</p>`;
                                                        handleAddComponent(textBlock);
                                                    }
                                                    setInlineTyping(false);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        setInlineTyping(false);
                                                    }
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        const text = (e.target as HTMLTextAreaElement).value.trim();
                                                        if (text) {
                                                            const textBlock = createComponent("text");
                                                            (textBlock as any).content = `<p>${text}</p>`;
                                                            handleAddComponent(textBlock);
                                                        }
                                                        setInlineTyping(false);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="cursor-text"
                                                onClick={() => !previewMode && setInlineTyping(true)}
                                            >
                                                <div className="text-zinc-600 text-base">
                                                    Click here to start typing...
                                                </div>
                                                <div className="flex items-center gap-3 mt-4 text-zinc-700 text-sm">
                                                    <span>Type <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-xs">/</kbd> for commands</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <ComponentPalette onAddComponent={handleAddComponent} />
                                        </div>
                                    </div>
                                ) : (
                                    <DragDropContext
                                        onDragStart={(start) => {
                                            setIsDragging(true);
                                            setDraggedComponentId(start.draggableId);
                                        }}
                                        onDragEnd={(result) => {
                                            setIsDragging(false);
                                            setDraggedComponentId(null);

                                            // Check if dropped in trash zone
                                            if (result.destination?.droppableId === 'trash') {
                                                if (editingIndex === null) return;
                                                const newComponents = components.filter(c => c.id !== result.draggableId);
                                                handleUpdateLesson(editingIndex, { components: newComponents });
                                                setSelectedComponentId(null);
                                                return;
                                            }

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
                                                                    className={`group relative flex items-center gap-2 ${snapshot.isDragging ? 'opacity-75 z-50' : ''}`}
                                                                >
                                                                    {/* VISIBLE Drag Handle */}
                                                                    <div
                                                                        {...dragProvided.dragHandleProps}
                                                                        className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 cursor-grab active:cursor-grabbing transition-all shrink-0 flex items-center justify-center"
                                                                        title="Drag to reorder or drop in trash"
                                                                    >
                                                                        <GripVertical size={20} />
                                                                    </div>
                                                                    <div
                                                                        className="flex-1 min-w-0"
                                                                        data-component-wrapper
                                                                        onContextMenu={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            console.log('🎯 Context menu triggered for:', component.id);
                                                                            setSelectedComponentId(component.id);
                                                                            setContextMenu({ x: e.clientX, y: e.clientY, componentId: component.id });
                                                                        }}
                                                                    >
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

                                        {/* Trash Zone - fixed overlay during drag */}
                                        <Droppable droppableId="trash">
                                            {(trashProvided, trashSnapshot) => (
                                                <div
                                                    ref={trashProvided.innerRef}
                                                    {...trashProvided.droppableProps}
                                                    className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-xl border-2 border-dashed transition-all z-[100] flex items-center gap-3 ${!isDragging ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'
                                                        } ${trashSnapshot.isDraggingOver
                                                            ? 'bg-red-500/40 border-red-500 scale-110'
                                                            : 'bg-zinc-900/95 border-zinc-500 backdrop-blur-md shadow-2xl'
                                                        }`}
                                                >
                                                    <Trash2 size={24} className={trashSnapshot.isDraggingOver ? 'text-red-400' : 'text-zinc-300'} />
                                                    <span className={`text-sm font-semibold ${trashSnapshot.isDraggingOver ? 'text-red-300' : 'text-zinc-300'}`}>
                                                        {trashSnapshot.isDraggingOver ? 'Release to delete!' : 'Drop here to delete'}
                                                    </span>
                                                    <div style={{ display: 'none' }}>{trashProvided.placeholder}</div>
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}

                                {!previewMode && components.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {/* Inline typing area */}
                                        {inlineTyping ? (
                                            <div className="p-3 border border-zinc-700 rounded-lg bg-zinc-900/50">
                                                <textarea
                                                    ref={inlineInputRef}
                                                    autoFocus
                                                    placeholder="Continue typing... (Enter to save, Escape to cancel)"
                                                    className="w-full min-h-[80px] bg-transparent text-white text-base resize-none focus:outline-none placeholder:text-zinc-600"
                                                    onBlur={(e) => {
                                                        const text = e.target.value.trim();
                                                        if (text) {
                                                            const textBlock = createComponent("text");
                                                            (textBlock as any).content = `<p>${text}</p>`;
                                                            handleAddComponent(textBlock);
                                                        }
                                                        setInlineTyping(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') {
                                                            setInlineTyping(false);
                                                        }
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            const text = (e.target as HTMLTextAreaElement).value.trim();
                                                            if (text) {
                                                                const textBlock = createComponent("text");
                                                                (textBlock as any).content = `<p>${text}</p>`;
                                                                handleAddComponent(textBlock);
                                                            }
                                                            setInlineTyping(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => setInlineTyping(true)}
                                                className="py-3 px-4 text-zinc-600 text-sm cursor-text hover:bg-zinc-900/30 rounded-lg transition-colors"
                                            >
                                                Click to continue writing, or use{' '}
                                                <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-xs mx-1">/</kbd>{' '}
                                                for commands
                                            </div>
                                        )}

                                        {/* Add block button */}
                                        <div className="flex justify-center pt-2">
                                            <ComponentPalette onAddComponent={handleAddComponent} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeView === 'settings' ? (
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
                    ) : (
                        /* Sections Tab */
                        <div className="max-w-3xl mx-auto p-4 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Manage Sections</h2>
                                    <p className="text-sm text-zinc-500">Organize lessons into collapsible sections</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const newSection: Section = {
                                            id: `section-${Date.now()}`,
                                            title: 'New Section',
                                            lessonIds: [],
                                        };
                                        setSections([...sections, newSection]);
                                        setExpandedSections(prev => new Set([...prev, newSection.id]));
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Section
                                </button>
                            </div>

                            {sections.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
                                    <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-500">No sections yet</p>
                                    <p className="text-zinc-600 text-sm">Create sections to organize your lessons</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sections.map((section) => {
                                        const isExpanded = expandedSections.has(section.id);
                                        const sectionLessons = section.lessonIds
                                            .map(id => lessons.find(l => l.id === id))
                                            .filter(Boolean) as Lesson[];
                                        const unassignedLessons = lessons.filter(
                                            l => !sections.some(s => s.lessonIds.includes(l.id))
                                        );

                                        return (
                                            <div key={section.id} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
                                                {/* Section Header */}
                                                <div className="flex items-center gap-2 p-3 bg-zinc-900">
                                                    <button
                                                        onClick={() => {
                                                            setExpandedSections(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(section.id)) {
                                                                    next.delete(section.id);
                                                                } else {
                                                                    next.add(section.id);
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                        className="p-1 hover:bg-zinc-800 rounded"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-zinc-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                                                        )}
                                                    </button>
                                                    <FolderOpen className="w-4 h-4 text-blue-400" />
                                                    <input
                                                        type="text"
                                                        value={section.title}
                                                        onChange={(e) => {
                                                            setSections(sections.map(s =>
                                                                s.id === section.id ? { ...s, title: e.target.value } : s
                                                            ));
                                                        }}
                                                        className="flex-1 bg-transparent text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                                                    />
                                                    <span className="text-xs text-zinc-500">{sectionLessons.length} lessons</span>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this section? Lessons will remain unassigned.')) {
                                                                setSections(sections.filter(s => s.id !== section.id));
                                                            }
                                                        }}
                                                        className="p-1 hover:bg-red-900/50 rounded text-zinc-500 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Section Lessons */}
                                                {isExpanded && (
                                                    <div className="p-3 space-y-2 border-t border-zinc-800">
                                                        {sectionLessons.map((lesson, idx) => (
                                                            <div key={`${section.id}-${lesson.id}-${idx}`} className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
                                                                <GripVertical className="w-4 h-4 text-zinc-600" />
                                                                <span className="flex-1 text-sm text-white">{lesson.title}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setSections(sections.map(s =>
                                                                            s.id === section.id
                                                                                ? { ...s, lessonIds: s.lessonIds.filter(id => id !== lesson.id) }
                                                                                : s
                                                                        ));
                                                                    }}
                                                                    className="text-xs text-zinc-500 hover:text-red-400"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* Add Lesson to Section */}
                                                        {unassignedLessons.length > 0 && (
                                                            <select
                                                                onChange={(e) => {
                                                                    const lessonId = e.target.value;
                                                                    if (lessonId) {
                                                                        setSections(sections.map(s =>
                                                                            s.id === section.id
                                                                                ? { ...s, lessonIds: [...s.lessonIds, lessonId] }
                                                                                : s
                                                                        ));
                                                                    }
                                                                    e.target.value = '';
                                                                }}
                                                                className="w-full mt-2 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="">+ Add lesson to section...</option>
                                                                {unassignedLessons.map(l => (
                                                                    <option key={l.id} value={l.id}>{l.title}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Warning for unassigned lessons */}
                            {(() => {
                                const unassigned = lessons.filter(
                                    l => !sections.some(s => s.lessonIds.includes(l.id))
                                );
                                if (unassigned.length > 0 && sections.length > 0) {
                                    return (
                                        <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                                            <p className="text-amber-400 text-sm font-medium">
                                                ⚠️ {unassigned.length} lesson(s) not in any section:
                                            </p>
                                            <p className="text-amber-600 text-xs mt-1">
                                                {unassigned.map(l => l.title).join(', ')}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}
                </main>

                {/* Right Panel */}
                <aside className="w-80 shrink-0">
                    <DesignControls
                        component={selectedComponent || null}
                        onUpdate={handleUpdateComponent}
                        onDelete={handleDeleteComponent}
                        onAddComponent={handleAddComponent}
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