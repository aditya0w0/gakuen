import path from 'path';

/**
 * Allowed file MIME types for uploads
 */
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
] as const;

export const ALLOWED_FILE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
] as const;

/**
 * Sanitize path to prevent traversal attacks
 * Removes ../, ..\, leading slashes, and dangerous characters
 */
export function sanitizePath(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        // Remove path traversal attempts
        .replace(/\.\.\//g, '')
        .replace(/\.\.\\/g, '')
        // Remove leading slashes
        .replace(/^[/\\]+/, '')
        // Remove null bytes
        .replace(/\0/g, '')
        // Only allow alphanumeric, dash, underscore
        .replace(/[^a-zA-Z0-9\-_]/g, '-')
        // Limit length
        .slice(0, 100);
}

/**
 * Validate file type by MIME and extension
 */
export function validateFileType(file: File): { valid: boolean; error?: string } {
    // Check MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
        return {
            valid: false,
            error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
        };
    }

    // Check extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext as any)) {
        return {
            valid: false,
            error: `Invalid file extension: ${ext}. Allowed: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
        };
    }

    // Check file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        return {
            valid: false,
            error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`
        };
    }

    return { valid: true };
}

/**
 * Sanitize string for safe output (basic XSS prevention)
 * For HTML content, use DOMPurify on client side
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        // Remove null bytes
        .replace(/\0/g, '')
        // Escape HTML entities
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Limit length
        .slice(0, 10000);
}

/**
 * Validate course ID format
 */
export function validateCourseId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    // Allow alphanumeric with dashes, 3-100 chars
    return /^[a-zA-Z0-9\-]{1,100}$/.test(id);
}

/**
 * Sanitize log message to prevent log injection
 */
export function sanitizeLogMessage(message: string): string {
    if (!message || typeof message !== 'string') {
        return '';
    }

    return message
        // Remove ANSI escape codes
        .replace(/\x1b\[[0-9;]*m/g, '')
        // Remove control characters
        .replace(/[\x00-\x1f\x7f]/g, '')
        // Limit length
        .slice(0, 1000);
}
