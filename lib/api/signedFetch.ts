"use client";

import { generateSignature, getSignatureHeaders } from './signing';

/**
 * Endpoint mapping for obfuscation
 * Real endpoints hidden behind cryptic codes
 */
const ENDPOINT_MAP: Record<string, string> = {
    // Courses
    'c': '/api/courses',
    'c.s': '/api/courses/search',
    'c.r': '/api/courses/related',

    // AI
    'a.c': '/api/ai/chat',
    'a.r': '/api/ai/recommend',
    'a.i': '/api/ai/improve',
    'a.g': '/api/ai/generate-image',

    // Upload
    'u': '/api/upload',
    'u.i': '/api/upload-image',

    // Auth
    'auth.s': '/api/auth/set-token',
    'auth.c': '/api/auth/clear-token',
};

/**
 * Decode obfuscated endpoint
 */
export function decodeEndpoint(code: string): string {
    return ENDPOINT_MAP[code] || code;
}

/**
 * Get obfuscated code for endpoint
 */
export function encodeEndpoint(path: string): string {
    for (const [code, endpoint] of Object.entries(ENDPOINT_MAP)) {
        if (endpoint === path) return code;
    }
    return path;
}

interface SignedFetchOptions extends RequestInit {
    /** Use obfuscated endpoint code instead of full path */
    endpoint?: string;
    /** Skip signature (for public endpoints) */
    skipSigning?: boolean;
}

/**
 * Signed fetch wrapper - automatically signs requests
 */
export async function signedFetch(
    urlOrCode: string,
    options: SignedFetchOptions = {}
): Promise<Response> {
    const { endpoint, skipSigning, ...fetchOptions } = options;

    // Decode endpoint if obfuscated code provided
    const path = endpoint ? decodeEndpoint(urlOrCode) : urlOrCode;
    const fullUrl = path.startsWith('/') ? path : `/${path}`;

    if (skipSigning) {
        return fetch(fullUrl, fetchOptions);
    }

    const method = (fetchOptions.method || 'GET').toUpperCase();
    const body = fetchOptions.body ? String(fetchOptions.body) : '';
    const timestamp = Date.now();

    // Generate signature
    const signature = await generateSignature(method, fullUrl, body, timestamp);
    const signatureHeaders = getSignatureHeaders(signature, timestamp);

    // Merge headers
    const headers = new Headers(fetchOptions.headers);
    Object.entries(signatureHeaders).forEach(([key, value]) => {
        headers.set(key, value);
    });

    return fetch(fullUrl, {
        ...fetchOptions,
        headers,
    });
}

/**
 * Convenience methods
 */
export const api = {
    /** GET request with signing */
    get: (url: string, options?: SignedFetchOptions) =>
        signedFetch(url, { ...options, method: 'GET' }),

    /** POST request with signing */
    post: (url: string, body: unknown, options?: SignedFetchOptions) =>
        signedFetch(url, {
            ...options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...options?.headers as Record<string, string> },
            body: JSON.stringify(body),
        }),

    /** PUT request with signing */
    put: (url: string, body: unknown, options?: SignedFetchOptions) =>
        signedFetch(url, {
            ...options,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...options?.headers as Record<string, string> },
            body: JSON.stringify(body),
        }),

    /** DELETE request with signing */
    delete: (url: string, options?: SignedFetchOptions) =>
        signedFetch(url, { ...options, method: 'DELETE' }),
};

/**
 * Usage examples:
 * 
 * // Normal usage with obfuscation
 * const response = await api.post('a.c', { message: 'hello' });
 * 
 * // Direct path (no obfuscation)
 * const response = await api.get('/api/courses');
 * 
 * // Skip signing for public endpoints
 * const response = await api.get('/api/courses', { skipSigning: true });
 */
