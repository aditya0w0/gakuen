/**
 * Coupon Operations - Firestore CRUD for coupon management
 */

import { initAdmin } from '@/lib/auth/firebase-admin';
import { Coupon, SubscriptionTier } from '@/lib/constants/subscription';
import { FieldValue } from 'firebase-admin/firestore';

// Firestore coupon document type
export interface CouponDoc extends Coupon {
    id: string;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}

// Input for creating/updating coupons
export interface CouponInput {
    code: string;
    discountPercent: number;
    discountAmount?: number;
    validFrom: string;
    validUntil: string;
    maxUses: number;
    applicableTo: 'subscription' | 'course' | 'bundle' | 'all';
    applicableTiers?: SubscriptionTier[];
    minPurchaseAmount?: number;
    isActive: boolean;
}

const COLLECTION = 'coupons';

/**
 * Get all coupons (admin only)
 */
export async function getCoupons(options?: {
    activeOnly?: boolean;
    limit?: number;
}): Promise<CouponDoc[]> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const db = admin.firestore();
    let query: FirebaseFirestore.Query = db.collection(COLLECTION);

    if (options?.activeOnly) {
        query = query.where('isActive', '==', true);
    }

    query = query.orderBy('createdAt', 'desc');

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as CouponDoc));
}

/**
 * Get a coupon by its code (case-insensitive)
 */
export async function getCouponByCode(code: string): Promise<CouponDoc | null> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const db = admin.firestore();

    // Query by uppercase code for consistency
    const snapshot = await db.collection(COLLECTION)
        .where('code', '==', code.toUpperCase())
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data(),
    } as CouponDoc;
}

/**
 * Get a coupon by ID
 */
export async function getCouponById(id: string): Promise<CouponDoc | null> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const db = admin.firestore();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) return null;

    return {
        id: doc.id,
        ...doc.data(),
    } as CouponDoc;
}

/**
 * Create a new coupon
 */
export async function createCoupon(data: CouponInput): Promise<CouponDoc> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const db = admin.firestore();

    // Check for duplicate code
    const existing = await getCouponByCode(data.code);
    if (existing) {
        throw new Error(`Coupon code "${data.code}" already exists`);
    }

    // Filter out undefined values (Firestore doesn't accept undefined)
    const couponData: any = {
        code: data.code.toUpperCase(), // Store uppercase for consistency
        discountPercent: data.discountPercent,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        maxUses: data.maxUses,
        applicableTo: data.applicableTo,
        isActive: data.isActive,
        usedCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    // Only add optional fields if defined
    if (data.discountAmount !== undefined) couponData.discountAmount = data.discountAmount;
    if (data.applicableTiers) couponData.applicableTiers = data.applicableTiers;
    if (data.minPurchaseAmount) couponData.minPurchaseAmount = data.minPurchaseAmount;

    const docRef = await db.collection(COLLECTION).add(couponData);

    return {
        id: docRef.id,
        ...couponData,
        usedCount: 0,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
    } as CouponDoc;
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(id: string, data: Partial<CouponInput>): Promise<CouponDoc> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const db = admin.firestore();
    const docRef = db.collection(COLLECTION).doc(id);

    const existing = await docRef.get();
    if (!existing.exists) {
        throw new Error('Coupon not found');
    }

    // If updating code, check for duplicates
    if (data.code) {
        const codeCheck = await getCouponByCode(data.code);
        if (codeCheck && codeCheck.id !== id) {
            throw new Error(`Coupon code "${data.code}" already exists`);
        }
        data.code = data.code.toUpperCase();
    }

    const updateData = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(updateData);

    const updated = await docRef.get();
    return {
        id: updated.id,
        ...updated.data(),
    } as CouponDoc;
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(id: string): Promise<void> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const db = admin.firestore();
    await db.collection(COLLECTION).doc(id).delete();
}

/**
 * Increment coupon usage count (called when coupon is redeemed)
 */
export async function incrementCouponUsage(id: string): Promise<void> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const db = admin.firestore();
    await db.collection(COLLECTION).doc(id).update({
        usedCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Validate a coupon for use
 */
export async function validateCoupon(
    code: string,
    purchaseType: 'subscription' | 'course' | 'bundle',
    tier?: SubscriptionTier,
    purchaseAmount?: number
): Promise<{ valid: boolean; coupon?: CouponDoc; error?: string }> {
    const coupon = await getCouponByCode(code);

    if (!coupon) {
        return { valid: false, error: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
        return { valid: false, error: 'This coupon is no longer active' };
    }

    const now = new Date();
    if (new Date(coupon.validFrom) > now) {
        return { valid: false, error: 'This coupon is not yet valid' };
    }
    if (new Date(coupon.validUntil) < now) {
        return { valid: false, error: 'This coupon has expired' };
    }

    if (coupon.usedCount >= coupon.maxUses) {
        return { valid: false, error: 'This coupon has reached its usage limit' };
    }

    if (coupon.applicableTo !== 'all' && coupon.applicableTo !== purchaseType) {
        return { valid: false, error: `This coupon is only valid for ${coupon.applicableTo} purchases` };
    }

    if (coupon.applicableTiers && tier && !coupon.applicableTiers.includes(tier)) {
        return { valid: false, error: 'This coupon is not valid for your subscription tier' };
    }

    if (coupon.minPurchaseAmount && purchaseAmount && purchaseAmount < coupon.minPurchaseAmount) {
        return { valid: false, error: `Minimum purchase amount is $${coupon.minPurchaseAmount}` };
    }

    return { valid: true, coupon };
}

/**
 * Seed default coupons (run once to migrate hardcoded coupons)
 */
export async function seedDefaultCoupons(): Promise<void> {
    const admin = initAdmin();
    if (!admin) throw new Error('Firebase Admin not initialized');

    const defaultCoupons: CouponInput[] = [
        {
            code: 'WELCOME20',
            discountPercent: 20,
            validFrom: '2024-01-01',
            validUntil: '2026-12-31',
            maxUses: 1000,
            applicableTo: 'all',
            isActive: true,
        },
        {
            code: 'NEWYEAR50',
            discountPercent: 50,
            validFrom: '2024-01-01',
            validUntil: '2026-01-31',
            maxUses: 100,
            applicableTo: 'subscription',
            isActive: true,
        },
        {
            code: 'STUDENT25',
            discountPercent: 25,
            validFrom: '2024-01-01',
            validUntil: '2026-12-31',
            maxUses: 500,
            applicableTo: 'all',
            isActive: true,
        },
        {
            code: 'VIP100',
            discountPercent: 100,
            validFrom: '2024-01-01',
            validUntil: '2026-12-31',
            maxUses: 10,
            applicableTo: 'subscription',
            applicableTiers: ['basic'],
            isActive: true,
        },
    ];

    for (const coupon of defaultCoupons) {
        const existing = await getCouponByCode(coupon.code);
        if (!existing) {
            await createCoupon(coupon);
            console.log(`✅ Created coupon: ${coupon.code}`);
        } else {
            console.log(`⏭️ Coupon already exists: ${coupon.code}`);
        }
    }
}
