// Core type definitions - Re-exports and Course/Lesson types
// User comes from lib/types/user.ts (canonical source)

export type { User, UserSubscription } from "./types/user";

// LessonComponent is an alias for Component from CMS types for compatibility
export type { Component as LessonComponent } from "./cms/types";
import type { Component } from "./cms/types";

export interface Lesson {
    id: string;
    title: string;
    type: "video" | "article" | "quiz" | "assignment" | "image" | "cms";
    duration: string;
    content?: string;
    videoUrl?: string;
    imageUrl?: string;
    order: number;
    components?: Component[];
    tiptapJson?: object; // Raw Tiptap JSON for FluidEditor - preserves tables and complex content
}

// Section for organizing lessons into collapsible groups
export interface Section {
    id: string;
    title: string;
    lessonIds: string[];  // References to lesson IDs in this section
}

export interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    instructorAvatar?: string;  // Custom instructor profile image
    thumbnail: string;
    category: string;
    level: "beginner" | "intermediate" | "advanced";
    duration: string;
    lessonsCount: number;
    enrolledCount: number;
    rating: number;
    price: number;
    isFree?: boolean;
    lessons: Lesson[];
    sections?: Section[];  // Optional: hierarchical organization
    createdAt?: string;
    isPublished?: boolean;
    createdBy?: string;
    accessTier?: "free" | "basic" | "mid" | "pro";
    translations?: Record<string, CourseTranslation>;
}

export interface CourseTranslation {
    title: string;
    description: string;
    lessons: LessonTranslation[];
}

export interface LessonTranslation {
    id: string;
    title: string;
    content?: string;
}

