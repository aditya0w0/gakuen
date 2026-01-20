/**
 * Admin endpoint to check and sync local registry
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-guard';
import { getAllLocalCourses, getLocalRegistryStats } from '@/lib/cache/local-registry';
import { syncPendingCourses, getPendingSyncCount } from '@/lib/cache/sync-queue';

export const dynamic = 'force-dynamic';

// GET - Check registry status
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const stats = await getLocalRegistryStats();
        const pendingCount = await getPendingSyncCount();
        const allCourses = await getAllLocalCourses();

        return NextResponse.json({
            status: 'ok',
            registry: {
                totalCourses: stats.count,
                courseIds: stats.courses,
                pendingSync: pendingCount,
            },
            courses: allCourses.map(c => ({
                id: c.id,
                title: c.meta.title,
                tg_file_id: c.tg_file_id ? 'present' : 'missing',
                pending_sync: c.pending_sync,
                createdAt: c.createdAt,
            })),
            blobEnabled: !!process.env.BLOB_READ_WRITE_TOKEN,
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error?.message || 'Unknown error',
        }, { status: 500 });
    }
}

// POST - Trigger sync
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        console.log('🔄 [Admin] Manual sync triggered');
        const result = await syncPendingCourses();

        return NextResponse.json({
            status: result.quota_exhausted ? 'partial' : 'ok',
            synced: result.synced,
            failed: result.failed,
            skipped: result.skipped,
            quota_exhausted: result.quota_exhausted,
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error?.message || 'Unknown error',
        }, { status: 500 });
    }
}
