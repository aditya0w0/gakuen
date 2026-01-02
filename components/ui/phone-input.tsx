import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { createPortal } from "react-dom";

interface CountryCode {
    code: string;
    name: string;
    dial: string;
    flag: string;
}

const countryCodes: CountryCode[] = [
    { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
    { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
    { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
    { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
    { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
    { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
    { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
    { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
    { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
    { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
];

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function PhoneInput({ value, onChange, placeholder = "123 456 7890", className = "" }: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[1]); // Default Indonesia
    const [search, setSearch] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: 288, // w-72 = 18rem = 288px
            });
        }
    }, [isOpen]);

    const filteredCountries = countryCodes.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.dial.includes(search) ||
            c.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectCountry = (country: CountryCode) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearch("");
        // Don't include country code in the value
        const phoneWithoutCode = value.replace(/^\+\d+\s*/, "");
        onChange(phoneWithoutCode);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        // Only allow numbers, spaces, hyphens, parentheses
        const cleaned = input.replace(/[^\d\s\-()]/g, "");
        onChange(cleaned);
    };

    return (
        <div className={`relative ${className}`}>
            <div className="flex gap-2">
                {/* Country Code Selector */}
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{selectedCountry.dial}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Phone Number Input */}
                <input
                    type="tel"
                    value={value}
                    onChange={handlePhoneChange}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Dropdown Portal - prevents overlap */}
            {isOpen && typeof window !== 'undefined' && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            width: `${dropdownPosition.width}px`,
                        }}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg shadow-lg z-50 max-h-64 overflow-hidden"
                    >
                        {/* Search */}
                        <div className="p-2 border-b border-neutral-200 dark:border-white/10">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full px-3 py-2 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        {/* Country List */}
                        <div className="max-h-52 overflow-y-auto">
                            {filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelectCountry(country)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-left"
                                >
                                    <span className="text-xl">{country.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-neutral-900 dark:text-white truncate">
                                            {country.name}
                                        </div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {country.dial}
                                        </div>
                                    </div>
                                    {selectedCountry.code === country.code && (
                                        <Check className="w-4 h-4 text-blue-500" />
                                    )}
                                </button>
                            ))}
                            {filteredCountries.length === 0 && (
                                <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                    No countries found
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
