import { NextRequest, NextResponse } from 'next/server';
import { validateFirebaseToken } from '@/lib/auth/validateToken';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to set httpOnly cookie with Firebase ID token
 * Called after successful login on client side
 */
export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token required' },
                { status: 400 }
            );
        }

        // Validate the token server-side
        const user = await validateFirebaseToken(idToken);

        // Create response with httpOnly cookie
        const response = NextResponse.json({
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                role: user.role,
            },
        });

        // Set httpOnly cookie (can't be accessed by JavaScript)
        response.cookies.set({
            name: 'firebase-token',
            value: idToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        console.log(`✅ Token cookie set for user: ${user.email}`);

        return response;
    } catch (error: any) {
        console.error('❌ Set token error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to set token' },
            { status: 401 }
        );
    }
}
