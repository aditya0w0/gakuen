import { useEffect, useRef } from 'react';
import { hybridStorage } from '@/lib/storage/hybrid-storage';
import { useAuth } from '@/components/auth/AuthContext';

const INTERVAL_MS = 10000; // Save every 10 seconds

export function useTimeTracker() {
    const { user } = useAuth();
    const startTimeRef = useRef<number | null>(null);
    const accumulatedMsRef = useRef(0);

    useEffect(() => {
        if (!user) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab hidden: Stop tracking and save
                if (startTimeRef.current) {
                    const elapsed = Date.now() - startTimeRef.current;
                    accumulatedMsRef.current += elapsed;
                    startTimeRef.current = null;

                    // Save accumulated time
                    saveTime();
                }
            } else {
                // Tab visible: Start tracking
                startTimeRef.current = Date.now();
            }
        };

        const saveTime = () => {
            if (accumulatedMsRef.current > 0) {
                console.log(`⏱️ Saving study time: ${accumulatedMsRef.current}ms`);
                hybridStorage.progress.trackTime(user.id, accumulatedMsRef.current);
                accumulatedMsRef.current = 0;
            }
        };

        // Start tracking immediately
        startTimeRef.current = Date.now();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Periodic save
        const interval = setInterval(() => {
            if (startTimeRef.current) {
                const now = Date.now();
                const elapsed = now - startTimeRef.current;
                accumulatedMsRef.current += elapsed;
                startTimeRef.current = now; // Reset start time for next interval
                saveTime();
            }
        }, INTERVAL_MS);

        return () => {
            // Cleanup: Save pending time
            if (startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                accumulatedMsRef.current += elapsed;
            }
            saveTime();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [user]);
}
