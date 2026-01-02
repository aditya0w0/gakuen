import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]
 * Get a single user by ID (admin only)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { id: userId } = await params;

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
        }

        const db = admin.firestore();

        // Get user from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();

        return NextResponse.json({
            id: userDoc.id,
            email: userData?.email || '',
            name: userData?.username || userData?.displayName || userData?.name || 'Unknown',
            role: userData?.role || 'student',
            avatar: userData?.photoURL || userData?.avatar,
            phoneNumber: userData?.phoneNumber,
            bio: userData?.bio,
            enrolledCourses: userData?.enrolledCourses || [],
            completedCourses: userData?.completedCourses || [],
            createdAt: userData?.createdAt?.toDate?.()?.toISOString() || userData?.createdAt,
            isDisabled: userData?.isDisabled || false,
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch user');
    }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { id: userId } = await params;

        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
        }

        const db = admin.firestore();
        const auth = admin.auth();

        // Delete from Firestore
        await db.collection('users').doc(userId).delete();

        // Try to delete from Firebase Auth too
        try {
            await auth.deleteUser(userId);
        } catch (e) {
            // User may not exist in Auth, that's ok
            console.log('User may not exist in Auth:', e);
        }

        return NextResponse.json({ success: true, message: 'User deleted' });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to delete user');
    }
}
