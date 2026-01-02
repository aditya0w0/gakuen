import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { getCoupons, createCoupon, seedDefaultCoupons } from '@/lib/firebase/coupon-operations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coupons - List all coupons (admin only)
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

        const coupons = await getCoupons({ activeOnly, limit });

        return NextResponse.json({
            coupons,
            total: coupons.length,
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch coupons');
    }
}

/**
 * POST /api/coupons - Create a new coupon (admin only)
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const body = await request.json();

        // Validate required fields
        const { code, discountPercent, validFrom, validUntil, maxUses, applicableTo, isActive } = body;

        if (!code || typeof code !== 'string' || code.length < 3) {
            return NextResponse.json({ error: 'Code must be at least 3 characters' }, { status: 400 });
        }

        if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
            return NextResponse.json({ error: 'Discount percent must be between 0 and 100' }, { status: 400 });
        }

        if (!validFrom || !validUntil) {
            return NextResponse.json({ error: 'Valid from and valid until dates are required' }, { status: 400 });
        }

        if (typeof maxUses !== 'number' || maxUses < 1) {
            return NextResponse.json({ error: 'Max uses must be at least 1' }, { status: 400 });
        }

        if (!['subscription', 'course', 'bundle', 'all'].includes(applicableTo)) {
            return NextResponse.json({ error: 'Invalid applicableTo value' }, { status: 400 });
        }

        const coupon = await createCoupon({
            code,
            discountPercent,
            discountAmount: body.discountAmount,
            validFrom,
            validUntil,
            maxUses,
            applicableTo,
            applicableTiers: body.applicableTiers,
            minPurchaseAmount: body.minPurchaseAmount,
            isActive: isActive ?? true,
        });

        return NextResponse.json({ success: true, coupon }, { status: 201 });
    } catch (error: any) {
        if (error.message?.includes('already exists')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        return safeErrorResponse(error, 'Failed to create coupon');
    }
}

/**
 * PUT /api/coupons?action=seed - Seed default coupons (admin only)
 */
export async function PUT(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'seed') {
            await seedDefaultCoupons();
            return NextResponse.json({ success: true, message: 'Default coupons seeded' });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to seed coupons');
    }
}
