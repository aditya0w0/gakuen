"use client";

import { FluidEditor, FluidEditorRef } from "@/components/cms/FluidEditor";
import { serializeToComponents, deserializeFromComponents } from "@/lib/cms/serialization";
import { Component } from "@/lib/cms/types";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Code2 } from "lucide-react";

// Sample components for testing
const SAMPLE_COMPONENTS: Component[] = [
    {
        id: "1",
        type: "header",
        level: 1,
        text: "Welcome to the Fluid Editor",
    },
    {
        id: "2",
        type: "text",
        content: "<p>This is a Notion-style editor. Type '/' to see available commands.</p>",
    },
    {
        id: "3",
        type: "text",
        content: "<p>You can create headings, lists, code blocks, and more!</p>",
    },
];

export default function FluidEditorDemo() {
    const editorRef = useRef<FluidEditorRef>(null);
    const [showJson, setShowJson] = useState(false);
    const [jsonOutput, setJsonOutput] = useState<object>({});
    const [htmlOutput, setHtmlOutput] = useState("");
    const [components, setComponents] = useState<Component[]>([]);

    // Convert sample components to Tiptap format
    const initialDoc = deserializeFromComponents(SAMPLE_COMPONENTS);
    const initialHtml = ""; // Could render initial doc to HTML

    const handleUpdate = (html: string, json: object) => {
        setHtmlOutput(html);
        setJsonOutput(json);

        // Convert back to components
        const converted = serializeToComponents(json as any);
        setComponents(converted);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/courses"
                            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold">Fluid Editor Demo</h1>
                            <p className="text-sm text-zinc-500">Notion-style editing experience</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowJson(!showJson)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showJson
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                        >
                            <Code2 size={16} />
                            {showJson ? 'Hide JSON' : 'Show JSON'}
                        </button>

                        <button
                            onClick={() => {
                                const html = editorRef.current?.getHTML();
                                console.log('HTML Output:', html);
                                console.log('Components:', components);
                                alert('Check console for output!');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Save size={16} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor */}
                    <div>
                        <h2 className="text-sm font-medium text-zinc-400 mb-3">Editor</h2>
                        <FluidEditor
                            ref={editorRef}
                            onUpdate={handleUpdate}
                            placeholder="Type '/' for commands, or just start writing..."
                            className="min-h-[400px]"
                        />

                        <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Quick Tips:</h3>
                            <ul className="text-sm text-zinc-500 space-y-1">
                                <li>• Type <code className="bg-zinc-800 px-1.5 py-0.5 rounded">/</code> for commands</li>
                                <li>• Use arrow keys to navigate the menu</li>
                                <li>• Press Enter to select a command</li>
                                <li>• Press Escape to close the menu</li>
                            </ul>
                        </div>
                    </div>

                    {/* Debug Panel */}
                    {showJson && (
                        <div>
                            <h2 className="text-sm font-medium text-zinc-400 mb-3">Debug Output</h2>

                            {/* Tiptap JSON */}
                            <div className="mb-4">
                                <h3 className="text-xs font-medium text-zinc-500 mb-2">Tiptap JSON:</h3>
                                <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs overflow-auto max-h-[200px]">
                                    {JSON.stringify(jsonOutput, null, 2)}
                                </pre>
                            </div>

                            {/* Converted Components */}
                            <div className="mb-4">
                                <h3 className="text-xs font-medium text-zinc-500 mb-2">Converted Components:</h3>
                                <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs overflow-auto max-h-[200px]">
                                    {JSON.stringify(components, null, 2)}
                                </pre>
                            </div>

                            {/* HTML Output */}
                            <div>
                                <h3 className="text-xs font-medium text-zinc-500 mb-2">HTML Output:</h3>
                                <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">
                                    {htmlOutput}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
