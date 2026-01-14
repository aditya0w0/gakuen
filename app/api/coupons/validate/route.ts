import { NextRequest, NextResponse } from 'next/server';
import { safeErrorResponse } from '@/lib/api/auth-guard';
import { validateCoupon } from '@/lib/firebase/coupon-operations';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/coupons/validate - Validate a coupon code
 * Public endpoint (no auth required) - returns only discount info, not full coupon
 */
export async function POST(request: NextRequest) {
    // Rate limiting to prevent brute force coupon guessing
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`coupon:${ip}`, RateLimits.COUPON);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { code, type } = body;

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        // Validate coupon using Firestore
        const result = await validateCoupon(
            code,
            type || 'subscription',
            undefined, // tier
            undefined  // purchaseAmount
        );

        if (!result.valid) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Return only necessary info (not full coupon details for security)
        return NextResponse.json({
            valid: true,
            code: result.coupon!.code,
            discountPercent: result.coupon!.discountPercent,
            discountAmount: result.coupon!.discountAmount,
            applicableTo: result.coupon!.applicableTo,
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to validate coupon');
    }
}
