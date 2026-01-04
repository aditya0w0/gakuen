/**
 * LLM Personalization using Gemini 2.5 Flash Lite (preview)
 * Stateless, serverless personalization for course recommendations
 * and frontend state updates based on user behavior.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Use Gemini 2.5 Flash Lite - cheapest model for fast decisions
const MODEL_NAME = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash-lite-preview-06-17";

/**
 * Frontend state from the last ~5 minutes
 */
export interface FrontendState {
    /** Route changes (e.g., ["/courses", "/courses/cs-101", "/courses/cs-102"]) */
    routeChanges: string[];
    /** Viewed course IDs */
    viewedCourseIds: string[];
    /** Clicked tags */
    clickedTags: string[];
    /** Watch duration in seconds (for video content) */
    watchDuration?: number;
    /** Scroll depth percentage (0-100) */
    scrollDepth?: number;
}

/**
 * User profile for personalization
 */
export interface UserProfile {
    /** User's skill level */
    level: "beginner" | "intermediate" | "advanced";
    /** Preferred topics/categories */
    preferredTopics: string[];
}

/**
 * Available course for ranking
 */
export interface AvailableCourse {
    id: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    tags: string[];
}

/**
 * Personalization request input
 */
export interface PersonalizationInput {
    frontendState: FrontendState;
    userProfile: UserProfile;
    availableCourses: AvailableCourse[];
}

/**
 * Frontend updates suggested by personalization
 */
export interface FrontendUpdates {
    /** Tags to highlight in the UI */
    highlightTags: string[];
    /** Suggested route to navigate to */
    suggestedRoute: string | null;
    /** UI element to focus on */
    uiFocus: string | null;
}

/**
 * Personalization response
 */
export interface PersonalizationResult {
    /** Ranked course IDs (most relevant first) */
    recommendedCourseIds: string[];
    /** Suggested frontend state changes */
    frontendUpdates: FrontendUpdates;
}

/**
 * Build a structured prompt for the LLM
 */
function buildPersonalizationPrompt(input: PersonalizationInput): string {
    const { frontendState, userProfile, availableCourses } = input;

    return `You are a personalization engine for an educational platform.
Analyze user behavior and return course recommendations and UI suggestions.

USER LEVEL: ${userProfile.level}
PREFERRED TOPICS: ${userProfile.preferredTopics.join(", ") || "none specified"}

RECENT FRONTEND STATE (last 5 minutes):
- Route changes: ${frontendState.routeChanges.slice(-5).join(" → ") || "none"}
- Viewed courses: ${frontendState.viewedCourseIds.slice(-5).join(", ") || "none"}
- Clicked tags: ${frontendState.clickedTags.slice(-5).join(", ") || "none"}
- Watch duration: ${frontendState.watchDuration ?? 0} seconds
- Scroll depth: ${frontendState.scrollDepth ?? 0}%

AVAILABLE COURSES:
${availableCourses.slice(0, 30).map(c => `- ${c.id} (${c.difficulty}): [${c.tags.join(", ")}]`).join("\n")}

RULES:
1. Infer short-term intent from frontend state
2. Prefer recent signals over long-term preferences
3. Match course difficulty to user level (±1 level allowed)
4. Only return IDs from AVAILABLE COURSES
5. Rank by relevance (max 5 courses)
6. Suggest frontend updates based on intent

Return ONLY valid JSON (no markdown, no explanation):
{"recommended_course_ids":[],"frontend_updates":{"highlight_tags":[],"suggested_route":null,"ui_focus":null}}`;
}

/**
 * Parse LLM response safely
 */
function parsePersonalizationResponse(text: string, validCourseIds: Set<string>): PersonalizationResult {
    // Clean up potential markdown code blocks
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    cleanText = cleanText.trim();

    // Try to extract JSON object
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No JSON object found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and filter course IDs
    const recommendedCourseIds: string[] = [];
    if (Array.isArray(parsed.recommended_course_ids)) {
        for (const id of parsed.recommended_course_ids) {
            if (typeof id === "string" && validCourseIds.has(id)) {
                recommendedCourseIds.push(id);
            }
        }
    }

    // Extract frontend updates with defaults
    const frontendUpdates: FrontendUpdates = {
        highlightTags: [],
        suggestedRoute: null,
        uiFocus: null,
    };

    if (parsed.frontend_updates && typeof parsed.frontend_updates === "object") {
        const updates = parsed.frontend_updates;

        if (Array.isArray(updates.highlight_tags)) {
            frontendUpdates.highlightTags = updates.highlight_tags
                .filter((t: unknown) => typeof t === "string")
                .slice(0, 5);
        }

        if (typeof updates.suggested_route === "string" && updates.suggested_route) {
            frontendUpdates.suggestedRoute = updates.suggested_route;
        }

        if (typeof updates.ui_focus === "string" && updates.ui_focus) {
            frontendUpdates.uiFocus = updates.ui_focus;
        }
    }

    return {
        recommendedCourseIds: recommendedCourseIds.slice(0, 5),
        frontendUpdates,
    };
}

/**
 * Heuristic fallback when LLM fails
 */
export function heuristicPersonalization(input: PersonalizationInput): PersonalizationResult {
    const { frontendState, userProfile, availableCourses } = input;

    // Build a scoring map for courses
    const courseScores = new Map<string, number>();

    for (const course of availableCourses) {
        let score = 0;

        // Match difficulty to user level
        const levelMap: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
        const userLevelNum = levelMap[userProfile.level] || 1;
        const courseLevelNum = levelMap[course.difficulty] || 1;
        const levelDiff = Math.abs(userLevelNum - courseLevelNum);

        if (levelDiff === 0) score += 3;
        else if (levelDiff === 1) score += 1;
        else score -= 2;

        // Match tags with clicked tags (recent signals - higher weight)
        for (const tag of course.tags) {
            if (frontendState.clickedTags.includes(tag)) {
                score += 5;
            }
        }

        // Match tags with preferred topics (lower weight)
        for (const tag of course.tags) {
            if (userProfile.preferredTopics.includes(tag)) {
                score += 2;
            }
        }

        // Boost courses related to recently viewed
        if (frontendState.viewedCourseIds.includes(course.id)) {
            // Don't recommend already viewed courses as highly
            score -= 1;
        }

        courseScores.set(course.id, score);
    }

    // Sort by score and take top 5
    const sorted = [...courseScores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

    // Build highlight tags from clicked tags
    const highlightTags = frontendState.clickedTags.slice(-3);

    return {
        recommendedCourseIds: sorted,
        frontendUpdates: {
            highlightTags,
            suggestedRoute: null,
            uiFocus: null,
        },
    };
}

/**
 * Get personalization using Gemini LLM
 */
export async function getPersonalization(input: PersonalizationInput): Promise<PersonalizationResult> {
    const validCourseIds = new Set(input.availableCourses.map(c => c.id));

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 80,
            },
        });

        const prompt = buildPersonalizationPrompt(input);
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        return parsePersonalizationResponse(text, validCourseIds);
    } catch (error) {
        console.error("Personalization LLM error:", error);
        // Fallback to heuristic
        return heuristicPersonalization(input);
    }
}

// In-memory cache for personalization results (5 minutes TTL)
const personalizationCache = new Map<string, { result: PersonalizationResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of personalizationCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            personalizationCache.delete(key);
        }
    }
}, 60000); // Cleanup every minute

/**
 * Get cached personalization or generate new one
 */
export async function getCachedPersonalization(
    userId: string,
    input: PersonalizationInput
): Promise<PersonalizationResult> {
    const cached = personalizationCache.get(userId);

    // Return cached if fresh (within 5 minutes)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 Using cached personalization for ${userId}`);
        return cached.result;
    }

    // Generate new personalization
    const result = await getPersonalization(input);

    // Cache result
    personalizationCache.set(userId, {
        result,
        timestamp: Date.now(),
    });

    console.log(`✨ Generated new personalization for ${userId}`);
    return result;
}

/**
 * Invalidate cache for a user
 */
export function invalidatePersonalizationCache(userId: string): void {
    personalizationCache.delete(userId);
}
