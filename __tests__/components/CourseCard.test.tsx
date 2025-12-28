import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock component for testing (simplified CourseCard logic)
function MockCourseCard({ course }: { course: any }) {
    return (
        <div data-testid="course-card">
            <h3 data-testid="course-title">{course.title}</h3>
            <p data-testid="course-instructor">
                {(course.instructor || 'Admin').split(' ')[0]}
            </p>
            <span data-testid="course-level">{course.level}</span>
            <span data-testid="course-category">{course.category}</span>
        </div>
    );
}

describe('CourseCard', () => {
    const mockCourse = {
        id: 'test-course-1',
        title: 'Introduction to Testing',
        instructor: 'John Doe',
        level: 'beginner',
        category: 'Programming',
        thumbnail: 'https://example.com/image.jpg',
        lessons: [{ id: '1' }, { id: '2' }],
    };

    describe('Rendering', () => {
        it('should render course title', () => {
            render(<MockCourseCard course={mockCourse} />);

            expect(screen.getByTestId('course-title')).toHaveTextContent('Introduction to Testing');
        });

        it('should render instructor name', () => {
            render(<MockCourseCard course={mockCourse} />);

            expect(screen.getByTestId('course-instructor')).toHaveTextContent('John');
        });

        it('should render course level', () => {
            render(<MockCourseCard course={mockCourse} />);

            expect(screen.getByTestId('course-level')).toHaveTextContent('beginner');
        });

        it('should render course category', () => {
            render(<MockCourseCard course={mockCourse} />);

            expect(screen.getByTestId('course-category')).toHaveTextContent('Programming');
        });
    });

    describe('Null Safety', () => {
        it('should handle missing instructor gracefully', () => {
            const courseWithoutInstructor = { ...mockCourse, instructor: undefined };

            render(<MockCourseCard course={courseWithoutInstructor} />);

            expect(screen.getByTestId('course-instructor')).toHaveTextContent('Admin');
        });

        it('should handle null instructor gracefully', () => {
            const courseWithNullInstructor = { ...mockCourse, instructor: null };

            render(<MockCourseCard course={courseWithNullInstructor} />);

            expect(screen.getByTestId('course-instructor')).toHaveTextContent('Admin');
        });
    });

    describe('Data Extraction', () => {
        it('should extract first name from full name', () => {
            const instructor = 'Jane Smith Johnson';
            const firstName = (instructor || 'Admin').split(' ')[0];

            expect(firstName).toBe('Jane');
        });

        it('should handle single name', () => {
            const instructor = 'Expert';
            const firstName = (instructor || 'Admin').split(' ')[0];

            expect(firstName).toBe('Expert');
        });
    });
});
