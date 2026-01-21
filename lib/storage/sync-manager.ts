// Sync manager: Handles syncing between local and Firebase
// OPTIMIZED FOR VERCEL FREE TIER:
// - 8s timeout on all Firebase operations (Vercel has 10s limit)
// - 60s sync interval to reduce function invocations
// - Batch size limits to prevent timeouts
// - Lazy initialization for cold starts

import { localCache } from "./local-cache";
import { updateProgress, getProgress, updateUserProfile } from "../firebase/firestore";
import { isFirebaseEnabled } from "../firebase/config";

interface SyncOperation {
    type: "progress" | "profile";
    userId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    timestamp: number;
}

// Vercel-optimized constants
const VERCEL_FUNCTION_TIMEOUT = 8000; // 8s (Vercel free tier has 10s limit)
const SYNC_DELAY = 60000; // 60s - reduced frequency for serverless
const MAX_BATCH_SIZE = 10; // Limit operations per sync cycle

/**
 * Wraps a promise with a timeout for Vercel serverless compatibility
 */
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
        )
    ]);
}

class SyncManager {
    private syncTimeout: ReturnType<typeof setTimeout> | null = null;
    private isSyncing = false;
    private initialized = false;

    // Lazy initialization for cold start optimization
    private ensureInitialized(): void {
        if (this.initialized) return;
        this.initialized = true;
        // Any one-time setup can go here
    }

    // Schedule a sync operation (debounced)
    scheduleSync(operation: SyncOperation): void {
        this.ensureInitialized();

        // Add to queue
        localCache.syncQueue.add(operation);

        // Clear existing timeout
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        // Schedule new sync with increased delay for Vercel
        this.syncTimeout = setTimeout(() => {
            this.syncNow();
        }, SYNC_DELAY);
    }

    // Force immediate sync with timeout safeguards
    async syncNow(): Promise<void> {
        if (!isFirebaseEnabled() || this.isSyncing) return;

        this.isSyncing = true;
        const queue = localCache.syncQueue.get();

        // Limit batch size to prevent timeouts
        const limitedQueue = queue.slice(0, MAX_BATCH_SIZE);
        const remaining = queue.slice(MAX_BATCH_SIZE);

        try {
            // Group operations by type and userId
            const grouped = this.groupOperations(limitedQueue);

            // Sync each group with timeout protection
            for (const [key, operations] of Object.entries(grouped)) {
                try {
                    await withTimeout(
                        this.syncGroup(operations),
                        VERCEL_FUNCTION_TIMEOUT,
                        `Sync ${key}`
                    );
                } catch (error) {
                    console.warn(`Sync group ${key} failed:`, error);
                    // Continue with other groups, don't fail entire sync
                }
            }

            // Clear synced items, keep remaining for next cycle
            if (remaining.length > 0) {
                localCache.syncQueue.set(remaining);
                // Schedule next batch
                this.syncTimeout = setTimeout(() => this.syncNow(), 5000);
            } else {
                localCache.syncQueue.clear();
            }
        } catch (error) {
            console.error("Sync error:", error);
            // Keep queue for retry
        } finally {
            this.isSyncing = false;
        }
    }

    private groupOperations(operations: SyncOperation[]): Record<string, SyncOperation[]> {
        const grouped: Record<string, SyncOperation[]> = {};

        operations.forEach(op => {
            const key = `${op.type}-${op.userId}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(op);
        });

        return grouped;
    }

    private async syncGroup(operations: SyncOperation[]): Promise<void> {
        if (operations.length === 0) return;

        const latest = operations[operations.length - 1]; // Get most recent

        try {
            if (latest.type === "progress") {
                await updateProgress(latest.userId, latest.data);
            } else if (latest.type === "profile") {
                await updateUserProfile(latest.userId, latest.data);
            }
        } catch (error) {
            console.error(`Error syncing ${latest.type}:`, error);
            throw error;
        }
    }

    // Sync progress from Firebase to local cache (with timeout)
    async pullProgress(userId: string): Promise<void> {
        if (!isFirebaseEnabled()) return;

        try {
            const firebaseProgress = await withTimeout(
                getProgress(userId),
                VERCEL_FUNCTION_TIMEOUT,
                "pullProgress"
            );
            if (firebaseProgress) {
                localCache.progress.set(firebaseProgress);
            }
        } catch (error) {
            console.error("Error pulling progress:", error);
            // Don't throw - allow app to continue with local cache
        }
    }

    // Clean up on logout
    cleanup(): void {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        this.initialized = false;
    }
}

export const syncManager = new SyncManager();
