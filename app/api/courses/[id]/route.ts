import { NextRequest, NextResponse } from 'next/server';
import { getCourse, saveCourse, deleteCourse } from '@/lib/server/fileOperations';
import { Course } from '@/lib/types';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { validateCourseId } from '@/lib/api/validators';
import { applyObjectTheming } from '@/lib/utils/content-theming';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id] - Public, anyone can view a course
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // 🔒 SECURITY: Validate course ID format
    if (!validateCourseId(id)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    try {
        const course = await getCourse(id);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // 🎮 Apply content theming (replace platform names with lore equivalents)
        const themedCourse = applyObjectTheming(course);

        return NextResponse.json(themedCourse, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            }
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch course');
    }
}

// PUT /api/courses/[id] - Admin only
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // 🔒 SECURITY: Require admin role
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const { id } = await params;

    // 🔒 SECURITY: Validate course ID format
    if (!validateCourseId(id)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    try {
        const course: Course = await request.json();

        // 🔒 SECURITY: Validate required fields
        if (!course.title || !course.id) {
            return NextResponse.json({ error: 'Invalid course data' }, { status: 400 });
        }

        // Ensure ID matches URL
        if (course.id !== id) {
            return NextResponse.json({ error: 'Course ID mismatch' }, { status: 400 });
        }

        const success = await saveCourse(id, course);

        if (!success) {
            return NextResponse.json({ error: 'Failed to save course' }, { status: 500 });
        }

        console.log(`✅ Admin ${authResult.user.email} updated course: ${id}`);
        return NextResponse.json({ success: true, course });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to save course');
    }
}

// DELETE /api/courses/[id] - Admin only
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // 🔒 SECURITY: Require admin role
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const { id } = await params;

    // 🔒 SECURITY: Validate course ID format
    if (!validateCourseId(id)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    try {
        const success = await deleteCourse(id);

        if (!success) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        console.log(`🗑️ Admin ${authResult.user.email} deleted course: ${id}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to delete course');
    }
}
