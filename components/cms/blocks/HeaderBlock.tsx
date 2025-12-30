"use client";

import { HeaderComponent } from "@/lib/cms/types";
import React, { createElement } from "react";

interface HeaderBlockProps {
    component: HeaderComponent;
    isEditing?: boolean;
    isSelected?: boolean;
    onUpdate?: (component: HeaderComponent) => void;
    onSelect?: () => void;
}

export function HeaderBlock({
    component,
    isEditing,
    isSelected,
    onUpdate,
    onSelect,
}: HeaderBlockProps) {
    const style: React.CSSProperties = {
        textAlign: component.align || "left",
        color: component.color || "#ffffff",
        fontSize: component.fontSize ? `${component.fontSize}px` : undefined,
        fontWeight: component.fontWeight || 600,
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    const tagName = `h${component.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                className={`group cursor-pointer rounded-lg transition-all ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "hover:bg-white/5"
                    }`}
            >
                {createElement(tagName, {
                    contentEditable: true,
                    suppressContentEditableWarning: true,
                    onBlur: (e: React.FocusEvent<HTMLElement>) => {
                        if (onUpdate) {
                            onUpdate({ ...component, text: e.currentTarget.textContent || "" });
                        }
                    },
                    style,
                    className: "focus:outline-none px-2 py-1",
                }, component.text)}
            </div>
        );
    }

    return createElement(tagName, { style }, component.text);
}
