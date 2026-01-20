import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';

export const dynamic = 'force-dynamic';

// 🔧 In-memory cache for dashboard stats (5 minute TTL)
// This prevents reading entire collections on every request
interface DashboardCache {
    data: DashboardStats | null;
    timestamp: number;
}

interface DashboardStats {
    totalUsers: number;
    activeCourses: number;
    totalRevenue: number;
    avgCompletion: number;
    subscriptions: {
        free: number;
        basic: number;
        mid: number;
        pro: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentPayments: any[];
    monthlyRevenue: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let dashboardCache: DashboardCache = { data: null, timestamp: 0 };

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics with real revenue data
 * Cached for 5 minutes to reduce Firestore reads
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        // Check cache first
        const now = Date.now();
        if (dashboardCache.data && (now - dashboardCache.timestamp) < CACHE_TTL_MS) {
            console.log('📊 Dashboard: serving from cache');
            return NextResponse.json(dashboardCache.data, {
                headers: { 'X-Cache': 'HIT' }
            });
        }

        console.log('📊 Dashboard: fetching fresh data from Firestore');

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();

        const stats: DashboardStats = {
            totalUsers: 0,
            activeCourses: 0,
            totalRevenue: 0,
            avgCompletion: 0,
            subscriptions: {
                free: 0,
                basic: 0,
                mid: 0,
                pro: 0,
            },
            recentPayments: [],
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
            const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const recentPayments: any[] = [];

            paymentsSnapshot.forEach(doc => {
                const data = doc.data();
                const amount = data.amount || 0;
                totalRevenue += amount;

                const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
                if (createdAt >= thisMonth) {
                    monthlyRevenue += amount;
                }

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

        // Update cache
        dashboardCache = { data: stats, timestamp: now };

        return NextResponse.json(stats, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch dashboard stats');
    }
}


