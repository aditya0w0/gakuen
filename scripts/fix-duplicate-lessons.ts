/**
 * Script to fix duplicate lesson IDs in courses
 * Run with: npx tsx scripts/fix-duplicate-lessons.ts
 */

import 'dotenv/config';
import { initAdmin } from '../lib/auth/firebase-admin';

async function fixDuplicateLessons() {
    console.log('🔧 Starting duplicate lesson fix...\n');

    const admin = initAdmin();
    const db = admin.firestore();

    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();

    let fixedCount = 0;

    for (const doc of coursesSnapshot.docs) {
        const course = doc.data();
        const courseId = doc.id;

        if (!course.lessons || !Array.isArray(course.lessons)) {
            continue;
        }

        // Track seen IDs
        const seenIds = new Set<string>();
        const originalLength = course.lessons.length;
        let hasDuplicates = false;

        // Fix duplicate IDs
        const fixedLessons = course.lessons.map((lesson: any, index: number) => {
            if (seenIds.has(lesson.id)) {
                // Generate new unique ID
                const newId = `${courseId}-lesson-${Date.now()}-${index}`;
                console.log(`  📝 Fixing duplicate: "${lesson.id}" -> "${newId}" (${lesson.title})`);
                hasDuplicates = true;
                seenIds.add(newId);
                return { ...lesson, id: newId };
            }
            seenIds.add(lesson.id);
            return lesson;
        });

        if (hasDuplicates) {
            console.log(`\n🔄 Updating course: ${courseId}`);

            // Update the course
            await db.collection('courses').doc(courseId).update({
                lessons: fixedLessons,
                updatedAt: new Date().toISOString(),
            });

            console.log(`✅ Fixed ${course.lessons.length - new Set(course.lessons.map((l: any) => l.id)).size} duplicate(s)\n`);
            fixedCount++;
        }
    }

    if (fixedCount === 0) {
        console.log('✨ No duplicate lesson IDs found!');
    } else {
        console.log(`\n🎉 Fixed ${fixedCount} course(s) with duplicate lessons`);
    }
}

fixDuplicateLessons()
    .then(() => {
        console.log('\n✅ Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
