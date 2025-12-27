import { NextResponse } from 'next/server';
import { listCourses, saveCourse } from '@/lib/server/fileOperations';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const courses = await listCourses();
        return NextResponse.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const courseData = await request.json();

        // Generate unique ID from title + timestamp to prevent collisions
        const slug = courseData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const id = `${slug}-${Date.now()}`;

        // Create course with initial lesson
        const newCourse = {
            id,
            title: courseData.title,
            description: courseData.description || '',
            instructor: courseData.instructor || 'Admin',
            thumbnail: courseData.thumbnail || 'https://placehold.co/800x400',
            category: courseData.category || 'Uncategorized',
            level: (courseData.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
            duration: '0 hours',
            lessonsCount: 1,
            enrolledCount: 0,
            rating: 0,
            price: 0,
            lessons: [
                {
                    id: '1',
                    title: 'Introduction',
                    description: 'Getting started',
                    duration: '5 min',
                    videoUrl: '',
                    content: '# Welcome\n\nStart building your course content here.',
                    components: [],
                },
            ],
            createdAt: new Date().toISOString(),
            isPublished: false,
        };

        await saveCourse(id, newCourse);
        console.log('✅ Created new course:', id);

        return NextResponse.json({ course: newCourse, id });
    } catch (error: any) {
        console.error('❌ Course creation error:', error);

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
        }

        console.log(`🗑️ Deleting course: ${id}`);
        // Delete from local file system
        const { deleteCourse } = await import('@/lib/server/fileOperations');
        const success = await deleteCourse(id);

        if (!success) {
            return NextResponse.json({ error: 'Course not found or failed to delete' }, { status: 404 });
        }

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('❌ Delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

