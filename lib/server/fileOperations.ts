import fs from 'fs';
import path from 'path';
import { Course } from '@/lib/constants/demo-data';

const DATA_DIR = path.join(process.cwd(), 'data', 'courses');

// Ensure data directory exists
export function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// Get course by ID
export async function getCourse(id: string): Promise<Course | null> {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data) as Course;
    } catch (error) {
        console.error(`Error reading course ${id}:`, error);
        return null;
    }
}

// Save course
export async function saveCourse(id: string, course: Course): Promise<boolean> {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `${id}.json`);

    try {
        fs.writeFileSync(filePath, JSON.stringify(course, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error(`Error saving course ${id}:`, error);
        return false;
    }
}

// List all courses
export async function listCourses(): Promise<Course[]> {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const courses: Course[] = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const id = file.replace('.json', '');
                const course = await getCourse(id);
                if (course) {
                    courses.push(course);
                }
            }
        }

        return courses;
    } catch (error) {
        console.error('Error listing courses:', error);
        return [];
    }
}

// Delete course
export async function deleteCourse(id: string): Promise<boolean> {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `${id}.json`);

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error deleting course ${id}:`, error);
        return false;
    }
}
