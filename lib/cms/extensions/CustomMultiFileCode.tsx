"use client";

import { Node, mergeAttributes, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Plus, X, FileCode, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Language options
const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'dart', label: 'Dart' },
    { value: 'jsx', label: 'React/JSX' },
    { value: 'tsx', label: 'React/TSX' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'bash', label: 'Bash' },
    { value: 'sql', label: 'SQL' },
];

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
            filename: `file${files.length + 1}.js`,
            language: 'javascript',
            code: '// New file\n',
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
        const newFiles = files.map(f =>
            f.id === fileId ? { ...f, ...updates } : f
        );
        updateFiles(newFiles);
    };

    return (
        <NodeViewWrapper className="my-4">
            <div className={`rounded-lg overflow-hidden border transition-all ${selected
                ? 'ring-2 ring-indigo-500 border-indigo-500/50'
                : 'border-zinc-700 hover:border-zinc-600'
                }`}>
                {/* Tabs Bar */}
                <div className="flex items-center bg-zinc-900 border-b border-zinc-700 overflow-x-auto">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => {
                                setActiveTab(file.id);
                                updateAttributes({ activeFileId: file.id });
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r border-zinc-700 cursor-pointer transition-colors ${activeTab === file.id
                                ? 'bg-zinc-800 text-white'
                                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <FileCode size={12} className="text-indigo-400 shrink-0" />
                            {editingFilename === file.id ? (
                                <input
                                    type="text"
                                    value={file.filename}
                                    onChange={(e) => handleUpdateFile(file.id, { filename: e.target.value })}
                                    onBlur={() => setEditingFilename(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingFilename(null)}
                                    autoFocus
                                    className="bg-zinc-700 text-white text-xs px-1 py-0.5 rounded w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            ) : (
                                <span
                                    onDoubleClick={() => setEditingFilename(file.id)}
                                    title="Double-click to rename"
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
                                    className="ml-1 text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={handleAddFile}
                        className="px-3 py-2 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800/50 transition-colors"
                        title="Add file"
                    >
                        <Plus size={14} />
                    </button>

                    {/* Delete Block Button */}
                    <button
                        onClick={() => deleteNode()}
                        className="ml-auto px-3 py-2 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete block"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Language Selector */}
                {activeFile && (
                    <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-700 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 uppercase">Language:</span>
                        <select
                            value={activeFile.language}
                            onChange={(e) => handleUpdateFile(activeFile.id, { language: e.target.value })}
                            className="bg-zinc-800 border border-zinc-600 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Code Editor with Syntax Highlighting */}
                {activeFile && (
                    <div className="relative min-h-[200px] overflow-hidden">
                        {/* Syntax highlighted background - pointer-events: none so clicks pass through */}
                        <SyntaxHighlighter
                            language={activeFile.language || 'javascript'}
                            style={vscDarkPlus}
                            showLineNumbers={false}
                            wrapLines={false}
                            wrapLongLines={false}
                            customStyle={{
                                margin: 0,
                                padding: '16px',
                                background: '#1e1e1e',
                                minHeight: '200px',
                                fontSize: '14px',
                                lineHeight: '21px',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
                                fontSize: '14px',
                                lineHeight: '21px',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                whiteSpace: 'pre',
                                overflowWrap: 'normal',
                                wordWrap: 'normal',
                            }}
                            placeholder="// Write your code here..."
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
