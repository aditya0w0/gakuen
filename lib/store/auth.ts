import { User } from "../constants/demo-data";

const AUTH_STORAGE_KEY = "gakuen_auth";
const SESSION_EXPIRY_HOURS = 24;

interface AuthSession {
    user: User;
    expiresAt: string;
}

export const authStore = {
    // Get current session
    getSession(): User | null {
        try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY);
            if (!stored) return null;

            const session: AuthSession = JSON.parse(stored);

            // Check if session expired
            if (new Date(session.expiresAt) < new Date()) {
                this.clearSession();
                return null;
            }

            return session.user;
        } catch {
            return null;
        }
    },

    // Set new session
    setSession(user: User): void {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);

        const session: AuthSession = {
            user,
            expiresAt: expiresAt.toISOString(),
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    },

    // Clear session
    clearSession(): void {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.getSession() !== null;
    },
};
