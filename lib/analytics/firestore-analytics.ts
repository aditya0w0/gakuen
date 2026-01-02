/**
 * Firestore-backed Analytics System
 * Persists API usage data across server restarts
 */

import { initAdmin } from "@/lib/auth/firebase-admin";

export interface AnalyticsRecord {
    id: string;
    type: "api_call" | "page_view" | "event";
    endpoint?: string;
    method?: string;
    userId?: string;
    userEmail?: string;
    timestamp: number;
    duration?: number;
    statusCode?: number;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
    // Page view specific
    pagePath?: string;
    referrer?: string;
    // Event specific
    eventName?: string;
    eventData?: Record<string, unknown>;
}

const COLLECTION_NAME = "analyticsRecords";

/**
 * Save analytics record to Firestore
 * This is server-side only (no consent check needed for functional data)
 */
export async function saveAnalyticsRecord(record: Omit<AnalyticsRecord, "id">): Promise<void> {
    try {
        const admin = initAdmin();
        if (!admin) {
            console.warn("Firebase Admin not initialized, skipping analytics save");
            return;
        }

        const db = admin.firestore();
        const { FieldValue } = await import("firebase-admin/firestore");

        await db.collection(COLLECTION_NAME).add({
            ...record,
            createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`📊 Saved ${record.type}: ${record.endpoint || record.pagePath || record.eventName}`);
    } catch (error) {
        console.error("Failed to save analytics record:", error);
    }
}

/**
 * Track API call (server-side, no consent needed)
 */
export async function trackAPICall(data: {
    endpoint: string;
    method: string;
    userId?: string;
    userEmail?: string;
    duration: number;
    statusCode: number;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
}): Promise<void> {
    await saveAnalyticsRecord({
        type: "api_call",
        timestamp: Date.now(),
        ...data,
    });
}

/**
 * Get analytics summary from Firestore
 */
export async function getAnalyticsSummary(days: number = 30): Promise<{
    today: { calls: number; cost: number };
    week: { calls: number; cost: number };
    month: { calls: number; cost: number };
    topEndpoints: { endpoint: string; count: number }[];
    topUsers: { email: string; count: number }[];
    recentCalls: AnalyticsRecord[];
}> {
    try {
        const admin = initAdmin();
        if (!admin) {
            return emptyStats();
        }

        const db = admin.firestore();
        const now = Date.now();
        const dayAgo = now - 86400000;
        const weekAgo = now - 7 * 86400000;
        const monthAgo = now - days * 86400000;

        // Query last 30 days of API calls
        const snapshot = await db.collection(COLLECTION_NAME)
            .where("type", "==", "api_call")
            .where("timestamp", ">=", monthAgo)
            .orderBy("timestamp", "desc")
            .limit(1000)
            .get();

        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AnalyticsRecord));

        // Calculate stats
        const todayRecords = records.filter(r => r.timestamp >= dayAgo);
        const weekRecords = records.filter(r => r.timestamp >= weekAgo);

        // Top endpoints
        const endpointCounts = new Map<string, number>();
        records.forEach(r => {
            if (r.endpoint) {
                endpointCounts.set(r.endpoint, (endpointCounts.get(r.endpoint) || 0) + 1);
            }
        });
        const topEndpoints = Array.from(endpointCounts.entries())
            .map(([endpoint, count]) => ({ endpoint, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Top users
        const userCounts = new Map<string, number>();
        records.forEach(r => {
            if (r.userEmail) {
                userCounts.set(r.userEmail, (userCounts.get(r.userEmail) || 0) + 1);
            }
        });
        const topUsers = Array.from(userCounts.entries())
            .map(([email, count]) => ({ email, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            today: {
                calls: todayRecords.length,
                cost: todayRecords.reduce((sum, r) => sum + (r.cost || 0), 0),
            },
            week: {
                calls: weekRecords.length,
                cost: weekRecords.reduce((sum, r) => sum + (r.cost || 0), 0),
            },
            month: {
                calls: records.length,
                cost: records.reduce((sum, r) => sum + (r.cost || 0), 0),
            },
            topEndpoints,
            topUsers,
            recentCalls: records.slice(0, 20),
        };
    } catch (error) {
        console.error("Failed to get analytics summary:", error);
        return emptyStats();
    }
}

function emptyStats() {
    return {
        today: { calls: 0, cost: 0 },
        week: { calls: 0, cost: 0 },
        month: { calls: 0, cost: 0 },
        topEndpoints: [],
        topUsers: [],
        recentCalls: [],
    };
}
