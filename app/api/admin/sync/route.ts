/**
 * Sync Queue API - Manually trigger sync of pending courses to Firestore
 * 
 * POST /api/admin/sync - Sync pending courses
 * GET /api/admin/sync - Check sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-guard';
import { syncPendingCourses, hasPendingSync, getPendingSyncCount } from '@/lib/cache/sync-queue';
import { getLocalRegistryStats } from '@/lib/cache/local-registry';

export const dynamic = 'force-dynamic';

// GET - Check sync status
export async function GET(request: NextRequest) {
    // Auth required
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const stats = await getLocalRegistryStats();
    const pendingCount = await getPendingSyncCount();

    return NextResponse.json({
        pending_sync: pendingCount,
        total_local: stats.count,
        courses: stats.courses,
    });
}

// POST - Trigger sync
export async function POST(request: NextRequest) {
    // Auth required
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    console.log(`🔄 [SyncAPI] Admin ${authResult.user.email} triggered sync`);

    const result = await syncPendingCourses();

    return NextResponse.json({
        success: true,
        synced: result.synced,
        failed: result.failed,
        quota_exhausted: result.quota_exhausted,
    });
}
