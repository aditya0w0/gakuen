"use client";

import { Component, HeaderComponent, TextComponent, ImageComponent, VideoComponent, CodeComponent, CTAComponent, DividerComponent, SpacerComponent, SyllabusComponent, Spacing, SyllabusItem } from "@/lib/cms/types";
import {
    InputLabel,
    SectionHeader,
    TextInput,
    Select,
    IconButton,
    ColorInput,
    TextArea
} from "@/components/cms/ui-primitives";
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Trash2,
    Type,
    Image,
    Video,
    Code,
    MousePointerClick,
    Minus,
    MoveVertical,
    Plus,
    List,
    X
} from "lucide-react";
import { useState } from "react";
import { COMPONENT_REGISTRY, createComponent } from "@/lib/cms/registry";

interface DesignControlsProps {
    component: Component | null;
    onUpdate: (component: Component) => void;
    onDelete: () => void;
    onAddComponent?: (component: Component) => void;
}

const iconMap: Record<string, any> = {
    Type,
    AlignLeft,
    Image,
    Video,
    Code,
    MousePointerClick,
    Minus,
    MoveVertical,
    List,
};

export function DesignControls({ component, onUpdate, onDelete, onAddComponent }: DesignControlsProps) {
    const [activeTab, setActiveTab] = useState<'design' | 'settings'>('design');

    if (!component) {
        return (
            <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-sm font-semibold text-white">Components</h3>
                    <p className="text-xs text-zinc-500 mt-1">Drag or click to add</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {COMPONENT_REGISTRY.map((meta) => {
                        const Icon = iconMap[meta.icon] || Type;
                        return (
                            <button
                                key={meta.type}
                                onClick={() => {
                                    if (onAddComponent) {
                                        const newComponent = createComponent(meta.type);
                                        onAddComponent(newComponent);
                                    }
                                }}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('componentType', meta.type);
                                    e.dataTransfer.effectAllowed = 'copy';
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left group cursor-grab active:cursor-grabbing"
                            >
                                <div className="w-8 h-8 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors shrink-0">
                                    <Icon size={16} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-zinc-300 group-hover:text-white">{meta.name}</div>
                                    <div className="text-[10px] text-zinc-500 truncate">{meta.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800 shrink-0">
                <button
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'design' ? 'text-white border-indigo-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
                    onClick={() => setActiveTab('design')}
                >
                    Design
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'text-white border-indigo-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{component.type}</span>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors"
                        title="Delete Component"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {activeTab === 'design' ? (
                    <>
                        {component.type === "header" && <HeaderControls component={component} onUpdate={onUpdate} />}
                        {component.type === "text" && <TextControls component={component} onUpdate={onUpdate} />}
                        {component.type === "image" && <ImageControls component={component} onUpdate={onUpdate} />}
                        {component.type === "video" && <VideoControls component={component} onUpdate={onUpdate} />}
                        {component.type === "code" && <CodeControls component={component} onUpdate={onUpdate} />}
                        {component.type === "cta" && <CTAControls component={component} onUpdate={onUpdate} />}
                        {component.type === "divider" && <DividerControls component={component} onUpdate={onUpdate} />}
                        {component.type === "spacer" && <SpacerControls component={component} onUpdate={onUpdate} />}
                        {component.type === "syllabus" && <SyllabusControls component={component} onUpdate={onUpdate} />}

                        {component.type !== "spacer" && (
                            <MarginControls
                                margin={component.margin}
                                onChange={(margin) => onUpdate({ ...component, margin })}
                            />
                        )}
                    </>
                ) : (
                    <div className="space-y-4">
                        <SectionHeader title="Component ID" />
                        <div className="p-3 bg-zinc-900 rounded border border-zinc-800 text-xs font-mono text-zinc-500 break-all">
                            {component.id}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Specific Controls ---

function HeaderControls({ component, onUpdate }: { component: HeaderComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Typography" />

            <Select
                label="Level"
                value={component.level}
                onChange={(e) => onUpdate({ ...component, level: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 })}
                options={[1, 2, 3, 4, 5, 6].map(i => ({ label: `Heading ${i}`, value: i }))}
            />

            <div>
                <InputLabel>Alignment</InputLabel>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <IconButton icon={<AlignLeft size={16} />} active={component.align === 'left' || !component.align} onClick={() => onUpdate({ ...component, align: 'left' })} />
                    <IconButton icon={<AlignCenter size={16} />} active={component.align === 'center'} onClick={() => onUpdate({ ...component, align: 'center' })} />
                    <IconButton icon={<AlignRight size={16} />} active={component.align === 'right'} onClick={() => onUpdate({ ...component, align: 'right' })} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <TextInput label="Size" unit="px" type="number" value={component.fontSize || ""} onChange={(e) => onUpdate({ ...component, fontSize: Number(e.target.value) })} />
                <TextInput label="Weight" type="number" step="100" value={component.fontWeight || 600} onChange={(e) => onUpdate({ ...component, fontWeight: Number(e.target.value) })} />
            </div>

            <ColorInput label="Color" value={component.color || "#ffffff"} onChange={(color) => onUpdate({ ...component, color })} />
        </div>
    );
}

function TextControls({ component, onUpdate }: { component: TextComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Typography" />

            <div>
                <InputLabel>Alignment</InputLabel>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <IconButton icon={<AlignLeft size={16} />} active={component.align === 'left' || !component.align} onClick={() => onUpdate({ ...component, align: 'left' })} />
                    <IconButton icon={<AlignCenter size={16} />} active={component.align === 'center'} onClick={() => onUpdate({ ...component, align: 'center' })} />
                    <IconButton icon={<AlignRight size={16} />} active={component.align === 'right'} onClick={() => onUpdate({ ...component, align: 'right' })} />
                    <IconButton icon={<AlignJustify size={16} />} active={component.align === 'justify'} onClick={() => onUpdate({ ...component, align: 'justify' })} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <TextInput label="Size" unit="px" type="number" value={component.fontSize || 16} onChange={(e) => onUpdate({ ...component, fontSize: Number(e.target.value) })} />
                <TextInput label="Line Height" step="0.1" type="number" value={component.lineHeight || 1.6} onChange={(e) => onUpdate({ ...component, lineHeight: Number(e.target.value) })} />
            </div>

            <ColorInput label="Color" value={component.color || "#d4d4d8"} onChange={(color) => onUpdate({ ...component, color })} />
        </div>
    );
}

function ImageControls({ component, onUpdate }: { component: ImageComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Source" />
            <TextInput label="Image URL" value={component.url} onChange={(e) => onUpdate({ ...component, url: e.target.value })} />
            <TextInput label="Alt Text" value={component.alt || ""} onChange={(e) => onUpdate({ ...component, alt: e.target.value })} />
            <TextInput label="Caption" value={component.caption || ""} onChange={(e) => onUpdate({ ...component, caption: e.target.value })} />

            <SectionHeader title="Appearance" />
            <div>
                <InputLabel>Alignment</InputLabel>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <IconButton icon={<AlignLeft size={16} />} active={component.align === 'left'} onClick={() => onUpdate({ ...component, align: 'left' })} />
                    <IconButton icon={<AlignCenter size={16} />} active={component.align === 'center' || !component.align} onClick={() => onUpdate({ ...component, align: 'center' })} />
                    <IconButton icon={<AlignRight size={16} />} active={component.align === 'right'} onClick={() => onUpdate({ ...component, align: 'right' })} />
                </div>
            </div>

            <TextInput label="Border Radius" unit="px" type="number" value={component.borderRadius || 8} onChange={(e) => onUpdate({ ...component, borderRadius: Number(e.target.value) })} />
        </div>
    )
}

function VideoControls({ component, onUpdate }: { component: VideoComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Video" />
            <TextInput label="URL" placeholder="YouTube / Vimeo" value={component.url} onChange={(e) => onUpdate({ ...component, url: e.target.value })} />

            <Select
                label="Aspect Ratio"
                value={component.aspectRatio || "16:9"}
                onChange={(e) => onUpdate({ ...component, aspectRatio: e.target.value as "16:9" | "4:3" | "1:1" })}
                options={[
                    { label: "16:9", value: "16:9" },
                    { label: "4:3", value: "4:3" },
                    { label: "1:1", value: "1:1" },
                ]}
            />
            <TextInput label="Caption" value={component.caption || ""} onChange={(e) => onUpdate({ ...component, caption: e.target.value })} />
        </div>
    )
}

function CodeControls({ component, onUpdate }: { component: CodeComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Code Settings" />
            <TextArea label="Code" rows={8} value={component.code} onChange={(e) => onUpdate({ ...component, code: e.target.value })} className="font-mono text-xs" />

            <TextInput label="Language" value={component.language || "javascript"} onChange={(e) => onUpdate({ ...component, language: e.target.value })} />

            <Select
                label="Show Line Numbers"
                value={component.showLineNumbers ? "yes" : "no"}
                onChange={(e) => onUpdate({ ...component, showLineNumbers: e.target.value === "yes" })}
                options={[{ label: "Show", value: "yes" }, { label: "Hide", value: "no" }]}
            />
            <TextInput label="Font Size" unit="px" type="number" value={component.fontSize || 14} onChange={(e) => onUpdate({ ...component, fontSize: Number(e.target.value) })} />
        </div>
    )
}

function CTAControls({ component, onUpdate }: { component: CTAComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Button" />
            <TextInput label="Text" value={component.text} onChange={(e) => onUpdate({ ...component, text: e.target.value })} />
            <TextInput label="Link URL" value={component.url || ""} onChange={(e) => onUpdate({ ...component, url: e.target.value })} />

            <Select
                label="Size"
                value={component.size || "medium"}
                onChange={(e) => onUpdate({ ...component, size: e.target.value as "small" | "medium" | "large" })}
                options={[
                    { label: "Small", value: "small" },
                    { label: "Medium", value: "medium" },
                    { label: "Large", value: "large" },
                ]}
            />

            <div>
                <InputLabel>Alignment</InputLabel>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <IconButton icon={<AlignLeft size={16} />} active={component.align === 'left'} onClick={() => onUpdate({ ...component, align: 'left' })} />
                    <IconButton icon={<AlignCenter size={16} />} active={component.align === 'center' || !component.align} onClick={() => onUpdate({ ...component, align: 'center' })} />
                    <IconButton icon={<AlignRight size={16} />} active={component.align === 'right'} onClick={() => onUpdate({ ...component, align: 'right' })} />
                </div>
            </div>

            <SectionHeader title="Colors" />
            <ColorInput label="Background" value={component.bgColor || "#3b82f6"} onChange={(val) => onUpdate({ ...component, bgColor: val })} />
            <ColorInput label="Text" value={component.textColor || "#ffffff"} onChange={(val) => onUpdate({ ...component, textColor: val })} />

            <TextInput label="Border Radius" unit="px" type="number" value={component.borderRadius || 8} onChange={(e) => onUpdate({ ...component, borderRadius: Number(e.target.value) })} />
        </div>
    )
}

function DividerControls({ component, onUpdate }: { component: DividerComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Divider" />
            <Select
                label="Style"
                value={component.style || "solid"}
                onChange={(e) => onUpdate({ ...component, style: e.target.value as "solid" | "dashed" | "dotted" })}
                options={[
                    { label: "Solid", value: "solid" },
                    { label: "Dashed", value: "dashed" },
                    { label: "Dotted", value: "dotted" },
                ]}
            />
            <ColorInput label="Color" value={component.color || "#404040"} onChange={(val) => onUpdate({ ...component, color: val })} />
            <TextInput label="Width" unit="%" type="number" min="0" max="100" value={component.width || 100} onChange={(e) => onUpdate({ ...component, width: Number(e.target.value) })} />
            <TextInput label="Thickness" unit="px" type="number" value={component.thickness || 1} onChange={(e) => onUpdate({ ...component, thickness: Number(e.target.value) })} />
        </div>
    )
}

function SpacerControls({ component, onUpdate }: { component: SpacerComponent; onUpdate: (c: Component) => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader title="Dimensions" />
            <TextInput label="Height" unit="px" type="number" value={component.height} onChange={(e) => onUpdate({ ...component, height: Number(e.target.value) })} />
        </div>
    )
}

function SyllabusControls({ component, onUpdate }: { component: SyllabusComponent; onUpdate: (c: Component) => void }) {
    const addItem = () => {
        const newItem: SyllabusItem = {
            id: `item-${Date.now()}`,
            title: `Module ${component.items.length + 1}`,
            description: "",
            duration: "30 min",
        };
        onUpdate({ ...component, items: [...component.items, newItem] });
    };

    const updateItem = (index: number, updates: Partial<SyllabusItem>) => {
        const newItems = [...component.items];
        newItems[index] = { ...newItems[index], ...updates };
        onUpdate({ ...component, items: newItems });
    };

    const deleteItem = (index: number) => {
        const newItems = component.items.filter((_, i) => i !== index);
        onUpdate({ ...component, items: newItems });
    };

    const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= component.items.length) return;
        
        const newItems = [...component.items];
        [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
        onUpdate({ ...component, items: newItems });
    };

    return (
        <div className="space-y-5">
            <SectionHeader title="Syllabus Settings" />
            
            <TextInput 
                label="Title" 
                value={component.title || ""} 
                onChange={(e) => onUpdate({ ...component, title: e.target.value })} 
            />

            <Select
                label="Style"
                value={component.style || "accordion"}
                onChange={(e) => onUpdate({ ...component, style: e.target.value as "numbered" | "accordion" | "cards" })}
                options={[
                    { label: "Accordion", value: "accordion" },
                    { label: "Numbered List", value: "numbered" },
                    { label: "Cards", value: "cards" },
                ]}
            />

            <Select
                label="Show Duration"
                value={component.showDuration ? "yes" : "no"}
                onChange={(e) => onUpdate({ ...component, showDuration: e.target.value === "yes" })}
                options={[{ label: "Show", value: "yes" }, { label: "Hide", value: "no" }]}
            />

            <ColorInput 
                label="Accent Color" 
                value={component.accentColor || "#6366f1"} 
                onChange={(val) => onUpdate({ ...component, accentColor: val })} 
            />

            <SectionHeader title="Modules" />
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {component.items.map((item, index) => (
                    <div key={item.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                                <button 
                                    onClick={() => moveItem(index, 'up')}
                                    disabled={index === 0}
                                    className="p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                                </button>
                                <button 
                                    onClick={() => moveItem(index, 'down')}
                                    disabled={index === component.items.length - 1}
                                    className="p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                                </button>
                            </div>
                            <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateItem(index, { title: e.target.value })}
                                className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Module title"
                            />
                            <button 
                                onClick={() => deleteItem(index)}
                                className="p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) => updateItem(index, { description: e.target.value })}
                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-400 focus:outline-none focus:border-indigo-500"
                            placeholder="Description (optional)"
                        />
                        <input
                            type="text"
                            value={item.duration || ""}
                            onChange={(e) => updateItem(index, { duration: e.target.value })}
                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-400 focus:outline-none focus:border-indigo-500"
                            placeholder="Duration (e.g., 30 min)"
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={addItem}
                className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
            >
                <Plus size={14} />
                Add Module
            </button>
        </div>
    );
}


function MarginControls({ margin, onChange }: { margin?: Spacing; onChange: (margin: Spacing) => void }) {
    const current = margin || {};
    return (
        <div className="pt-2">
            <SectionHeader title="Margin" />
            <div className="grid grid-cols-2 gap-3">
                <TextInput label="Top" unit="px" type="number" value={current.top || ""} onChange={(e) => onChange({ ...current, top: Number(e.target.value) })} />
                <TextInput label="Right" unit="px" type="number" value={current.right || ""} onChange={(e) => onChange({ ...current, right: Number(e.target.value) })} />
                <TextInput label="Bottom" unit="px" type="number" value={current.bottom || ""} onChange={(e) => onChange({ ...current, bottom: Number(e.target.value) })} />
                <TextInput label="Left" unit="px" type="number" value={current.left || ""} onChange={(e) => onChange({ ...current, left: Number(e.target.value) })} />
            </div>
        </div>
    )
}
