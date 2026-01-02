import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { getFeatureFlags, updateFeatureFlags, addToAIWhitelist, removeFromAIWhitelist } from '@/lib/admin/feature-flags';

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
        const {
            subscriptionsEnabled,
            aiEnabled,
            freeCoursesMode,
            disableRateLimits,
            aiUnlimitedMode,
            aiUnlockUntil,
            // Whitelist actions
            addToWhitelist,
            removeFromWhitelist,
        } = body;

        // Handle whitelist actions separately
        if (addToWhitelist) {
            const flags = await addToAIWhitelist(addToWhitelist, authResult.user.email);
            return NextResponse.json({ success: true, flags });
        }

        if (removeFromWhitelist) {
            const flags = await removeFromAIWhitelist(removeFromWhitelist, authResult.user.email);
            return NextResponse.json({ success: true, flags });
        }

        // Build updates object for regular flags
        const updates: Record<string, boolean | string | undefined> = {};

        if (typeof subscriptionsEnabled === 'boolean') {
            updates.subscriptionsEnabled = subscriptionsEnabled;
        }
        if (typeof aiEnabled === 'boolean') {
            updates.aiEnabled = aiEnabled;
        }
        if (typeof freeCoursesMode === 'boolean') {
            updates.freeCoursesMode = freeCoursesMode;
        }
        if (typeof disableRateLimits === 'boolean') {
            updates.disableRateLimits = disableRateLimits;
        }
        if (typeof aiUnlimitedMode === 'boolean') {
            updates.aiUnlimitedMode = aiUnlimitedMode;
        }
        if (aiUnlockUntil !== undefined) {
            updates.aiUnlockUntil = aiUnlockUntil; // ISO string or null to clear
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
