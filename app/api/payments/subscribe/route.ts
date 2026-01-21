import { NextRequest, NextResponse } from 'next/server';
import { withAuthTracked, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { SUBSCRIPTION_TIERS, type SubscriptionTier, type UserSubscription } from '@/lib/constants/subscription';
import { logger } from '@/lib/logger';
import { validateCoupon, incrementCouponUsage } from '@/lib/firebase/coupon-operations';
import { incrementRevenue, updateSubscriptionTier } from '@/lib/firebase/admin-stats';

export const dynamic = 'force-dynamic';

interface SubscribeRequest {
    tier: SubscriptionTier;
    billingCycle: 'monthly' | 'yearly';
    couponCode?: string;
    // Demo: card info not sent, just metadata
    cardLast4?: string;
    cardBrand?: string;
}

export const POST = withAuthTracked(async (request, { user }) => {
    try {
        const body: SubscribeRequest = await request.json();
        const { tier, billingCycle, couponCode, cardLast4, cardBrand } = body;

        // Validate tier
        if (!tier || !SUBSCRIPTION_TIERS[tier]) {
            return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
        }

        if (tier === 'free') {
            return NextResponse.json({ error: 'Cannot subscribe to free tier' }, { status: 400 });
        }

        // Validate billing cycle
        if (!['monthly', 'yearly'].includes(billingCycle)) {
            return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
        }

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();
        const userId = user.id;

        // Check if user already has active subscription
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (userData?.subscription?.tier !== 'free' && userData?.subscription?.status === 'active') {
            // Allow upgrade, but not if same tier
            if (userData.subscription.tier === tier) {
                return NextResponse.json({ error: 'You already have this subscription' }, { status: 400 });
            }
        }

        // Calculate price
        const tierConfig = SUBSCRIPTION_TIERS[tier];
        let amount: number = billingCycle === 'yearly' ? tierConfig.priceYearly : tierConfig.priceMonthly;
        let discountApplied = 0;
        let couponValid = false;
        let appliedCouponId: string | null = null;

        // Apply coupon if provided (using Firestore)
        if (couponCode) {
            const couponResult = await validateCoupon(couponCode, 'subscription', tier, amount);
            if (couponResult.valid && couponResult.coupon) {
                const coupon = couponResult.coupon;
                if (coupon.discountAmount) {
                    discountApplied = coupon.discountAmount;
                } else {
                    discountApplied = amount * (coupon.discountPercent / 100);
                }
                amount = Math.max(0, amount - discountApplied) as number;
                couponValid = true;
                appliedCouponId = coupon.id;
            }
        }

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

        // Create subscription record
        const subscriptionData: UserSubscription = {
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
            purchasedCourses: userData?.subscription?.purchasedCourses || [],
            purchasedBundles: userData?.subscription?.purchasedBundles || [],
        };

        // Create payment record
        const paymentRef = await db.collection('payments').add({
            userId,
            type: 'subscription',
            tier,
            billingCycle,
            amount,
            originalAmount: billingCycle === 'yearly' ? tierConfig.priceYearly : tierConfig.priceMonthly,
            discountApplied,
            couponCode: couponValid ? couponCode?.toUpperCase() : null,
            status: 'completed',
            paymentMethod: 'card',
            cardLast4: cardLast4 || null,
            cardBrand: cardBrand || null,
            createdAt: FieldValue.serverTimestamp(),
        });

        // Update user's subscription
        await userRef.update({
            subscription: subscriptionData,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Increment coupon usage if one was applied
        if (appliedCouponId) {
            await incrementCouponUsage(appliedCouponId);
        }

        // Update pre-aggregated admin stats (non-blocking)
        const previousTier = (userData?.subscription?.tier || 'free') as "free" | "basic" | "mid" | "pro";
        Promise.all([
            incrementRevenue(amount, true),
            updateSubscriptionTier(previousTier, tier as "free" | "basic" | "mid" | "pro"),
        ]).catch(err => console.warn('Stats update failed (non-critical):', err));

        logger.info(`Subscription created: ${tier} ${billingCycle}`, {
            userId,
            tier,
            billingCycle,
            amount,
            paymentId: paymentRef.id,
        }, 'SubscriptionAPI');

        return NextResponse.json({
            success: true,
            paymentId: paymentRef.id,
            subscription: subscriptionData,
            amount,
            discountApplied,
            message: `Successfully subscribed to ${tierConfig.name}!`,
        });
    } catch (error) {
        console.error('❌ Subscription error:', error);
        return safeErrorResponse(error, 'Subscription failed');
    }
});

// GET - Check subscription status
export const GET = withAuthTracked(async (request, { user }) => {
    try {
        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();
        const userId = user.id;

        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        const subscription = userData?.subscription || {
            tier: 'free',
            status: 'active',
        };

        return NextResponse.json({
            subscription,
            tierConfig: SUBSCRIPTION_TIERS[subscription.tier as SubscriptionTier],
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to get subscription status');
    }
});
