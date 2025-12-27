import { NextResponse } from 'next/server';
import { recommendCourses } from '@/lib/ai/gemini';

export async function POST(request: Request) {
    try {
        const { query, courses } = await request.json();

        if (!query || !courses) {
            return NextResponse.json({ error: 'Query and Courses are required' }, { status: 400 });
        }

        // Limit course data to save tokens (send only id, title, description, category)
        const simplifiedCourses = courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category,
            level: c.level
        }));

        const jsonString = await recommendCourses(query, JSON.stringify(simplifiedCourses));
        const recommendation = JSON.parse(jsonString);

        return NextResponse.json(recommendation);
    } catch (error: any) {
        console.error('AI Recommendation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
