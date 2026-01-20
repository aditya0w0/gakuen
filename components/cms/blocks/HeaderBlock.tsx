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
    // Default font sizes for each heading level (matching typical typography)
    const defaultFontSizes: Record<number, string> = {
        1: '2.25rem',  // 36px
        2: '1.5rem',   // 24px
        3: '1.25rem',  // 20px
        4: '1.125rem', // 18px
        5: '1rem',     // 16px
        6: '0.875rem', // 14px
    };

    const style: React.CSSProperties = {
        textAlign: component.align || undefined,
        color: component.color || '#fafafa',  // Light color for dark mode
        fontSize: component.fontSize ? `${component.fontSize}px` : defaultFontSizes[component.level || 1],
        fontWeight: component.fontWeight || 600,  // Semi-bold for headers
        marginTop: component.margin?.top ? `${component.margin.top}px` : '0',
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : '0.875em',
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
        lineHeight: 1.2,
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
