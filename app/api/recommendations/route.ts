import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { listCourses } from '@/lib/server/fileOperations';
import { getCachedRecommendations, invalidateRecommendationCache } from '@/lib/ai/recommendations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recommendations
 * Returns personalized course recommendations based on user's learning history
 */
export async function GET(request: NextRequest) {
    try {
        // Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { user } = authResult;

        // Get all available courses
        const allCourses = await listCourses();

        // Build course info for recommendation engine
        const courseInfos = allCourses.map(course => ({
            id: course.id,
            title: course.title,
            category: course.category || 'general',
            level: course.level || 'beginner'
        }));

        // Get categories from user's enrolled courses
        const enrolledCategories = allCourses
            .filter(c => user.enrolledCourses?.includes(c.id))
            .map(c => c.category || 'general');

        // Build user context
        const userContext = {
            enrolledCourses: user.enrolledCourses || [],
            completedLessons: user.completedLessons?.length || 0,
            categories: [...new Set(enrolledCategories)], // Unique categories
            recentActivity: user.enrolledCourses?.slice(0, 3) // Last 3 enrolled
        };

        // Get limit from query params (default 5)
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '5', 10);

        // Get recommendations (cached or fresh)
        const recommendedIds = await getCachedRecommendations(
            user.id,
            userContext,
            courseInfos,
            Math.min(limit, 10) // Max 10
        );

        // Get full course objects for recommended IDs
        const recommendedCourses = recommendedIds
            .map(id => allCourses.find(c => c.id === id))
            .filter(Boolean);

        return NextResponse.json({
            recommendations: recommendedCourses,
            count: recommendedCourses.length,
            cached: true // Client can use this info
        });

    } catch (error) {
        return safeErrorResponse(error, 'Failed to get recommendations');
    }
}

/**
 * POST /api/recommendations/refresh
 * Force refresh recommendations (e.g., after enrolling in new course)
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        // Invalidate cache
        invalidateRecommendationCache(authResult.user.id);

        return NextResponse.json({
            success: true,
            message: 'Recommendations cache cleared'
        });

    } catch (error) {
        return safeErrorResponse(error, 'Failed to refresh recommendations');
    }
}
