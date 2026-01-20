import { NextRequest, NextResponse } from 'next/server';
import { findSimilarCourses } from '@/lib/ml/server';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    try {
        const { courseId, allCourses } = await request.json();

        if (!courseId || !allCourses) {
            return NextResponse.json({ error: 'Course ID and All Courses are required' }, { status: 400 });
        }

        // Limit data for ML processing (only need text fields)
        const simplifiedCourses = allCourses.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category
        }));

        console.log(`🧠 finding similarities for course ${courseId}...`);

        const relatedCourseResults = await findSimilarCourses(courseId, simplifiedCourses);

        console.log(`✅ found ${relatedCourseResults.length} matches`);

        // Merge back full course data (including thumbnail, instructor, etc.)
        const relatedCoursesWithFullData = relatedCourseResults
            .map((result: any) => {
                const fullCourse = allCourses.find((c: any) => c.id === result.id);
                return fullCourse || result;
            })
            .filter(Boolean);

        return NextResponse.json(relatedCoursesWithFullData);
    } catch (error: any) {
        console.error('ML Recommendation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
