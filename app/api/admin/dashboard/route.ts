import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { getAdminDashboardStats, refreshAdminDashboardStats } from '@/lib/firebase/admin-stats';
import { initAdmin } from '@/lib/auth/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard
 * 
 * Returns pre-aggregated dashboard stats.
 * Cost: 1 Firestore read (from stats/admin_dashboard doc)
 * Cached: 30 minutes in-memory
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        // Get pre-aggregated stats (1 read, cached 30min)
        const stats = await getAdminDashboardStats();

        if (!stats) {
            // Stats doc doesn't exist - trigger first-time refresh
            console.log('📊 Dashboard: First-time stats generation...');
            const freshStats = await refreshAdminDashboardStats("manual");
            return NextResponse.json(freshStats, {
                headers: { 'X-Stats-Source': 'fresh' }
            });
        }

        // Get recent users (paginated, max 10)
        const recentUsers = await getRecentUsers(10);

        return NextResponse.json({
            ...stats,
            recentUsers,
        }, {
            headers: {
                'X-Stats-Source': 'cached',
                'X-Stats-Updated': stats.lastUpdated,
                'Cache-Control': 'private, max-age=300', // 5min browser cache
            }
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch dashboard stats');
    }
}

/**
 * POST /api/admin/dashboard
 * 
 * Force refresh stats (expensive operation)
 * Use sparingly - e.g., button click, not auto-refresh
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        console.log(`📊 Admin ${authResult.user.email} triggered stats refresh`);

        const stats = await refreshAdminDashboardStats("manual");

        return NextResponse.json({
            success: true,
            stats,
            message: "Stats refreshed successfully",
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to refresh stats');
    }
}

/**
 * Get recent users (paginated)
 * Only fetches minimal fields needed for display
 */
async function getRecentUsers(limit: number = 10) {
    try {
        const admin = initAdmin();
        if (!admin) return [];

        const db = admin.firestore();

        // Only select fields needed for display
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .select('email', 'name', 'avatar', 'createdAt', 'enrolledCourses')
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email,
                name: data.name || 'User',
                avatar: data.avatar,
                enrolledCourses: data.enrolledCourses?.length || 0,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            };
        });
    } catch (error) {
        console.error('Failed to get recent users:', error);
        return [];
    }
}
