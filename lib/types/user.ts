/**
 * User type definition for the application
 * This is the source of truth for the User interface
 */

export interface UserSubscription {
    tier: "free" | "basic" | "mid" | "pro";
    status: "active" | "cancelled" | "expired";
    startDate?: string;
    endDate?: string;
}

export interface User {
    // Core fields
    id: string;
    username?: string; // Unique username for profile URL (@username)
    name: string; // Display name
    email: string;
    role: "admin" | "student";  // 'user' is legacy, use 'student'
    avatar?: string;

    // Course progress
    enrolledCourses?: string[];
    completedLessons?: string[];

    // Subscription
    subscription?: UserSubscription;

    // Metadata
    createdAt?: string;
    updatedAt?: string;

    // Profile fields
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string; // ISO date string
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    bio?: string;

    // Address
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };

    // Social links
    socialLinks?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
        website?: string;
    };

    // Preferences
    education?: string;
    preferredLanguage?: string;
    timezone?: string;

    // Allow additional properties for flexibility
    [key: string]: unknown;
}

