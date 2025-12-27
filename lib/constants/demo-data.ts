// Production-quality demo data structure
import { Component } from "../cms/types";
import { DEMO_LESSON_COMPONENTS } from "./demo-components";

export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
    avatar?: string;
    enrolledCourses: string[];
    completedLessons: string[];
    createdAt: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    thumbnail: string;
    category: string;
    level: "beginner" | "intermediate" | "advanced";
    duration: string; // e.g., "24 hours"
    lessonsCount: number;
    enrolledCount: number;
    rating: number;
    price: number;
    lessons: Lesson[];
    isPublished?: boolean;
    publishedAt?: string;
    createdAt?: string;
}

export interface Lesson {
    id: string;
    title: string;
    type: "article" | "image" | "cms";
    duration: string; // e.g., "10 min"
    content: string;
    imageUrl?: string;
    order: number;
    components?: Component[]; // New CMS components
}

// Demo Users
export const DEMO_USERS: User[] = [
    {
        id: "admin-001",
        name: "Alex Chen",
        email: "admin@gakuen.edu",
        role: "admin",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        enrolledCourses: [],
        completedLessons: [],
        createdAt: "2024-01-15T10:00:00Z",
    },
    {
        id: "user-001",
        name: "Yuki Tanaka",
        email: "student@gakuen.edu",
        role: "user",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki",
        enrolledCourses: ["cs-101", "web-202"],
        completedLessons: ["cs-101-l1", "cs-101-l2", "web-202-l1"],
        createdAt: "2024-02-01T08:30:00Z",
    },
];

// Demo Courses
export const DEMO_COURSES: Course[] = [
    {
        id: "cs-101",
        title: "Introduction to Computer Science",
        description: "Master the fundamentals of programming, algorithms, and data structures. Perfect for beginners starting their coding journey.",
        instructor: "Dr. Sarah Martinez",
        thumbnail: "https://picsum.photos/seed/cs101/800/600",
        category: "Computer Science",
        level: "beginner",
        duration: "20 hours",
        lessonsCount: 12,
        enrolledCount: 1247,
        rating: 4.8,
        price: 49.99,
        lessons: [
            {
                id: "cs-101-l1",
                title: "What is an Algorithm?",
                type: "article",
                duration: "8 min",
                order: 1,
                content: `# Understanding Algorithms

An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. Think of it as a recipe in cooking—you follow specific instructions in a particular order to achieve your desired result.

## Key Characteristics of Algorithms

### 1. Well-Defined Inputs and Outputs
Every algorithm must clearly specify what data it accepts and what results it produces.

### 2. Finiteness
An algorithm must terminate after a finite number of steps. Infinite loops are not algorithms!

### 3. Effectiveness
Each step must be basic enough to be carried out, in principle, by a person using paper and pencil.

## Real-World Example

Consider finding the largest number in a list:

1. Start with the first number as the "current maximum"
2. Compare each subsequent number with the current maximum
3. If a number is larger, make it the new maximum
4. After checking all numbers, the current maximum is our answer

This simple process demonstrates all three characteristics: clear input/output, finite steps, and executable steps.

## Why Algorithms Matter

In computer science, algorithms form the foundation of efficient programming. Understanding how to design and analyze algorithms helps you:

- Write faster, more efficient code
- Solve complex problems systematically
- Optimize resource usage
- Make better architectural decisions

> **Next Steps**: In the following lessons, we'll explore different types of algorithms, analyze their efficiency, and learn how to choose the right algorithm for specific problems.`,
                components: DEMO_LESSON_COMPONENTS,
            },
            {
                id: "cs-101-l2",
                title: "Algorithm Complexity Visualization",
                type: "image",
                duration: "5 min",
                order: 2,
                imageUrl: "https://picsum.photos/seed/complexity/1200/800",
                content: "Study this visualization showing how different algorithm time complexities (O(1), O(n), O(n²), O(log n)) behave as input size increases. Understanding Big O notation is crucial for writing efficient code.",
            },
            {
                id: "cs-101-l3",
                title: "Data Structures Fundamentals",
                type: "article",
                duration: "12 min",
                order: 3,
                content: `# Introduction to Data Structures

Data structures are ways of organizing and storing data so that operations can be performed efficiently. Choosing the right data structure is as important as choosing the right algorithm.

## Common Data Structures

### Arrays
- Sequential collection of elements
- Fast access by index
- Fixed or dynamic size

### Linked Lists
- Elements connected by pointers
- Dynamic size
- Efficient insertions/deletions

### Stacks & Queues
- Specialized linear structures
- LIFO (Last In First Out) for stacks
- FIFO (First In First Out) for queues

Understanding these fundamentals will prepare you for more advanced structures like trees and graphs.`,
            },
        ],
    },
    {
        id: "web-202",
        title: "Modern Web Development with React",
        description: "Build production-ready web applications using React, Next.js, and cutting-edge frontend technologies.",
        instructor: "Marcus Johnson",
        thumbnail: "https://picsum.photos/seed/web202/800/600",
        category: "Web Development",
        level: "intermediate",
        duration: "32 hours",
        lessonsCount: 24,
        enrolledCount: 892,
        rating: 4.9,
        price: 79.99,
        lessons: [
            {
                id: "web-202-l1",
                title: "React Component Architecture",
                type: "article",
                duration: "10 min",
                order: 1,
                content: `# React Component Architecture

React's component-based architecture revolutionized how we build user interfaces. Let's explore best practices for structuring your React applications.

## Component Types

### Presentational Components
Focus purely on how things look. They receive data through props and rarely have their own state.

### Container Components
Focus on how things work. They provide data and behavior to presentational components.

## Best Practices

1. **Single Responsibility**: Each component should do one thing well
2. **Composition Over Inheritance**: Build complex UIs from simple components
3. **Props Down, Events Up**: Data flows down, events flow up
4. **Keep Components Pure**: Same props should always render the same output

By following these principles, you'll build maintainable and scalable applications.`,
            },
        ],
    },
    {
        id: "py-300",
        title: "Python for Data Science",
        description: "Learn data analysis, visualization, and machine learning basics using Python, Pandas, and scikit-learn.",
        instructor: "Dr. Emily Zhang",
        thumbnail: "https://picsum.photos/seed/py300/800/600",
        category: "Data Science",
        level: "intermediate",
        duration: "28 hours",
        lessonsCount: 18,
        enrolledCount: 654,
        rating: 4.7,
        price: 69.99,
        lessons: [],
    },
    {
        id: "des-101",
        title: "UI/UX Design Principles",
        description: "Master the art of creating beautiful, user-friendly interfaces. Learn design thinking, wireframing, and prototyping.",
        instructor: "Sofia Rodriguez",
        thumbnail: "https://picsum.photos/seed/des101/800/600",
        category: "Design",
        level: "beginner",
        duration: "16 hours",
        lessonsCount: 15,
        enrolledCount: 423,
        rating: 4.6,
        price: 39.99,
        lessons: [],
    },
];
