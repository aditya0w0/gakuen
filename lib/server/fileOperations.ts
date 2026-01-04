// Course storage operations using Firebase Firestore
// MIGRATED FROM LOCAL FILESYSTEM (fs) FOR VERCEL COMPATIBILITY

import { initAdmin } from '@/lib/auth/firebase-admin';
import { Course } from '@/lib/types';

/**
 * Get Firestore instance from Admin SDK
 */
function getAdminFirestore() {
    try {
        const admin = initAdmin();
        return admin.firestore();
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        return null;
    }
}

// Get course by ID
export async function getCourse(id: string): Promise<Course | null> {
    const db = getAdminFirestore();
    if (!db) {
        console.error('Firestore not available');
        return null;
    }

    try {
        const docRef = db.collection('courses').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        return { id, ...docSnap.data() } as Course;
    } catch (error) {
        console.error(`Error reading course ${id}:`, error);
        return null;
    }
}

// Save course
export async function saveCourse(id: string, course: Course): Promise<boolean> {
    const db = getAdminFirestore();
    if (!db) {
        console.error('Firestore not available');
        return false;
    }

    try {
        const { id: courseId, ...courseData } = course;
        await db.collection('courses').doc(id).set({
            ...courseData,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        return true;
    } catch (error) {
        console.error(`Error saving course ${id}:`, error);
        return false;
    }
}

// List all courses
export async function listCourses(): Promise<Course[]> {
    const db = getAdminFirestore();
    if (!db) {
        console.error('Firestore not available');
        return [];
    }

    try {
        const snapshot = await db.collection('courses').get();
        const courses: Course[] = [];

        snapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() } as Course);
        });

        return courses;
    } catch (error) {
        console.error('Error listing courses:', error);
        return [];
    }
}

// Delete course
export async function deleteCourse(id: string): Promise<boolean> {
    const db = getAdminFirestore();
    if (!db) {
        console.error('Firestore not available');
        return false;
    }

    try {
        await db.collection('courses').doc(id).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting course ${id}:`, error);
        return false;
    }
}

// Legacy function - no longer needed but kept for compatibility
export function ensureDataDir() {
    // No-op: Firestore doesn't need directory initialization
}
