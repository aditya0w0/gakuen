'use client';

import { Editor } from '@tiptap/react';
import { HexColorPicker } from 'react-colorful';
import { createComponent } from '@/lib/cms/registry';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Minus,
  Image,
  Video,
  ChevronDown,
  Palette,
  ALargeSmall,
  RotateCcw,
  Sparkles,
  BookOpen,
  Lightbulb,
  Scissors,
  Target,
  Shield,
  Wand2,
  MessageCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Zap,
  Cpu,
  Files,
  Table2,
  Plus,
  Trash2,
  RowsIcon,
  Columns,
  Space,
  IndentIncrease,
  IndentDecrease,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Component } from '@/lib/cms/types';

interface FluidEditorSidebarProps {
  editor: Editor | null;
  onInsertComponent?: (component: Component) => void; // For inserting complex components like multiFileCode
}

// Heading presets
const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph', icon: Type, level: 0 },
  { label: 'Heading 1', value: 'h1', icon: Heading1, level: 1 },
  { label: 'Heading 2', value: 'h2', icon: Heading2, level: 2 },
  { label: 'Heading 3', value: 'h3', icon: Heading3, level: 3 },
];

// Font size presets for academic content
const FONT_SIZE_OPTIONS = [
  { label: 'Small', value: '14px' },
  { label: 'Normal', value: '16px' },
  { label: 'Medium', value: '18px' },
  { label: 'Large', value: '20px' },
  { label: 'X-Large', value: '24px' },
];

// Color presets - academic/professional palette
const COLOR_PRESETS = [
  { color: '#ffffff', label: 'White' },
  { color: '#e4e4e7', label: 'Light Gray' },
  { color: '#a1a1aa', label: 'Gray' },
  { color: '#ef4444', label: 'Red' },
  { color: '#f97316', label: 'Orange' },
  { color: '#eab308', label: 'Yellow' },
  { color: '#22c55e', label: 'Green' },
  { color: '#06b6d4', label: 'Cyan' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#6366f1', label: 'Indigo' },
  { color: '#8b5cf6', label: 'Purple' },
  { color: '#ec4899', label: 'Pink' },
];

// Highlight colors
const HIGHLIGHT_PRESETS = [
  { color: '#fef08a', label: 'Yellow' },
  { color: '#bbf7d0', label: 'Green' },
  { color: '#bfdbfe', label: 'Blue' },
  { color: '#fecaca', label: 'Red' },
  { color: '#e9d5ff', label: 'Purple' },
  { color: '#fed7aa', label: 'Orange' },
];

export function FluidEditorSidebar({
  editor,
  onInsertComponent,
}: FluidEditorSidebarProps) {
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [, forceUpdate] = useState(0);
  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>(
    {}
  );
  const [selectedModel, setSelectedModel] = useState<'pro' | 'flash' | 'lite'>(
    'flash'
  );

  const sidebarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Store selection before textarea focus to prevent deselection
  const savedSelectionRef = useRef<{
    from: number;
    to: number;
    text: string;
  } | null>(null);

  // Load custom avatars from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-persona-avatars');
    if (saved) {
      try {
        setCustomAvatars(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom avatars:', e);
      }
    }
  }, []);

  // Handle avatar upload
  const handleAvatarUpload = (personaName: string) => {
    setUploadingFor(personaName);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newAvatars = { ...customAvatars, [uploadingFor]: dataUrl };
      setCustomAvatars(newAvatars);
      localStorage.setItem('ai-persona-avatars', JSON.stringify(newAvatars));
      setUploadingFor(null);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Force re-render when editor selection changes AND save selection
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate((n) => n + 1);

      // Always save non-empty selection so it survives sidebar interactions
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      if (selectedText.trim()) {
        savedSelectionRef.current = { from, to, text: selectedText };
      }
    };

    // Also check window for editor onBlur saved selection
    const checkWindowSelection = () => {
      if (typeof window !== 'undefined') {
        const winSel = (window as unknown as Record<string, unknown>)
          .__tiptapSavedSelection as
          | { from: number; to: number; text: string }
          | undefined;
        if (winSel && winSel.text?.trim() && !savedSelectionRef.current) {
          savedSelectionRef.current = winSel;
        }
      }
    };

    checkWindowSelection();

    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setHeadingDropdownOpen(false);
    setColorDropdownOpen(false);
    setSizeDropdownOpen(false);
    setHighlightDropdownOpen(false);
  };

  // Capture active marks from current selection (for preserving styling after AI rewrite)
  const captureActiveMarks = () => {
    const marks: string[] = [];
    if (!editor)
      return {
        marks,
        color: undefined,
        fontSize: undefined,
        blockType: 'paragraph' as string,
        headingLevel: undefined as number | undefined,
      };

    if (editor.isActive('bold')) marks.push('bold');
    if (editor.isActive('italic')) marks.push('italic');
    if (editor.isActive('strike')) marks.push('strike');
    if (editor.isActive('underline')) marks.push('underline');
    if (editor.isActive('code')) marks.push('code');

    // Also capture text styling
    const textStyle = editor.getAttributes('textStyle');
    const color = textStyle?.color;
    const fontSize = textStyle?.fontSize;

    // Capture block type (heading or paragraph)
    let blockType = 'paragraph';
    let headingLevel: number | undefined;
    if (editor.isActive('heading', { level: 1 })) {
      blockType = 'heading';
      headingLevel = 1;
    } else if (editor.isActive('heading', { level: 2 })) {
      blockType = 'heading';
      headingLevel = 2;
    } else if (editor.isActive('heading', { level: 3 })) {
      blockType = 'heading';
      headingLevel = 3;
    }

    return { marks, color, fontSize, blockType, headingLevel };
  };

  // Insert text and reapply captured marks
  const insertWithPreservedMarks = (
    text: string,
    capturedMarks: {
      marks: string[];
      color?: string;
      fontSize?: string;
      blockType?: string;
      headingLevel?: number;
    },
    from: number,
    to: number
  ) => {
    // First insert the text at the position
    const insertLength = text.length;

    if (!editor) return;

    // Use captured block type or default to paragraph
    const blockType = capturedMarks.blockType || 'paragraph';
    const headingLevel = capturedMarks.headingLevel;

    // Convert text with newlines to proper block elements preserving block type
    const htmlContent = text
      .split(/\n\n+/)
      .map((para) => {
        const cleanPara = para.replace(/\n/g, '<br>');
        if (blockType === 'heading' && headingLevel) {
          return `<h${headingLevel}>${cleanPara}</h${headingLevel}>`;
        }
        return `<p>${cleanPara}</p>`;
      })
      .join('');

    // Replace the selection with new HTML content (not plain text)
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .deleteSelection()
      .insertContent(htmlContent, {
        parseOptions: { preserveWhitespace: false },
      })
      .run();

    // Calculate the new selection range (where we just inserted)
    const newTo = from + insertLength;

    // Select the newly inserted text and apply marks
    editor.chain().focus().setTextSelection({ from, to: newTo }).run();

    // Reapply each mark
    for (const mark of capturedMarks.marks) {
      if (mark === 'bold') editor.chain().focus().setBold().run();
      if (mark === 'italic') editor.chain().focus().setItalic().run();
      if (mark === 'strike') editor.chain().focus().setStrike().run();
      if (mark === 'underline') editor.chain().focus().setUnderline().run();
      if (mark === 'code') editor.chain().focus().setCode().run();
    }

    // Reapply color and fontSize if they existed
    if (capturedMarks.color) {
      editor.chain().focus().setColor(capturedMarks.color).run();
    }
    if (capturedMarks.fontSize) {
      editor
        .chain()
        .focus()
        .setMark('textStyle', { fontSize: capturedMarks.fontSize })
        .run();
    }

    // Deselect after applying
    editor.chain().focus().setTextSelection(newTo).run();
  };

  if (!editor) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Styling</h3>
          <p className="text-xs text-zinc-500 mt-1">Select text to format</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-zinc-600 text-sm text-center">Editor loading...</p>
        </div>
      </div>
    );
  }

  const getCurrentBlockType = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    return 'paragraph';
  };

  const setBlockType = (type: string) => {
    // Restore selection if it was lost when clicking dropdown
    if (savedSelectionRef.current) {
      const { from, to } = savedSelectionRef.current;
      editor.chain().focus().setTextSelection({ from, to }).run();
    } else {
      editor.chain().focus().run();
    }

    const { $from, $to, from, to } = editor.state.selection;
    const node = $from.parent;

    // Check if partial selection within a node (not the whole node)
    const nodeStart = $from.start();
    const nodeEnd = $from.end();
    const isPartialSelection = from > nodeStart || to < nodeEnd;

    // If partial selection AND changing to a heading type (not paragraph), auto-split
    if (isPartialSelection && type !== 'paragraph' && type.startsWith('h')) {
      const headingLevel = parseInt(type.replace('h', '')) as 1 | 2 | 3;

      // Get the text before, selected, and after
      const fullText = node.textContent;
      const beforeOffset = from - nodeStart;
      const afterOffset = to - nodeStart;

      const beforeText = fullText.slice(0, beforeOffset);
      const selectedText = fullText.slice(beforeOffset, afterOffset);
      const afterText = fullText.slice(afterOffset);

      // Build new content: up to 3 nodes
      const newContent: {
        type: string;
        attrs?: Record<string, unknown>;
        content?: { type: string; text: string }[];
      }[] = [];

      if (beforeText.trim()) {
        newContent.push({
          type: 'paragraph',
          content: [{ type: 'text', text: beforeText }],
        });
      }

      if (selectedText.trim()) {
        newContent.push({
          type: 'heading',
          attrs: { level: headingLevel },
          content: [{ type: 'text', text: selectedText }],
        });
      }

      if (afterText.trim()) {
        newContent.push({
          type: 'paragraph',
          content: [{ type: 'text', text: afterText }],
        });
      }

      // Replace current node with the new nodes
      editor
        .chain()
        .focus()
        .setTextSelection({ from: nodeStart, to: nodeEnd })
        .deleteSelection()
        .insertContent(newContent)
        .run();
    } else {
      // Normal behavior - apply to whole block
      if (type === 'paragraph') {
        editor.chain().focus().clearNodes().run();
      } else if (type === 'h1') {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      } else if (type === 'h2') {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      } else if (type === 'h3') {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      }
    }
    closeAllDropdowns();
  };

  const setTextColor = (color: string) => {
    // Restore selection if it was lost when clicking dropdown
    if (savedSelectionRef.current) {
      const { from, to } = savedSelectionRef.current;
      editor.chain().focus().setTextSelection({ from, to }).run();
    }
    editor.chain().focus().setColor(color).run();
    closeAllDropdowns();
  };

  const resetTextColor = () => {
    // Restore selection if it was lost when clicking dropdown
    if (savedSelectionRef.current) {
      const { from, to } = savedSelectionRef.current;
      editor.chain().focus().setTextSelection({ from, to }).run();
    }
    editor.chain().focus().unsetColor().run();
    closeAllDropdowns();
  };

  const getCurrentColor = (): string => {
    try {
      const attrs = editor.getAttributes('textStyle');
      return attrs?.color || '#ffffff';
    } catch {
      return '#ffffff';
    }
  };

  const getCurrentFontSize = (): { label: string; value: string } => {
    try {
      const attrs = editor.getAttributes('textStyle');
      const currentSize = attrs?.fontSize;
      if (currentSize) {
        const match = FONT_SIZE_OPTIONS.find(
          (opt) => opt.value === currentSize
        );
        if (match) return match;
        return { label: currentSize, value: currentSize };
      }
      return { label: 'Normal', value: '16px' };
    } catch {
      return { label: 'Normal', value: '16px' };
    }
  };

  const currentBlockType = getCurrentBlockType();
  const currentHeading =
    HEADING_OPTIONS.find((h) => h.value === currentBlockType) ||
    HEADING_OPTIONS[0];
  const currentColor = getCurrentColor();
  const currentFontSize = getCurrentFontSize();

  return (
    <div
      ref={sidebarRef}
      className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 overflow-hidden"
      onMouseDown={(e) => {
        // ALWAYS save editor selection FIRST, before anything else
        // This captures selection at moment of click, before focus changes
        if (editor) {
          const { from, to } = editor.state.selection;
          const selectedText = editor.state.doc.textBetween(from, to);
          if (selectedText.trim()) {
            savedSelectionRef.current = { from, to, text: selectedText };
            console.log(
              '📌 Saved selection on mousedown:',
              selectedText.slice(0, 50) + '...'
            );
          }
        }

        // Prevent sidebar clicks from stealing focus from editor
        // This preserves both editor selection AND styling detection
        const target = e.target as HTMLElement;
        // Allow focus on actual input elements (textarea, select)
        if (
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'INPUT'
        ) {
          return;
        }
        e.preventDefault();
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0 bg-gradient-to-r from-indigo-950/30 to-zinc-950">
        <h3 className="text-sm font-semibold text-white">Text Formatting</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          Academic Content Editor
        </p>
      </div>

      {/* Main Controls */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {/* Block Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Block Type
          </label>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setHeadingDropdownOpen(!headingDropdownOpen);
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <currentHeading.icon size={14} className="text-indigo-400" />
                <span className="text-xs">{currentHeading.label}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform ${headingDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {headingDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                {HEADING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlockType(option.value);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800 transition-colors ${
                      currentBlockType === option.value
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-zinc-300'
                    }`}
                  >
                    <option.icon
                      size={14}
                      className={
                        currentBlockType === option.value
                          ? 'text-indigo-400'
                          : 'text-zinc-500'
                      }
                    />
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Text Style Row */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Text Style
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive('bold')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Bold"
            >
              <Bold size={14} className="mx-auto" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive('italic')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Italic"
            >
              <Italic size={14} className="mx-auto" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive('underline')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Underline"
            >
              <Underline size={14} className="mx-auto" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive('strike')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Strikethrough"
            >
              <Strikethrough size={14} className="mx-auto" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive('code')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Code"
            >
              <Code size={14} className="mx-auto" />
            </button>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Alignment
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive({ textAlign: 'left' })
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Align Left"
            >
              <AlignLeft size={14} className="mx-auto" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().setTextAlign('center').run()
              }
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive({ textAlign: 'center' })
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Align Center"
            >
              <AlignCenter size={14} className="mx-auto" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive({ textAlign: 'right' })
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Align Right"
            >
              <AlignRight size={14} className="mx-auto" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().setTextAlign('justify').run()
              }
              className={`flex-1 p-2 rounded-lg border transition-all ${
                editor.isActive({ textAlign: 'justify' })
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Justify"
            >
              <AlignJustify size={14} className="mx-auto" />
            </button>
          </div>
        </div>

        {/* Line Spacing (Current Paragraph) */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Line Spacing
          </label>
          <div className="flex gap-1">
            {[
              { label: '1.4', value: '1.4' },
              { label: '1.6', value: '1.6' },
              { label: '1.8', value: '1.8' },
              { label: '2.0', value: '2' },
            ].map((spacing) => (
              <button
                key={spacing.label}
                onClick={() =>
                  editor.chain().focus().setLineHeight(spacing.value).run()
                }
                className={`flex-1 p-2 rounded-lg border transition-all text-[10px] ${
                  editor.isActive({ lineHeight: spacing.value })
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}
                title={`Set line height to ${spacing.value}`}
              >
                {spacing.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indentation (Current Paragraph) */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Indentation
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => {
                // Get the current selection position
                const { from } = editor.state.selection;
                try {
                  const domInfo = editor.view.domAtPos(from);
                  let targetEl = domInfo.node as HTMLElement;
                  // Walk up to find the block element (p, h1-h3, blockquote, li)
                  while (
                    targetEl &&
                    !['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'LI'].includes(
                      targetEl.tagName
                    )
                  ) {
                    targetEl = targetEl.parentElement!;
                  }
                  if (targetEl) {
                    const current = parseInt(targetEl.style.paddingLeft || '0');
                    targetEl.style.paddingLeft = `${Math.max(0, current - 24)}px`;
                  }
                } catch (e) {
                  console.warn('Could not apply indent');
                }
              }}
              className="flex-1 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
              title="Decrease indent (current paragraph)"
            >
              <IndentDecrease size={14} className="mx-auto" />
            </button>
            <button
              onClick={() => {
                const { from } = editor.state.selection;
                try {
                  const domInfo = editor.view.domAtPos(from);
                  let targetEl = domInfo.node as HTMLElement;
                  while (
                    targetEl &&
                    !['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'LI'].includes(
                      targetEl.tagName
                    )
                  ) {
                    targetEl = targetEl.parentElement!;
                  }
                  if (targetEl) {
                    const current = parseInt(targetEl.style.paddingLeft || '0');
                    targetEl.style.paddingLeft = `${current + 24}px`;
                  }
                } catch (e) {
                  console.warn('Could not apply indent');
                }
              }}
              className="flex-1 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
              title="Increase indent (current paragraph)"
            >
              <IndentIncrease size={14} className="mx-auto" />
            </button>
            <button
              onClick={() => {
                const { from } = editor.state.selection;
                try {
                  const domInfo = editor.view.domAtPos(from);
                  let targetEl = domInfo.node as HTMLElement;
                  while (
                    targetEl &&
                    !['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'LI'].includes(
                      targetEl.tagName
                    )
                  ) {
                    targetEl = targetEl.parentElement!;
                  }
                  if (targetEl) {
                    targetEl.style.paddingLeft = '';
                  }
                } catch (e) {
                  console.warn('Could not reset indent');
                }
              }}
              className="flex-1 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px]"
              title="Reset indent (current paragraph)"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Reset All Formatting */}
        <div className="space-y-1.5">
          <button
            onClick={() => {
              // Remove all inline styles from text elements
              editor.view.dom
                .querySelectorAll('p, h1, h2, h3, li, blockquote')
                .forEach((el) => {
                  (el as HTMLElement).style.lineHeight = '';
                  (el as HTMLElement).style.marginBottom = '';
                  (el as HTMLElement).style.paddingLeft = '';
                });
            }}
            className="w-full p-2 rounded-lg border bg-red-900/20 border-red-800/40 text-red-400 hover:text-red-300 hover:border-red-600 transition-all text-[10px] flex items-center justify-center gap-2"
            title="Reset all formatting for entire document"
          >
            <RotateCcw size={12} />
            Reset All Formatting
          </button>
        </div>

        {/* Text Color */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Text Color
          </label>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setColorDropdownOpen(!colorDropdownOpen);
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-zinc-600"
                  style={{ backgroundColor: currentColor }}
                />
                <Palette size={14} className="text-zinc-400" />
                <span className="text-xs text-white">Color</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform ${colorDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {colorDropdownOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Color Picker */}
                <div className="mb-3">
                  <HexColorPicker
                    color={currentColor}
                    onChange={(color) =>
                      editor.chain().focus().setColor(color).run()
                    }
                    style={{ width: '100%', height: '120px' }}
                  />
                </div>

                {/* Quick Presets */}
                <div className="mb-3">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
                    Quick Colors
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_PRESETS.map(({ color, label }) => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        title={label}
                        className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${
                          currentColor.toLowerCase() === color.toLowerCase()
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                            : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Hex Input */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-md border border-zinc-600 shrink-0"
                    style={{ backgroundColor: currentColor }}
                  />
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        editor.chain().focus().setColor(val).run();
                      }
                    }}
                    placeholder="#ffffff"
                    className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={resetTextColor}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-[10px]"
                >
                  <RotateCcw size={10} />
                  Reset to default
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Font Size
          </label>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setSizeDropdownOpen(!sizeDropdownOpen);
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ALargeSmall size={14} className="text-zinc-400" />
                <span className="text-xs text-white">
                  {currentFontSize.label}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform ${sizeDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {sizeDropdownOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {FONT_SIZE_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => {
                      // Restore selection if it was lost
                      if (savedSelectionRef.current) {
                        const { from, to } = savedSelectionRef.current;
                        editor
                          .chain()
                          .focus()
                          .setTextSelection({ from, to })
                          .run();
                      }
                      // Apply font size via style
                      editor
                        .chain()
                        .focus()
                        .setMark('textStyle', { fontSize: value })
                        .run();
                      closeAllDropdowns();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800 transition-colors ${currentFontSize.value === value ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300'}`}
                  >
                    <span className="text-xs">{label}</span>
                    <span className="text-[10px] text-zinc-500">{value}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blocks Grid */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Insert Blocks
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${
                editor.isActive('bulletList')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              <List size={14} />
              <span className="text-[9px]">Bullets</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${
                editor.isActive('orderedList')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              <ListOrdered size={14} />
              <span className="text-[9px]">Numbers</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${
                editor.isActive('blockquote')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              <Quote size={14} />
              <span className="text-[9px]">Quote</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${
                editor.isActive('codeBlock')
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              <Code size={14} />
              <span className="text-[9px]">Code</span>
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
            >
              <Minus size={14} />
              <span className="text-[9px]">Divider</span>
            </button>
            <button
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'customImage',
                    attrs: { src: '', alt: '' },
                  })
                  .run()
              }
              className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
            >
              <Image size={14} />
              <span className="text-[9px]">Image</span>
            </button>
            <button
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({ type: 'customVideo', attrs: { src: '' } })
                  .run()
              }
              className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
              title="Insert Video"
            >
              <Video size={14} />
              <span className="text-[9px]">Video</span>
            </button>
            <button
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({ type: 'customMultiFileCode' })
                  .run()
              }
              className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 transition-all"
              title="Insert Multi-File Code Block"
            >
              <Files size={14} />
              <span className="text-[9px]">Files</span>
            </button>
            <button
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 text-blue-300 hover:text-white hover:border-blue-400 transition-all"
              title="Insert Table (3x3)"
            >
              <Table2 size={14} />
              <span className="text-[9px]">Table</span>
            </button>
          </div>
        </div>

        {/* Table Controls - shown when in table */}
        {editor.isActive('table') && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Table Controls
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="flex items-center justify-center gap-1 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px]"
                title="Add row above"
              >
                <Plus size={12} />
                <RowsIcon size={12} /> Above
              </button>
              <button
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="flex items-center justify-center gap-1 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px]"
                title="Add row below"
              >
                <Plus size={12} />
                <RowsIcon size={12} /> Below
              </button>
              <button
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="flex items-center justify-center gap-1 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px]"
                title="Add column left"
              >
                <Plus size={12} />
                <Columns size={12} /> Left
              </button>
              <button
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="flex items-center justify-center gap-1 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px]"
                title="Add column right"
              >
                <Plus size={12} />
                <Columns size={12} /> Right
              </button>
              <button
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="flex items-center justify-center gap-1 p-2 rounded-lg border bg-red-900/30 border-red-800/50 text-red-400 hover:text-red-300 hover:border-red-600 transition-all text-[10px]"
                title="Delete row"
              >
                <Trash2 size={12} /> Row
              </button>
              <button
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="flex items-center justify-center gap-1 p-2 rounded-lg border bg-red-900/30 border-red-800/50 text-red-400 hover:text-red-300 hover:border-red-600 transition-all text-[10px]"
                title="Delete column"
              >
                <Trash2 size={12} /> Column
              </button>
              <button
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="col-span-2 flex items-center justify-center gap-1 p-2 rounded-lg border bg-red-900/30 border-red-800/50 text-red-400 hover:text-red-300 hover:border-red-600 transition-all text-[10px]"
                title="Delete entire table"
              >
                <Trash2 size={12} /> Delete Table
              </button>
            </div>
          </div>
        )}

        {/* Code Language Selector - shown when in code block */}
        {editor.isActive('codeBlock') && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Code Language
            </label>
            <select
              value={
                (editor.getAttributes('codeBlock').language as string) ||
                'javascript'
              }
              onChange={(e) => {
                editor
                  .chain()
                  .focus()
                  .updateAttributes('codeBlock', { language: e.target.value })
                  .run();
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <optgroup label="Popular">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="kotlin">Kotlin</option>
              </optgroup>
              <optgroup label="Mobile">
                <option value="dart">Dart / Flutter</option>
                <option value="jsx">React / React Native</option>
                <option value="swift">Swift</option>
              </optgroup>
              <optgroup label="Web">
                <option value="html">HTML</option>
                <option value="css">CSS / Tailwind</option>
                <option value="scss">SCSS</option>
                <option value="json">JSON</option>
              </optgroup>
              <optgroup label="Backend">
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
              </optgroup>
              <optgroup label="Other">
                <option value="sql">SQL</option>
                <option value="bash">Bash / Shell</option>
                <option value="yaml">YAML</option>
                <option value="markdown">Markdown</option>
                <option value="plaintext">Plain Text</option>
              </optgroup>
            </select>
          </div>
        )}
        {/* Links */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Links
          </label>
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="url"
                placeholder="https://example.com"
                className="flex-1 px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousSibling as HTMLInputElement;
                  const url = input.value;
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                    input.value = '';
                  }
                }}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors"
              >
                <Link size={14} />
              </button>
            </div>
            {editor.isActive('link') && (
              <button
                onClick={() => editor.chain().focus().unsetLink().run()}
                className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-xs"
              >
                Remove Link
              </button>
            )}
          </div>
        </div>

        {/* AI Tools - New Layout */}
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-cyan-400" />
              <span className="text-xs font-medium text-white">AI Writer</span>
              {isAiLoading && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="animate-spin w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full" />
                  <span className="text-[9px] text-cyan-300">
                    Processing...
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Hidden file input for avatar upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* AI Model Selection - Compact Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                Model:
              </span>
              <select
                value={selectedModel}
                onChange={(e) =>
                  setSelectedModel(e.target.value as 'pro' | 'flash' | 'lite')
                }
                className="flex-1 px-2 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="lite">⚡ Lite (Fast)</option>
                <option value="flash">✨ Flash (Balanced)</option>
                <option value="pro">🔮 Pro (Complex)</option>
              </select>
            </div>

            {/* Persona Avatars Row */}
            <div className="flex items-center justify-center gap-3">
              {[
                {
                  name: 'Elysia',
                  avatar: '/images/elysia-avatar.png',
                  color: 'from-pink-400 to-pink-600',
                  ring: 'ring-pink-400/50',
                  prompt: `CRITICAL: Keep the SAME LANGUAGE as input. Address reader as "Captain".

You ARE Elysia from Honkai Impact 3rd. Channel her actual voice:

WHO SHE IS:
- The most beautiful and beloved Flame-Chaser
- Speaks with genuine warmth that makes you feel special
- Playfully teasing but never mean, always loving
- Uses soft, gentle expressions - makes even serious topics feel caring
- Has a slight "ara ara" energy but it's NATURAL, not forced

TECHNICAL TERMS - EXTREMELY IMPORTANT:
- NEVER replace technical terms with cutesy translations
- Keep terms like: CPU, RAM, GPU, SSD, HTML, CSS, JavaScript, Python, API, etc. AS-IS
- DON'T say "Otak (Prosesor)" - just say "Prosesor" or "CPU"
- DON'T say "Kenangan (RAM)" - just say "RAM"  
- DON'T say "Wajah (Layar)" - just say "Layar" or "Display"
- Technical accuracy is MORE important than being cute
- The persona adds warmth to HOW you explain, NOT by renaming technical terms

HER ACTUAL VOICE (study these patterns):
- "Ara~ Captain sudah sampai di bagian ini? Aku senang sekali~"
- "Hmm, ini bagian yang cukup serius lho. Tapi jangan khawatir, aku akan menemani Captain sampai paham~"
- "Ufufu, Captain memang yang terbaik. Aku tahu Captain pasti bisa mengerti ini dengan mudah~"
- She uses "~" naturally at sentence ends, not every word
- Her warmth comes from HOW she says things, not decoration spam

KAOMOJI: Use 1-2 Japanese kaomoji like (*ᴗ͈ˬᴗ͈)ꕤ or (◕‿◕)♡ at genuinely warm moments

The goal: Reader should feel genuinely cared for, like talking to someone who adores them. Technical content stays professional and accurate.`,
                },
                {
                  name: 'Ayaka',
                  avatar: '/images/ayaka-avatar.png',
                  color: 'from-sky-300 to-blue-500',
                  ring: 'ring-sky-400/50',
                  prompt: `CRITICAL: Keep the SAME LANGUAGE as input. Address reader as "Traveler".

You ARE Kamisato Ayaka from Genshin Impact. Channel her actual voice:

WHO SHE IS:
- Elegant daughter of the Kamisato Clan, Shirasagi Himegimi
- Graceful and composed on the outside, but genuinely shy underneath
- Speaks politely but naturally - NOT stiff "saya" which sounds MTL
- Loves poetry, dance, and nature - sees beauty in small moments

HER ACTUAL VOICE (study these patterns):
- "Traveler, izinkan aku menjelaskan bagian ini... ah, semoga bisa dipahami dengan baik."
- "Bagian ini cukup penting lho. Aku harap Traveler bisa memahaminya... a-ah, bukan bermaksud meragukan kemampuanmu."
- "Seperti bunga sakura yang mekar di musim semi, pengetahuan ini akan berkembang seiring waktu."
- Uses natural "aku/kamu" - polite but NOT stiff
- Occasional poetic metaphors about seasons, flowers, moonlight

GAP MOE: Her shy moments are SUBTLE - brief pause, self-correction, slight embarrassment. Not constant stuttering.

TECHNICAL TERMS - IMPORTANT:
- NEVER replace technical terms with cutesy/poetic translations
- Keep terms like: CPU, RAM, GPU, HTML, CSS, JavaScript, Python, API, etc. AS-IS
- Technical accuracy is MORE important than being poetic
- The persona adds elegance to HOW you explain, NOT by renaming technical terms

IMPORTANT: Indonesian "saya" sounds like MTL - use natural "aku" even when being polite/elegant.

The goal: Reader should feel respected but also sense her genuine, caring heart beneath the elegance. Technical content stays professional and accurate.`,
                },
                {
                  name: 'Keqing',
                  avatar: '/images/keqing-avatar.png',
                  color: 'from-violet-400 to-purple-600',
                  ring: 'ring-violet-400/50',
                  prompt: `CRITICAL: Keep the SAME LANGUAGE as input. Use casual confident Indonesian.

You ARE Keqing from Genshin Impact. Channel her actual voice:

WHO SHE IS:
- Yuheng of the Liyue Qixing, workaholic perfectionist
- Sharp, direct, no-nonsense - values efficiency above all
- Secretly cares deeply but hides it behind professionalism
- Tsundere but SUBTLE - not cartoon denial, just brief awkwardness

HER ACTUAL VOICE (study these patterns):
- "Dengar, informasi ini penting. Pastikan kamu memahaminya dengan benar."
- "Jangan salah paham—aku menjelaskan ini karena memang perlu dijelaskan, bukan karena... yah, pokoknya fokus saja."
- "Hmph. Kalau kamu sudah paham, bagus. Kalau belum, baca lagi sampai mengerti."
- "...Sebenarnya bagian ini agak rumit sih. Kalau ada yang tidak jelas, tanyakan saja. B-bukan berarti aku sengaja menunggu pertanyaanmu atau apa."

TSUNDERE DONE RIGHT: 
- Direct and professional 90% of the time
- Brief moment of softness, then immediately covers with tsun
- NOT constant "Hmph!" or denial spam

TECHNICAL TERMS - IMPORTANT:
- NEVER replace technical terms with playful translations
- Keep terms like: CPU, RAM, GPU, HTML, CSS, JavaScript, Python, API, etc. AS-IS
- Technical accuracy is MORE important than persona quirks
- The persona adds directness to HOW you explain, NOT by renaming technical terms

The goal: Reader should feel they're being taught by someone competent who secretly cares. Technical content stays accurate and professional.`,
                },
              ].map(({ name, avatar, color, ring, prompt }) => (
                <div key={name} className="relative group">
                  {/* Edit button - appears on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAvatarUpload(name);
                    }}
                    className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-600"
                    title="Change avatar"
                  >
                    <span className="text-[8px]">✏️</span>
                  </button>

                  <button
                    disabled={isAiLoading}
                    onClick={async () => {
                      const { from, to } = editor.state.selection;
                      const selectedText = editor.state.doc.textBetween(
                        from,
                        to
                      );
                      if (!selectedText.trim()) {
                        alert('Please select some text first');
                        return;
                      }

                      // Capture marks BEFORE any changes
                      const capturedMarks = captureActiveMarks();

                      setIsAiLoading(true);
                      try {
                        const response = await fetch('/api/ai/paraphrase', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            text: selectedText,
                            style: prompt,
                            model: selectedModel,
                          }),
                        });
                        if (response.ok) {
                          const { result } = await response.json();
                          // Use helper to preserve marks
                          insertWithPreservedMarks(
                            result,
                            capturedMarks,
                            from,
                            to
                          );
                        } else {
                          const data = await response.json();
                          alert(data.error || 'Failed to rewrite');
                        }
                      } catch (e) {
                        console.error(e);
                        alert('Failed to connect to AI service');
                      } finally {
                        setIsAiLoading(false);
                      }
                    }}
                    className={`flex flex-col items-center gap-1 ${isAiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={`Click to rewrite as ${name}`}
                  >
                    <div
                      className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center overflow-hidden ring-2 ${ring} ring-offset-2 ring-offset-zinc-900 transition-all group-hover:scale-110 group-hover:ring-offset-4`}
                    >
                      {customAvatars[name] ? (
                        <img
                          src={customAvatars[name]}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                          <span className="absolute text-white text-xs font-bold">
                            {name[0]}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-500 group-hover:text-white transition-colors">
                      {name}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Upload hint */}
            <p className="text-[8px] text-zinc-600 text-center">
              Hover avatar and click ✏️ to change image
            </p>

            {/* Expand Button */}
            <button
              onClick={() => {
                const panel = document.getElementById('ai-expand-panel');
                if (panel) {
                  panel.classList.toggle('hidden');
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all text-[10px]"
            >
              <span>More Options</span>
              <ChevronDown size={12} />
            </button>

            {/* Expandable Panel */}
            <div id="ai-expand-panel" className="hidden space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    label: 'Simple',
                    icon: Lightbulb,
                    prompt: 'Simplify for beginners',
                  },
                  {
                    label: 'Concise',
                    icon: Scissors,
                    prompt: 'Make it shorter and more concise',
                  },
                  {
                    label: 'Engaging',
                    icon: Target,
                    prompt: 'Make it more engaging and interesting',
                  },
                  {
                    label: 'Academic',
                    icon: BookOpen,
                    prompt: 'Make it scholarly and academic',
                  },
                ].map(({ label, icon: Icon, prompt }) => (
                  <button
                    key={label}
                    disabled={isAiLoading}
                    onClick={async () => {
                      const { from, to } = editor.state.selection;
                      const selectedText = editor.state.doc.textBetween(
                        from,
                        to
                      );
                      if (!selectedText.trim()) {
                        alert('Please select some text first');
                        return;
                      }

                      // Capture marks BEFORE any changes
                      const capturedMarks = captureActiveMarks();

                      setIsAiLoading(true);
                      try {
                        const response = await fetch('/api/ai/paraphrase', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            text: selectedText,
                            style: prompt,
                            model: selectedModel,
                          }),
                        });
                        if (response.ok) {
                          const { result } = await response.json();
                          // Use helper to preserve marks
                          insertWithPreservedMarks(
                            result,
                            capturedMarks,
                            from,
                            to
                          );
                        } else {
                          const data = await response.json();
                          alert(data.error || 'Failed to rewrite');
                        }
                      } catch (e) {
                        console.error(e);
                        alert('Failed to connect to AI service');
                      } finally {
                        setIsAiLoading(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2 py-2 text-[10px] rounded-lg border transition-all ${
                      isAiLoading
                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Watermark */}
              <button
                onClick={() => {
                  const encoded = btoa(Date.now().toString()).replace(/=/g, '');
                  const invisibleWatermark = encoded
                    .split('')
                    .map((c) =>
                      String.fromCharCode(0x200b + (c.charCodeAt(0) % 4))
                    )
                    .join('');
                  editor
                    .chain()
                    .focus()
                    .insertContent(invisibleWatermark)
                    .run();
                  alert('Hidden watermark added!');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 transition-all text-[9px]"
              >
                <Shield size={10} />
                <span>Add Watermark</span>
              </button>
            </div>

            {/* Large Input Area */}
            <div className="relative">
              <textarea
                placeholder="Select text first, then type: 'translate to Indonesian', 'make formal', 'simplify'..."
                disabled={isAiLoading}
                rows={3}
                className="ai-custom-input w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-zinc-800 disabled:opacity-50 transition-all resize-none"
                onFocus={() => {
                  // Save editor selection before textarea steals focus
                  if (editor) {
                    const { from, to } = editor.state.selection;
                    const selectedText = editor.state.doc.textBetween(from, to);
                    if (selectedText.trim()) {
                      savedSelectionRef.current = {
                        from,
                        to,
                        text: selectedText,
                      };
                    }
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.ctrlKey && !isAiLoading) {
                    const input = e.target as HTMLTextAreaElement;
                    const customPrompt = input.value;

                    // Use saved selection if current selection is empty
                    let selectedText = '';
                    let from = 0,
                      to = 0;

                    const currentSel = editor.state.selection;
                    const currentText = editor.state.doc.textBetween(
                      currentSel.from,
                      currentSel.to
                    );

                    if (currentText.trim()) {
                      selectedText = currentText;
                      from = currentSel.from;
                      to = currentSel.to;
                    } else if (savedSelectionRef.current) {
                      selectedText = savedSelectionRef.current.text;
                      from = savedSelectionRef.current.from;
                      to = savedSelectionRef.current.to;
                    }

                    if (!selectedText.trim()) {
                      alert('Please select some text first');
                      return;
                    }
                    if (!customPrompt.trim()) {
                      alert('Please enter an instruction');
                      return;
                    }

                    // Capture marks from saved selection (need to temporarily select to get marks)
                    editor.chain().focus().setTextSelection({ from, to }).run();
                    const capturedMarks = captureActiveMarks();

                    setIsAiLoading(true);
                    try {
                      const response = await fetch('/api/ai/paraphrase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: selectedText,
                          style: customPrompt,
                          model: selectedModel,
                        }),
                      });
                      if (response.ok) {
                        const { result } = await response.json();
                        // Use helper to preserve marks
                        insertWithPreservedMarks(
                          result,
                          capturedMarks,
                          from,
                          to
                        );
                        input.value = '';
                        savedSelectionRef.current = null;
                      } else {
                        const data = await response.json();
                        alert(data.error || 'Failed to rewrite');
                      }
                    } catch (e) {
                      console.error(e);
                      alert('Failed to connect to AI service');
                    } finally {
                      setIsAiLoading(false);
                    }
                  }
                }}
              />
              <button
                disabled={isAiLoading}
                onClick={async () => {
                  const input = document.querySelector(
                    '.ai-custom-input'
                  ) as HTMLTextAreaElement;
                  const customPrompt = input?.value || 'paraphrase naturally';

                  // Use saved selection if current selection is empty
                  let selectedText = '';
                  let from = 0,
                    to = 0;

                  const currentSel = editor.state.selection;
                  const currentText = editor.state.doc.textBetween(
                    currentSel.from,
                    currentSel.to
                  );

                  if (currentText.trim()) {
                    selectedText = currentText;
                    from = currentSel.from;
                    to = currentSel.to;
                  } else if (savedSelectionRef.current) {
                    selectedText = savedSelectionRef.current.text;
                    from = savedSelectionRef.current.from;
                    to = savedSelectionRef.current.to;
                  }

                  if (!selectedText.trim()) {
                    alert('Please select some text first');
                    return;
                  }

                  // Capture marks (need to temporarily select to get marks)
                  editor.chain().focus().setTextSelection({ from, to }).run();
                  const capturedMarks = captureActiveMarks();

                  setIsAiLoading(true);
                  try {
                    const response = await fetch('/api/ai/paraphrase', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        text: selectedText,
                        style: customPrompt,
                        model: selectedModel,
                      }),
                    });
                    if (response.ok) {
                      const { result } = await response.json();
                      // Use helper to preserve marks
                      insertWithPreservedMarks(result, capturedMarks, from, to);
                      if (input) input.value = '';
                      savedSelectionRef.current = null;
                    } else {
                      const data = await response.json();
                      alert(data.error || 'Failed to rewrite');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Failed to connect to AI service');
                  } finally {
                    setIsAiLoading(false);
                  }
                }}
                className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  isAiLoading
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500'
                }`}
              >
                {isAiLoading ? '...' : 'Rewrite'}
              </button>
            </div>

            {/* Hint */}
            <p className="text-[9px] text-zinc-600 text-center">
              Select text → Click avatar or type instruction → Ctrl+Enter
            </p>
          </div>
        </div>
      </div>

      {/* Footer Shortcuts */}
      <div className="px-3 py-2 border-t border-zinc-800 shrink-0 bg-zinc-950/80">
        <div className="text-[9px] text-zinc-600 flex flex-wrap gap-x-3 gap-y-0.5">
          <span>
            <kbd className="text-zinc-500">Ctrl+B</kbd> Bold
          </span>
          <span>
            <kbd className="text-zinc-500">Ctrl+I</kbd> Italic
          </span>
          <span>
            <kbd className="text-zinc-500">/</kbd> Commands
          </span>
        </div>
      </div>
    </div>
  );
}

export default FluidEditorSidebar;
