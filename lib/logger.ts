/**
 * Centralized Logger - Routes client logs to server terminal
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Failed to load', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
    level: LogLevel;
    message: string;
    data?: any;
    source?: string;
    timestamp: string;
}

// Detect if we're on server or client
const isServer = typeof window === 'undefined';

// Terminal colors for server-side logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

const levelConfig = {
    debug: { emoji: '🔍', color: colors.gray, label: 'DEBUG' },
    info: { emoji: '📘', color: colors.cyan, label: 'INFO' },
    warn: { emoji: '⚠️', color: colors.yellow, label: 'WARN' },
    error: { emoji: '❌', color: colors.red, label: 'ERROR' },
};

function formatServerLog(payload: LogPayload): string {
    const config = levelConfig[payload.level];
    const time = new Date(payload.timestamp).toLocaleTimeString();
    const source = payload.source ? `${colors.dim}[${payload.source}]${colors.reset}` : '';

    let output = `${config.emoji} ${config.color}${config.label}${colors.reset} ${colors.dim}${time}${colors.reset} ${source} ${payload.message}`;

    if (payload.data) {
        const dataStr = typeof payload.data === 'object'
            ? JSON.stringify(payload.data, null, 2)
            : String(payload.data);
        output += `\n${colors.dim}${dataStr}${colors.reset}`;
    }

    return output;
}

async function sendToServer(payload: LogPayload): Promise<void> {
    try {
        // Fire and forget - don't await to avoid blocking
        fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(() => {
            // Silently fail if log endpoint is down
        });
    } catch {
        // Silently fail
    }
}

function createLogFn(level: LogLevel) {
    return (message: string, data?: any, source?: string) => {
        const payload: LogPayload = {
            level,
            message,
            data,
            source: source || getCallerSource(),
            timestamp: new Date().toISOString(),
        };

        if (isServer) {
            // Server: print directly to terminal
            console.log(formatServerLog(payload));
        } else {
            // Client: send to server API
            sendToServer(payload);

            // Also keep minimal console output for dev tools debugging
            if (level === 'error') {
                console.error(`[${level.toUpperCase()}] ${message}`);
            }
        }
    };
}

function getCallerSource(): string {
    try {
        const stack = new Error().stack;
        if (!stack) return '';

        const lines = stack.split('\n');
        // Skip Error, createLogFn, and the actual log method
        const callerLine = lines[4] || '';

        // Extract filename from stack trace
        const match = callerLine.match(/\/([^\/]+\.(tsx?|jsx?)):/);
        return match ? match[1] : '';
    } catch {
        return '';
    }
}

export const logger = {
    debug: createLogFn('debug'),
    info: createLogFn('info'),
    warn: createLogFn('warn'),
    error: createLogFn('error'),

    // Convenience method for logging API responses
    api: (endpoint: string, status: number, duration?: number) => {
        const emoji = status >= 400 ? '❌' : status >= 300 ? '↪️' : '✅';
        const durationStr = duration ? ` (${duration}ms)` : '';
        createLogFn(status >= 400 ? 'error' : 'info')(
            `${emoji} ${endpoint} → ${status}${durationStr}`,
            undefined,
            'API'
        );
    },
};

// Export type for use in other files
export type { LogLevel, LogPayload };
