"use client";

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this when rendering user-generated HTML content
 */
export function sanitizeHtml(dirty: string): string {
    if (typeof window === 'undefined') {
        // Server-side: return escaped version
        return dirty
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    return DOMPurify.sanitize(dirty, {
        // Allow safe HTML tags
        ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr',
            'ul', 'ol', 'li',
            'strong', 'b', 'em', 'i', 'u', 's', 'strike',
            'a', 'img',
            'blockquote', 'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span',
        ],
        // Allow safe attributes
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'id',
            'target', 'rel',
        ],
        // Force links to open in new tab safely
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target', 'rel'],
    });
}

/**
 * Sanitize and render markdown-style content
 * Converts markdown to HTML and sanitizes
 */
export function sanitizeMarkdown(markdown: string): string {
    // This is a simple wrapper - use with a markdown library
    return sanitizeHtml(markdown);
}

/**
 * Create a safe anchor tag
 */
export function createSafeLink(url: string, text: string): string {
    const sanitizedUrl = sanitizeUrl(url);
    const sanitizedText = escapeHtml(text);
    return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${sanitizedText}</a>`;
}

/**
 * Sanitize URL to prevent javascript: and data: attacks
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    if (
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:')
    ) {
        return '#';
    }

    return url;
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * React hook for sanitized HTML rendering
 */
export function useSanitizedHtml(dirty: string): string {
    // Memoization can be added here if needed
    return sanitizeHtml(dirty);
}
