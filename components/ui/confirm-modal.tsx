"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: "bg-red-600 hover:bg-red-700",
        warning: "bg-amber-600 hover:bg-amber-700",
        info: "bg-blue-600 hover:bg-blue-700",
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-neutral-600 dark:text-neutral-400">
                    {message}
                </p>

                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 ${variantStyles[variant]}`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
