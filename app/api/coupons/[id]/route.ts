import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { getCouponById, updateCoupon, deleteCoupon } from '@/lib/firebase/coupon-operations';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/coupons/[id] - Get a specific coupon (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const { id } = await params;
        const coupon = await getCouponById(id);

        if (!coupon) {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }

        return NextResponse.json(coupon);
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch coupon');
    }
}

/**
 * PUT /api/coupons/[id] - Update a coupon (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const { id } = await params;
        const body = await request.json();

        // Basic validation
        if (body.code && (typeof body.code !== 'string' || body.code.length < 3)) {
            return NextResponse.json({ error: 'Code must be at least 3 characters' }, { status: 400 });
        }

        if (body.discountPercent !== undefined &&
            (typeof body.discountPercent !== 'number' || body.discountPercent < 0 || body.discountPercent > 100)) {
            return NextResponse.json({ error: 'Discount percent must be between 0 and 100' }, { status: 400 });
        }

        if (body.maxUses !== undefined && (typeof body.maxUses !== 'number' || body.maxUses < 1)) {
            return NextResponse.json({ error: 'Max uses must be at least 1' }, { status: 400 });
        }

        const coupon = await updateCoupon(id, body);

        return NextResponse.json({ success: true, coupon });
    } catch (error: any) {
        if (error.message === 'Coupon not found') {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }
        if (error.message?.includes('already exists')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        return safeErrorResponse(error, 'Failed to update coupon');
    }
}

/**
 * DELETE /api/coupons/[id] - Delete a coupon (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const { id } = await params;
        await deleteCoupon(id);

        return NextResponse.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to delete coupon');
    }
}
