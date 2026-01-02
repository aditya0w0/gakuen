import { NextRequest, NextResponse } from 'next/server';
import { searchCourses } from '@/lib/ml/server';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Require authentication (uses ML resources)
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    try {
        const { query, allCourses } = await request.json();

        if (!query || !allCourses) {
            return NextResponse.json({ error: 'Query and Courses are required' }, { status: 400 });
        }

        console.log(`🔍 Semantic search for: "${query}"`);

        // Simplified course objects for processing
        const searchData = allCourses.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category,
            level: c.level
        }));

        const results = await searchCourses(query, searchData);

        console.log(`✅ Found ${results.length} ranked results`);

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Semantic Search error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
