/**
 * Cron job to sync local registry courses to Firestore
 * 
 * This should be triggered by Vercel Cron (see vercel.json)
 * Also triggers on every request to ensure sync happens
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncPendingCourses, hasPendingSync, getPendingSyncCount } from '@/lib/cache/sync-queue';

export const dynamic = 'force-dynamic';

// Protect cron endpoint with secret
function validateCronRequest(request: NextRequest): boolean {
    // Vercel cron jobs include this header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If no secret configured, allow (for dev)
    if (!cronSecret) return true;

    return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
    // Only allow cron or authorized requests
    if (!validateCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const pendingCount = await getPendingSyncCount();

        if (pendingCount === 0) {
            return NextResponse.json({
                status: 'ok',
                message: 'No pending courses to sync',
                pendingCount: 0,
            });
        }

        console.log(`🔄 [Cron] Starting sync of ${pendingCount} pending courses...`);

        const result = await syncPendingCourses();

        return NextResponse.json({
            status: result.quota_exhausted ? 'partial' : 'ok',
            synced: result.synced,
            failed: result.failed,
            quota_exhausted: result.quota_exhausted,
        });
    } catch (error: any) {
        console.error('❌ [Cron] Sync failed:', error);
        return NextResponse.json({
            status: 'error',
            error: error?.message || 'Unknown error',
        }, { status: 500 });
    }
}
