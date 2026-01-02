import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics with real revenue data
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();

        const stats = {
            totalUsers: 0,
            activeCourses: 0,
            totalRevenue: 0,
            avgCompletion: 0,
            // New subscription stats
            subscriptions: {
                free: 0,
                basic: 0,
                mid: 0,
                pro: 0,
            },
            recentPayments: [] as any[],
            monthlyRevenue: 0,
        };

        try {
            // Get total users count and subscription breakdown
            const usersSnapshot = await db.collection('users').get();
            stats.totalUsers = usersSnapshot.size;

            usersSnapshot.forEach(doc => {
                const data = doc.data();
                const tier = data.subscription?.tier || 'free';
                if (stats.subscriptions[tier as keyof typeof stats.subscriptions] !== undefined) {
                    stats.subscriptions[tier as keyof typeof stats.subscriptions]++;
                }
            });

            // Get real revenue from payments collection
            const paymentsSnapshot = await db.collection('payments')
                .where('status', '==', 'completed')
                .get();

            let totalRevenue = 0;
            let monthlyRevenue = 0;
            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const recentPayments: any[] = [];

            paymentsSnapshot.forEach(doc => {
                const data = doc.data();
                const amount = data.amount || 0;
                totalRevenue += amount;

                // Check if payment is from this month
                const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
                if (createdAt >= thisMonth) {
                    monthlyRevenue += amount;
                }

                // Collect recent payments (last 5)
                if (recentPayments.length < 5) {
                    recentPayments.push({
                        id: doc.id,
                        amount,
                        type: data.type || 'course',
                        tier: data.tier,
                        createdAt: createdAt.toISOString(),
                    });
                }
            });

            stats.totalRevenue = Math.round(totalRevenue * 100) / 100;
            stats.monthlyRevenue = Math.round(monthlyRevenue * 100) / 100;
            stats.recentPayments = recentPayments;

            // Get enrollments for completion calculation
            const enrollmentsSnapshot = await db.collection('enrollments').get();
            let totalProgress = 0;
            enrollmentsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.progress) {
                    totalProgress += data.progress;
                }
            });

            if (enrollmentsSnapshot.size > 0) {
                stats.avgCompletion = Math.round(totalProgress / enrollmentsSnapshot.size);
            }
        } catch (e) {
            console.log('Error fetching from Firebase:', e);
        }

        // Get active courses count
        try {
            const coursesResponse = await fetch(
                new URL('/api/courses', request.url).toString(),
                { headers: request.headers }
            );
            if (coursesResponse.ok) {
                const coursesData = await coursesResponse.json();
                stats.activeCourses = Array.isArray(coursesData) ? coursesData.length : 0;
            }
        } catch (e) {
            console.log('Failed to fetch courses count:', e);
        }

        return NextResponse.json(stats);
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch dashboard stats');
    }
}

