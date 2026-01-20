import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-guard';
import { migrateCourseStats } from '@/lib/firebase/migrate-course-stats';

/**
 * POST /api/admin/migrate-stats
 * 
 * One-time migration to populate course_stats collection.
 * Run this once, then delete this endpoint.
 */
export async function POST(request: NextRequest) {
    // Require admin
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const result = await migrateCourseStats();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json(
            { error: 'Migration failed', details: String(error) },
            { status: 500 }
        );
    }
}
