import { NextRequest, NextResponse } from "next/server";
import { saveAnalyticsRecord } from "@/lib/analytics/firestore-analytics";
import { checkRateLimit, getClientIP, RateLimits } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/track
 * Track analytics events (page views, events)
 */
export async function POST(request: NextRequest) {
    // Rate limiting using centralized utility
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`analytics:${ip}`, RateLimits.ANALYTICS);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { type, timestamp } = body;

        // For non-functional tracking, we don't store user data
        // Just the aggregated event

        switch (type) {
            case "page_view":
                await saveAnalyticsRecord({
                    type: "page_view",
                    pagePath: body.pagePath,
                    referrer: body.referrer,
                    timestamp: timestamp || Date.now(),
                });
                break;

            case "event":
                await saveAnalyticsRecord({
                    type: "event",
                    eventName: body.eventName,
                    eventData: body.eventData,
                    timestamp: timestamp || Date.now(),
                });
                break;

            default:
                return NextResponse.json(
                    { error: "Invalid event type" },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Analytics track error:", error);
        return NextResponse.json(
            { error: "Failed to track event" },
            { status: 500 }
        );
    }
}
