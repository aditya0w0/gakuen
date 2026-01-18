"use client";

import { MultiFileCodeComponent, CodeFile } from "@/lib/cms/types";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Plus, X, FileCode } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Language icons/labels
const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript', ext: '.js' },
    { value: 'typescript', label: 'TypeScript', ext: '.ts' },
    { value: 'python', label: 'Python', ext: '.py' },
    { value: 'java', label: 'Java', ext: '.java' },
    { value: 'kotlin', label: 'Kotlin', ext: '.kt' },
    { value: 'dart', label: 'Dart', ext: '.dart' },
    { value: 'jsx', label: 'React/JSX', ext: '.jsx' },
    { value: 'tsx', label: 'React/TSX', ext: '.tsx' },
    { value: 'swift', label: 'Swift', ext: '.swift' },
    { value: 'html', label: 'HTML', ext: '.html' },
    { value: 'css', label: 'CSS', ext: '.css' },
    { value: 'scss', label: 'SCSS', ext: '.scss' },
    { value: 'json', label: 'JSON', ext: '.json' },
    { value: 'go', label: 'Go', ext: '.go' },
    { value: 'rust', label: 'Rust', ext: '.rs' },
    { value: 'php', label: 'PHP', ext: '.php' },
    { value: 'ruby', label: 'Ruby', ext: '.rb' },
    { value: 'sql', label: 'SQL', ext: '.sql' },
    { value: 'bash', label: 'Bash', ext: '.sh' },
    { value: 'yaml', label: 'YAML', ext: '.yaml' },
];

interface MultiFileCodeBlockProps {
    component: MultiFileCodeComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onUpdate?: (component: MultiFileCodeComponent) => void;
    onSelect?: () => void;
}

export function MultiFileCodeBlock({
    component,
    isEditing,
    isSelected,
    onUpdate,
    onSelect,
}: MultiFileCodeBlockProps) {
    const [activeTab, setActiveTab] = useState(component.activeFileId || component.files[0]?.id);
    const [editingFilename, setEditingFilename] = useState<string | null>(null);

    const activeFile = component.files.find(f => f.id === activeTab) || component.files[0];

    const containerStyle = {
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    const handleAddFile = () => {
        if (!onUpdate) return;
        const newFile: CodeFile = {
            id: uuidv4(),
            filename: `untitled${component.files.length + 1}.js`,
            language: 'javascript',
            code: '// New file\n',
        };
        onUpdate({
            ...component,
            files: [...component.files, newFile],
            activeFileId: newFile.id,
        });
        setActiveTab(newFile.id);
    };

    const handleRemoveFile = (fileId: string) => {
        if (!onUpdate || component.files.length <= 1) return;
        const newFiles = component.files.filter(f => f.id !== fileId);
        const newActiveId = activeTab === fileId ? newFiles[0].id : activeTab;
        onUpdate({
            ...component,
            files: newFiles,
            activeFileId: newActiveId,
        });
        if (activeTab === fileId) setActiveTab(newActiveId);
    };

    const handleUpdateFile = (fileId: string, updates: Partial<CodeFile>) => {
        if (!onUpdate) return;
        const newFiles = component.files.map(f =>
            f.id === fileId ? { ...f, ...updates } : f
        );
        onUpdate({ ...component, files: newFiles });
    };

    const handleCodeChange = (code: string) => {
        if (!activeFile || !onUpdate) return;
        handleUpdateFile(activeFile.id, { code });
    };

    // Editor view
    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={containerStyle}
                className={`group cursor-pointer rounded-lg overflow-hidden transition-all ${isSelected ? "ring-2 ring-indigo-500" : "hover:ring-1 hover:ring-zinc-600"
                    }`}
            >
                {/* Tabs Bar */}
                <div className="flex items-center bg-zinc-900 border-b border-zinc-700 overflow-x-auto">
                    {component.files.map((file) => (
                        <div
                            key={file.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab(file.id);
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
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="bg-zinc-700 text-white text-xs px-1 py-0.5 rounded w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            ) : (
                                <span
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingFilename(file.id);
                                    }}
                                    title="Double-click to rename"
                                >
                                    {file.filename}
                                </span>
                            )}
                            {component.files.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile(file.id);
                                    }}
                                    className="ml-1 text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Remove file"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    {/* Add File Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddFile();
                        }}
                        className="px-3 py-2 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800/50 transition-colors"
                        title="Add file"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* Language Selector */}
                {activeFile && (
                    <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-700 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 uppercase">Language:</span>
                        <select
                            value={activeFile.language}
                            onChange={(e) => handleUpdateFile(activeFile.id, { language: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
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
                    <div className="relative min-h-[200px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Syntax highlighted background */}
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
                                fontSize: component.fontSize ? `${component.fontSize}px` : '14px',
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
                            onChange={(e) => handleCodeChange(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white focus:outline-none resize-none"
                            style={{
                                padding: '16px',
                                fontSize: component.fontSize ? `${component.fontSize}px` : '14px',
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
        );
    }

    // Student/Preview view
    return (
        <div style={containerStyle} className="rounded-lg overflow-hidden border border-zinc-800">
            {/* Tabs Bar */}
            <div className="flex items-center bg-zinc-900 border-b border-zinc-700 overflow-x-auto">
                {component.files.map((file) => (
                    <button
                        key={file.id}
                        onClick={() => setActiveTab(file.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r border-zinc-700 transition-colors ${activeTab === file.id
                            ? 'bg-zinc-800 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                    >
                        <FileCode size={12} className="text-indigo-400" />
                        {file.filename}
                    </button>
                ))}
            </div>

            {/* Syntax Highlighted Code */}
            {activeFile && (
                <SyntaxHighlighter
                    language={activeFile.language || "javascript"}
                    style={vscDarkPlus}
                    showLineNumbers={component.showLineNumbers}
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: component.fontSize ? `${component.fontSize}px` : '14px',
                    }}
                >
                    {activeFile.code}
                </SyntaxHighlighter>
            )}
        </div>
    );
}
