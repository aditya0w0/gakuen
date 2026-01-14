import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';

export async function POST(request: NextRequest) {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const user = authResult.user;

    try {
        const { courseId } = await request.json();

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required' },
                { status: 400 }
            );
        }

        // Get current enrolled courses
        const { firestore } = initAdmin();
        const db = firestore();
        const userRef = db.collection('users').doc(user.id);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        const currentEnrolled = userData?.enrolledCourses || [];

        // Check if already enrolled
        if (currentEnrolled.includes(courseId)) {
            return NextResponse.json({
                success: true,
                alreadyEnrolled: true,
                enrolledCourses: currentEnrolled
            });
        }

        // Add course to enrolled list
        const updatedEnrolled = [...currentEnrolled, courseId];

        await userRef.update({
            enrolledCourses: updatedEnrolled,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            enrolledCourses: updatedEnrolled
        });
    } catch (error) {
        console.error('Enrollment API error:', error);
        return NextResponse.json(
            { error: 'Failed to enroll in course' },
            { status: 500 }
        );
    }
}
