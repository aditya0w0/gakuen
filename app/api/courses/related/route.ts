import { NextResponse } from 'next/server';
import { findSimilarCourses } from '@/lib/ml/server';

export async function POST(request: Request) {
    try {
        const { courseId, allCourses } = await request.json();

        if (!courseId || !allCourses) {
            return NextResponse.json({ error: 'Course ID and All Courses are required' }, { status: 400 });
        }

        // Limit data for processing (simulated database fetch would happen here in prod)
        const simplifiedCourses = allCourses.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category
        }));

        console.log(`🧠 finding similarities for course ${courseId}...`);

        const relatedCourses = await findSimilarCourses(courseId, simplifiedCourses);

        console.log(`✅ found ${relatedCourses.length} matches`);

        return NextResponse.json(relatedCourses);
    } catch (error: any) {
        console.error('ML Recommendation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
