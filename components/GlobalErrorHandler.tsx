"use client";

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Global error handler component
 * Catches uncaught errors and promise rejections, sends to server
 */
export function GlobalErrorHandler() {
    useEffect(() => {
        // Handle uncaught errors
        const handleError = (event: ErrorEvent) => {
            logger.error('Uncaught error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            }, 'Window');
        };

        // Handle unhandled promise rejections
        const handleRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            logger.error('Unhandled promise rejection', {
                message: reason?.message || String(reason),
                stack: reason?.stack?.split('\n').slice(0, 3).join('\n'),
            }, 'Promise');
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null; // This component renders nothing
}
