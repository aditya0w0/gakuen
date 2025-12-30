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

        // Try to fetch users from Firebase
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const { getFirebaseDB, isFirebaseEnabled } = await import('@/lib/firebase/config');

            if (isFirebaseEnabled()) {
                const db = getFirebaseDB();
                if (db) {
                    const usersRef = collection(db, 'users');
                    const snapshot = await getDocs(usersRef);
                    usersCache = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as User[];
                }
            }
        } catch (e) {
            console.log('Firebase not available, using cache');
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

        // Update in Firebase
        try {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { getFirebaseDB, isFirebaseEnabled } = await import('@/lib/firebase/config');

            if (isFirebaseEnabled()) {
                const db = getFirebaseDB();
                if (db) {
                    await updateDoc(doc(db, 'users', userId), {
                        ...cleanUpdates,
                        updatedAt: serverTimestamp(),
                        updatedBy: authResult.user.id,
                    });
                }
            }
        } catch (e) {
            console.error('Firebase update failed:', e);
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
