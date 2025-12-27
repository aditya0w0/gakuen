// Hybrid storage: Auth operations with signup support
import { User } from "../constants/demo-data";
import { localCache } from "./local-cache";
import { syncManager } from "./sync-manager";
import { firebaseAuth } from "../firebase/auth";
import { isFirebaseEnabled } from "../firebase/config";

export const hybridStorage = {
    // Authentication
    auth: {
        async login(email: string, password: string): Promise<User> {
            if (!isFirebaseEnabled()) {
                throw new Error("Firebase is not configured. Please set up Firebase authentication.");
            }

            const user = await firebaseAuth.signIn(email, password);
            if (user) {
                localCache.user.set(user);

                // Set cookie for middleware access
                if (typeof window !== 'undefined') {
                    const { authCookies } = await import('../auth/cookies');
                    authCookies.set(user);
                }

                await syncManager.pullProgress(user.id);
                return user;
            }
            throw new Error("Login failed");
        },

        async signup(email: string, password: string, name: string): Promise<User> {
            if (isFirebaseEnabled()) {
                const user = await firebaseAuth.signUp(email, password, name);

                // Set user immediately
                localCache.user.set(user);

                // Initialize empty progress (don't pull - new user has none)
                const emptyProgress = {
                    completedLessons: [],
                    courseProgress: {},
                    totalHours: 0,
                    currentStreak: 0,
                    lastActivity: new Date().toISOString(),
                };
                localCache.progress.set(emptyProgress);

                return user;
            }

            // Local signup not supported - need Firebase
            throw new Error("Signup requires Firebase. Please enable Firebase in settings.");
        },

        async signInWithGoogle(): Promise<User> {
            if (!isFirebaseEnabled()) {
                throw new Error("Google sign-in requires Firebase");
            }

            const user = await firebaseAuth.signInWithGoogle();
            if (!user) {
                throw new Error("Google sign-in failed");
            }

            localCache.user.set(user);

            // Set cookie for middleware access
            if (typeof window !== 'undefined') {
                const { authCookies } = await import('../auth/cookies');
                authCookies.set(user);
            }

            // Try to pull progress, but don't fail if it doesn't exist
            try {
                await syncManager.pullProgress(user.id);
            } catch (error) {
                // First-time Google user - initialize empty progress
                const emptyProgress = {
                    completedLessons: [],
                    courseProgress: {},
                    totalHours: 0,
                    currentStreak: 0,
                    lastActivity: new Date().toISOString(),
                };
                localCache.progress.set(emptyProgress);
            }

            return user;
        },

        async logout(): Promise<void> {
            await syncManager.syncNow();
            localCache.clear();

            // Clear httpOnly cookie via API
            try {
                await fetch('/api/auth/clear-token', { method: 'POST' });
            } catch (error) {
                console.error('Failed to clear token cookie:', error);
            }

            // Clear client-side cookie (legacy)
            if (typeof window !== 'undefined') {
                const { authCookies } = await import('../auth/cookies');
                authCookies.clear();
            }

            if (isFirebaseEnabled()) {
                await firebaseAuth.signOut();
            }

            syncManager.cleanup();
        },

        getSession(): User | null {
            return localCache.user.get() as User | null;
        },
    },

    // Progress tracking
    progress: {
        get(): any {
            const cached = localCache.progress.get();
            if (cached) return cached;

            return {
                completedLessons: [],
                courseProgress: {},
                totalHours: 0,
                currentStreak: 0,
                lastActivity: new Date().toISOString(),
                totalTimeMs: 0,
            };
        },

        completeLesson(userId: string, lessonId: string, courseId: string, totalLessons: number, forceProgress?: number): void {
            const progress = this.get();

            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
            }

            if (forceProgress !== undefined) {
                progress.courseProgress[courseId] = forceProgress;
            } else {
                const completedInCourse = progress.completedLessons.filter((id: string) =>
                    id.toLowerCase().startsWith(courseId.toLowerCase())
                ).length;

                const validTotal = Math.max(1, totalLessons);
                progress.courseProgress[courseId] = Math.round((completedInCourse / validTotal) * 100);
            }
            progress.lastActivity = new Date().toISOString();

            localCache.progress.set(progress);

            if (isFirebaseEnabled()) {
                syncManager.scheduleSync({
                    type: "progress",
                    userId,
                    data: progress,
                    timestamp: Date.now(),
                });
            }
        },

        isLessonCompleted(lessonId: string): boolean {
            const progress = this.get();
            return progress.completedLessons.includes(lessonId);
        },

        getCourseProgress(courseId: string): number {
            const progress = this.get();
            return progress.courseProgress[courseId] || 0;
        },

        trackTime(userId: string, ms: number): void {
            const progress = this.get();

            progress.totalTimeMs = (progress.totalTimeMs || 0) + ms;
            // Update totalHours for backward compatibility/display
            progress.totalHours = Math.round((progress.totalTimeMs / (1000 * 60 * 60)) * 10) / 10;

            progress.lastActivity = new Date().toISOString();

            localCache.progress.set(progress);

            if (isFirebaseEnabled()) {
                syncManager.scheduleSync({
                    type: "progress",
                    userId,
                    data: progress,
                    timestamp: Date.now(),
                });
            }
        },
    },

    // User profile
    profile: {
        async update(userId: string, updates: Partial<User>): Promise<void> {
            const user = localCache.user.get();
            if (user) {
                const updated = { ...user, ...updates };
                localCache.user.set(updated);
            }

            if (isFirebaseEnabled()) {
                syncManager.scheduleSync({
                    type: "profile",
                    userId,
                    data: updates,
                    timestamp: Date.now(),
                });
            }
        },
    },
};
