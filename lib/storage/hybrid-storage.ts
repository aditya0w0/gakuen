// Hybrid storage: Auth operations with signup support
import { User } from "@/lib/types";
import { localCache } from "./local-cache";
import { syncManager } from "./sync-manager";
import { firebaseAuth } from "../firebase/auth";
import { isFirebaseEnabled } from "../firebase/config";
import { getFirebaseErrorMessage } from "../firebase/firebase-errors";

export const hybridStorage = {
    // Authentication
    auth: {
        async login(email: string, password: string): Promise<User> {
            if (!isFirebaseEnabled()) {
                throw new Error("Firebase is not configured. Please set up Firebase authentication.");
            }

            // 🔒 CLEAR existing session before new login (enforce single session)
            localCache.clear();
            if (typeof window !== 'undefined') {
                const { authCookies } = await import('../auth/cookies');
                authCookies.clear();
            }

            try {
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
            } catch (error) {
                throw new Error(getFirebaseErrorMessage(error));
            }
        },

        async signup(email: string, password: string, name: string): Promise<User> {
            if (!isFirebaseEnabled()) {
                throw new Error("Signup requires Firebase. Please enable Firebase in settings.");
            }

            try {
                const user = await firebaseAuth.signUp(email, password, name);

                // Set user immediately
                localCache.user.set(user);

                // Set cookie for middleware access (consistency with login)
                if (typeof window !== 'undefined') {
                    const { authCookies } = await import('../auth/cookies');
                    authCookies.set(user);
                }

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
            } catch (error) {
                throw new Error(getFirebaseErrorMessage(error));
            }
        },

        async signInWithGoogle(): Promise<User> {
            if (!isFirebaseEnabled()) {
                throw new Error("Google sign-in requires Firebase");
            }

            // 🔒 CLEAR existing session before new login (enforce single session)
            localCache.clear();
            if (typeof window !== 'undefined') {
                const { authCookies } = await import('../auth/cookies');
                authCookies.clear();
            }

            try {
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
                } catch {
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
            } catch (error) {
                throw new Error(getFirebaseErrorMessage(error));
            }
        },

        async logout(): Promise<void> {
            // Fire sync in background - don't block logout
            if (isFirebaseEnabled()) {
                syncManager.syncNow().catch(e => console.warn('Background sync on logout:', e));
            }

            // Clear immediately for instant logout
            localCache.clear();

            // Clear httpOnly cookie via API (fire and forget)
            fetch('/api/auth/clear-token', { method: 'POST' }).catch(() => { });

            // Clear client-side cookie
            if (typeof window !== 'undefined') {
                import('../auth/cookies').then(({ authCookies }) => {
                    authCookies.clear();
                });
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

            // Ensure completedLessons is an array (defensive check for corrupted Firebase data)
            progress.completedLessons = progress.completedLessons || [];
            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
            }

            if (forceProgress !== undefined) {
                progress.courseProgress[courseId] = forceProgress;
            } else {
                const completedInCourse = (progress.completedLessons || []).filter((id: string) =>
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
            return (progress.completedLessons || []).includes(lessonId);
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
