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
    Strikethrough,
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

    useEffect(() => {
        const saved = localStorage.getItem('ai-persona-avatars');
        if (saved) {
            try {
                setCustomAvatars(JSON.parse(saved));
            } catch { }
        }
    }, []);

    if (!editor) return null;

    const handleAiRewrite = async (prompt: string) => {
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

    const ToolBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
        <button
            onClick={onClick}
            title={title}
            className={`p-2.5 rounded-lg transition-all flex-1 flex items-center justify-center ${active
                ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/50'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="md:hidden bg-zinc-900/95 backdrop-blur border-t border-zinc-800 p-2">
            {/* Compact Grid Layout - 2 rows for formatting */}
            <div className="grid grid-cols-8 gap-1.5 mb-2">
                {/* Row 1: Text styles + Color */}
                <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
                    <Bold size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
                    <Italic size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
                    <Underline size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike">
                    <Strikethrough size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
                    <List size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
                    <ListOrdered size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
                    <Quote size={15} />
                </ToolBtn>
                <div className="relative flex-1">
                    <ToolBtn onClick={() => setShowColorMenu(!showColorMenu)} title="Color">
                        <Palette size={15} />
                    </ToolBtn>
                    {showColorMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl z-50">
                            <div className="grid grid-cols-4 gap-1.5">
                                {COLOR_PRESETS.map((preset) => (
                                    <button
                                        key={preset.color}
                                        onClick={() => { editor.chain().focus().setColor(preset.color).run(); setShowColorMenu(false); }}
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

            {/* Row 2: Insert blocks */}
            <div className="grid grid-cols-8 gap-1.5 mb-2">
                <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
                    <Heading1 size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
                    <Heading2 size={15} />
                </ToolBtn>
                <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
                    <Code size={15} />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
                    <Minus size={15} />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().insertContent({ type: 'customImage', attrs: { src: '', alt: '' } }).run()} title="Image">
                    <Image size={15} />
                </ToolBtn>
                {/* 3 empty slots for future features or balance */}
                <div className="col-span-3" />
            </div>

            {/* AI Writer Row - Compact horizontal */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
                <div className="flex items-center gap-1.5 shrink-0">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span className="text-[9px] text-zinc-500 uppercase font-semibold">AI</span>
                    {isAiLoading && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                </div>
                <div className="flex items-center gap-2 flex-1 justify-center">
                    {AI_PERSONAS.map(({ name, avatar, color, ring, prompt }) => (
                        <button
                            key={name}
                            disabled={isAiLoading}
                            onClick={() => handleAiRewrite(prompt)}
                            className={`flex flex-col items-center ${isAiLoading ? 'opacity-50' : ''}`}
                            title={`Rewrite as ${name}`}
                        >
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center overflow-hidden ring-2 ${ring} ring-offset-1 ring-offset-zinc-900 transition-transform active:scale-90`}>
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
                                        <span className="absolute text-white text-[10px] font-bold">{name[0]}</span>
                                    </>
                                )}
                            </div>
                            <span className="text-[8px] text-zinc-500 mt-0.5">{name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MobileEditorToolbar;
