// Admin-only endpoint to initiate Google Drive authorization
// Only admins can authorize Drive storage for the application

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-guard';
import { getAuthUrl } from '@/lib/storage/google-drive';

export async function GET(request: NextRequest) {
    // 🔒 SECURITY: Only admins can authorize Drive integration
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;

    try {
        const authUrl = getAuthUrl();
        return NextResponse.redirect(authUrl);
    } catch (error: any) {
        console.error('Google auth error:', error);
        return NextResponse.json(
            { error: 'Failed to generate auth URL' },
            { status: 500 }
        );
    }
}
