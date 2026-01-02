import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DEFAULT_SUBSCRIPTION, SubscriptionTier, SUBSCRIPTION_TIERS } from '@/lib/constants/subscription';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const body = await request.json();
        const { tier, billingCycle, couponCode, amount } = body;

        // Validate tier
        if (!tier || !SUBSCRIPTION_TIERS[tier as SubscriptionTier]) {
            return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
        }

        if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
            return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
        }

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();
        const userId = authResult.user.id;

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        if (billingCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Create subscription object
        const subscription = {
            tier,
            status: 'active',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            billingCycle,
            aiUsage: {
                proRequestsToday: 0,
                flashRequestsToday: 0,
                lastResetDate: new Date().toISOString().split('T')[0],
            },
            purchasedCourses: [],
            purchasedBundles: [],
        };

        // Save subscription to user document
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            subscription,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Create payment record
        const paymentRef = await db.collection('payments').add({
            userId,
            type: 'subscription',
            tier,
            billingCycle,
            amount,
            couponCode: couponCode || null,
            status: 'completed',
            createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Subscription created: ${tier} for user ${userId}, payment ${paymentRef.id}`);

        return NextResponse.json({
            success: true,
            subscriptionId: paymentRef.id,
            tier,
            endDate: endDate.toISOString(),
        });
    } catch (error) {
        console.error('❌ Subscription error:', error);
        return safeErrorResponse(error, 'Failed to create subscription');
    }
}
