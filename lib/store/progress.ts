const PROGRESS_STORAGE_KEY = "gakuen_progress";

interface UserProgress {
    completedLessons: string[]; // lesson IDs
    courseProgress: Record<string, number>; // courseId -> percentage
    lastActivity: string;
}

export const progressStore = {
    // Get user progress
    getProgress(): UserProgress {
        try {
            const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
            if (!stored) {
                return {
                    completedLessons: [],
                    courseProgress: {},
                    lastActivity: new Date().toISOString(),
                };
            }
            return JSON.parse(stored);
        } catch {
            return {
                completedLessons: [],
                courseProgress: {},
                lastActivity: new Date().toISOString(),
            };
        }
    },

    // Mark lesson as complete
    completeLesson(lessonId: string, courseId: string, totalLessons: number): void {
        const progress = this.getProgress();

        if (!(progress.completedLessons || []).includes(lessonId)) {
            progress.completedLessons = progress.completedLessons || [];
            progress.completedLessons.push(lessonId);
        }

        // Calculate course progress
        const completedInCourse = (progress.completedLessons || []).filter(id =>
            id.startsWith(courseId)
        ).length;

        progress.courseProgress[courseId] = Math.round((completedInCourse / totalLessons) * 100);
        progress.lastActivity = new Date().toISOString();

        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    },

    // Check if lesson is completed
    isLessonCompleted(lessonId: string): boolean {
        const progress = this.getProgress();
        return (progress.completedLessons || []).includes(lessonId);
    },

    // Get course progress percentage
    getCourseProgress(courseId: string): number {
        const progress = this.getProgress();
        return progress.courseProgress[courseId] || 0;
    },

    // Clear all progress
    clearProgress(): void {
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
    },
};
