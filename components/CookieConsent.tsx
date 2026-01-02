"use client";

import { useState, useEffect } from "react";
import { X, Cookie, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ConsentSettings {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp: number;
}

const CONSENT_KEY = "gakuen-cookie-consent";
const CONSENT_EXPIRY_DAYS = 90;

export function CookieConsent() {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [settings, setSettings] = useState<ConsentSettings>({
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: 0,
    });

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as ConsentSettings;
                setSettings(parsed);
                const expiryMs = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
                if (Date.now() - parsed.timestamp >= expiryMs) {
                    setTimeout(() => setIsVisible(true), 1000);
                }
            } catch {
                setTimeout(() => setIsVisible(true), 1000);
            }
        } else {
            setTimeout(() => setIsVisible(true), 1000);
        }

        // Listen for manual open from Cookie Preferences link
        const handleOpenPreferences = () => {
            setIsVisible(true);
            setShowPreferences(true);
        };
        window.addEventListener('openCookiePreferences', handleOpenPreferences);
        return () => window.removeEventListener('openCookiePreferences', handleOpenPreferences);
    }, []);

    const saveConsent = (analytics: boolean, marketing: boolean) => {
        const consent: ConsentSettings = {
            essential: true,
            analytics,
            marketing,
            timestamp: Date.now(),
        };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
        setSettings(consent);
        setIsVisible(false);
        setShowPreferences(false);
    };

    const handleAcceptAll = () => saveConsent(true, true);
    const handleRejectAll = () => saveConsent(false, false);
    const handleSavePreferences = () => saveConsent(settings.analytics, settings.marketing);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsVisible(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {t.cookies.title}
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t.cookies.description}
                    </p>

                    {/* Quick Actions */}
                    {!showPreferences && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleRejectAll}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                                {t.cookies.rejectAll}
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                {t.cookies.acceptAll}
                            </button>
                        </div>
                    )}

                    {/* Manage Preferences Toggle */}
                    <button
                        onClick={() => setShowPreferences(!showPreferences)}
                        className="flex items-center justify-between w-full p-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <span>Manage Preferences</span>
                        {showPreferences ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Detailed Preferences */}
                    {showPreferences && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Essential Cookies */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Essential Cookies</h3>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                            Required for the website to function. Cannot be disabled.
                                        </p>
                                    </div>
                                    <div className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                                        Always On
                                    </div>
                                </div>
                            </div>

                            {/* Analytics Cookies */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 pr-4">
                                        <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Analytics Cookies</h3>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                            Help us understand how visitors interact with our website.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, analytics: !s.analytics }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.analytics ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.analytics ? 'translate-x-6' : ''
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Marketing Cookies */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 pr-4">
                                        <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Marketing Cookies</h3>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                            Used to deliver personalized advertisements.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, marketing: !s.marketing }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.marketing ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.marketing ? 'translate-x-6' : ''
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSavePreferences}
                                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Save Preferences
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
