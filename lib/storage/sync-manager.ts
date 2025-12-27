// Sync manager: Handles syncing between local and Firebase
import { localCache } from "./local-cache";
import { updateProgress, getProgress, updateUserProfile } from "../firebase/firestore";
import { isFirebaseEnabled } from "../firebase/config";

interface SyncOperation {
    type: "progress" | "profile";
    userId: string;
    data: any;
    timestamp: number;
}

class SyncManager {
    private syncTimeout: NodeJS.Timeout | null = null;
    private isSyncing = false;
    private readonly SYNC_DELAY = 30000; // 30 seconds

    // Schedule a sync operation (debounced)
    scheduleSync(operation: SyncOperation): void {
        // Add to queue
        localCache.syncQueue.add(operation);

        // Clear existing timeout
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        // Schedule new sync
        this.syncTimeout = setTimeout(() => {
            this.syncNow();
        }, this.SYNC_DELAY);
    }

    // Force immediate sync
    async syncNow(): Promise<void> {
        if (!isFirebaseEnabled() || this.isSyncing) return;

        this.isSyncing = true;
        const queue = localCache.syncQueue.get();

        try {
            // Group operations by type and userId
            const grouped = this.groupOperations(queue);

            // Sync each group
            for (const [key, operations] of Object.entries(grouped)) {
                await this.syncGroup(operations);
            }

            // Clear queue on success
            localCache.syncQueue.clear();
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

    // Sync progress from Firebase to local cache
    async pullProgress(userId: string): Promise<void> {
        if (!isFirebaseEnabled()) return;

        try {
            const firebaseProgress = await getProgress(userId);
            if (firebaseProgress) {
                localCache.progress.set(firebaseProgress);
            }
        } catch (error) {
            console.error("Error pulling progress:", error);
        }
    }

    // Clean up on logout
    cleanup(): void {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
    }
}

export const syncManager = new SyncManager();
