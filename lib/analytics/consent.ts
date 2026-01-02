/**
 * GDPR-Compliant Consent Utilities
 * Checks user consent before any tracking
 */

const CONSENT_KEY = "gakuen-cookie-consent";

interface ConsentSettings {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp: number;
}

/**
 * Get current consent settings
 * Returns null if user hasn't made a choice yet
 */
export function getConsent(): ConsentSettings | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) return null;
        return JSON.parse(stored) as ConsentSettings;
    } catch {
        return null;
    }
}

/**
 * Check if user has given analytics consent
 * REQUIRED before any analytics tracking
 */
export function hasAnalyticsConsent(): boolean {
    const consent = getConsent();
    return consent?.analytics === true;
}

/**
 * Check if user has given marketing consent
 * REQUIRED before any marketing tracking/pixels
 */
export function hasMarketingConsent(): boolean {
    const consent = getConsent();
    return consent?.marketing === true;
}

/**
 * Check if user has made any consent choice
 */
export function hasConsentChoice(): boolean {
    return getConsent() !== null;
}

/**
 * Save consent settings
 */
export function saveConsent(analytics: boolean, marketing: boolean): void {
    if (typeof window === "undefined") return;

    const consent: ConsentSettings = {
        essential: true, // Always true
        analytics,
        marketing,
        timestamp: Date.now(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}
