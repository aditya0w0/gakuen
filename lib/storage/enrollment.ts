// Enrollment management for courses
import { hybridStorage } from "./hybrid-storage";
import { localCache } from "./local-cache";

export interface EnrollmentResult {
    success: boolean;
    error?: string;
    alreadyEnrolled?: boolean;
}

export const enrollmentManager = {
    async enrollInCourse(userId: string, courseId: string): Promise<EnrollmentResult> {
        try {
            // Validate inputs
            if (!userId || !courseId) {
                return { success: false, error: "Invalid user or course ID" };
            }

            // Get current user from cache
            const user = hybridStorage.auth.getSession();
            if (!user) {
                return { success: false, error: "User not authenticated" };
            }

            // Check if already enrolled
            if (user.enrolledCourses?.includes(courseId)) {
                return { success: true, alreadyEnrolled: true };
            }

            // Update enrolled courses
            const updatedCourses = [...(user.enrolledCourses || []), courseId];
            const updatedUser = { ...user, enrolledCourses: updatedCourses };

            // Update local cache immediately
            localCache.user.set(updatedUser);

            // Sync to Firebase if enabled
            await hybridStorage.profile.update(userId, { enrolledCourses: updatedCourses });
            
            return { success: true };
        } catch (error) {
            console.error("Enrollment error:", error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : "Enrollment failed" 
            };
        }
    },

    async unenrollFromCourse(userId: string, courseId: string): Promise<EnrollmentResult> {
        try {
            // Validate inputs
            if (!userId || !courseId) {
                return { success: false, error: "Invalid user or course ID" };
            }

            const user = hybridStorage.auth.getSession();
            if (!user) {
                return { success: false, error: "User not authenticated" };
            }

            // Remove from enrolled courses
            const updatedCourses = (user.enrolledCourses || []).filter(id => id !== courseId);
            const updatedUser = { ...user, enrolledCourses: updatedCourses };

            // Update local cache
            localCache.user.set(updatedUser);

            // Sync to Firebase
            await hybridStorage.profile.update(userId, { enrolledCourses: updatedCourses });
            
            return { success: true };
        } catch (error) {
            console.error("Unenrollment error:", error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : "Unenrollment failed" 
            };
        }
    },

    isEnrolled(courseId: string): boolean {
        const user = hybridStorage.auth.getSession();
        return user?.enrolledCourses?.includes(courseId) || false;
    },
};
