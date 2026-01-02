import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { getAnalyticsSummary } from '@/lib/analytics/firestore-analytics';
import { getSummary as getInMemorySummary, getStats, getAllRecords } from '@/lib/api/analytics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics
 * Get API usage analytics (admin only)
 * Uses Firestore for persistent data, falls back to in-memory
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'summary';
        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');

        switch (type) {
            case 'summary':
                // Try Firestore first, fall back to in-memory
                try {
                    const firestoreData = await getAnalyticsSummary(30);
                    // If Firestore has data, use it
                    if (firestoreData.month.calls > 0) {
                        return NextResponse.json(firestoreData);
                    }
                } catch (e) {
                    console.warn('Firestore analytics unavailable, using in-memory:', e);
                }
                // Fallback to in-memory
                return NextResponse.json(getInMemorySummary());

            case 'range':
                if (!startDate || !endDate) {
                    return NextResponse.json(
                        { error: 'Start and end dates required' },
                        { status: 400 }
                    );
                }
                return NextResponse.json(getStats(startDate, endDate));

            case 'export':
                // Export all records as CSV-ready data
                const records = getAllRecords();
                return NextResponse.json({
                    records,
                    exportedAt: new Date().toISOString(),
                    count: records.length,
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid type. Use: summary, range, export' },
                    { status: 400 }
                );
        }
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch analytics');
    }
}
