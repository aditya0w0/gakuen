import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/revenue
 * Get detailed revenue analytics
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();
        const now = new Date();

        // Initialize monthly data for last 6 months
        const monthlyRevenue: { month: string; revenue: number; subscriptions: number; courses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthlyRevenue.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                revenue: 0,
                subscriptions: 0,
                courses: 0,
            });
        }

        let totalRevenue = 0;
        let subscriptionRevenue = 0;
        let courseRevenue = 0;
        let bundleRevenue = 0;
        const tierBreakdown = { basic: 0, mid: 0, pro: 0 };

        try {
            const paymentsSnapshot = await db.collection('payments')
                .where('status', '==', 'completed')
                .get();

            paymentsSnapshot.forEach(doc => {
                const data = doc.data();
                const amount = data.amount || 0;
                const type = data.type || 'course';
                const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);

                totalRevenue += amount;

                // Categorize by type
                if (type === 'subscription') {
                    subscriptionRevenue += amount;
                    const tier = data.tier as string;
                    if (tier && tierBreakdown[tier as keyof typeof tierBreakdown] !== undefined) {
                        tierBreakdown[tier as keyof typeof tierBreakdown] += amount;
                    }
                } else if (type === 'bundle') {
                    bundleRevenue += amount;
                } else {
                    courseRevenue += amount;
                }

                // Add to monthly breakdown
                const monthIndex = monthlyRevenue.findIndex(m => {
                    const mDate = new Date(`${m.month} 01, 20${m.month.slice(-2)}`);
                    return mDate.getMonth() === createdAt.getMonth() &&
                        mDate.getFullYear() === createdAt.getFullYear();
                });

                if (monthIndex !== -1) {
                    monthlyRevenue[monthIndex].revenue += amount;
                    if (type === 'subscription') {
                        monthlyRevenue[monthIndex].subscriptions += amount;
                    } else {
                        monthlyRevenue[monthIndex].courses += amount;
                    }
                }
            });
        } catch (e) {
            console.error('Error fetching payments:', e);
        }

        return NextResponse.json({
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            breakdown: {
                subscriptions: Math.round(subscriptionRevenue * 100) / 100,
                courses: Math.round(courseRevenue * 100) / 100,
                bundles: Math.round(bundleRevenue * 100) / 100,
            },
            tierBreakdown: {
                basic: Math.round(tierBreakdown.basic * 100) / 100,
                mid: Math.round(tierBreakdown.mid * 100) / 100,
                pro: Math.round(tierBreakdown.pro * 100) / 100,
            },
            monthlyRevenue,
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch revenue analytics');
    }
}
