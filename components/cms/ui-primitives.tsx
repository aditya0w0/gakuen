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

export const ColorInput = ({ label, value, onChange }: { label?: string; value: string; onChange: (val: string) => void }) => (
    <div>
        {label && <InputLabel>{label}</InputLabel>}
        <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-md overflow-hidden group focus-within:ring-1 focus-within:ring-indigo-500 h-10">
            <div
                className="w-9 h-full border-r border-zinc-700 shrink-0 cursor-pointer transition-colors hover:opacity-90"
                style={{ backgroundColor: value }}
                onClick={() => {
                    // In a real implementation this would trigger the actual picker,
                    // for now we rely on the hex input or external picker logic
                }}
            ></div>
            <input
                type="text"
                value={value.replace('#', '')}
                onChange={(e) => onChange(`#${e.target.value}`)}
                className="bg-transparent px-3 py-2 text-sm text-gray-200 flex-1 focus:outline-none font-mono uppercase w-full h-full"
            />
            <span className="px-2 text-zinc-600 text-xs select-none">HEX</span>
        </div>
    </div>
);

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
