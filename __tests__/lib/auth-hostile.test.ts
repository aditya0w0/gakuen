import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authStore } from '@/lib/store/auth';

describe('authStore - Hostile QA Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (window.localStorage.getItem as any).mockReturnValue(null);
        (window.localStorage.setItem as any).mockClear();
        (window.localStorage.removeItem as any).mockClear();
    });

    describe('getSession - null/undefined/garbage inputs', () => {
        it('localStorage returns null', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(null);
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns undefined', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(undefined);
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns empty string', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns whitespace only', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('   \n\t  ');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns "null" string', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('null');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns "undefined" string', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('undefined');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns invalid JSON', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('{not valid json');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns JSON array instead of object', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('[1,2,3]');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns number as string', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('12345');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns boolean as string', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce('true');
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns object without user field', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({ expiresAt: '2099-01-01' }));
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns object without expiresAt field', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({ user: { id: '1' } }));
            expect(() => authStore.getSession()).not.toThrow();
        });

        it('localStorage returns object with null user', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({ user: null, expiresAt: '2099-01-01' }));
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns object with empty user', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({ user: {}, expiresAt: '2099-01-01' }));
            expect(authStore.getSession()).toEqual({});
        });

        it('localStorage returns malformed date', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({ user: { id: '1' }, expiresAt: 'not-a-date' }));
            expect(() => authStore.getSession()).not.toThrow();
        });

        it('localStorage returns epoch zero', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({ user: { id: '1' }, expiresAt: '1970-01-01T00:00:00.000Z' }));
            expect(authStore.getSession()).toBeNull();
        });

        it('localStorage returns future date year 9999', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({ user: { id: '1' }, expiresAt: '9999-12-31T23:59:59.999Z' }));
            expect(authStore.getSession()).toEqual({ id: '1' });
        });

        it('localStorage throws on getItem', () => {
            (window.localStorage.getItem as any).mockImplementationOnce(() => { throw new Error('QuotaExceeded'); });
            expect(authStore.getSession()).toBeNull();
        });
    });

    describe('setSession - null/undefined/garbage inputs', () => {
        it('setSession with null user', () => {
            expect(() => authStore.setSession(null as any)).not.toThrow();
        });

        it('setSession with undefined user', () => {
            expect(() => authStore.setSession(undefined as any)).not.toThrow();
        });

        it('setSession with empty object', () => {
            authStore.setSession({} as any);
            expect(window.localStorage.setItem).toHaveBeenCalled();
        });

        it('setSession with string instead of object', () => {
            expect(() => authStore.setSession('not-a-user' as any)).not.toThrow();
        });

        it('setSession with number instead of object', () => {
            expect(() => authStore.setSession(12345 as any)).not.toThrow();
        });

        it('setSession with array instead of object', () => {
            expect(() => authStore.setSession([1, 2, 3] as any)).not.toThrow();
        });

        it('setSession with circular reference throws', () => {
            const circular: any = { id: '1' };
            circular.self = circular;
            expect(() => authStore.setSession(circular)).toThrow();
        });

        it('localStorage.setItem throws', () => {
            (window.localStorage.setItem as any).mockImplementationOnce(() => { throw new Error('QuotaExceeded'); });
            expect(() => authStore.setSession({ id: '1' } as any)).toThrow();
        });

        it('setSession called 100 times rapidly', () => {
            for (let i = 0; i < 100; i++) {
                authStore.setSession({ id: `user-${i}` } as any);
            }
            expect(window.localStorage.setItem).toHaveBeenCalledTimes(100);
        });
    });

    describe('clearSession - edge cases', () => {
        it('clearSession when nothing stored', () => {
            expect(() => authStore.clearSession()).not.toThrow();
        });

        it('clearSession called twice', () => {
            authStore.clearSession();
            authStore.clearSession();
            expect(window.localStorage.removeItem).toHaveBeenCalledTimes(2);
        });

        it('clearSession when localStorage throws', () => {
            (window.localStorage.removeItem as any).mockImplementationOnce(() => { throw new Error('PermissionDenied'); });
            expect(() => authStore.clearSession()).toThrow();
        });
    });

    describe('isAuthenticated - edge cases', () => {
        it('isAuthenticated returns false when empty', () => {
            expect(authStore.isAuthenticated()).toBe(false);
        });

        it('isAuthenticated returns true with valid session', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({
                user: { id: '1' },
                expiresAt: new Date(Date.now() + 86400000).toISOString()
            }));
            expect(authStore.isAuthenticated()).toBe(true);
        });

        it('isAuthenticated returns false with expired session', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({
                user: { id: '1' },
                expiresAt: '2020-01-01T00:00:00.000Z'
            }));
            expect(authStore.isAuthenticated()).toBe(false);
        });

        it('isAuthenticated called 100 times', () => {
            for (let i = 0; i < 100; i++) {
                authStore.isAuthenticated();
            }
            expect(window.localStorage.getItem).toHaveBeenCalled();
        });
    });

    describe('race conditions and re-entrancy', () => {
        it('setSession during getSession', async () => {
            const promises = [
                Promise.resolve().then(() => authStore.setSession({ id: '1' } as any)),
                Promise.resolve().then(() => authStore.getSession()),
                Promise.resolve().then(() => authStore.setSession({ id: '2' } as any)),
                Promise.resolve().then(() => authStore.getSession()),
            ];
            await Promise.all(promises);
            expect(window.localStorage.setItem).toHaveBeenCalled();
        });

        it('clearSession during setSession', async () => {
            const promises = [
                Promise.resolve().then(() => authStore.setSession({ id: '1' } as any)),
                Promise.resolve().then(() => authStore.clearSession()),
            ];
            await Promise.all(promises);
        });

        it('multiple rapid auth state changes', () => {
            for (let i = 0; i < 50; i++) {
                authStore.setSession({ id: `${i}` } as any);
                authStore.getSession();
                authStore.isAuthenticated();
                if (i % 10 === 0) authStore.clearSession();
            }
        });
    });

    describe('prototype pollution and injection', () => {
        it('user with __proto__ field', () => {
            expect(() => authStore.setSession({ __proto__: { admin: true } } as any)).not.toThrow();
        });

        it('user with constructor field', () => {
            expect(() => authStore.setSession({ constructor: { name: 'Evil' } } as any)).not.toThrow();
        });

        it('expiresAt as object instead of string', () => {
            (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify({
                user: { id: '1' },
                expiresAt: { year: 2099 }
            }));
            expect(() => authStore.getSession()).not.toThrow();
        });
    });

    describe('extremely large inputs', () => {
        it('user object with 1000 properties', () => {
            const bigUser: any = { id: '1' };
            for (let i = 0; i < 1000; i++) {
                bigUser[`prop${i}`] = `value${i}`;
            }
            expect(() => authStore.setSession(bigUser)).not.toThrow();
        });

        it('user id with 10KB string', () => {
            const bigId = 'x'.repeat(10 * 1024);
            expect(() => authStore.setSession({ id: bigId } as any)).not.toThrow();
        });

        it('deeply nested user object', () => {
            let nested: any = { id: '1' };
            for (let i = 0; i < 50; i++) {
                nested = { child: nested };
            }
            expect(() => authStore.setSession(nested)).not.toThrow();
        });
    });
});
