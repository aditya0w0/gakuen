"use client";

import { SyllabusComponent } from "@/lib/cms/types";
import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, BookOpen } from "lucide-react";

interface SyllabusBlockProps {
    component: SyllabusComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onUpdate?: (component: SyllabusComponent) => void;
    onSelect?: () => void;
}

export function SyllabusBlock({ component, isEditing, isSelected, onSelect }: SyllabusBlockProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        if (isEditing) return;
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    const marginStyle = component.margin ? {
        marginTop: component.margin.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin.left ? `${component.margin.left}px` : undefined,
    } : {};

    const accentColor = component.accentColor || "#6366f1";

    const renderAccordionStyle = () => (
        <div className="space-y-2">
            {component.items.map((item, index) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                    <div 
                        key={item.id} 
                        className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50 transition-all hover:border-zinc-700"
                    >
                        <button
                            onClick={() => toggleItem(item.id)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-800/50 transition-colors"
                            style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
                        >
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                >
                                    {index + 1}
                                </div>
                                <span className="text-white font-medium">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {component.showDuration && item.duration && (
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Clock size={12} />
                                        {item.duration}
                                    </span>
                                )}
                                {isExpanded ? (
                                    <ChevronUp size={18} className="text-zinc-500" />
                                ) : (
                                    <ChevronDown size={18} className="text-zinc-500" />
                                )}
                            </div>
                        </button>
                        {isExpanded && item.description && (
                            <div className="px-4 pb-4 pt-4 text-zinc-400 text-sm border-t border-zinc-800">
                                {item.description}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderNumberedStyle = () => (
        <div className="space-y-3">
            {component.items.map((item, index) => (
                <div 
                    key={item.id} 
                    className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                    <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                    >
                        {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium mb-1">{item.title}</h4>
                        {item.description && (
                            <p className="text-zinc-400 text-sm">{item.description}</p>
                        )}
                    </div>
                    {component.showDuration && item.duration && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1 shrink-0">
                            <Clock size={12} />
                            {item.duration}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );

    const renderCardsStyle = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {component.items.map((item, index) => (
                <div 
                    key={item.id} 
                    className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all hover:-translate-y-0.5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: accentColor, color: 'white' }}
                        >
                            {index + 1}
                        </div>
                        {component.showDuration && item.duration && (
                            <span className="text-xs text-zinc-500 flex items-center gap-1 ml-auto">
                                <Clock size={12} />
                                {item.duration}
                            </span>
                        )}
                    </div>
                    <h4 className="text-white font-medium mb-2">{item.title}</h4>
                    {item.description && (
                        <p className="text-zinc-400 text-sm">{item.description}</p>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div 
            className={`transition-all ${isEditing ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 rounded-lg' : ''}`}
            onClick={onSelect}
            style={marginStyle}
        >
            {component.title && (
                <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={20} style={{ color: accentColor }} />
                    <h3 className="text-xl font-bold text-white">{component.title}</h3>
                </div>
            )}
            
            {component.style === 'accordion' && renderAccordionStyle()}
            {component.style === 'numbered' && renderNumberedStyle()}
            {component.style === 'cards' && renderCardsStyle()}
            {!component.style && renderAccordionStyle()}

            {component.items.length === 0 && (
                <div className="p-8 border-2 border-dashed border-zinc-800 rounded-lg text-center">
                    <p className="text-zinc-500">No modules added yet</p>
                    <p className="text-zinc-600 text-sm mt-1">Select this block and add modules in the right panel</p>
                </div>
            )}
        </div>
    );
}
