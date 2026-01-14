import { NextRequest, NextResponse } from 'next/server';
import { sanitizeLogMessage } from '@/lib/api/validators';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

// Terminal colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m',
};

const levelConfig: Record<string, { emoji: string; color: string; label: string }> = {
    debug: { emoji: '🔍', color: colors.gray, label: 'DEBUG' },
    info: { emoji: '📘', color: colors.cyan, label: 'INFO' },
    warn: { emoji: '⚠️', color: colors.yellow, label: 'WARN' },
    error: { emoji: '❌', color: colors.red, label: 'ERROR' },
};

export async function POST(request: NextRequest) {
    // Rate limiting using centralized utility
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`log:${ip}`, RateLimits.LOG);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const payload = await request.json();

        // 🔒 SECURITY: Validate and sanitize all input
        const level = ['debug', 'info', 'warn', 'error'].includes(payload.level)
            ? payload.level
            : 'info';

        // 🔒 SECURITY: Sanitize message to prevent log injection
        const message = sanitizeLogMessage(payload.message || '');
        const source = sanitizeLogMessage(payload.source || '');
        const timestamp = payload.timestamp;

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        const config = levelConfig[level];
        const time = timestamp
            ? new Date(timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString();

        // Get client info from headers
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const isChrome = userAgent.includes('Chrome');
        const isFirefox = userAgent.includes('Firefox');
        const browser = isChrome ? '🌐 Chrome' : isFirefox ? '🦊 Firefox' : '🌐 Browser';

        // Format the log output
        const sourceTag = source ? `${colors.dim}[${source}]${colors.reset}` : '';
        const browserTag = `${colors.dim}[${browser}]${colors.reset}`;

        let output = `${config.emoji} ${config.color}${colors.bright}${config.label}${colors.reset} ${colors.dim}${time}${colors.reset} ${browserTag} ${sourceTag} ${message}`;

        // 🔒 SECURITY: Sanitize data before logging
        if (payload.data !== undefined) {
            const dataStr = typeof payload.data === 'object'
                ? JSON.stringify(payload.data, null, 2).slice(0, 500)
                : String(payload.data).slice(0, 500);
            const safeData = sanitizeLogMessage(dataStr);
            output += `\n${colors.dim}└─ ${safeData}${colors.reset}`;
        }

        // Print to server terminal
        console.log(output);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(`${colors.red}❌ Log endpoint error${colors.reset}`);
        return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
    }
}
