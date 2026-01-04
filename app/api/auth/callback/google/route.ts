// Google OAuth callback handler
// Exchanges auth code for refresh token and stores it

import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/lib/storage/google-drive';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(
            new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL('/settings?error=missing_code', request.url)
        );
    }

    try {
        const { refreshToken } = await handleCallback(code);

        // IMPORTANT: In production, you should store this refresh token securely
        // For now, we'll show it to the admin to add to environment variables
        console.log('='.repeat(60));
        console.log('GOOGLE DRIVE AUTHORIZATION SUCCESSFUL!');
        console.log('Add this to your .env and Vercel environment variables:');
        console.log(`GOOGLE_REFRESH_TOKEN="${refreshToken}"`);
        console.log('='.repeat(60));

        // Redirect to success page with instructions
        return NextResponse.redirect(
            new URL(
                `/settings?google_drive=success&token=${encodeURIComponent(refreshToken.slice(0, 20))}...`,
                request.url
            )
        );
    } catch (err: any) {
        console.error('OAuth callback error:', err);
        return NextResponse.redirect(
            new URL(`/settings?error=${encodeURIComponent(err.message || 'auth_failed')}`, request.url)
        );
    }
}
