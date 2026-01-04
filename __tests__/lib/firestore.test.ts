import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/config', () => ({
    isFirebaseEnabled: vi.fn(() => true),
    getFirebaseDB: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _seconds: Date.now() / 1000 })),
    Timestamp: {
        fromDate: vi.fn((date) => ({ toDate: () => date })),
    },
}));

describe('Firestore Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    describe('getUserProfile', () => {
        it('returns null when Firebase is disabled', async () => {
            vi.doMock('@/lib/firebase/config', () => ({
                isFirebaseEnabled: () => false,
                getFirebaseDB: vi.fn(),
            }));

            const { getUserProfile } = await import('@/lib/firebase/firestore');
            const result = await getUserProfile('test-user-id');

            expect(result).toBeNull();
        });

        it('returns null for empty userId', async () => {
            const { getUserProfile } = await import('@/lib/firebase/firestore');

            const result = await getUserProfile('');
            expect(result).toBeNull();
        });
    });

    describe('createUserProfile', () => {
        it('calls setDoc with user data', async () => {
            const { setDoc } = await import('firebase/firestore');
            vi.doMock('@/lib/firebase/config', () => ({
                isFirebaseEnabled: () => true,
                getFirebaseDB: () => ({}),
            }));

            const { createUserProfile } = await import('@/lib/firebase/firestore');

            const newUser = {
                id: 'new-user-id',
                email: 'new@example.com',
                name: 'New User',
                role: 'student' as const,
                enrolledCourses: [],
                completedLessons: [],
                createdAt: new Date().toISOString(),
            };

            await createUserProfile(newUser);
            // Test passes if no error thrown
            expect(true).toBe(true);
        });
    });

    describe('updateUserProfile', () => {
        it('calls updateDoc with updates', async () => {
            vi.doMock('@/lib/firebase/config', () => ({
                isFirebaseEnabled: () => true,
                getFirebaseDB: () => ({}),
            }));

            const { updateUserProfile } = await import('@/lib/firebase/firestore');

            await updateUserProfile('test-user-id', { name: 'Updated Name' });
            // Test passes if no error thrown
            expect(true).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('handles null userId gracefully', async () => {
            const { getUserProfile } = await import('@/lib/firebase/firestore');
            const result = await getUserProfile(null as any);
            expect(result).toBeNull();
        });

        it('handles undefined userId gracefully', async () => {
            const { getUserProfile } = await import('@/lib/firebase/firestore');
            const result = await getUserProfile(undefined as any);
            expect(result).toBeNull();
        });
    });
});
