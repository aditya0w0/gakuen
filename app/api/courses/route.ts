import { NextRequest, NextResponse } from 'next/server';
import { listCourses, saveCourse } from '@/lib/server/fileOperations';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { sanitizeString, validateCourseId } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

// GET is public - anyone can browse courses
export async function GET() {
    try {
        const courses = await listCourses();
        return NextResponse.json(courses, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch courses');
    }
}

// POST requires admin
export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const courseData = await request.json();

        // 🔒 SECURITY: Validate and sanitize input
        if (!courseData.title || typeof courseData.title !== 'string') {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const title = courseData.title.slice(0, 200); // Limit title length

        // Generate unique ID from title + timestamp to prevent collisions
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 50);
        const id = `${slug}-${Date.now()}`;

        // Create course with initial lesson
        const newCourse = {
            id,
            title: title,
            description: (courseData.description || '').slice(0, 5000),
            instructor: (courseData.instructor || authResult.user.name || 'Admin').slice(0, 100),
            thumbnail: courseData.thumbnail || 'https://placehold.co/800x400',
            category: (courseData.category || 'Uncategorized').slice(0, 50),
            level: (['beginner', 'intermediate', 'advanced'].includes(courseData.level)
                ? courseData.level
                : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
            duration: '0 hours',
            lessonsCount: 1,
            enrolledCount: 0,
            rating: 0,
            price: 0,
            lessons: [
                {
                    id: '1',
                    title: 'Introduction',
                    type: 'article' as const,
                    duration: '5 min',
                    content: '# Welcome\n\nStart building your course content here.',
                    order: 1,
                    components: [],
                },
            ],
            createdAt: new Date().toISOString(),
            isPublished: false,
            createdBy: authResult.user.id, // Track who created it
        };

        await saveCourse(id, newCourse);
        console.log(`✅ Admin ${authResult.user.email} created course: ${id}`);

        return NextResponse.json({ course: newCourse, id });
    } catch (error: unknown) {
        return safeErrorResponse(error, 'Failed to create course');
    }
}

// DELETE requires admin
export async function DELETE(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
        }

        // 🔒 SECURITY: Validate course ID format
        if (!validateCourseId(id)) {
            return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 });
        }

        console.log(`🗑️ Admin ${authResult.user.email} deleting course: ${id}`);

        // Delete from local file system
        const { deleteCourse } = await import('@/lib/server/fileOperations');
        const success = await deleteCourse(id);

        if (!success) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, id });
    } catch (error: unknown) {
        return safeErrorResponse(error, 'Failed to delete course');
    }
}
