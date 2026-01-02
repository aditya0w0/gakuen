import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const { id } = await context.params;
    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        const admin = initAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const db = admin.firestore();
        const docRef = db.collection('notifications').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        // 🔒 Verify ownership
        if (doc.data()?.userId !== authResult.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await docRef.update({ read: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to mark as read');
    }
}
