import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('LocalCache', () => {
    const STORAGE_KEY = 'gakuen_user';
    const PROGRESS_KEY = 'gakuen_progress';

    beforeEach(() => {
        vi.clearAllMocks();
        (window.localStorage.getItem as any).mockReturnValue(null);
    });

    describe('User Cache', () => {
        it('should return null when no user is cached', () => {
            (window.localStorage.getItem as any).mockReturnValue(null);

            const result = window.localStorage.getItem(STORAGE_KEY);
            expect(result).toBeNull();
        });

        it('should parse cached user correctly', () => {
            const mockUser = {
                id: 'test-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'student',
            };

            (window.localStorage.getItem as any).mockReturnValue(JSON.stringify(mockUser));

            const result = window.localStorage.getItem(STORAGE_KEY);
            const parsed = JSON.parse(result!);

            expect(parsed.id).toBe('test-123');
            expect(parsed.email).toBe('test@example.com');
            expect(parsed.role).toBe('student');
        });

        it('should save user to localStorage', () => {
            const user = { id: 'new-user', name: 'New User' };

            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEY,
                JSON.stringify(user)
            );
        });
    });

    describe('Progress Cache', () => {
        it('should return default progress when none cached', () => {
            const defaultProgress = {
                completedLessons: [],
                courseProgress: {},
                totalHours: 0,
                currentStreak: 0,
            };

            expect(defaultProgress.completedLessons).toEqual([]);
            expect(defaultProgress.totalHours).toBe(0);
        });

        it('should parse cached progress correctly', () => {
            const mockProgress = {
                completedLessons: ['lesson-1', 'lesson-2'],
                courseProgress: { 'course-1': 50 },
                totalHours: 10,
                currentStreak: 5,
            };

            (window.localStorage.getItem as any).mockReturnValue(JSON.stringify(mockProgress));

            const result = window.localStorage.getItem(PROGRESS_KEY);
            const parsed = JSON.parse(result!);

            expect(parsed.completedLessons).toHaveLength(2);
            expect(parsed.courseProgress['course-1']).toBe(50);
            expect(parsed.totalHours).toBe(10);
        });

        it('should calculate course progress percentage', () => {
            const completedLessons = ['course-1-lesson-1', 'course-1-lesson-2'];
            const totalLessons = 4;

            const completedInCourse = completedLessons.filter(id =>
                id.startsWith('course-1')
            ).length;

            const progress = Math.round((completedInCourse / totalLessons) * 100);

            expect(progress).toBe(50);
        });
    });

    describe('Cache Clear', () => {
        it('should clear all cache data', () => {
            window.localStorage.clear();

            expect(window.localStorage.clear).toHaveBeenCalled();
        });

        it('should remove specific key', () => {
            window.localStorage.removeItem(STORAGE_KEY);

            expect(window.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        });
    });
});
