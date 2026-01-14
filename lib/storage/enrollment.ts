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

            // Sync to Firebase IMMEDIATELY (not debounced) via API
            // This ensures refreshUser() gets the updated data
            try {
                const response = await fetch('/api/user/enroll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    console.error('Enrollment API error:', data.error);
                    // Revert local cache on failure
                    localCache.user.set(user);
                    return { success: false, error: data.error || 'Failed to enroll' };
                }
            } catch (apiError) {
                console.error('Enrollment API request failed:', apiError);
                // Keep local cache updated even if API fails (offline support)
            }

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
