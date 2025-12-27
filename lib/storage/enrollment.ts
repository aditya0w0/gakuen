// Enrollment management for courses
import { hybridStorage } from "./hybrid-storage";
import { localCache } from "./local-cache";

export const enrollmentManager = {
    async enrollInCourse(userId: string, courseId: string): Promise<void> {
        // Get current user from cache
        const user = hybridStorage.auth.getSession();
        if (!user) throw new Error("User not authenticated");

        // Check if already enrolled
        if (user.enrolledCourses?.includes(courseId)) {
            return; // Already enrolled
        }

        // Update enrolled courses
        const updatedCourses = [...(user.enrolledCourses || []), courseId];
        const updatedUser = { ...user, enrolledCourses: updatedCourses };

        // Update local cache immediately
        localCache.user.set(updatedUser);

        // Sync to Firebase if enabled
        await hybridStorage.profile.update(userId, { enrolledCourses: updatedCourses });
    },

    async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
        const user = hybridStorage.auth.getSession();
        if (!user) throw new Error("User not authenticated");

        // Remove from enrolled courses
        const updatedCourses = (user.enrolledCourses || []).filter(id => id !== courseId);
        const updatedUser = { ...user, enrolledCourses: updatedCourses };

        // Update local cache
        localCache.user.set(updatedUser);

        // Sync to Firebase
        await hybridStorage.profile.update(userId, { enrolledCourses: updatedCourses });
    },

    isEnrolled(courseId: string): boolean {
        const user = hybridStorage.auth.getSession();
        return user?.enrolledCourses?.includes(courseId) || false;
    },
};
