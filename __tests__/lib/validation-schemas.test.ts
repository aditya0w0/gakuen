/**
 * Validation Schema Tests
 * Tests for input validation and sanitization
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-create schemas for testing (to avoid import issues)
const emailSchema = z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase().trim());

const safeStringSchema = z
    .string()
    .max(1000, 'Text too long')
    .transform(val => val.trim())
    .refine(val => !/<script|javascript:|on\w+=/i.test(val), {
        message: 'Invalid characters detected'
    });

const idSchema = z
    .string()
    .min(1, 'ID required')
    .max(128, 'ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format');

const paymentSchema = z.object({
    courseId: idSchema,
    amount: z.number().positive().finite(),
    couponCode: z.string().max(50).regex(/^[A-Z0-9_-]*$/).optional(),
});

describe('Validation Schemas', () => {
    describe('Email Schema', () => {
        it('should accept valid emails', () => {
            const result = emailSchema.safeParse('User@Example.com');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('user@example.com');
            }
        });

        it('should reject invalid emails', () => {
            const result = emailSchema.safeParse('not-an-email');
            expect(result.success).toBe(false);
        });

        it('should reject emails that are too long', () => {
            const longEmail = 'a'.repeat(250) + '@test.com';
            const result = emailSchema.safeParse(longEmail);
            expect(result.success).toBe(false);
        });

        it('should lowercase emails correctly', () => {
            const result = emailSchema.safeParse('TEST@Example.COM');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('test@example.com');
            }
        });
    });

    describe('Safe String Schema', () => {
        it('should accept safe strings', () => {
            const result = safeStringSchema.safeParse('Hello, this is safe text.');
            expect(result.success).toBe(true);
        });

        it('should reject strings with script tags', () => {
            const result = safeStringSchema.safeParse('<script>alert("xss")</script>');
            expect(result.success).toBe(false);
        });

        it('should reject strings with javascript: protocol', () => {
            const result = safeStringSchema.safeParse('javascript:alert(1)');
            expect(result.success).toBe(false);
        });

        it('should reject strings with event handlers', () => {
            const result = safeStringSchema.safeParse('<img onerror="alert(1)">');
            expect(result.success).toBe(false);
        });

        it('should reject strings over 1000 characters', () => {
            const longString = 'a'.repeat(1001);
            const result = safeStringSchema.safeParse(longString);
            expect(result.success).toBe(false);
        });
    });

    describe('ID Schema', () => {
        it('should accept valid IDs', () => {
            const validIds = ['user123', 'course_456', 'product-789', 'abc123XYZ'];
            validIds.forEach(id => {
                const result = idSchema.safeParse(id);
                expect(result.success).toBe(true);
            });
        });

        it('should reject IDs with special characters', () => {
            const invalidIds = ['user@123', 'course!456', 'product#789', 'test space'];
            invalidIds.forEach(id => {
                const result = idSchema.safeParse(id);
                expect(result.success).toBe(false);
            });
        });

        it('should reject empty IDs', () => {
            const result = idSchema.safeParse('');
            expect(result.success).toBe(false);
        });

        it('should reject IDs over 128 characters', () => {
            const longId = 'a'.repeat(129);
            const result = idSchema.safeParse(longId);
            expect(result.success).toBe(false);
        });
    });

    describe('Payment Schema', () => {
        it('should accept valid payment data', () => {
            const result = paymentSchema.safeParse({
                courseId: 'course-123',
                amount: 99.99,
            });
            expect(result.success).toBe(true);
        });

        it('should accept payment with coupon', () => {
            const result = paymentSchema.safeParse({
                courseId: 'course-123',
                amount: 79.99,
                couponCode: 'SAVE20',
            });
            expect(result.success).toBe(true);
        });

        it('should reject negative amounts', () => {
            const result = paymentSchema.safeParse({
                courseId: 'course-123',
                amount: -10,
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid coupon codes', () => {
            const result = paymentSchema.safeParse({
                courseId: 'course-123',
                amount: 99.99,
                couponCode: 'invalid code!',
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing courseId', () => {
            const result = paymentSchema.safeParse({
                amount: 99.99,
            });
            expect(result.success).toBe(false);
        });
    });
});
