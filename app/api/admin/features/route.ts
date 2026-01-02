import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { getFeatureFlags, updateFeatureFlags } from '@/lib/admin/feature-flags';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/features
 * Get current feature flags
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const flags = await getFeatureFlags();
        return NextResponse.json(flags);
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch feature flags');
    }
}

/**
 * POST /api/admin/features
 * Update feature flags
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const body = await request.json();
        const { subscriptionsEnabled, aiEnabled } = body;

        const updates: { subscriptionsEnabled?: boolean; aiEnabled?: boolean } = {};
        if (typeof subscriptionsEnabled === 'boolean') {
            updates.subscriptionsEnabled = subscriptionsEnabled;
        }
        if (typeof aiEnabled === 'boolean') {
            updates.aiEnabled = aiEnabled;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid updates provided' },
                { status: 400 }
            );
        }

        const newFlags = await updateFeatureFlags(updates, authResult.user.email);

        console.log(`🔧 Feature flags updated by ${authResult.user.email}:`, updates);

        return NextResponse.json({
            success: true,
            flags: newFlags,
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to update feature flags');
    }
}
