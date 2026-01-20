/**
 * Migrate existing enrollment/review data to course_stats collection
 * 
 * Run this ONCE to populate initial stats from legacy data.
 * After this, stats are updated incrementally on each enrollment/review.
 */

import { initAdmin } from '@/lib/auth/firebase-admin';

export async function migrateCourseStats() {
    const { firestore, FieldValue } = initAdmin();
    const db = firestore();

    console.log('🔄 [Migration] Starting course stats migration...');

    try {
        // Step 1: Count enrollments from users collection
        const usersSnap = await db.collection('users').get();
        const enrollmentCounts: Record<string, number> = {};

        usersSnap.forEach(doc => {
            const data = doc.data();
            const enrolledCourses = data.enrolledCourses || [];
            enrolledCourses.forEach((courseId: string) => {
                enrollmentCounts[courseId] = (enrollmentCounts[courseId] || 0) + 1;
            });
        });

        console.log(`📊 Found ${Object.keys(enrollmentCounts).length} courses with enrollments`);

        // Step 2: Aggregate ratings from reviews collection
        const reviewsSnap = await db.collection('reviews').get();
        const courseRatings: Record<string, { sum: number; count: number }> = {};

        reviewsSnap.forEach(doc => {
            const data = doc.data();
            const { courseId, rating } = data;
            if (courseId && typeof rating === 'number') {
                if (!courseRatings[courseId]) {
                    courseRatings[courseId] = { sum: 0, count: 0 };
                }
                courseRatings[courseId].sum += rating;
                courseRatings[courseId].count += 1;
            }
        });

        console.log(`⭐ Found ${Object.keys(courseRatings).length} courses with reviews`);

        // Step 3: Write to course_stats collection
        const batch = db.batch();
        const allCourseIds = new Set([
            ...Object.keys(enrollmentCounts),
            ...Object.keys(courseRatings)
        ]);

        for (const courseId of allCourseIds) {
            const statsRef = db.collection('course_stats').doc(courseId);
            const statsData: Record<string, unknown> = {
                migratedAt: new Date().toISOString(),
            };

            if (enrollmentCounts[courseId]) {
                statsData.enrolledCount = enrollmentCounts[courseId];
            }

            if (courseRatings[courseId]) {
                statsData.ratingSum = courseRatings[courseId].sum;
                statsData.ratingCount = courseRatings[courseId].count;
            }

            batch.set(statsRef, statsData, { merge: true });
        }

        await batch.commit();

        console.log(`✅ [Migration] Migrated ${allCourseIds.size} courses to course_stats`);

        return {
            success: true,
            coursesProcessed: allCourseIds.size,
            enrollmentCounts,
            courseRatings,
        };
    } catch (error) {
        console.error('❌ [Migration] Failed:', error);
        throw error;
    }
}
