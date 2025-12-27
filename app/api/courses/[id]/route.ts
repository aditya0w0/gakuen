import { NextResponse } from 'next/server';
import { getCourse, saveCourse, deleteCourse } from '@/lib/server/fileOperations';
import { Course } from '@/lib/constants/demo-data';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const course = await getCourse(id);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error(`Error fetching course ${id}:`, error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}

// PUT /api/courses/[id]
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const course: Course = await request.json();
        const success = await saveCourse(id, course);

        if (!success) {
            return NextResponse.json({ error: 'Failed to save course' }, { status: 500 });
        }

        return NextResponse.json({ success: true, course });
    } catch (error) {
        console.error(`Error saving course ${id}:`, error);
        return NextResponse.json({ error: 'Failed to save course' }, { status: 500 });
    }
}

// DELETE /api/courses/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const success = await deleteCourse(id);

        if (!success) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting course ${id}:`, error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
