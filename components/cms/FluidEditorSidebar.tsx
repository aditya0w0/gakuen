"use client";

import { Editor } from '@tiptap/react';
import { HexColorPicker } from 'react-colorful';
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
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface FluidEditorSidebarProps {
    editor: Editor | null;
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

export function FluidEditorSidebar({ editor }: FluidEditorSidebarProps) {
    const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);
    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
    const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
    const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [, forceUpdate] = useState(0);
    const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({});

    const sidebarRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);

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

    // Force re-render when editor selection changes
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            forceUpdate(n => n + 1);
        };

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chain = editor.chain().focus() as any;
        if (type === 'paragraph') {
            chain.clearNodes().run();
        } else if (type === 'h1') {
            chain.toggleHeading({ level: 1 }).run();
        } else if (type === 'h2') {
            chain.toggleHeading({ level: 2 }).run();
        } else if (type === 'h3') {
            chain.toggleHeading({ level: 3 }).run();
        }
        closeAllDropdowns();
    };

    const setTextColor = (color: string) => {
        editor.chain().focus().setColor(color).run();
        closeAllDropdowns();
    };

    const resetTextColor = () => {
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

    const currentBlockType = getCurrentBlockType();
    const currentHeading = HEADING_OPTIONS.find(h => h.value === currentBlockType) || HEADING_OPTIONS[0];
    const currentColor = getCurrentColor();

    return (
        <div ref={sidebarRef} className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 shrink-0 bg-gradient-to-r from-indigo-950/30 to-zinc-950">
                <h3 className="text-sm font-semibold text-white">Text Formatting</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Academic Content Editor</p>
            </div>

            {/* Main Controls */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">

                {/* Block Type */}
                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Block Type</label>
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
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${headingDropdownOpen ? 'rotate-180' : ''}`} />
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
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800 transition-colors ${currentBlockType === option.value
                                            ? 'bg-indigo-600/20 text-indigo-300'
                                            : 'text-zinc-300'
                                            }`}
                                    >
                                        <option.icon size={14} className={currentBlockType === option.value ? 'text-indigo-400' : 'text-zinc-500'} />
                                        <span className="text-xs">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Text Style Row */}
                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Text Style</label>
                    <div className="flex gap-1">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`flex-1 p-2 rounded-lg border transition-all ${editor.isActive('bold')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                            title="Bold"
                        >
                            <Bold size={14} className="mx-auto" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`flex-1 p-2 rounded-lg border transition-all ${editor.isActive('italic')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                            title="Italic"
                        >
                            <Italic size={14} className="mx-auto" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            className={`flex-1 p-2 rounded-lg border transition-all ${editor.isActive('underline')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                            title="Underline"
                        >
                            <Underline size={14} className="mx-auto" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={`flex-1 p-2 rounded-lg border transition-all ${editor.isActive('strike')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                            title="Strikethrough"
                        >
                            <Strikethrough size={14} className="mx-auto" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            className={`flex-1 p-2 rounded-lg border transition-all ${editor.isActive('code')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                            title="Code"
                        >
                            <Code size={14} className="mx-auto" />
                        </button>
                    </div>
                </div>

                {/* Text Color */}
                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Text Color</label>
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
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${colorDropdownOpen ? 'rotate-180' : ''}`} />
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
                                        onChange={(color) => editor.chain().focus().setColor(color).run()}
                                        style={{ width: '100%', height: '120px' }}
                                    />
                                </div>

                                {/* Quick Presets */}
                                <div className="mb-3">
                                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Quick Colors</label>
                                    <div className="grid grid-cols-6 gap-1.5">
                                        {COLOR_PRESETS.map(({ color, label }) => (
                                            <button
                                                key={color}
                                                onClick={() => setTextColor(color)}
                                                title={label}
                                                className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${currentColor.toLowerCase() === color.toLowerCase()
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
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Font Size</label>
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
                                <span className="text-xs text-white">Size</span>
                            </div>
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${sizeDropdownOpen ? 'rotate-180' : ''}`} />
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
                                            // Apply font size via style
                                            editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
                                            closeAllDropdowns();
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800 transition-colors text-zinc-300"
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
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Insert Blocks</label>
                    <div className="grid grid-cols-3 gap-1.5">
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${editor.isActive('bulletList')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                        >
                            <List size={14} />
                            <span className="text-[9px]">Bullets</span>
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${editor.isActive('orderedList')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                        >
                            <ListOrdered size={14} />
                            <span className="text-[9px]">Numbers</span>
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${editor.isActive('blockquote')
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                        >
                            <Quote size={14} />
                            <span className="text-[9px]">Quote</span>
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${editor.isActive('codeBlock')
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
                            onClick={() => editor.chain().focus().insertContent({ type: 'customImage', attrs: { src: '', alt: '' } }).run()}
                            className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                        >
                            <Image size={14} />
                            <span className="text-[9px]">Image</span>
                        </button>
                    </div>
                </div>

                {/* Links */}
                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Links</label>
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
                                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
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
                                    <span className="text-[9px] text-cyan-300">Processing...</span>
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

                        {/* Persona Avatars Row */}
                        <div className="flex items-center justify-center gap-3">
                            {[
                                {
                                    name: 'Elysia',
                                    avatar: '/images/elysia-avatar.png',
                                    color: 'from-pink-400 to-pink-600',
                                    ring: 'ring-pink-400/50',
                                    prompt: 'Rewrite this text as Elysia from Honkai Impact 3rd would write it. Use her playful, elegant, flirty anime waifu tone. Include musical notes (♪), say "Hi~" if starting a greeting, use words like "lovely", "beautiful", "sparkle". Be optimistic and endearing.'
                                },
                                {
                                    name: 'Ayaka',
                                    avatar: '/images/ayaka-avatar.png',
                                    color: 'from-sky-300 to-blue-500',
                                    ring: 'ring-sky-400/50',
                                    prompt: 'Rewrite this text as Kamisato Ayaka from Genshin Impact would write it. She has Gap Moe with two distinct modes:\n\nTHE MASK: Start cold, distant, and overly formal like a disciplined noblewoman. Use phrases like "One must consider...", "It would be proper to...", "As the Shirasagi Himegimi, I must advise...".\n\nTHE BREAK: When expressing genuine feelings or encouragement, she cracks and becomes flustered. Include stuttering ("I-I...", "P-Please..."), throat clearing ("*Ehem*... forgive me"), and apologizing for being "improper" or "too forward". Example: "I-I... *ehem*... that is to say... I find myself hoping you succeed. P-Please do not think me strange for saying so..."\n\nUse poetic metaphors about sakura, snow, and seasons. The contrast between her composed exterior and her shy sincerity is the charm. She desperately wants to connect but struggles to break from her formal training.'
                                },
                                {
                                    name: 'Keqing',
                                    avatar: '/images/keqing-avatar.png',
                                    color: 'from-violet-400 to-purple-600',
                                    ring: 'ring-violet-400/50',
                                    prompt: 'Rewrite this text as Keqing from Genshin Impact would write it. She is a classic tsundere—sharp and professional, but occasionally loses composure when embarrassed or hiding her true feelings. Include stammering/flustered stuttering like "I-I-It\'s not like I did this for you!", "W-What are you looking at?!", "H-Hmph!". Be efficient and action-oriented normally, but when showing care, stutter and immediately follow with denial. Use phrases like "Let me be clear", "not that I care or anything", "D-Don\'t misunderstand!". Focus on efficiency and standards, but betray genuine warmth she frantically tries to hide.'
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
                                            const selectedText = editor.state.doc.textBetween(from, to);
                                            if (!selectedText.trim()) {
                                                alert('Please select some text first');
                                                return;
                                            }

                                            setIsAiLoading(true);
                                            try {
                                                const response = await fetch('/api/ai/paraphrase', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ text: selectedText, style: prompt }),
                                                });
                                                if (response.ok) {
                                                    const { result } = await response.json();
                                                    editor.chain().focus().deleteSelection().insertContent(result).run();
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
                                        <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center overflow-hidden ring-2 ${ring} ring-offset-2 ring-offset-zinc-900 transition-all group-hover:scale-110 group-hover:ring-offset-4`}>
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
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                    <span className="absolute text-white text-xs font-bold">{name[0]}</span>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-zinc-500 group-hover:text-white transition-colors">{name}</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Upload hint */}
                        <p className="text-[8px] text-zinc-600 text-center">Hover avatar and click ✏️ to change image</p>

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
                                    { label: 'Simple', icon: Lightbulb, prompt: 'Simplify for beginners' },
                                    { label: 'Concise', icon: Scissors, prompt: 'Make it shorter and more concise' },
                                    { label: 'Engaging', icon: Target, prompt: 'Make it more engaging and interesting' },
                                    { label: 'Academic', icon: BookOpen, prompt: 'Make it scholarly and academic' },
                                ].map(({ label, icon: Icon, prompt }) => (
                                    <button
                                        key={label}
                                        disabled={isAiLoading}
                                        onClick={async () => {
                                            const { from, to } = editor.state.selection;
                                            const selectedText = editor.state.doc.textBetween(from, to);
                                            if (!selectedText.trim()) {
                                                alert('Please select some text first');
                                                return;
                                            }

                                            setIsAiLoading(true);
                                            try {
                                                const response = await fetch('/api/ai/paraphrase', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ text: selectedText, style: prompt }),
                                                });
                                                if (response.ok) {
                                                    const { result } = await response.json();
                                                    editor.chain().focus().deleteSelection().insertContent(result).run();
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
                                        className={`flex items-center gap-1.5 px-2 py-2 text-[10px] rounded-lg border transition-all ${isAiLoading
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
                                    const invisibleWatermark = encoded.split('').map(c =>
                                        String.fromCharCode(0x200B + (c.charCodeAt(0) % 4))
                                    ).join('');
                                    editor.chain().focus().insertContent(invisibleWatermark).run();
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
                                placeholder="Custom instruction: 'make it sound like a pirate' or 'translate to Japanese'..."
                                disabled={isAiLoading}
                                rows={3}
                                className="ai-custom-input w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-zinc-800 disabled:opacity-50 transition-all resize-none"
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && e.ctrlKey && !isAiLoading) {
                                        const input = e.target as HTMLTextAreaElement;
                                        const customPrompt = input.value;
                                        const { from, to } = editor.state.selection;
                                        const selectedText = editor.state.doc.textBetween(from, to);
                                        if (!selectedText.trim()) {
                                            alert('Please select some text first');
                                            return;
                                        }
                                        if (!customPrompt.trim()) {
                                            alert('Please enter an instruction');
                                            return;
                                        }

                                        setIsAiLoading(true);
                                        try {
                                            const response = await fetch('/api/ai/paraphrase', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ text: selectedText, style: customPrompt }),
                                            });
                                            if (response.ok) {
                                                const { result } = await response.json();
                                                editor.chain().focus().deleteSelection().insertContent(result).run();
                                                input.value = '';
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
                                    const input = document.querySelector('.ai-custom-input') as HTMLTextAreaElement;
                                    const customPrompt = input?.value || 'paraphrase naturally';
                                    const { from, to } = editor.state.selection;
                                    const selectedText = editor.state.doc.textBetween(from, to);
                                    if (!selectedText.trim()) {
                                        alert('Please select some text first');
                                        return;
                                    }

                                    setIsAiLoading(true);
                                    try {
                                        const response = await fetch('/api/ai/paraphrase', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ text: selectedText, style: customPrompt }),
                                        });
                                        if (response.ok) {
                                            const { result } = await response.json();
                                            editor.chain().focus().deleteSelection().insertContent(result).run();
                                            if (input) input.value = '';
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
                                className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${isAiLoading
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
                    <span><kbd className="text-zinc-500">Ctrl+B</kbd> Bold</span>
                    <span><kbd className="text-zinc-500">Ctrl+I</kbd> Italic</span>
                    <span><kbd className="text-zinc-500">/</kbd> Commands</span>
                </div>
            </div>
        </div>
    );
}

export default FluidEditorSidebar;

