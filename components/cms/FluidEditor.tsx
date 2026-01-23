'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CustomImage } from '@/lib/cms/extensions/CustomImage';
import { CustomVideo } from '@/lib/cms/extensions/CustomVideo';
import { CustomMultiFileCode } from '@/lib/cms/extensions/CustomMultiFileCode';
import { CustomQuiz } from '@/lib/cms/extensions/CustomQuiz';
import {
  CustomYouTube,
  isYouTubeUrl,
  extractYouTubeId,
} from '@/lib/cms/extensions/CustomYouTube';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Bold from '@tiptap/extension-bold';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
// Additional languages for syntax highlighting
import dart from 'highlight.js/lib/languages/dart';
import kotlin from 'highlight.js/lib/languages/kotlin';
import swift from 'highlight.js/lib/languages/swift';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { LineHeight } from '@/lib/cms/extensions/LineHeight';

// Create lowlight instance with common + mobile languages
const lowlight = createLowlight(common);
lowlight.register('dart', dart);
lowlight.register('kotlin', kotlin);
lowlight.register('swift', swift);
// Aliases
lowlight.registerAlias('dart', 'flutter');
lowlight.registerAlias('kotlin', 'kt');

// Per-block saves use dynamic imports to avoid SSR issues
import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
  ReactNode,
} from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Video as VideoIcon,
  Code,
  Minus,
  Quote,
  List,
  ListOrdered,
  HelpCircle,
  Youtube,
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
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 size={18} />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 size={18} />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
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
      editor
        .chain()
        .focus()
        .insertContent({ type: 'customImage', attrs: { src: '', alt: '' } })
        .run();
    },
  },
  {
    title: 'Video',
    description: 'Upload or embed a video',
    icon: <VideoIcon size={18} />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'customVideo', attrs: { src: '', poster: '' } })
        .run();
    },
  },
  {
    title: 'Quiz',
    description: 'Create a multiple choice quiz',
    icon: <HelpCircle size={18} />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'customQuiz', attrs: {} })
        .run();
    },
  },
  {
    title: 'YouTube',
    description: 'Embed a YouTube video',
    icon: <Youtube size={18} />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'customYoutube',
          attrs: { videoId: '', title: '' },
        })
        .run();
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

  const filteredCommands = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const executeCommand = useCallback(
    (command: SlashCommandItem) => {
      const { from } = editor.state.selection;
      editor
        .chain()
        .focus()
        .deleteRange({
          from: from - query.length - 1,
          to: from,
        })
        .run();

      command.command(editor);
      onClose();
    },
    [editor, query, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + filteredCommands.length) % filteredCommands.length
        );
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
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
            index === selectedIndex
              ? 'bg-indigo-600/20 text-white'
              : 'text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              index === selectedIndex
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {cmd.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{cmd.title}</div>
            <div className="text-xs text-zinc-500 truncate">
              {cmd.description}
            </div>
          </div>
          {index === selectedIndex && (
            <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
              ↵
            </kbd>
          )}
        </button>
      ))}
    </div>
  );
}

// Editor props
export interface FluidEditorProps {
  initialContent?: string | object;
  onUpdate?: (html: string, json: object) => void;
  onEditorReady?: (editor: Editor) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  // Per-block mode (optional - enables native block saves)
  courseId?: string;
  lessonId?: string;
}

export interface FluidEditorRef {
  getHTML: () => string;
  getJSON: () => object;
  setContent: (content: string) => void;
  focus: () => void;
  getEditor: () => Editor | null;
}

export const FluidEditor = forwardRef<FluidEditorRef, FluidEditorProps>(
  (
    {
      initialContent = '',
      onUpdate,
      onEditorReady,
      placeholder = "Type '/' for commands, or just start writing...",
      editable = true,
      className = '',
      courseId,
      lessonId,
    },
    ref
  ) => {
    const [slashMenu, setSlashMenu] = useState<{
      open: boolean;
      query: string;
      position: { top: number; left: number };
    }>({ open: false, query: '', position: { top: 0, left: 0 } });

    // Per-block native saves status
    const blockEditorEnabled = !!(courseId && lessonId);
    const [blockSaving, setBlockSaving] = useState(false);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        // TextAlign MUST come before StarterKit so it can add attributes to paragraph/heading
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          alignments: ['left', 'center', 'right', 'justify'],
          defaultAlignment: 'left',
        }),
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          // Disable Link - we configure it separately below
          link: false,
          // Disable default Bold - we configure custom one below for b tag support
          bold: false,
          // Disable Underline - it may be duplicated otherwise
          underline: false,
          // Disable default codeBlock - we configure custom one below with enhanced parseHTML
          codeBlock: false,
        }),
        // Custom Bold that recognizes both <strong> and <b> tags, plus CSS font-weight
        Bold.extend({
          parseHTML() {
            return [
              { tag: 'strong' },
              { tag: 'b' },
              {
                style: 'font-weight',
                getAttrs: (value) => {
                  const weight =
                    typeof value === 'string' ? parseInt(value, 10) : value;
                  if (weight >= 600 || value === 'bold' || value === 'bolder') {
                    return {};
                  }
                  return false;
                },
              },
            ];
          },
        }),
        // CodeBlockLowlight with syntax highlighting
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: 'javascript',
          HTMLAttributes: {
            class: 'hljs',
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
        CustomImage,
        CustomVideo,
        CustomMultiFileCode,
        CustomQuiz,
        CustomYouTube,
        Underline, // Added explicitly since disabled in StarterKit
        TextStyle.configure({
          HTMLAttributes: {},
        }).extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              fontSize: {
                default: null,
                parseHTML: (element) => element.style.fontSize || null,
                renderHTML: (attributes) => {
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
        // Table extension for tables
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'tiptap-table',
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
        // Line height extension
        LineHeight.configure({
          types: ['heading', 'paragraph'],
          defaultLineHeight: '1.5',
        }),
      ],
      content: initialContent,
      editable,
      editorProps: {
        attributes: {
          class:
            'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-6 py-5',
        },
        // Smart paste handler - handles images, videos, and YouTube URLs
        handlePaste: (view, event) => {
          const clipboardData = event.clipboardData;
          if (!clipboardData) return false;

          // Check for plain text first - detect URLs
          const text = clipboardData.getData('text/plain');
          
          // Detect YouTube URLs
          if (text && isYouTubeUrl(text)) {
            const videoId = extractYouTubeId(text);
            if (videoId) {
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.customYoutube.create({
                    videoId,
                    title: 'YouTube Video',
                  })
                )
              );
              return true; // Handled
            }
          }

          // Detect direct video URLs (.mp4, .webm, .ogg, .mov)
          if (text && /^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(text)) {
            console.log('🎬 Detected video URL paste:', text);
            view.dispatch(
              view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.customVideo.create({
                  src: text,
                })
              )
            );
            return true; // Handled - CustomVideo will auto-upload it
          }

          // Handle clipboard image FILES (screenshots, copied file images)
          const files = clipboardData.files;
          if (files && files.length > 0) {
            // Check for video files first
            const videoFile = Array.from(files).find((f) =>
              f.type.startsWith('video/')
            );
            if (videoFile) {
              const formData = new FormData();
              formData.append('file', videoFile);
              formData.append('type', 'video');

              // Show placeholder while uploading
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.paragraph.create(
                    {},
                    view.state.schema.text(`[Uploading video...]`)
                  )
                )
              );

              // Upload asynchronously
              fetch('/api/upload-video', {
                method: 'POST',
                body: formData,
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.url) {
                    const { state } = view;
                    const videoNode = state.schema.nodes.customVideo.create({
                      src: data.url,
                    });

                    let tr = state.tr;
                    state.doc.descendants((node, pos) => {
                      if (
                        node.isText &&
                        node.text?.includes('[Uploading video...]')
                      ) {
                        tr = tr.replaceWith(
                          pos,
                          pos + node.nodeSize,
                          videoNode
                        );
                        return false;
                      }
                      return true;
                    });
                    view.dispatch(tr);
                  }
                })
                .catch((err) => {
                  console.error('Video upload failed:', err);
                });

              return true;
            }

            const imageFile = Array.from(files).find((f) =>
              f.type.startsWith('image/')
            );
            if (imageFile) {
              // Upload first, then insert - prevents base64 in JSON
              const formData = new FormData();
              formData.append('file', imageFile);
              formData.append('type', 'cms');

              // Generate unique placeholder ID for tracking
              const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              // Insert placeholder node with unique ID
              const placeholderNode = view.state.schema.nodes.customImage.create({
                src: '', // Empty src - CustomImage will show upload state
                alt: uploadId, // Store ID in alt for tracking
              });
              
              const insertPos = view.state.selection.from;
              view.dispatch(
                view.state.tr.replaceSelectionWith(placeholderNode)
              );

              // Upload asynchronously
              fetch('/api/upload', {
                method: 'POST',
                body: formData,
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.url) {
                    // Find and update the placeholder by ID
                    const { state } = view;
                    let found = false;
                    
                    state.doc.descendants((node, pos) => {
                      if (!found && node.type.name === 'customImage' && node.attrs.alt === uploadId) {
                        const tr = state.tr.setNodeMarkup(pos, null, {
                          src: data.url,
                          alt: imageFile.name || '',
                        });
                        view.dispatch(tr);
                        found = true;
                        return false;
                      }
                      return true;
                    });
                  }
                })
                .catch((err) => {
                  console.error('Image upload failed:', err);
                  // Remove placeholder on error
                  const { state } = view;
                  state.doc.descendants((node, pos) => {
                    if (node.type.name === 'customImage' && node.attrs.alt === uploadId) {
                      const tr = state.tr.delete(pos, pos + node.nodeSize);
                      view.dispatch(tr);
                      return false;
                    }
                    return true;
                  });
                });

              return true;
            }
          }

          // Let Tiptap handle all other pastes
          return false;
        },
      },
      onBlur: ({ editor }) => {
        // Store selection on blur for sidebar to use
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to);
        if (text.trim() && typeof window !== 'undefined') {
          (
            window as unknown as Record<string, unknown>
          ).__tiptapSavedSelection = { from, to, text };
        }
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
          setSlashMenu((prev) => ({ ...prev, open: false }));
        }
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => editor?.getHTML() || '',
        getJSON: () => editor?.getJSON() || {},
        setContent: (content: string) => editor?.commands.setContent(content),
        focus: () => editor?.commands.focus(),
        getEditor: () => editor,
      }),
      [editor]
    );

    // Notify parent when editor is ready
    useEffect(() => {
      if (editor && onEditorReady) {
        onEditorReady(editor);
      }
    }, [editor, onEditorReady]);

    // Per-block save effect (when courseId + lessonId provided)
    useEffect(() => {
      if (!editor || !blockEditorEnabled || !courseId || !lessonId) return;

      let saveTimeout: NodeJS.Timeout | null = null;
      const prevBlocks: Record<string, any> = {};
      let blockIds: string[] = [];

      const handleUpdate = async () => {
        if (saveTimeout) clearTimeout(saveTimeout);

        saveTimeout = setTimeout(async () => {
          setBlockSaving(true);
          try {
            // Dynamic import to avoid SSR issues
            const { tiptapToBlocks, blocksDiffer } =
              await import('@/lib/cms/tiptap-to-blocks');
            const { saveBlock, saveLessonStructure } =
              await import('@/lib/cache/block-cache');

            const doc = editor.getJSON();
            const result = tiptapToBlocks(doc, courseId, blockIds);

            let savedCount = 0;
            for (const block of result.blocks) {
              if (
                !prevBlocks[block.id] ||
                blocksDiffer(prevBlocks[block.id], block)
              ) {
                await saveBlock(courseId, block.id, block);
                prevBlocks[block.id] = block;
                savedCount++;
              }
            }

            if (JSON.stringify(result.blockIds) !== JSON.stringify(blockIds)) {
              await saveLessonStructure(
                courseId,
                lessonId,
                '',
                result.blockIds
              );
              blockIds = result.blockIds;
            }

            if (savedCount > 0) {
              console.log(`💾 [Blocks] Saved ${savedCount} block(s)`);
            }
          } catch (err) {
            console.error('Block save error:', err);
          } finally {
            setBlockSaving(false);
          }
        }, 500);
      };

      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
        if (saveTimeout) clearTimeout(saveTimeout);
      };
    }, [editor, blockEditorEnabled, courseId, lessonId]);

    useEffect(() => {
      const handleClick = () => {
        if (slashMenu.open) {
          setSlashMenu((prev) => ({ ...prev, open: false }));
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
                    margin: 0.5em 0 0.25em;
                    color: white;
                    line-height: 1.2;
                }
                .ProseMirror h2 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    margin: 0.5em 0 0.25em;
                    color: white;
                    line-height: 1.3;
                }
                .ProseMirror h3 {
                    font-size: 1.375rem;
                    font-weight: 600;
                    margin: 0.5em 0 0.25em;
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
            onClose={() => setSlashMenu((prev) => ({ ...prev, open: false }))}
          />
        )}

        {/* Keyboard shortcuts hint */}
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-600">
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 font-mono">
              /
            </kbd>{' '}
            commands
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 font-mono">
              **text**
            </kbd>{' '}
            bold
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 font-mono">
              *text*
            </kbd>{' '}
            italic
          </span>
        </div>
      </div>
    );
  }
);

FluidEditor.displayName = 'FluidEditor';

export default FluidEditor;
