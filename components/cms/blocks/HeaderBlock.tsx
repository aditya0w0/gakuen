"use client";

import { HeaderComponent } from "@/lib/cms/types";

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
    const Tag = `h${component.level}` as keyof JSX.IntrinsicElements;

    const style = {
        textAlign: component.align || "left",
        color: component.color || "#ffffff",
        fontSize: component.fontSize ? `${component.fontSize}px` : undefined,
        fontWeight: component.fontWeight || 600,
        marginTop: component.margin?.top ? `${component.margin.top}px` : undefined,
        marginRight: component.margin?.right ? `${component.margin.right}px` : undefined,
        marginBottom: component.margin?.bottom ? `${component.margin.bottom}px` : undefined,
        marginLeft: component.margin?.left ? `${component.margin.left}px` : undefined,
    };

    if (isEditing) {
        return (
            <div
                onClick={onSelect}
                className={`group cursor-pointer rounded-lg transition-all ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "hover:bg-white/5"
                    }`}
            >
                <Tag
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                        if (onUpdate) {
                            onUpdate({ ...component, text: e.currentTarget.textContent || "" });
                        }
                    }}
                    style={style}
                    className="focus:outline-none px-2 py-1"
                >
                    {component.text}
                </Tag>
            </div>
        );
    }

    return <Tag style={style}>{component.text}</Tag>;
}
