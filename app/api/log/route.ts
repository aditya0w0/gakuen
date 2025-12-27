import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { level = 'info', message, data, source, timestamp } = payload;

        const config = levelConfig[level] || levelConfig.info;
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

        if (data !== undefined) {
            const dataStr = typeof data === 'object'
                ? JSON.stringify(data, null, 2)
                : String(data);
            output += `\n${colors.dim}└─ ${dataStr}${colors.reset}`;
        }

        // Print to server terminal
        console.log(output);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(`${colors.red}❌ Log endpoint error:${colors.reset}`, error);
        return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
    }
}
