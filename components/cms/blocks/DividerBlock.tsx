"use client";

import { DividerComponent } from "@/lib/cms/types";

interface DividerBlockProps {
    component: DividerComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function DividerBlock({ component, isEditing, isSelected, onSelect }: DividerBlockProps) {
    const containerStyle = {
        marginTop: component.margin?.top ? `${component.margin.top}px` : "24px",
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : "24px",
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    const hrStyle = {
        borderStyle: component.style || "solid",
        borderColor: component.color || "#404040",
        borderWidth: `${component.thickness || 1}px 0 0 0`,
        width: `${component.width || 100}%`,
        margin: "0 auto",
    };

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={containerStyle}
                className={`group cursor-pointer rounded-lg transition-all p-2 ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "hover:bg-white/5"
                    }`}
            >
                <hr style={hrStyle} />
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <hr style={hrStyle} />
        </div>
    );
}
