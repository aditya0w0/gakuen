'use client';

import { Lesson, Course, Section } from '@/lib/types';
import { Component } from '@/lib/cms/types';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Save,
  ChevronLeft,
  Plus,
  GripVertical,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { useState, useEffect, useRef, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ComponentRenderer } from '@/components/cms/ComponentRenderer';
import { ComponentPalette } from '@/components/cms/ComponentPalette';
import { DesignControls } from '@/components/cms/DesignControls';
import { ContextMenu } from '@/components/cms/ContextMenu';
import { CourseSettings } from '@/components/cms/CourseSettings';
import { FluidEditor, FluidEditorRef } from '@/components/cms/FluidEditor';
import { FluidEditorSidebar } from '@/components/cms/FluidEditorSidebar';
import { MobileEditorToolbar } from '@/components/cms/MobileEditorToolbar';
import {
  serializeToComponents,
  deserializeFromComponents,
} from '@/lib/cms/serialization';
import { fetchCourse, updateCourse, publishCourse } from '@/lib/api/courseApi';
// saveCourseMetadata removed - now using Telegram storage
import { createComponent } from '@/lib/cms/registry';

const TopBar = ({
  onSave,
  isSaving,
  onPreview,
  isPreview,
  activeView,
  onViewChange,
  isPublished,
}: {
  onSave: () => void;
  isSaving: boolean;
  onPreview: () => void;
  isPreview: boolean;
  activeView: 'content' | 'settings' | 'sections';
  onViewChange: (view: 'content' | 'settings' | 'sections') => void;
  isPublished: boolean;
}) => (
  <header className="h-12 md:h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-2 md:px-4 shrink-0">
    <div className="flex items-center space-x-2 md:space-x-3">
      <Link
        href="/courses"
        className="text-zinc-500 hover:text-white transition-colors"
      >
        <ChevronLeft size={20} />
      </Link>
      <div className="flex space-x-0.5 md:space-x-1 bg-zinc-900/50 p-0.5 md:p-1 rounded-lg border border-zinc-800/50">
        <button
          onClick={() => onViewChange('content')}
          className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-colors ${activeView === 'content' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Content
        </button>
        <button
          onClick={() => onViewChange('settings')}
          className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-colors ${activeView === 'settings' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Settings
        </button>
        <button
          onClick={() => onViewChange('sections')}
          className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-colors ${activeView === 'sections' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Sections
        </button>
      </div>
    </div>

    <div className="flex items-center space-x-2 md:space-x-3">
      <span className="text-xs text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 hidden md:inline-block">
        {isSaving ? 'Saving...' : 'Saved'}
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
        className={`flex items-center space-x-1 md:space-x-1.5 px-2 md:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-lg ${
          isPublished
            ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
        }`}
      >
        <Save size={14} />
        <span className="hidden sm:inline">
          {isSaving ? 'Saving...' : isPublished ? 'Update' : 'Publish'}
        </span>
      </button>

      <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full border border-zinc-800"></div>
    </div>
  </header>
);

// --- Main Page Component ---

export default function CourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial lesson index from URL
  const initialLessonIndex = parseInt(searchParams.get('lesson') || '0', 10);

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    componentId: string;
  } | null>(null);
  const [copiedComponent, setCopiedComponent] = useState<Component | null>(
    null
  ); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [activeView, setActiveView] = useState<
    'content' | 'settings' | 'sections'
  >('content');
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseThumbnail, setCourseThumbnail] = useState('');
  const [courseAuthor, setCourseAuthor] = useState('');
  const [courseAuthorAvatar, setCourseAuthorAvatar] = useState('');
  const [courseCategory, setCourseCategory] = useState('Uncategorized');
  const [courseLevel, setCourseLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('beginner');
  const [isPublished, setIsPublished] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(
    null
  );
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [lessonDropdownOpen, setLessonDropdownOpen] = useState(false);
  const [inlineTyping, setInlineTyping] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [fluidEditor, setFluidEditor] = useState<
    import('@tiptap/react').Editor | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Hidden on mobile by default
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const fluidEditorRef = useRef<FluidEditorRef>(null);
  const _saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const idCounterRef = useRef(0);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const lessonDropdownRef = useRef<HTMLDivElement>(null);

  // Load course from API
  useEffect(() => {
    fetchCourse(courseId)
      .then((serverCourse) => {
        if (serverCourse) {
          setCourse(serverCourse);
          setLessons(serverCourse.lessons || []);
          setCourseTitle(serverCourse.title);
          setCourseDescription(serverCourse.description);
          setCourseThumbnail(serverCourse.thumbnail || '');
          setCourseAuthor(serverCourse.instructor || '');
          setCourseAuthorAvatar(serverCourse.instructorAvatar || '');
          setCourseCategory(serverCourse.category || 'Uncategorized');
          setCourseLevel(serverCourse.level || 'beginner');
          setIsPublished(serverCourse.isPublished || false);

          if (serverCourse.lessons && serverCourse.lessons.length > 0) {
            // Use lesson from URL if valid, otherwise default to 0
            const lessonIdx =
              initialLessonIndex < serverCourse.lessons.length
                ? initialLessonIndex
                : 0;
            setEditingIndex(lessonIdx);
          }
          setSections(serverCourse.sections || []);
          setExpandedSections(
            new Set((serverCourse.sections || []).map((s) => s.id))
          );
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [courseId]);

  // Start 30s checkpoint sync
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/lib/cache/checkpoint-sync').then(
      ({ startCheckpointSync, stopCheckpointSync }) => {
        startCheckpointSync();
        return () => stopCheckpointSync();
      }
    );
  }, []);

  // Sync editingIndex to URL when lesson changes (without adding history entries)
  useEffect(() => {
    if (editingIndex !== null && editingIndex !== initialLessonIndex) {
      const url = new URL(window.location.href);
      url.searchParams.set('lesson', editingIndex.toString());
      window.history.replaceState({}, '', url.toString());
    }
  }, [editingIndex, initialLessonIndex]);

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(event.target as Node)
      ) {
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

  // Close lesson dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        lessonDropdownRef.current &&
        !lessonDropdownRef.current.contains(event.target as Node)
      ) {
        setLessonDropdownOpen(false);
      }
    };

    if (lessonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [lessonDropdownOpen]);

  // Keyboard navigation for CMS editor
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.ctrlKey || event.metaKey;

      // Check target type
      const target = event.target as HTMLElement;
      const isFormInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Ctrl/Cmd + S: Save (always works)
      if (isModifier && event.key === 's') {
        event.preventDefault();
        handleSave();
        return;
      }

      // Ctrl/Cmd + Arrow: Lesson navigation (works even in editor)
      if (isModifier && event.key === 'ArrowUp') {
        event.preventDefault();
        if (editingIndex !== null && editingIndex > 0) {
          setEditingIndex(editingIndex - 1);
          console.log('📖 Navigated to previous lesson');
        }
        return;
      }

      if (isModifier && event.key === 'ArrowDown') {
        event.preventDefault();
        if (editingIndex !== null && editingIndex < lessons.length - 1) {
          setEditingIndex(editingIndex + 1);
          console.log('📖 Navigated to next lesson');
        }
        return;
      }

      // Ctrl/Cmd + N: New lesson
      if (isModifier && event.key === 'n') {
        event.preventDefault();
        handleAddLesson();
        console.log('📖 Added new lesson');
        return;
      }

      // Escape: Deselect component
      if (event.key === 'Escape') {
        setSelectedComponentId(null);
        setContextMenu(null);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingIndex, lessons.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle lesson reorder
  const handleLessonReorder = (fromIndex: number, toIndex: number) => {
    const newLessons = [...lessons];
    const [removed] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, removed);

    // Update order property for all lessons
    newLessons.forEach((lesson, idx) => {
      lesson.order = idx + 1;
    });

    setLessons(newLessons);

    // Adjust editing index if needed
    if (editingIndex === fromIndex) {
      setEditingIndex(toIndex);
    } else if (editingIndex !== null) {
      if (fromIndex < editingIndex && toIndex >= editingIndex) {
        setEditingIndex(editingIndex - 1);
      } else if (fromIndex > editingIndex && toIndex <= editingIndex) {
        setEditingIndex(editingIndex + 1);
      }
    }

    // Save to server
    if (course) {
      const updatedCourse = {
        ...course,
        lessons: newLessons,
      };
      updateCourse(courseId, updatedCourse);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!course)
    return <div className="text-zinc-500 p-10">Course not found</div>;

  const currentLesson = editingIndex !== null ? lessons[editingIndex] : null;
  const components = currentLesson?.components || [];
  const selectedComponent = components.find(
    (c) => c.id === selectedComponentId
  );

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updatedCourse = {
        ...course,
        title: courseTitle,
        description: courseDescription,
        thumbnail: courseThumbnail,
        instructor: courseAuthor,
        instructorAvatar: courseAuthorAvatar,
        category: courseCategory,
        level: courseLevel,
        lessons,
        sections,
        isPublished: true,
        publishedAt: new Date().toISOString(),
      };

      // Publish to Telegram (explicit action)
      const success = await publishCourse(courseId, updatedCourse);

      if (success) {
        setIsPublished(true);
        console.log('✅ Course published to Telegram');
      } else {
        console.error('❌ Publish failed');
      }
    } catch (error) {
      console.error('❌ Publish error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLesson = () => {
    const newLesson: Lesson = {
      id: `${courseId}-lesson-${Date.now()}`,
      title: `Lesson ${lessons.length + 1}`,
      type: 'cms',
      duration: '10 min',
      content: '',
      order: lessons.length + 1,
      components: [],
    };
    setLessons([...lessons, newLesson]);
    setEditingIndex(lessons.length);
  };

  const handleUpdateLesson = async (
    index: number,
    updates: Partial<Lesson>
  ) => {
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
    if (confirm('Delete this lesson?')) {
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
    const newComponents = components.map((c) =>
      c.id === updatedComponent.id ? updatedComponent : c
    );
    handleUpdateLesson(editingIndex, { components: newComponents });
  };

  const handleDeleteComponent = () => {
    if (editingIndex === null || !selectedComponentId) return;
    const newComponents = components.filter(
      (c) => c.id !== selectedComponentId
    );
    handleUpdateLesson(editingIndex, { components: newComponents });
    setSelectedComponentId(null);
  };

  // Handle fluid editor updates - save only tiptapJson (not redundant components)
  const handleFluidEditorUpdate = (html: string, json: object) => {
    if (editingIndex === null) return;
    const currentLesson = lessons[editingIndex];

    // Always save the raw Tiptap JSON for perfect preservation (especially tables)
    const jsonChanged =
      JSON.stringify(json) !== JSON.stringify(currentLesson?.tiptapJson);

    if (jsonChanged) {
      // OPTIMIZATION: Only store tiptapJson, NOT components.
      // Components are generated on-demand by blobToCourse for legacy readers.
      // This reduces payload by 50%+ and avoids 413 errors!
      handleUpdateLesson(editingIndex, {
        tiptapJson: json, // Primary storage - preserves tables perfectly
        components: undefined, // Clear legacy components to save space
      });
    }
  };

  // Get initial content for FluidEditor - prefer tiptapJson, fall back to components
  const getFluidEditorInitialContent = () => {
    const currentLesson = editingIndex !== null ? lessons[editingIndex] : null;

    // If we have tiptapJson, use it directly (perfect table preservation)
    if (currentLesson?.tiptapJson) {
      const json = currentLesson.tiptapJson as {
        type?: string;
        content?: unknown[];
      };
      if (json.type === 'doc' && json.content && json.content.length > 0) {
        console.log('📥 Loading from tiptapJson');
        return currentLesson.tiptapJson;
      }
    }

    // Fallback: deserialize from components (legacy data)
    if (components.length === 0) return '';
    console.log('📥 Loading from components (legacy)');
    return deserializeFromComponents(components);
  };

  // Context menu handlers
  const handleDuplicateComponent = (component: Component) => {
    if (editingIndex === null) return;
    idCounterRef.current += 1;
    const newComponent = {
      ...component,
      id: `${component.type}-dup-${idCounterRef.current}`,
    };
    const index = components.findIndex((c) => c.id === component.id);
    const newComponents = [...components];
    newComponents.splice(index + 1, 0, newComponent);
    handleUpdateLesson(editingIndex, { components: newComponents });
    setContextMenu(null);
  };

  const handleDeleteFromContextMenu = (component: Component) => {
    if (editingIndex === null) return;
    const newComponents = components.filter((c) => c.id !== component.id);
    handleUpdateLesson(editingIndex, { components: newComponents });
    setContextMenu(null);
  };

  const handleMoveComponentUp = (component: Component) => {
    if (editingIndex === null) return;
    const index = components.findIndex((c) => c.id === component.id);
    if (index <= 0) return;
    const newComponents = [...components];
    [newComponents[index - 1], newComponents[index]] = [
      newComponents[index],
      newComponents[index - 1],
    ];
    handleUpdateLesson(editingIndex, { components: newComponents });
    setContextMenu(null);
  };

  const handleMoveComponentDown = (component: Component) => {
    if (editingIndex === null) return;
    const index = components.findIndex((c) => c.id === component.id);
    if (index >= components.length - 1) return;
    const newComponents = [...components];
    [newComponents[index], newComponents[index + 1]] = [
      newComponents[index + 1],
      newComponents[index],
    ];
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
            if (
              !(e.target as HTMLElement).closest('[data-component-wrapper]')
            ) {
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
              className="max-w-5xl mx-auto px-2 md:px-0"
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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-3 border-b border-zinc-800/50 px-4 pt-4">
                  <div className="flex-1 min-w-0">
                    {/* Breadcrumb - hidden on mobile */}
                    <div className="hidden md:flex items-center space-x-2 text-zinc-500 text-xs mb-1.5">
                      <span className="text-zinc-600 truncate">
                        {course.title}
                      </span>
                      <ChevronDown size={10} className="-rotate-90" />
                      <span className="text-indigo-400 truncate">
                        {currentLesson.title}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentLesson.title}
                      onChange={(e) => {
                        const updated = [...lessons];
                        updated[editingIndex!] = {
                          ...updated[editingIndex!],
                          title: e.target.value,
                        };
                        setLessons(updated);
                      }}
                      onBlur={() =>
                        handleUpdateLesson(editingIndex!, {
                          title: currentLesson.title,
                        })
                      }
                      className="text-xl font-bold text-white tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 placeholder-zinc-700 w-full"
                      placeholder="Lesson Title"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0 md:ml-4">
                    {/* Lesson Selector with Drag Reorder */}
                    <div className="relative" ref={lessonDropdownRef}>
                      <button
                        onClick={() =>
                          setLessonDropdownOpen(!lessonDropdownOpen)
                        }
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md px-2 py-1.5 hover:border-zinc-700 transition-colors min-w-[140px]"
                      >
                        <span className="truncate flex-1 text-left">
                          {currentLesson?.title || 'Select Lesson'}
                        </span>
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${lessonDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {lessonDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                          <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-500 flex items-center gap-2">
                            <GripVertical size={12} />
                            <span>Drag to reorder lessons</span>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {lessons.map((lesson, idx) => (
                              <div
                                key={lesson.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    'lessonIndex',
                                    idx.toString()
                                  );
                                  e.currentTarget.classList.add('opacity-50');
                                }}
                                onDragEnd={(e) => {
                                  e.currentTarget.classList.remove(
                                    'opacity-50'
                                  );
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.add(
                                    'bg-indigo-600/20',
                                    'border-t-2',
                                    'border-indigo-500'
                                  );
                                }}
                                onDragLeave={(e) => {
                                  e.currentTarget.classList.remove(
                                    'bg-indigo-600/20',
                                    'border-t-2',
                                    'border-indigo-500'
                                  );
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove(
                                    'bg-indigo-600/20',
                                    'border-t-2',
                                    'border-indigo-500'
                                  );
                                  const fromIndex = parseInt(
                                    e.dataTransfer.getData('lessonIndex')
                                  );
                                  if (fromIndex !== idx) {
                                    handleLessonReorder(fromIndex, idx);
                                  }
                                }}
                                onClick={() => {
                                  setEditingIndex(idx);
                                  setSelectedComponentId(null);
                                  setLessonDropdownOpen(false);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                                  idx === editingIndex
                                    ? 'bg-indigo-600/30 text-indigo-300'
                                    : 'text-white hover:bg-zinc-800'
                                }`}
                              >
                                <GripVertical
                                  size={14}
                                  className="text-zinc-500 cursor-grab active:cursor-grabbing shrink-0"
                                />
                                <span className="text-xs text-zinc-500 shrink-0">
                                  {idx + 1}.
                                </span>
                                <span className="text-sm truncate flex-1">
                                  {lesson.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Menu */}
                    <div className="relative" ref={addMenuRef}>
                      <button
                        onClick={() => setAddMenuOpen(!addMenuOpen)}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white transition-colors"
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

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => handleDeleteLesson(editingIndex!)}
                      disabled={lessons.length <= 1}
                      className={`p-1.5 rounded-md transition-colors ${
                        lessons.length <= 1
                          ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                      title={
                        lessons.length <= 1
                          ? "Can't delete last lesson"
                          : 'Delete Lesson'
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Fluid Editor - Primary editing experience */}
              <div className="min-h-[300px]">
                <FluidEditor
                  ref={fluidEditorRef}
                  key={editingIndex} // Re-mount when switching lessons
                  initialContent={getFluidEditorInitialContent()}
                  onUpdate={handleFluidEditorUpdate}
                  onEditorReady={setFluidEditor}
                  placeholder="Type '/' for commands, or just start writing..."
                  editable={!previewMode}
                  className="min-h-[300px]"
                  // Per-block native saves
                  courseId={courseId}
                  lessonId={currentLesson?.id}
                />
                {/* Mobile Inline Toolbar */}
                <MobileEditorToolbar editor={fluidEditor} />
              </div>
            </div>
          ) : activeView === 'settings' ? (
            <CourseSettings
              courseTitle={courseTitle}
              courseDescription={courseDescription}
              courseThumbnail={courseThumbnail}
              courseAuthor={courseAuthor}
              courseAuthorAvatar={courseAuthorAvatar}
              courseCategory={courseCategory}
              courseLevel={courseLevel}
              onTitleChange={setCourseTitle}
              onDescriptionChange={setCourseDescription}
              onThumbnailChange={setCourseThumbnail}
              onAuthorChange={setCourseAuthor}
              onAuthorAvatarChange={setCourseAuthorAvatar}
              onCategoryChange={setCourseCategory}
              onLevelChange={setCourseLevel}
              createdAt={course.createdAt}
              lastModified={new Date().toISOString()}
              isPublished={isPublished}
            />
          ) : (
            /* Sections Tab */
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Manage Sections
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Organize lessons into collapsible sections
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newSection: Section = {
                      id: `section-${Date.now()}`,
                      title: 'New Section',
                      lessonIds: [],
                    };
                    setSections([...sections, newSection]);
                    setExpandedSections(
                      (prev) => new Set([...prev, newSection.id])
                    );
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
                  <p className="text-zinc-600 text-sm">
                    Create sections to organize your lessons
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section) => {
                    const isExpanded = expandedSections.has(section.id);
                    const sectionLessons = section.lessonIds
                      .map((id) => lessons.find((l) => l.id === id))
                      .filter(Boolean) as Lesson[];
                    const unassignedLessons = lessons.filter(
                      (l) => !sections.some((s) => s.lessonIds.includes(l.id))
                    );

                    return (
                      <div
                        key={section.id}
                        className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50"
                      >
                        <div className="flex items-center gap-2 p-3 bg-zinc-900">
                          <button
                            onClick={() => {
                              setExpandedSections((prev) => {
                                const next = new Set(prev);
                                if (next.has(section.id))
                                  next.delete(section.id);
                                else next.add(section.id);
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
                            onChange={(e) =>
                              setSections(
                                sections.map((s) =>
                                  s.id === section.id
                                    ? { ...s, title: e.target.value }
                                    : s
                                )
                              )
                            }
                            className="flex-1 bg-transparent text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                          />
                          <span className="text-xs text-zinc-500">
                            {sectionLessons.length} lessons
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('Delete this section?')) {
                                setSections(
                                  sections.filter((s) => s.id !== section.id)
                                );
                              }
                            }}
                            className="p-1 hover:bg-red-900/50 rounded text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="p-3 space-y-2 border-t border-zinc-800">
                            {sectionLessons.map((lesson, idx) => {
                              // Helper to move lesson up/down within this section
                              const moveLessonInSection = (
                                direction: 'up' | 'down'
                              ) => {
                                const currentIndex = section.lessonIds.indexOf(
                                  lesson.id
                                );
                                if (currentIndex === -1) return;

                                const newIndex =
                                  direction === 'up'
                                    ? currentIndex - 1
                                    : currentIndex + 1;
                                if (
                                  newIndex < 0 ||
                                  newIndex >= section.lessonIds.length
                                )
                                  return;

                                // Create new lessonIds array with swapped positions
                                const newLessonIds = [...section.lessonIds];
                                [
                                  newLessonIds[currentIndex],
                                  newLessonIds[newIndex],
                                ] = [
                                  newLessonIds[newIndex],
                                  newLessonIds[currentIndex],
                                ];

                                // Update sections state
                                const newSections = sections.map((s) =>
                                  s.id === section.id
                                    ? { ...s, lessonIds: newLessonIds }
                                    : s
                                );
                                setSections(newSections);

                                // Save to server immediately
                                if (course) {
                                  updateCourse(courseId, {
                                    ...course,
                                    sections: newSections,
                                    lessons,
                                  });
                                }
                              };

                              return (
                                <div
                                  key={`${section.id}-${lesson.id}`}
                                  className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg group"
                                >
                                  {/* Up/Down buttons */}
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={() => moveLessonInSection('up')}
                                      disabled={idx === 0}
                                      className={`p-0.5 rounded transition-colors ${idx === 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
                                      title="Move up"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        moveLessonInSection('down')
                                      }
                                      disabled={
                                        idx === sectionLessons.length - 1
                                      }
                                      className={`p-0.5 rounded transition-colors ${idx === sectionLessons.length - 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
                                      title="Move down"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <span className="flex-1 text-sm text-white">
                                    {lesson.title}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setSections(
                                        sections.map((s) =>
                                          s.id === section.id
                                            ? {
                                                ...s,
                                                lessonIds: s.lessonIds.filter(
                                                  (id) => id !== lesson.id
                                                ),
                                              }
                                            : s
                                        )
                                      )
                                    }
                                    className="text-xs text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}

                            {unassignedLessons.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const newSections = sections.map((s) =>
                                      s.id === section.id
                                        ? {
                                            ...s,
                                            lessonIds: [
                                              ...s.lessonIds,
                                              e.target.value,
                                            ],
                                          }
                                        : s
                                    );
                                    setSections(newSections);
                                    // Save to server
                                    if (course) {
                                      updateCourse(courseId, {
                                        ...course,
                                        sections: newSections,
                                        lessons,
                                      });
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                className="w-full mt-2 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400"
                              >
                                <option value="">
                                  + Add lesson to section...
                                </option>
                                {unassignedLessons.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.title}
                                  </option>
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

              {lessons.filter(
                (l) => !sections.some((s) => s.lessonIds.includes(l.id))
              ).length > 0 &&
                sections.length > 0 && (
                  <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                    <p className="text-amber-400 text-sm font-medium">
                      ⚠️{' '}
                      {
                        lessons.filter(
                          (l) =>
                            !sections.some((s) => s.lessonIds.includes(l.id))
                        ).length
                      }{' '}
                      lesson(s) not in any section
                    </p>
                  </div>
                )}
            </div>
          )}
        </main>

        {/* Right Panel - Desktop only (mobile uses inline toolbar) */}
        <aside className="hidden md:block w-80 shrink-0">
          {activeView === 'content' ? (
            <FluidEditorSidebar
              editor={fluidEditor}
              onInsertComponent={handleAddComponent}
            />
          ) : (
            <DesignControls
              component={selectedComponent || null}
              onUpdate={handleUpdateComponent}
              onDelete={handleDeleteComponent}
              onAddComponent={handleAddComponent}
            />
          )}
        </aside>
      </div>

      {/* Context Menu */}
      {contextMenu &&
        (() => {
          const component =
            components.find((c) => c.id === contextMenu.componentId) || null;
          return (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              component={component}
              onClose={() => setContextMenu(null)}
              onDuplicate={() =>
                component && handleDuplicateComponent(component)
              }
              onDelete={() =>
                component && handleDeleteFromContextMenu(component)
              }
              onMoveUp={() => component && handleMoveComponentUp(component)}
              onMoveDown={() => component && handleMoveComponentDown(component)}
              onCopy={() => component && handleCopyComponent(component)}
              canMoveUp={
                components.findIndex((c) => c.id === contextMenu.componentId) >
                0
              }
              canMoveDown={
                components.findIndex((c) => c.id === contextMenu.componentId) <
                components.length - 1
              }
            />
          );
        })()}
    </div>
  );
}
