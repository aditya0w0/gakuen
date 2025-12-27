"use client";

import { CodeComponent } from "@/lib/cms/types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
    component: CodeComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function CodeBlock({ component, isEditing, isSelected, onSelect }: CodeBlockProps) {
    const containerStyle = {
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={containerStyle}
                className={`group cursor-pointer rounded-lg transition-all overflow-hidden ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "hover:bg-white/5"
                    }`}
            >
                <SyntaxHighlighter
                    language={component.language || "javascript"}
                    style={vscDarkPlus}
                    showLineNumbers={component.showLineNumbers}
                    customStyle={{
                        margin: 0,
                        borderRadius: "0.5rem",
                        fontSize: component.fontSize ? `${component.fontSize}px` : "14px",
                    }}
                >
                    {component.code}
                </SyntaxHighlighter>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <SyntaxHighlighter
                language={component.language || "javascript"}
                style={vscDarkPlus}
                showLineNumbers={component.showLineNumbers}
                customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    fontSize: component.fontSize ? `${component.fontSize}px` : "14px",
                }}
            >
                {component.code}
            </SyntaxHighlighter>
        </div>
    );
}
