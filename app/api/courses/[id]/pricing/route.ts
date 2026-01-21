import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { validateCourseId } from '@/lib/api/validators';

/**
 * PATCH /api/courses/[id]/pricing
 * 
 * Update course pricing and access tier
 * Admin only
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require admin
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { id: courseId } = await params;

        // Validate course ID
        if (!validateCourseId(courseId)) {
            return NextResponse.json(
                { error: 'Invalid course ID format' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { price, accessTier, isFree } = body;

        // Validate accessTier
        const validTiers = ['free', 'basic', 'mid', 'pro'];
        if (accessTier && !validTiers.includes(accessTier)) {
            return NextResponse.json(
                { error: 'Invalid access tier. Must be: free, basic, mid, or pro' },
                { status: 400 }
            );
        }

        // Validate price
        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return NextResponse.json(
                { error: 'Invalid price. Must be a non-negative number' },
                { status: 400 }
            );
        }

        const { firestore } = initAdmin();
        const db = firestore();

        // Build update object
        const updateData: Record<string, any> = {
            updatedAt: new Date().toISOString(),
            updatedBy: authResult.user.id,
        };

        if (price !== undefined) {
            updateData.price = price;
        }

        if (accessTier !== undefined) {
            updateData.accessTier = accessTier;
            // If setting to free tier, also set isFree
            if (accessTier === 'free') {
                updateData.isFree = true;
                updateData.price = 0;
            } else {
                updateData.isFree = false;
            }
        }

        if (isFree !== undefined) {
            updateData.isFree = isFree;
            if (isFree) {
                updateData.price = 0;
                updateData.accessTier = 'free';
            }
        }

        // Update Firestore
        await db.collection('courses').doc(courseId).update(updateData);

        console.log(`💰 Admin ${authResult.user.email} updated pricing for ${courseId}:`, updateData);

        return NextResponse.json({
            success: true,
            courseId,
            updated: updateData,
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to update course pricing');
    }
}
