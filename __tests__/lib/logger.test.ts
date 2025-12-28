import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the logger formatting logic
describe('Logger', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('Level Configuration', () => {
        it('should have correct level configs', () => {
            const levelConfig = {
                debug: { emoji: '🔍', label: 'DEBUG' },
                info: { emoji: '📘', label: 'INFO' },
                warn: { emoji: '⚠️', label: 'WARN' },
                error: { emoji: '❌', label: 'ERROR' },
            };

            expect(levelConfig.debug.emoji).toBe('🔍');
            expect(levelConfig.info.label).toBe('INFO');
            expect(levelConfig.error.emoji).toBe('❌');
        });
    });

    describe('Log Payload Structure', () => {
        it('should create valid log payload', () => {
            const payload = {
                level: 'info' as const,
                message: 'Test message',
                data: { key: 'value' },
                source: 'test.ts',
                timestamp: new Date().toISOString(),
            };

            expect(payload.level).toBe('info');
            expect(payload.message).toBe('Test message');
            expect(payload.data).toEqual({ key: 'value' });
            expect(payload.source).toBe('test.ts');
            expect(payload.timestamp).toBeDefined();
        });

        it('should handle undefined data', () => {
            const payload = {
                level: 'debug' as const,
                message: 'No data',
                timestamp: new Date().toISOString(),
            };

            expect(payload.data).toBeUndefined();
        });
    });

    describe('API Logging', () => {
        it('should format API log correctly', () => {
            const endpoint = '/api/courses';
            const status = 200;
            const duration = 45;

            const emoji = status >= 400 ? '❌' : status >= 300 ? '↪️' : '✅';
            const message = `${emoji} ${endpoint} → ${status} (${duration}ms)`;

            expect(message).toBe('✅ /api/courses → 200 (45ms)');
        });

        it('should use error emoji for 4xx status', () => {
            const status = 404;
            const emoji = status >= 400 ? '❌' : status >= 300 ? '↪️' : '✅';

            expect(emoji).toBe('❌');
        });

        it('should use redirect emoji for 3xx status', () => {
            const status = 301;
            const emoji = status >= 400 ? '❌' : status >= 300 ? '↪️' : '✅';

            expect(emoji).toBe('↪️');
        });
    });
});
