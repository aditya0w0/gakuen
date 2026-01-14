import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { Course } from '@/lib/types';

// GET: Export all courses as JSON
export async function GET(request: NextRequest) {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const { firestore } = initAdmin();
        const db = firestore();
        const coursesRef = db.collection('courses');
        const snapshot = await coursesRef.get();

        const courses: Course[] = [];
        snapshot.forEach((doc) => {
            courses.push({ id: doc.id, ...doc.data() } as Course);
        });

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(courses, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="courses-backup-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error) {
        console.error('Export courses error:', error);
        return NextResponse.json(
            { error: 'Failed to export courses' },
            { status: 500 }
        );
    }
}

// POST: Import courses from JSON
export async function POST(request: NextRequest) {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const courses = await request.json() as Course[];

        if (!Array.isArray(courses)) {
            return NextResponse.json(
                { error: 'Invalid format: expected array of courses' },
                { status: 400 }
            );
        }

        const results = {
            imported: 0,
            updated: 0,
            errors: [] as string[],
        };

        for (const course of courses) {
            try {
                if (!course.id || !course.title) {
                    results.errors.push(`Skipped course: missing id or title`);
                    continue;
                }

                const { firestore } = initAdmin();
                const db = firestore();
                const courseRef = db.collection('courses').doc(course.id);
                const existingDoc = await courseRef.get();

                // Prepare course data (remove id from data, it's the doc ID)
                const { id, ...courseData } = course;
                const dataToSave = {
                    ...courseData,
                    updatedAt: new Date().toISOString(),
                    importedAt: new Date().toISOString(),
                };

                if (existingDoc.exists) {
                    await courseRef.update(dataToSave);
                    results.updated++;
                } else {
                    await courseRef.set({
                        ...dataToSave,
                        createdAt: new Date().toISOString(),
                    });
                    results.imported++;
                }
            } catch (err) {
                results.errors.push(`Failed to import course ${course.id}: ${err}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Imported ${results.imported} new courses, updated ${results.updated} existing courses`,
            ...results,
        });
    } catch (error) {
        console.error('Import courses error:', error);
        return NextResponse.json(
            { error: 'Failed to import courses' },
            { status: 500 }
        );
    }
}
