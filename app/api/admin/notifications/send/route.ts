import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Admin only
    const authResult = await requireAdmin(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    try {
        const body = await request.json();
        const { userId, title, message, type } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Missing required fields (title, message)' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Must provide userId' }, { status: 400 });
        }

        // Use Firebase Admin SDK
        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();

        // Create notification document
        const docRef = await db.collection('notifications').add({
            userId,
            title,
            message,
            type: type || 'info',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Notification created: ${docRef.id} for user ${userId}`);

        return NextResponse.json({ success: true, notificationId: docRef.id });
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return safeErrorResponse(error, 'Failed to send notification');
    }
}
