import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to clear Firebase auth token cookie
 * Called during logout
 */
export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear the httpOnly cookie
    response.cookies.set({
        name: 'firebase-token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Expire immediately
    });

    console.log('🗑️ Token cookie cleared');

    return response;
}
