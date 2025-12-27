"use client";

import { Component, HeaderComponent, TextComponent, ImageComponent, VideoComponent, CodeComponent, CTAComponent, DividerComponent, SpacerComponent, Spacing } from "@/lib/cms/types";
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
    Trash2
} from "lucide-react";
import { useState } from "react";

interface DesignControlsProps {
    component: Component | null;
    onUpdate: (component: Component) => void;
    onDelete: () => void;
}

export function DesignControls({ component, onUpdate, onDelete }: DesignControlsProps) {
    const [activeTab, setActiveTab] = useState<'design' | 'settings'>('design');

    if (!component) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
                <p className="text-sm">Select a component to edit its properties</p>
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
