"use client";

import { Node, mergeAttributes, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Plus, X, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Language mapping from file extension
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'kt': 'kotlin',
    'dart': 'dart',
    'swift': 'swift',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'md': 'markdown',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
};

// Auto-detect language from filename
const detectLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return EXTENSION_TO_LANGUAGE[ext] || 'javascript';
};

interface CodeFile {
    id: string;
    filename: string;
    language: string;
    code: string;
}

// Multi-File Code Node View Component
function MultiFileCodeNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
    const files: CodeFile[] = node.attrs.files || [
        { id: uuidv4(), filename: 'main.js', language: 'javascript', code: '// Main file\n' }
    ];
    const [activeTab, setActiveTab] = useState(node.attrs.activeFileId || files[0]?.id);
    const [editingFilename, setEditingFilename] = useState<string | null>(null);

    const activeFile = files.find(f => f.id === activeTab) || files[0];

    const updateFiles = (newFiles: CodeFile[]) => {
        updateAttributes({ files: newFiles });
    };

    const handleAddFile = () => {
        const newFile: CodeFile = {
            id: uuidv4(),
            filename: `untitled${files.length + 1}.js`,
            language: 'javascript',
            code: '',
        };
        updateFiles([...files, newFile]);
        setActiveTab(newFile.id);
        updateAttributes({ activeFileId: newFile.id });
    };

    const handleRemoveFile = (fileId: string) => {
        if (files.length <= 1) return;
        const newFiles = files.filter(f => f.id !== fileId);
        const newActiveId = activeTab === fileId ? newFiles[0].id : activeTab;
        updateFiles(newFiles);
        if (activeTab === fileId) {
            setActiveTab(newActiveId);
            updateAttributes({ activeFileId: newActiveId });
        }
    };

    const handleUpdateFile = (fileId: string, updates: Partial<CodeFile>) => {
        // Auto-detect language when filename changes
        if (updates.filename) {
            updates.language = detectLanguage(updates.filename);
        }
        const newFiles = files.map(f =>
            f.id === fileId ? { ...f, ...updates } : f
        );
        updateFiles(newFiles);
    };

    return (
        <NodeViewWrapper className="my-4">
            {/* macOS-style Window */}
            <div className={`rounded-xl overflow-hidden transition-all border border-zinc-700/50 ${selected
                ? 'ring-2 ring-blue-500/50'
                : ''
                }`}>
                {/* Title Bar - Modern macOS Style */}
                <div
                    className="px-4 py-2.5 flex items-center gap-2"
                    style={{ backgroundColor: '#3C3C3C' }}
                >
                    {/* Traffic Light Buttons - Modern macOS */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => deleteNode()}
                            className="w-3 h-3 rounded-full transition-all group flex items-center justify-center"
                            style={{ backgroundColor: '#FF5F56' }}
                            title="Delete"
                        >
                            <X size={7} className="text-red-900/80 opacity-0 group-hover:opacity-100" />
                        </button>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFBD2E' }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#27C93F' }} />
                    </div>

                    {/* File Tabs */}
                    <div className="flex-1 flex items-center gap-0.5 mx-2 overflow-x-auto">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                onClick={() => {
                                    setActiveTab(file.id);
                                    updateAttributes({ activeFileId: file.id });
                                }}
                                className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all ${activeTab === file.id
                                    ? 'bg-zinc-700/80 text-white'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700/40'
                                    }`}
                            >
                                {editingFilename === file.id ? (
                                    <input
                                        type="text"
                                        value={file.filename}
                                        onChange={(e) => handleUpdateFile(file.id, { filename: e.target.value })}
                                        onBlur={() => setEditingFilename(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingFilename(null)}
                                        autoFocus
                                        className="bg-zinc-600 text-white text-xs px-1.5 py-0.5 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={() => setEditingFilename(file.id)}
                                        className="truncate max-w-[120px]"
                                        title={file.filename}
                                    >
                                        {file.filename}
                                    </span>
                                )}
                                {files.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFile(file.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-all ml-0.5"
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={handleAddFile}
                            className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-700/40 rounded transition-all"
                            title="New file"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>

                {/* Code Editor */}
                {activeFile && (
                    <div className="relative min-h-[180px] overflow-hidden bg-[#1a1a1a]">
                        {/* Syntax highlighted background */}
                        <SyntaxHighlighter
                            language={detectLanguage(activeFile.filename)}
                            style={vscDarkPlus}
                            showLineNumbers={false}
                            wrapLines={false}
                            wrapLongLines={false}
                            customStyle={{
                                margin: 0,
                                padding: '16px',
                                background: 'transparent',
                                minHeight: '180px',
                                fontSize: '13px',
                                lineHeight: '20px',
                                fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
                                pointerEvents: 'none',
                                whiteSpace: 'pre',
                                overflowX: 'auto',
                            }}
                            codeTagProps={{
                                style: {
                                    fontFamily: 'inherit',
                                    fontSize: 'inherit',
                                    lineHeight: 'inherit',
                                }
                            }}
                        >
                            {activeFile.code || ' '}
                        </SyntaxHighlighter>
                        {/* Transparent textarea overlay for editing */}
                        <textarea
                            value={activeFile.code}
                            onChange={(e) => handleUpdateFile(activeFile.id, { code: e.target.value })}
                            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white focus:outline-none resize-none"
                            style={{
                                padding: '16px',
                                fontSize: '13px',
                                lineHeight: '20px',
                                fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
                                whiteSpace: 'pre',
                                overflowWrap: 'normal',
                                wordWrap: 'normal',
                            }}
                            placeholder="// Start typing..."
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}

// Custom Multi-File Code Extension
export const CustomMultiFileCode = Node.create({
    name: 'customMultiFileCode',

    group: 'block',

    // draggable: true,  // REMOVED - causes textarea focus issues in Firefox/Safari

    atom: true,

    addAttributes() {
        return {
            files: {
                default: [
                    { id: 'default-1', filename: 'main.js', language: 'javascript', code: '// Main file\nconsole.log("Hello!");' },
                    { id: 'default-2', filename: 'styles.css', language: 'css', code: '/* Styles */\nbody {\n  margin: 0;\n}' },
                ],
            },
            activeFileId: {
                default: 'default-1',
            },
            showLineNumbers: {
                default: true,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-multi-file-code]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-multi-file-code': '' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MultiFileCodeNodeView, {
            // Allow events inside the node view (for textarea, buttons, etc.)
            stopEvent: ({ event }) => {
                // Allow all events inside the node view to work normally
                return true;
            },
        });
    },
});

export default CustomMultiFileCode;
