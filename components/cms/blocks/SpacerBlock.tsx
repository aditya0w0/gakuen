"use client";

import { SpacerComponent } from "@/lib/cms/types";

interface SpacerBlockProps {
    component: SpacerComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function SpacerBlock({ component, isEditing, isSelected, onSelect }: SpacerBlockProps) {
    const style = {
        height: `${component.height}px`,
    };

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={style}
                className={`group cursor-pointer rounded-lg transition-all ${isSelected
                    ? "ring-2 ring-indigo-500 bg-indigo-500/10"
                    : "hover:bg-white/5 bg-neutral-800/30"
                    }`}
            >
                <div className="flex items-center justify-center h-full text-xs text-neutral-500">
                    {component.height}px
                </div>
            </div>
        );
    }

    return <div style={style} />;
}
