import { NextRequest, NextResponse } from 'next/server';
import { withAuthTracked, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { paymentSchema } from '@/lib/validation/schemas';
import { isSubscriptionsEnabled } from '@/lib/admin/feature-flags';

export const dynamic = 'force-dynamic';

export const POST = withAuthTracked(async (request, { user }) => {
    try {
        // 🔧 Feature flag check
        if (!(await isSubscriptionsEnabled())) {
            return NextResponse.json(
                { error: 'Payments are temporarily disabled for maintenance.' },
                { status: 503 }
            );
        }

        // Validate and sanitize input
        const body = await request.json();
        const parseResult = paymentSchema.safeParse(body);

        if (!parseResult.success) {
            const errors = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
            return NextResponse.json({ error: `Invalid input: ${errors}` }, { status: 400 });
        }

        const { courseId, amount, couponCode } = parseResult.data;

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();
        const userId = user.id;

        // Check if user already purchased this course
        const existingPayment = await db.collection('payments')
            .where('userId', '==', userId)
            .where('courseId', '==', courseId)
            .where('status', '==', 'completed')
            .get();

        if (!existingPayment.empty) {
            return NextResponse.json({ error: 'You already own this course' }, { status: 400 });
        }

        // Simulate payment processing delay (1-2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create payment record
        const paymentRef = await db.collection('payments').add({
            userId,
            courseId,
            amount,
            status: 'completed', // Always succeeds in dummy mode
            paymentMethod: 'card',
            createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Payment created: ${paymentRef.id} for user ${userId}, course ${courseId}`);

        // Auto-enroll user in the course and track in subscription
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const enrolledCourses = userData?.enrolledCourses || [];
            const purchasedCourses = userData?.subscription?.purchasedCourses || [];

            const updates: any = {};

            // Add to enrolledCourses if not already enrolled
            if (!enrolledCourses.includes(courseId)) {
                updates.enrolledCourses = [...enrolledCourses, courseId];
            }

            // Also track in subscription.purchasedCourses for paid course tracking
            if (!purchasedCourses.includes(courseId)) {
                updates['subscription.purchasedCourses'] = [...purchasedCourses, courseId];
            }

            if (Object.keys(updates).length > 0) {
                await userRef.update(updates);
                console.log(`✅ User ${userId} enrolled in course ${courseId} (updated enrolledCourses and subscription.purchasedCourses)`);
            }
        }

        return NextResponse.json({
            success: true,
            paymentId: paymentRef.id,
            message: 'Payment successful! You are now enrolled in this course.',
        });
    } catch (error) {
        console.error('❌ Payment error:', error);
        return safeErrorResponse(error, 'Payment failed');
    }
});
