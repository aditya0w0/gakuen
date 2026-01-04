// Course Recommendations using Gemini Flash Lite
// Analyzes user metadata and suggests relevant courses

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Use Flash Lite - cheapest model for simple tasks
const MODEL_NAME = "gemini-2.0-flash-lite";

interface UserContext {
    enrolledCourses: string[];      // Course IDs user is enrolled in
    completedLessons: number;       // Total lessons completed
    categories: string[];           // Categories of enrolled courses
    recentActivity?: string[];      // Recent course IDs accessed
}

interface CourseInfo {
    id: string;
    title: string;
    category: string;
    level: string;
}

/**
 * Get course recommendations based on user's learning history
 * Returns array of course IDs that match available courses
 */
export async function getRecommendations(
    userContext: UserContext,
    availableCourses: CourseInfo[],
    limit: number = 5
): Promise<string[]> {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Build a simple prompt
        const prompt = `You are a course recommendation system. Based on the user's learning data, recommend courses from the available list.

USER DATA:
- Enrolled in: ${userContext.enrolledCourses.join(", ") || "none"}
- Completed lessons: ${userContext.completedLessons}
- Interested categories: ${userContext.categories.join(", ") || "various"}
- Recent activity: ${userContext.recentActivity?.join(", ") || "none"}

AVAILABLE COURSES (not enrolled):
${availableCourses
                .filter(c => !userContext.enrolledCourses.includes(c.id))
                .map(c => `- ${c.id}: "${c.title}" (${c.category}, ${c.level})`)
                .join("\n")}

TASK: Return ONLY a JSON array of ${limit} course IDs that would be most relevant for this user. 
Consider: skill progression, category interests, complementary skills.
Format: ["course-id-1", "course-id-2", ...]

RESPONSE (JSON array only):`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Parse JSON response
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (!jsonMatch) {
            console.error("No JSON array in response:", text);
            return [];
        }

        const recommendations = JSON.parse(jsonMatch[0]) as string[];

        // Validate that recommended IDs exist in available courses
        const validIds = new Set(availableCourses.map(c => c.id));
        const validRecommendations = recommendations.filter(id => validIds.has(id));

        console.log(`✨ Generated ${validRecommendations.length} recommendations`);
        return validRecommendations.slice(0, limit);

    } catch (error) {
        console.error("Recommendation error:", error);
        return [];
    }
}

// Simple in-memory cache for recommendations
const recommendationCache = new Map<string, { recommendations: string[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

/**
 * Get cached recommendations or generate new ones
 */
export async function getCachedRecommendations(
    userId: string,
    userContext: UserContext,
    availableCourses: CourseInfo[],
    limit: number = 5
): Promise<string[]> {
    const cached = recommendationCache.get(userId);

    // Return cached if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 Using cached recommendations for ${userId}`);
        return cached.recommendations;
    }

    // Generate new recommendations
    const recommendations = await getRecommendations(userContext, availableCourses, limit);

    // Cache result
    recommendationCache.set(userId, {
        recommendations,
        timestamp: Date.now()
    });

    return recommendations;
}

/**
 * Invalidate cache for a user (call when they enroll in a new course)
 */
export function invalidateRecommendationCache(userId: string): void {
    recommendationCache.delete(userId);
}
