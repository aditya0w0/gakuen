import { Course } from '@/lib/types';

// Fetch course by ID
export async function fetchCourse(id: string): Promise<Course | null> {
    try {
        const response = await fetch(`/api/courses/${id}`, { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching course ${id}:`, error);
        return null;
    }
}

// Update course
export async function updateCourse(id: string, course: Course): Promise<boolean> {
    try {
        const response = await fetch(`/api/courses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(course),
            credentials: 'include', // Send auth cookies
            cache: 'no-store',
        });
        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ Failed to save course ${id}: ${response.status}`, text);
        } else {
            console.log(`✅ Course ${id} saved successfully`);
        }
        return response.ok;
    } catch (error) {
        console.error(`Error updating course ${id}:`, error);
        return false;
    }
}

// Fetch all courses
export async function fetchAllCourses(): Promise<Course[]> {
    try {
        const response = await fetch('/api/courses', { cache: 'no-store' });
        if (!response.ok) {
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
}
