"use client";

import { TextComponent } from "@/lib/cms/types";
import { useState } from "react";
import { Sparkles, Wand2, Loader2 } from "lucide-react";

interface TextBlockProps {
    component: TextComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onUpdate?: (component: TextComponent) => void;
    onSelect?: () => void;
}

export function TextBlock({
    component,
    isEditing,
    isSelected,
    onUpdate,
    onSelect,
}: TextBlockProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingType, setProcessingType] = useState<'typos' | 'paraphrase' | null>(null);

    const style = {
        textAlign: component.align || "left",
        color: component.color || "#d4d4d8",
        fontSize: component.fontSize ? `${component.fontSize}px` : "16px",
        lineHeight: component.lineHeight || 1.6,
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    const handleAIImprovement = async (action: 'fix-typos' | 'paraphrase') => {
        if (!component.content || !onUpdate) return;

        setIsProcessing(true);
        setProcessingType(action === 'fix-typos' ? 'typos' : 'paraphrase');

        try {
            // Strip HTML for AI, preserve formatting
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = component.content;
            const plainText = tempDiv.textContent || tempDiv.innerText;

            const response = await fetch('/api/ai/improve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: plainText,
                    action,
                }),
            });

            if (!response.ok) throw new Error('AI improvement failed');

            const data = await response.json();
            if (data.result) {
                onUpdate({ ...component, content: data.result });
            } else {
                throw new Error('No result from AI');
            }
        } catch (error) {
            console.error('AI improvement error:', error);
            alert('Failed to improve text');
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                className={`group cursor-pointer rounded-lg transition-all relative ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "hover:bg-white/5"
                    }`}
            >
                {/* AI Toolbar */}
                {isSelected && (
                    <div className="absolute -top-10 right-0 flex gap-2 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAIImprovement('fix-typos');
                            }}
                            disabled={isProcessing}
                            className="px-2.5 py-1 bg-zinc-700/90 hover:bg-zinc-600 text-white rounded text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 backdrop-blur-sm border border-zinc-600"
                            title="Quick typo fixes (Gemini Flash)"
                        >
                            {isProcessing && processingType === 'typos' ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Sparkles size={12} className="text-yellow-400" />
                            )}
                            Fix Typos
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAIImprovement('paraphrase');
                            }}
                            disabled={isProcessing}
                            className="px-2.5 py-1 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 backdrop-blur-sm border border-indigo-500/50"
                            title="Rephrase text (Gemini Pro)"
                        >
                            {isProcessing && processingType === 'paraphrase' ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Wand2 size={12} className="text-indigo-300" />
                            )}
                            Paraphrase
                        </button>
                    </div>
                )}

                <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                        if (onUpdate) {
                            onUpdate({ ...component, content: e.currentTarget.innerHTML });
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: component.content }}
                    style={style}
                    className="focus:outline-none px-2 py-1"
                />
            </div>
        );
    }

    return <div style={style} dangerouslySetInnerHTML={{ __html: component.content }} />;
}

