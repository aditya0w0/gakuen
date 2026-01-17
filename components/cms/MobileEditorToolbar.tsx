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
    Palette,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

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

const AI_PERSONAS = [
    {
        name: 'Elysia',
        avatar: '/images/elysia-avatar.png',
        color: 'from-pink-400 to-rose-500',
        ring: 'ring-pink-400/50',
        prompt: 'Rewrite this text in a playful, elegant, and slightly flirty anime waifu style. Use soft, warm expressions and occasional teasing remarks. Add cute expressions like "~" and emoticons sparingly. Be charming and supportive.'
    },
    {
        name: 'Ayaka',
        avatar: '/images/ayaka-avatar.png',
        color: 'from-blue-300 to-indigo-400',
        ring: 'ring-blue-300/50',
        prompt: 'Rewrite this as Kamisato Ayaka with Gap Moe. Start with elegant and composed language, but occasionally break character to show genuine shyness. Use formal speech that cracks when flustered.'
    },
    {
        name: 'Keqing',
        avatar: '/images/keqing-avatar.png',
        color: 'from-violet-400 to-purple-600',
        ring: 'ring-violet-400/50',
        prompt: 'Rewrite as Keqing - a tsundere. Be sharp and professional normally, but add stammering when embarrassed like "I-It\'s not like I care!" and "H-Hmph!". Deny showing care while obviously caring.'
    },
];

export function MobileEditorToolbar({ editor }: MobileEditorToolbarProps) {
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({});

    // Load custom avatars from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('ai-persona-avatars');
        if (saved) {
            try {
                setCustomAvatars(JSON.parse(saved));
            } catch { }
        }
    }, []);

    if (!editor) return null;

    const insertBlock = (type: string) => {
        switch (type) {
            case 'h1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case 'h2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
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
    };

    const setColor = (color: string) => {
        editor.chain().focus().setColor(color).run();
        setShowColorMenu(false);
    };

    const handleAiRewrite = async (prompt: string, personaName: string) => {
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

            {/* AI Writer Section */}
            <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-indigo-400" />
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">AI Writer</span>
                    {isAiLoading && <Loader2 size={12} className="animate-spin text-indigo-400" />}
                </div>
                <div className="flex items-center justify-center gap-4">
                    {AI_PERSONAS.map(({ name, avatar, color, ring, prompt }) => (
                        <button
                            key={name}
                            disabled={isAiLoading}
                            onClick={() => handleAiRewrite(prompt, name)}
                            className={`flex flex-col items-center gap-1 ${isAiLoading ? 'opacity-50' : ''}`}
                            title={`Rewrite as ${name}`}
                        >
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center overflow-hidden ring-2 ${ring} ring-offset-2 ring-offset-zinc-900 transition-transform active:scale-95`}>
                                {customAvatars[name] ? (
                                    <img src={customAvatars[name]} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <img
                                            src={avatar}
                                            alt={name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <span className="absolute text-white text-xs font-bold">{name[0]}</span>
                                    </>
                                )}
                            </div>
                            <span className="text-[9px] text-zinc-500">{name}</span>
                        </button>
                    ))}
                </div>
                <p className="text-[8px] text-zinc-600 text-center mt-2">Select text, then tap a persona to rewrite</p>
            </div>
        </div>
    );
}

export default MobileEditorToolbar;
