/**
 * Input validation schemas using Zod
 * Prevents injection attacks and ensures data integrity
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

/** Email validation */
export const emailSchema = z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase().trim());

/** Safe string - no HTML/script injection */
export const safeStringSchema = z
    .string()
    .max(1000, 'Text too long')
    .transform(val => val.trim())
    .refine(val => !/<script|javascript:|on\w+=/i.test(val), {
        message: 'Invalid characters detected'
    });

/** Alphanumeric with limited special chars */
export const alphanumericSchema = z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores and hyphens allowed');

/** Positive number */
export const positiveNumberSchema = z
    .number()
    .positive('Must be a positive number')
    .finite('Must be a finite number');

/** UUID/Firebase ID format */
export const idSchema = z
    .string()
    .min(1, 'ID required')
    .max(128, 'ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format');

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: safeStringSchema.pipe(z.string().min(2, 'Name must be at least 2 characters')),
});

// ============================================
// Payment Schemas
// ============================================

export const paymentSchema = z.object({
    courseId: idSchema,
    amount: positiveNumberSchema,
    couponCode: z.string().max(50).regex(/^[A-Z0-9_-]*$/).optional(),
});

export const subscriptionSchema = z.object({
    tier: z.enum(['basic', 'mid', 'pro']),
    billingCycle: z.enum(['monthly', 'yearly']),
    couponCode: z.string().max(50).regex(/^[A-Z0-9_-]*$/).optional(),
});

// ============================================
// Coupon Schemas
// ============================================

export const couponCodeSchema = z
    .string()
    .min(3, 'Coupon code too short')
    .max(50, 'Coupon code too long')
    .regex(/^[A-Z0-9_-]+$/, 'Invalid coupon code format')
    .transform(val => val.toUpperCase());

export const createCouponSchema = z.object({
    code: couponCodeSchema,
    discountType: z.enum(['percent', 'fixed']),
    discountPercent: z.number().min(1).max(100).optional(),
    discountAmount: positiveNumberSchema.optional(),
    maxUses: z.number().int().positive().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    isActive: z.boolean().default(true),
});

export const validateCouponSchema = z.object({
    code: couponCodeSchema,
    type: z.enum(['course', 'subscription']).optional(),
});

// ============================================
// Course Schemas
// ============================================

export const courseIdSchema = idSchema;

export const enrollCourseSchema = z.object({
    courseId: idSchema,
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate request body against a schema
 * Returns parsed data or throws with user-friendly error
 */
export async function validateBody<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<T> {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
        const errors = result.error.issues.map((e: { message: string }) => e.message).join(', ');
        throw new Error(`Validation failed: ${errors}`);
    }

    return result.data;
}

/**
 * Validate and sanitize a single value
 */
export function validate<T>(value: unknown, schema: z.ZodSchema<T>): T {
    return schema.parse(value);
}
