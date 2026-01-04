import { NextRequest, NextResponse } from "next/server";
import { requireAuth, safeErrorResponse } from "@/lib/api/auth-guard";
import { checkRateLimit, getClientIP, RateLimits } from "@/lib/api/rate-limit";
import {
    getCachedPersonalization,
    invalidatePersonalizationCache,
    type PersonalizationInput,
    type FrontendState,
    type UserProfile,
    type AvailableCourse,
} from "@/lib/ai/personalization";

export const dynamic = "force-dynamic";

// Validation constants
const MAX_AVAILABLE_COURSES = 50;
const MAX_COURSE_ID_LENGTH = 100;
const MAX_TAGS_PER_COURSE = 10;

/**
 * Validate frontend state input
 */
function validateFrontendState(data: unknown): FrontendState | null {
    if (!data || typeof data !== "object") return null;

    const state = data as Record<string, unknown>;

    return {
        routeChanges: Array.isArray(state.routeChanges)
            ? state.routeChanges.filter((r): r is string => typeof r === "string").slice(0, 20)
            : [],
        viewedCourseIds: Array.isArray(state.viewedCourseIds)
            ? state.viewedCourseIds.filter((id): id is string => typeof id === "string").slice(0, 20)
            : [],
        clickedTags: Array.isArray(state.clickedTags)
            ? state.clickedTags.filter((t): t is string => typeof t === "string").slice(0, 20)
            : [],
        watchDuration: typeof state.watchDuration === "number" ? Math.max(0, state.watchDuration) : undefined,
        scrollDepth: typeof state.scrollDepth === "number" ? Math.max(0, Math.min(100, state.scrollDepth)) : undefined,
    };
}

/**
 * Validate user profile input
 */
function validateUserProfile(data: unknown): UserProfile | null {
    if (!data || typeof data !== "object") return null;

    const profile = data as Record<string, unknown>;

    const validLevels = ["beginner", "intermediate", "advanced"];
    const level = validLevels.includes(profile.level as string)
        ? (profile.level as "beginner" | "intermediate" | "advanced")
        : "beginner";

    return {
        level,
        preferredTopics: Array.isArray(profile.preferredTopics)
            ? profile.preferredTopics.filter((t): t is string => typeof t === "string").slice(0, 10)
            : [],
    };
}

/**
 * Validate available courses input
 */
function validateAvailableCourses(data: unknown): AvailableCourse[] {
    if (!Array.isArray(data)) return [];

    const validLevels = ["beginner", "intermediate", "advanced"];

    return data
        .filter((c): c is Record<string, unknown> => c && typeof c === "object")
        .slice(0, MAX_AVAILABLE_COURSES)
        .map((c) => ({
            id: typeof c.id === "string" ? c.id.slice(0, MAX_COURSE_ID_LENGTH) : "",
            difficulty: validLevels.includes(c.difficulty as string)
                ? (c.difficulty as "beginner" | "intermediate" | "advanced")
                : "beginner",
            tags: Array.isArray(c.tags)
                ? c.tags.filter((t): t is string => typeof t === "string").slice(0, MAX_TAGS_PER_COURSE)
                : [],
        }))
        .filter((c) => c.id); // Remove courses without ID
}

/**
 * POST /api/personalize
 * Returns personalized course recommendations and frontend updates
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limiting by IP
        const clientIP = getClientIP(request);
        const rateLimit = checkRateLimit(`personalize:${clientIP}`, RateLimits.AI);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": rateLimit.resetTime.toString(),
                    },
                }
            );
        }

        // Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { user } = authResult;

        // Parse and validate request body
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
        }

        const requestData = body as Record<string, unknown>;

        // Validate inputs
        const frontendState = validateFrontendState(requestData.frontendState);
        if (!frontendState) {
            return NextResponse.json({ error: "Invalid frontendState" }, { status: 400 });
        }

        const userProfile = validateUserProfile(requestData.userProfile);
        if (!userProfile) {
            return NextResponse.json({ error: "Invalid userProfile" }, { status: 400 });
        }

        const availableCourses = validateAvailableCourses(requestData.availableCourses);
        if (availableCourses.length === 0) {
            return NextResponse.json({ error: "availableCourses is required and must not be empty" }, { status: 400 });
        }

        const input: PersonalizationInput = {
            frontendState,
            userProfile,
            availableCourses,
        };

        console.log(`🎯 Personalization request for user ${user.email}`);

        // Get personalization (cached or fresh)
        const result = await getCachedPersonalization(user.id, input);

        return NextResponse.json({
            recommended_course_ids: result.recommendedCourseIds,
            frontend_updates: {
                highlight_tags: result.frontendUpdates.highlightTags,
                suggested_route: result.frontendUpdates.suggestedRoute,
                ui_focus: result.frontendUpdates.uiFocus,
            },
        });
    } catch (error) {
        return safeErrorResponse(error, "Personalization service unavailable");
    }
}

/**
 * DELETE /api/personalize
 * Invalidate personalization cache for the current user
 */
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        invalidatePersonalizationCache(authResult.user.id);

        return NextResponse.json({
            success: true,
            message: "Personalization cache cleared",
        });
    } catch (error) {
        return safeErrorResponse(error, "Failed to clear personalization cache");
    }
}
