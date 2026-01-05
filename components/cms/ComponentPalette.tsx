"use client";

import { COMPONENT_REGISTRY, createComponent } from "@/lib/cms/registry";
import { Component } from "@/lib/cms/types";
import { LucideIcon, Type, AlignLeft, Image, Video, Code, MousePointerClick, Minus, MoveVertical, Plus, List } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ComponentPaletteProps {
    onAddComponent: (component: Component) => void;
}

const iconMap: Record<string, LucideIcon> = {
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

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-4 py-2.5 bg-zinc-900 border border-zinc-700 border-dashed rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 transition-all group"
            >
                <Plus size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                Add Block
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-1.5">
                    <div className="grid grid-cols-1 gap-0.5 max-h-80 overflow-y-auto custom-scrollbar">
                        {COMPONENT_REGISTRY.map((meta) => {
                            const Icon = iconMap[meta.icon] || Type;
                            return (
                                <button
                                    key={meta.type}
                                    onClick={() => {
                                        const newComponent = createComponent(meta.type);
                                        onAddComponent(newComponent);
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-zinc-300 group-hover:text-white">{meta.name}</div>
                                        <div className="text-[10px] text-zinc-500">{meta.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
