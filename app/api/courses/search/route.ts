import { NextResponse } from 'next/server';
import { searchCourses } from '@/lib/ml/server';

export async function POST(request: Request) {
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
