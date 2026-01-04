"use client";

import { X, AlertTriangle, Trash2, Info, Check } from "lucide-react";
import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface SimpleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    children?: ReactNode;
    isDestructive?: boolean;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    icon?: ReactNode;
}

export function SimpleModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    children,
    isDestructive = false,
    isLoading = false,
    confirmText = "Delete",
    cancelText = "Cancel",
    icon
}: SimpleModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Default icon based on destructive state
    const defaultIcon = isDestructive
        ? <AlertTriangle size={20} />
        : <Info size={20} />;

    // Use portal to render at body level
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 transform transition-all scale-100 opacity-100"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isDestructive
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                            {icon || defaultIcon}
                        </div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors"
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {description && (
                    <p className="text-zinc-400 mb-6 leading-relaxed">
                        {description}
                    </p>
                )}

                {children && (
                    <div className="mb-6">
                        {children}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-2
                            ${isDestructive
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
