"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CustomImage } from '@/lib/cms/extensions/CustomImage';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
    useState,
    useEffect,
    useCallback,
    forwardRef,
    useImperativeHandle,
    useRef,
    ReactNode
} from 'react';
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Code,
    Minus,
    Quote,
    List,
    ListOrdered,
} from 'lucide-react';

// Slash command items
interface SlashCommandItem {
    title: string;
    description: string;
    icon: ReactNode;
    command: (editor: Editor) => void;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
    {
        title: 'Text',
        description: 'Just start writing with plain text',
        icon: <Type size={18} />,
        command: (editor) => editor.chain().focus().clearNodes().run(),
    },
    {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: <Heading1 size={18} />,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: <Heading2 size={18} />,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: <Heading3 size={18} />,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
        title: 'Bullet List',
        description: 'Create a simple bullet list',
        icon: <List size={18} />,
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: <ListOrdered size={18} />,
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        title: 'Quote',
        description: 'Capture a quote',
        icon: <Quote size={18} />,
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
        title: 'Divider',
        description: 'Visually divide sections',
        icon: <Minus size={18} />,
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        title: 'Code Block',
        description: 'Write code with syntax highlighting',
        icon: <Code size={18} />,
        command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        title: 'Image',
        description: 'Upload or generate an image',
        icon: <ImageIcon size={18} />,
        command: (editor) => {
            editor.chain().focus().insertContent({ type: 'customImage', attrs: { src: '', alt: '' } }).run();
        },
    },
];

// Slash command dropdown component
function SlashCommandMenu({
    editor,
    query,
    onClose,
    position,
}: {
    editor: Editor;
    query: string;
    onClose: () => void;
    position: { top: number; left: number };
}) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredCommands = SLASH_COMMANDS.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
    );

    const executeCommand = useCallback((command: SlashCommandItem) => {
        const { from } = editor.state.selection;
        editor.chain()
            .focus()
            .deleteRange({
                from: from - query.length - 1,
                to: from
            })
            .run();

        command.command(editor);
        onClose();
    }, [editor, query, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    executeCommand(filteredCommands[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredCommands, selectedIndex, executeCommand, onClose]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (filteredCommands.length === 0) {
        return (
            <div
                ref={menuRef}
                className="fixed bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-50 min-w-[220px]"
                style={{ top: position.top, left: position.left }}
            >
                <div className="text-zinc-500 text-sm px-3 py-2">No results</div>
            </div>
        );
    }

    return (
        <div
            ref={menuRef}
            className="fixed bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl py-2 z-50 min-w-[300px] max-h-[360px] overflow-y-auto"
            style={{ top: position.top, left: position.left }}
        >
            <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">
                Basic blocks
            </div>
            {filteredCommands.map((cmd, index) => (
                <button
                    key={cmd.title}
                    onClick={() => executeCommand(cmd)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${index === selectedIndex
                        ? 'bg-indigo-600/20 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800/50'
                        }`}
                >
                    <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-indigo-600/30 text-indigo-300' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                        {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{cmd.title}</div>
                        <div className="text-xs text-zinc-500 truncate">{cmd.description}</div>
                    </div>
                    {index === selectedIndex && (
                        <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">↵</kbd>
                    )}
                </button>
            ))}
        </div>
    );
}

// Editor props
export interface FluidEditorProps {
    initialContent?: string;
    onUpdate?: (html: string, json: object) => void;
    onEditorReady?: (editor: Editor) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string;
}

export interface FluidEditorRef {
    getHTML: () => string;
    getJSON: () => object;
    setContent: (content: string) => void;
    focus: () => void;
    getEditor: () => Editor | null;
}

export const FluidEditor = forwardRef<FluidEditorRef, FluidEditorProps>(({
    initialContent = '',
    onUpdate,
    onEditorReady,
    placeholder = "Type '/' for commands, or just start writing...",
    editable = true,
    className = '',
}, ref) => {
    const [slashMenu, setSlashMenu] = useState<{
        open: boolean;
        query: string;
        position: { top: number; left: number };
    }>({ open: false, query: '', position: { top: 0, left: 0 } });

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            CustomImage,
            Underline,
            TextStyle.configure({
                HTMLAttributes: {},
            }).extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        fontSize: {
                            default: null,
                            parseHTML: element => element.style.fontSize || null,
                            renderHTML: attributes => {
                                if (!attributes.fontSize) return {};
                                return { style: `font-size: ${attributes.fontSize}` };
                            },
                        },
                    };
                },
            }),
            Color,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-400 underline hover:text-indigo-300',
                },
            }),
        ],
        content: initialContent,
        editable,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-6 py-5',
            },
        },
        onUpdate: ({ editor }) => {
            onUpdate?.(editor.getHTML(), editor.getJSON());

            const { from } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(
                Math.max(0, from - 50),
                from
            );

            const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);

            if (slashMatch) {
                const coords = editor.view.coordsAtPos(from);
                setSlashMenu({
                    open: true,
                    query: slashMatch[1],
                    position: { top: coords.bottom + 8, left: coords.left },
                });
            } else if (slashMenu.open) {
                setSlashMenu(prev => ({ ...prev, open: false }));
            }
        },
    });

    useImperativeHandle(ref, () => ({
        getHTML: () => editor?.getHTML() || '',
        getJSON: () => editor?.getJSON() || {},
        setContent: (content: string) => editor?.commands.setContent(content),
        focus: () => editor?.commands.focus(),
        getEditor: () => editor,
    }), [editor]);

    // Notify parent when editor is ready
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);


    useEffect(() => {
        const handleClick = () => {
            if (slashMenu.open) {
                setSlashMenu(prev => ({ ...prev, open: false }));
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [slashMenu.open]);

    if (!editor) {
        return (
            <div className="animate-pulse bg-zinc-800/50 rounded-xl h-[200px]" />
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Editor Styles */}
            <style>{`
                .ProseMirror {
                    outline: none;
                }
                .ProseMirror > * + * {
                    margin-top: 0.75em;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #52525b;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror h1 {
                    font-size: 2.25rem;
                    font-weight: 700;
                    margin: 1.5rem 0 0.75rem;
                    color: white;
                    line-height: 1.2;
                }
                .ProseMirror h2 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    margin: 1.25rem 0 0.625rem;
                    color: white;
                    line-height: 1.3;
                }
                .ProseMirror h3 {
                    font-size: 1.375rem;
                    font-weight: 600;
                    margin: 1rem 0 0.5rem;
                    color: #f4f4f5;
                    line-height: 1.4;
                }
                .ProseMirror p {
                    margin: 0.625rem 0;
                    color: #d4d4d8;
                    line-height: 1.75;
                }
                .ProseMirror strong {
                    font-weight: 600;
                    color: white;
                }
                .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1.75rem;
                    margin: 0.75rem 0;
                }
                .ProseMirror ul {
                    list-style-type: disc;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                }
                .ProseMirror li {
                    margin: 0.375rem 0;
                    color: #d4d4d8;
                }
                .ProseMirror li::marker {
                    color: #6366f1;
                }
                .ProseMirror blockquote {
                    border-left: 4px solid #6366f1;
                    padding: 0.5rem 0 0.5rem 1.25rem;
                    margin: 1.25rem 0;
                    color: #a1a1aa;
                    font-style: italic;
                    background: rgba(99, 102, 241, 0.05);
                    border-radius: 0 0.5rem 0.5rem 0;
                }
                .ProseMirror hr {
                    border: none;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #3f3f46, transparent);
                    margin: 2rem 0;
                }
                .ProseMirror pre {
                    background: #0f0f0f;
                    border: 1px solid #27272a;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    margin: 1.25rem 0;
                    overflow-x: auto;
                }
                .ProseMirror code {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.875em;
                    background: #27272a;
                    padding: 0.2em 0.4em;
                    border-radius: 0.375rem;
                    color: #f472b6;
                }
                .ProseMirror pre code {
                    background: none;
                    padding: 0;
                    color: #e4e4e7;
                }
                .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.75rem;
                    margin: 1.5rem 0;
                }
                .ProseMirror a {
                    color: #818cf8;
                    text-decoration: underline;
                }
            `}</style>

            {/* Main Editor */}
            <EditorContent
                editor={editor}
                className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden transition-all hover:border-zinc-700/50 focus-within:border-indigo-500/30"
            />

            {/* Slash Command Menu */}
            {slashMenu.open && editor && (
                <SlashCommandMenu
                    editor={editor}
                    query={slashMenu.query}
                    position={slashMenu.position}
                    onClose={() => setSlashMenu(prev => ({ ...prev, open: false }))}
                />
            )}

            {/* Keyboard shortcuts hint */}
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-600">
                <span>
                    <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 font-mono">/</kbd>
                    {' '}commands
                </span>
                <span>
                    <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 font-mono">**text**</kbd>
                    {' '}bold
                </span>
                <span>
                    <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 font-mono">*text*</kbd>
                    {' '}italic
                </span>
            </div>
        </div>
    );
});

FluidEditor.displayName = 'FluidEditor';

export default FluidEditor;
