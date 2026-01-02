import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, safeErrorResponse } from '@/lib/api/auth-guard';

export const dynamic = 'force-dynamic';

// In-memory user store for demo (in production, use Firebase/database)
// This gets populated from localStorage syncing or Firebase
let usersCache: User[] = [];

interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'admin';
    avatar?: string;
    enrolledCourses?: string[];
    createdAt?: string;
    isDisabled?: boolean;
}

/**
 * GET /api/admin/users
 * List all users with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.toLowerCase() || '';
        const role = searchParams.get('role');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        // Try to fetch users from Firebase using Admin SDK
        try {
            const { initAdmin } = await import('@/lib/auth/firebase-admin');
            const admin = initAdmin();

            if (admin) {
                console.log('Fetching users from Firebase Admin SDK...');
                const db = admin.firestore();
                const snapshot = await db.collection('users').get();

                usersCache = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as User[];

                console.log(`✅ Fetched ${usersCache.length} users from Firebase Admin SDK`);
            } else {
                console.log('⚠️ Firebase Admin not initialized');
            }
        } catch (e) {
            console.error('❌ Firebase Admin fetch error:', e);
        }

        // Filter users
        let filtered = usersCache;

        if (search) {
            filtered = filtered.filter(u =>
                u.email?.toLowerCase().includes(search) ||
                u.name?.toLowerCase().includes(search)
            );
        }

        if (role && role !== 'all') {
            filtered = filtered.filter(u => u.role === role);
        }

        // Paginate
        const total = filtered.length;
        const start = (page - 1) * limit;
        const paginated = filtered.slice(start, start + limit);

        return NextResponse.json({
            users: paginated,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to fetch users');
    }
}

/**
 * PATCH /api/admin/users
 * Update user (role, disable status)
 */
export async function PATCH(request: NextRequest) {
    try {
        // 🔒 SECURITY: Require admin role
        const authResult = await requireAdmin(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { userId, updates } = await request.json();

        if (!userId || !updates) {
            return NextResponse.json(
                { error: 'userId and updates required' },
                { status: 400 }
            );
        }

        // Validate updates - only allow specific fields
        const allowedFields = ['role', 'isDisabled', 'name'];
        const cleanUpdates: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                cleanUpdates[key] = value;
            }
        }

        if (Object.keys(cleanUpdates).length === 0) {
            return NextResponse.json(
                { error: 'No valid updates provided' },
                { status: 400 }
            );
        }

        // Prevent self-demotion
        if (userId === authResult.user.id && cleanUpdates.role === 'student') {
            return NextResponse.json(
                { error: 'Cannot demote yourself' },
                { status: 400 }
            );
        }

        // Update in Firebase using Admin SDK
        try {
            const { initAdmin } = await import('@/lib/auth/firebase-admin');
            const admin = initAdmin();

            if (admin) {
                const db = admin.firestore();
                const { FieldValue } = await import('firebase-admin/firestore');
                await db.collection('users').doc(userId).update({
                    ...cleanUpdates,
                    updatedAt: FieldValue.serverTimestamp(),
                    updatedBy: authResult.user.id,
                });
                console.log(`✅ Updated user ${userId} in Firebase Admin SDK`);
            }
        } catch (e) {
            console.error('Firebase Admin update failed:', e);
        }

        // Update local cache
        const userIndex = usersCache.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            usersCache[userIndex] = { ...usersCache[userIndex], ...cleanUpdates };
        }

        console.log(`✅ Admin ${authResult.user.email} updated user ${userId}:`, cleanUpdates);

        return NextResponse.json({
            success: true,
            userId,
            updates: cleanUpdates,
        });
    } catch (error) {
        return safeErrorResponse(error, 'Failed to update user');
    }
}
