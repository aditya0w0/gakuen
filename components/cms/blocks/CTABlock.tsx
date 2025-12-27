"use client";

import { CTAComponent } from "@/lib/cms/types";

interface CTABlockProps {
    component: CTAComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function CTABlock({ component, isEditing, isSelected, onSelect }: CTABlockProps) {
    const containerStyle = {
        textAlign: component.align || "center",
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    const sizeMap = {
        small: "px-4 py-2 text-sm",
        medium: "px-6 py-3 text-base",
        large: "px-8 py-4 text-lg",
    };

    const buttonStyle = {
        backgroundColor: component.bgColor || "#3b82f6",
        color: component.textColor || "#ffffff",
        borderRadius: component.borderRadius ? `${component.borderRadius}px` : "8px",
    };

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                style={containerStyle}
                className={`group cursor-pointer rounded-lg transition-all p-2 ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "hover:bg-white/5"
                    }`}
            >
                <button
                    style={buttonStyle}
                    className={`font-medium transition-opacity hover:opacity-90 ${sizeMap[component.size || "medium"]
                        }`}
                >
                    {component.text}
                </button>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <button
                style={buttonStyle}
                className={`font-medium transition-opacity hover:opacity-90 ${sizeMap[component.size || "medium"]
                    }`}
                onClick={() => component.url && window.open(component.url, "_blank")}
            >
                {component.text}
            </button>
        </div>
    );
}
