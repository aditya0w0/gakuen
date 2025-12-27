"use client";

import { Component } from "@/lib/cms/types";
import { Copy, Trash2, ArrowUp, ArrowDown, Clipboard } from "lucide-react";
import { useEffect, useRef } from "react";

interface ContextMenuProps {
    x: number;
    y: number;
    component: Component | null;
    onClose: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onCopy: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

export function ContextMenu({
    x,
    y,
    component,
    onClose,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onCopy,
    canMoveUp,
    canMoveDown,
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    if (!component) return null;

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                ref={menuRef}
                className="fixed z-50 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/50 py-1.5 animate-in fade-in zoom-in-95 duration-100"
                style={{ left: x, top: y }}
            >
                <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-1">
                    {component.type}
                </div>

                <MenuItem
                    icon={<Copy size={14} />}
                    label="Duplicate"
                    shortcut="⌘D"
                    onClick={() => {
                        onDuplicate();
                        onClose();
                    }}
                />

                <MenuItem
                    icon={<Clipboard size={14} />}
                    label="Copy"
                    shortcut="⌘C"
                    onClick={() => {
                        onCopy();
                        onClose();
                    }}
                />

                <div className="h-px bg-zinc-800 my-1" />

                <MenuItem
                    icon={<ArrowUp size={14} />}
                    label="Move Up"
                    shortcut="⌘↑"
                    disabled={!canMoveUp}
                    onClick={() => {
                        if (canMoveUp) {
                            onMoveUp();
                            onClose();
                        }
                    }}
                />

                <MenuItem
                    icon={<ArrowDown size={14} />}
                    label="Move Down"
                    shortcut="⌘↓"
                    disabled={!canMoveDown}
                    onClick={() => {
                        if (canMoveDown) {
                            onMoveDown();
                            onClose();
                        }
                    }}
                />

                <div className="h-px bg-zinc-800 my-1" />

                <MenuItem
                    icon={<Trash2 size={14} />}
                    label="Delete"
                    shortcut="Del"
                    danger
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                />
            </div>
        </>
    );
}

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
}

function MenuItem({ icon, label, shortcut, disabled, danger, onClick }: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-md transition-colors ${disabled
                    ? "text-zinc-600 cursor-not-allowed"
                    : danger
                        ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
        >
            <div className="flex items-center gap-2.5">
                {icon}
                <span>{label}</span>
            </div>
            {shortcut && (
                <span className="text-[10px] text-zinc-600 font-mono">{shortcut}</span>
            )}
        </button>
    );
}
