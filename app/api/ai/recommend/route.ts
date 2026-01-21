import { NextRequest, NextResponse } from 'next/server';
import { recommendCourses } from '@/lib/ai/gemini';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require authentication to prevent API cost abuse
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { query, courses } = await request.json();

        // 🔒 SECURITY: Validate input
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }
        if (!courses || !Array.isArray(courses)) {
            return NextResponse.json({ error: 'Courses array required' }, { status: 400 });
        }

        // 🔒 SECURITY: Limit query length
        if (query.length > 1000) {
            return NextResponse.json({ error: 'Query too long (max 1000 chars)' }, { status: 400 });
        }

        // Limit course data to save tokens (send only id, title, description, category)
        const simplifiedCourses = courses.slice(0, 50).map((c: { id: string; title?: string; description?: string; category?: string; level?: string }) => ({
            id: c.id,
            title: c.title?.slice(0, 200),
            description: c.description?.slice(0, 500),
            category: c.category?.slice(0, 50),
            level: c.level
        }));

        console.log(`🤖 AI recommend for user ${authResult.user.email}: "${query.slice(0, 50)}..."`);

        const jsonString = await recommendCourses(query, JSON.stringify(simplifiedCourses));
        const recommendation = JSON.parse(jsonString);

        return NextResponse.json(recommendation);
    } catch (error: unknown) {
        return safeErrorResponse(error, 'Recommendation service unavailable');
    }
}
