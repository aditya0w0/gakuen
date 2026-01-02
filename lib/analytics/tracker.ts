"use client";

/**
 * Client-side Analytics Tracker
 * Respects GDPR - only tracks if user consents to analytics cookies
 */

import { hasAnalyticsConsent } from "./consent";

/**
 * Track page view (requires analytics consent)
 */
export async function trackPageView(pagePath: string): Promise<void> {
    // GDPR: Check consent first
    if (!hasAnalyticsConsent()) {
        return;
    }

    try {
        await fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "page_view",
                pagePath,
                referrer: document.referrer || undefined,
                timestamp: Date.now(),
            }),
        });
    } catch (error) {
        console.warn("Failed to track page view:", error);
    }
}

/**
 * Track custom event (requires analytics consent)
 */
export async function trackEvent(
    eventName: string,
    eventData?: Record<string, unknown>
): Promise<void> {
    // GDPR: Check consent first
    if (!hasAnalyticsConsent()) {
        return;
    }

    try {
        await fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "event",
                eventName,
                eventData,
                timestamp: Date.now(),
            }),
        });
    } catch (error) {
        console.warn("Failed to track event:", error);
    }
}

/**
 * Track course enrollment (functional - no consent needed)
 */
export async function trackEnrollment(courseId: string): Promise<void> {
    try {
        await fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "event",
                eventName: "course_enrollment",
                eventData: { courseId },
                timestamp: Date.now(),
                functional: true, // Mark as functional, no consent needed
            }),
        });
    } catch (error) {
        console.warn("Failed to track enrollment:", error);
    }
}
