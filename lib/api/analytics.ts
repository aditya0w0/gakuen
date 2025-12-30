/**
 * API Analytics Tracking System
 * Tracks API usage, costs, and performance metrics
 */

export interface APICallRecord {
    id: string;
    endpoint: string;
    method: string;
    userId: string;
    userEmail: string;
    timestamp: number;
    duration: number; // ms
    statusCode: number;
    // AI-specific
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
}

export interface DailyStats {
    date: string; // YYYY-MM-DD
    totalCalls: number;
    totalCost: number;
    byEndpoint: Record<string, number>;
    byUser: Record<string, number>;
    byModel: Record<string, { calls: number; cost: number }>;
}

// In-memory storage (reset on server restart)
// In production, use Redis or database
const callRecords: APICallRecord[] = [];
const dailyStatsCache: Map<string, DailyStats> = new Map();

// Dynamic pricing from OpenRouter API + fallbacks
// Import and re-export for backwards compatibility
export {
    getModelPricing,
    calculateDynamicCost as calculateCost,
    calculateDynamicImageCost as calculateImageCost,
    getAllPricing
} from './pricing';

/**
 * Generate unique ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get date string from timestamp
 */
function getDateString(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Track an API call
 */
export function trackAPICall(record: Omit<APICallRecord, 'id'>): void {
    const fullRecord: APICallRecord = {
        ...record,
        id: generateId(),
    };

    callRecords.push(fullRecord);

    // Keep only last 10,000 records in memory
    if (callRecords.length > 10000) {
        callRecords.shift();
    }

    // Invalidate cache for this date
    const date = getDateString(record.timestamp);
    dailyStatsCache.delete(date);

    console.log(`📊 API: ${record.method} ${record.endpoint} | User: ${record.userEmail} | ${record.duration}ms${record.cost ? ` | $${record.cost.toFixed(6)}` : ''}`);
}

/**
 * Get statistics for a date range
 */
export function getStats(startDate: string, endDate: string): DailyStats[] {
    const stats: DailyStats[] = [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000; // Include end date

    // Filter records in range
    const filtered = callRecords.filter(r => r.timestamp >= start && r.timestamp < end);

    // Group by date
    const byDate = new Map<string, APICallRecord[]>();
    for (const record of filtered) {
        const date = getDateString(record.timestamp);
        if (!byDate.has(date)) {
            byDate.set(date, []);
        }
        byDate.get(date)!.push(record);
    }

    // Calculate stats for each date
    for (const [date, records] of byDate) {
        const dailyStat: DailyStats = {
            date,
            totalCalls: records.length,
            totalCost: records.reduce((sum, r) => sum + (r.cost || 0), 0),
            byEndpoint: {},
            byUser: {},
            byModel: {},
        };

        for (const record of records) {
            // By endpoint
            dailyStat.byEndpoint[record.endpoint] = (dailyStat.byEndpoint[record.endpoint] || 0) + 1;

            // By user
            dailyStat.byUser[record.userEmail] = (dailyStat.byUser[record.userEmail] || 0) + 1;

            // By model (AI only)
            if (record.model) {
                if (!dailyStat.byModel[record.model]) {
                    dailyStat.byModel[record.model] = { calls: 0, cost: 0 };
                }
                dailyStat.byModel[record.model].calls++;
                dailyStat.byModel[record.model].cost += record.cost || 0;
            }
        }

        stats.push(dailyStat);
    }

    return stats.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get summary statistics
 */
export function getSummary(): {
    today: { calls: number; cost: number };
    week: { calls: number; cost: number };
    month: { calls: number; cost: number };
    topEndpoints: { endpoint: string; count: number }[];
    topUsers: { email: string; count: number }[];
    recentCalls: APICallRecord[];
} {
    const now = Date.now();
    const dayAgo = now - 86400000;
    const weekAgo = now - 7 * 86400000;
    const monthAgo = now - 30 * 86400000;

    const todayRecords = callRecords.filter(r => r.timestamp >= dayAgo);
    const weekRecords = callRecords.filter(r => r.timestamp >= weekAgo);
    const monthRecords = callRecords.filter(r => r.timestamp >= monthAgo);

    // Top endpoints
    const endpointCounts = new Map<string, number>();
    for (const r of monthRecords) {
        endpointCounts.set(r.endpoint, (endpointCounts.get(r.endpoint) || 0) + 1);
    }
    const topEndpoints = Array.from(endpointCounts.entries())
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Top users
    const userCounts = new Map<string, number>();
    for (const r of monthRecords) {
        userCounts.set(r.userEmail, (userCounts.get(r.userEmail) || 0) + 1);
    }
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
            calls: monthRecords.length,
            cost: monthRecords.reduce((sum, r) => sum + (r.cost || 0), 0),
        },
        topEndpoints,
        topUsers,
        recentCalls: callRecords.slice(-20).reverse(),
    };
}

/**
 * Get all records (for export)
 */
export function getAllRecords(): APICallRecord[] {
    return [...callRecords];
}
