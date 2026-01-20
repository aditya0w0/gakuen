/**
 * Course Storage Operations
 * 
 * This file re-exports from the new Telegram-based storage layer.
 * Maintains backward compatibility with existing API routes.
 * 
 * Storage priority:
 * 1. Telegram (immutable blobs, free, fast CDN)
 * 2. GDrive (fallback if Telegram fails)
 * 3. Legacy Firestore (for old courses during migration)
 */

export {
    getCourse,
    getPublishedCourse,
    saveCourse,
    listCourses,
    deleteCourse,
    ensureDataDir
} from '@/lib/storage/course-storage';
