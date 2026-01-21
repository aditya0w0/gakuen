import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-guard';
import { validateDriveConnection } from '@/lib/storage/google-drive';
import { validateTelegramConnection } from '@/lib/storage/telegram-storage';
import { validateR2Connection } from '@/lib/storage/r2-storage';
import { initAdmin } from '@/lib/auth/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // 🔒 SECURITY: Only admins can view system status
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;

    const statusResults = {
        firebase: 'error',
        drive: 'error',
        r2: 'error',
        telegram: 'error',
    };

    // 1. Check Firebase
    try {
        const { firestore } = initAdmin();
        const db = firestore();
        // Simple write check or collection list
        await db.collection('system_checks').doc('health').set({
            lastCheck: new Date().toISOString(),
            status: 'ok'
        });
        statusResults.firebase = 'healthy';
    } catch (error) {
        console.error('Firebase health check failed:', error);
        statusResults.firebase = 'error';
    }

    // 2. Check Google Drive
    try {
        const driveHealthy = await validateDriveConnection();
        statusResults.drive = driveHealthy ? 'healthy' : 'error';
    } catch (error) {
        console.error('Drive health check failed:', error);
        statusResults.drive = 'error';
    }

    // 3. Check Cloudflare R2
    try {
        const r2Healthy = await validateR2Connection();
        statusResults.r2 = r2Healthy ? 'healthy' : 'error';
    } catch (error) {
        console.error('R2 health check failed:', error);
        statusResults.r2 = 'error';
    }

    // 4. Check Telegram
    try {
        const tgHealthy = await validateTelegramConnection();
        statusResults.telegram = tgHealthy ? 'healthy' : 'error';
    } catch (error) {
        console.error('Telegram health check failed:', error);
        statusResults.telegram = 'error';
    }

    return NextResponse.json(statusResults);
}
