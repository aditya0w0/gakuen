"use client";

import { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Quote,
    Code,
    Image,
    Heading1,
    Heading2,
    Minus,
    Link,
    ChevronDown,
    Sparkles,
    Palette,
} from 'lucide-react';
import { useState, useRef } from 'react';

interface MobileEditorToolbarProps {
    editor: Editor | null;
}

const COLOR_PRESETS = [
    { color: '#ffffff', label: 'White' },
    { color: '#ef4444', label: 'Red' },
    { color: '#f97316', label: 'Orange' },
    { color: '#eab308', label: 'Yellow' },
    { color: '#22c55e', label: 'Green' },
    { color: '#3b82f6', label: 'Blue' },
    { color: '#8b5cf6', label: 'Purple' },
    { color: '#ec4899', label: 'Pink' },
];

export function MobileEditorToolbar({ editor }: MobileEditorToolbarProps) {
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);

    if (!editor) return null;

    const insertBlock = (type: string) => {
        switch (type) {
            case 'h1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case 'h2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
            case 'quote':
                editor.chain().focus().toggleBlockquote().run();
                break;
            case 'code':
                editor.chain().focus().toggleCodeBlock().run();
                break;
            case 'divider':
                editor.chain().focus().setHorizontalRule().run();
                break;
            case 'image':
                editor.chain().focus().insertContent({ type: 'customImage', attrs: { src: '', alt: '' } }).run();
                break;
        }
        setShowBlockMenu(false);
    };

    const setColor = (color: string) => {
        editor.chain().focus().setColor(color).run();
        setShowColorMenu(false);
    };

    return (
        <div className="md:hidden bg-zinc-900 border-t border-zinc-800 p-3 space-y-3">
            {/* Text Formatting Row */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold mr-2 shrink-0">Style</span>
                <div className="flex gap-1 flex-1">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded-lg transition-all ${editor.isActive('bold')
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded-lg transition-all ${editor.isActive('italic')
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-2 rounded-lg transition-all ${editor.isActive('underline')
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <Underline size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        className={`p-2 rounded-lg transition-all ${editor.isActive('code')
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <Code size={16} />
                    </button>

                    {/* Color Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColorMenu(!showColorMenu)}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                        >
                            <Palette size={16} />
                        </button>
                        {showColorMenu && (
                            <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl z-50">
                                <div className="grid grid-cols-4 gap-1">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.color}
                                            onClick={() => setColor(preset.color)}
                                            className="w-7 h-7 rounded-md border border-zinc-600 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: preset.color }}
                                            title={preset.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lists & Blocks Row */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold mr-2 shrink-0">Lists</span>
                <div className="flex gap-1 flex-1">
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded-lg transition-all ${editor.isActive('bulletList')
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2 rounded-lg transition-all ${editor.isActive('orderedList')
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <ListOrdered size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-2 rounded-lg transition-all ${editor.isActive('blockquote')
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <Quote size={16} />
                    </button>
                </div>
            </div>

            {/* Insert Blocks Row */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold mr-2 shrink-0">Insert</span>
                <div className="flex gap-1 flex-1 flex-wrap">
                    <button
                        onClick={() => insertBlock('h1')}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                        title="Heading 1"
                    >
                        <Heading1 size={16} />
                    </button>
                    <button
                        onClick={() => insertBlock('h2')}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                        title="Heading 2"
                    >
                        <Heading2 size={16} />
                    </button>
                    <button
                        onClick={() => insertBlock('code')}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                        title="Code Block"
                    >
                        <Code size={16} />
                    </button>
                    <button
                        onClick={() => insertBlock('divider')}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                        title="Divider"
                    >
                        <Minus size={16} />
                    </button>
                    <button
                        onClick={() => insertBlock('image')}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                        title="Image"
                    >
                        <Image size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MobileEditorToolbar;
