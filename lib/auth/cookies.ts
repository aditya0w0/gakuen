import { User } from "@/lib/types";
import { logger } from "@/lib/logger";

/**
 * Cookie-based session management for server-side middleware access
 * Works alongside localStorage for client-side speed
 */
export const authCookies = {
    /**
     * Set user session cookie (client-side)
     * Cookie is accessible by middleware for route protection
     */
    set(user: User): void {
        const sessionData = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        };

        // Set cookie with 7-day expiry
        document.cookie = `user-session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;

        logger.info('Session cookie set', { email: user.email }, 'authCookies');
    },

    /**
     * Clear user session cookie
     */
    clear(): void {
        document.cookie = 'user-session=; path=/; max-age=0';
        logger.info('Session cookie cleared', null, 'authCookies');
    },

    /**
     * Get user from cookie (client-side read)
     * Note: Middleware reads cookies server-side
     */
    get(): User | null {
        if (typeof document === 'undefined') return null;

        const cookies = document.cookie.split('; ');
        const sessionCookie = cookies.find(c => c.startsWith('user-session='));

        if (!sessionCookie) return null;

        try {
            const value = sessionCookie.split('=')[1];
            const decoded = decodeURIComponent(value);
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Failed to parse session cookie:', error);
            return null;
        }
    }
};
