"use client";

import React from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

// --- Shared Components based on Reference ---

export const InputLabel = ({ children, info }: { children: React.ReactNode; info?: string }) => (
    <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-zinc-400">{children}</label>
        {info && <span className="text-zinc-500 text-xs cursor-help" title={info}>ⓘ</span>}
    </div>
);

export const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 mt-6">{title}</h3>
);

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    unit?: string;
}

export const TextInput = ({ label, unit, className, ...props }: TextInputProps) => (
    <div className={label ? "" : "w-full"}>
        {label && <InputLabel>{label}</InputLabel>}
        <div className="relative group">
            <input
                type="text"
                className={`w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow placeholder-zinc-500 ${unit ? 'pr-10' : ''} ${className || ''}`}
                {...props}
            />
            {unit && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">
                    {unit}
                </span>
            )}
        </div>
    </div>
);

export const TextArea = ({ label, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
    <div>
        {label && <InputLabel>{label}</InputLabel>}
        <textarea
            className={`w-full bg-zinc-800 border-zinc-700 rounded-lg p-4 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none placeholder-zinc-600 leading-relaxed border ${className}`}
            {...props}
        />
    </div>
);

export const Select = ({ label, options, value, onChange, className }: { label?: string; options: { label: string; value: string | number }[]; value?: string | number; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; className?: string }) => (
    <div>
        {label && <InputLabel>{label}</InputLabel>}
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className={`w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-gray-200 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-zinc-800/80 transition-colors ${className}`}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
        </div>
    </div>
);

export const LayoutOption = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center py-2 rounded space-y-1 transition-all ${active
            ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
        title={label}
    >
        {icon}
    </button>
);

export const IconButton = ({ icon, active, onClick, className }: { icon: React.ReactNode; active?: boolean; onClick?: () => void; className?: string }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center py-1.5 rounded transition-all ${active
            ? "bg-zinc-800 text-indigo-400 shadow-sm"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            } ${className}`}
    >
        {icon}
    </button>
);

export const ColorInput = ({ label, value, onChange }: { label?: string; value: string; onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const presetColors = [
        '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
        '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
        '#6b7280', '#d4d4d8', '#a3a3a3', '#525252', '#1f2937',
    ];

    return (
        <div className="relative">
            {label && <InputLabel>{label}</InputLabel>}
            <div
                className="flex items-center bg-zinc-800 border border-zinc-700 rounded-md overflow-hidden group focus-within:ring-1 focus-within:ring-indigo-500 h-10 cursor-pointer hover:border-zinc-600 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div
                    className="w-9 h-full border-r border-zinc-700 shrink-0 transition-colors"
                    style={{ backgroundColor: value }}
                />
                <div className="bg-transparent px-3 py-2 text-sm text-gray-200 flex-1 font-mono uppercase">
                    {value.replace('#', '')}
                </div>
                <span className="px-2 text-zinc-600 text-xs select-none">HEX</span>
            </div>

            {/* Color Picker Modal */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-4 w-64 animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-xs font-semibold text-zinc-400 mb-3">COLOR PICKER</div>

                        {/* Preset Colors */}
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {presetColors.map((color) => (
                                <button
                                    key={color}
                                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${value.toLowerCase() === color.toLowerCase()
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                                            : 'border-zinc-700 hover:border-zinc-500'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(color);
                                    }}
                                />
                            ))}
                        </div>

                        {/* Custom Hex Input */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-gray-200 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="#000000"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export const PrimaryButton = ({ children, icon: Icon, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: LucideIcon }) => (
    <button
        className={`flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
    >
        {Icon && <Icon size={16} />}
        <span>{children}</span>
    </button>
);

export const SecondaryButton = ({ children, icon: Icon, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: LucideIcon }) => (
    <button
        className={`flex items-center px-4 py-2.5 bg-zinc-900/50 border border-zinc-700 border-dashed rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 transition-all group active:scale-[0.98] ${className}`}
        {...props}
    >
        {Icon && <Icon size={16} className="mr-2 group-hover:scale-110 transition-transform" />}
        {children}
    </button>
);
