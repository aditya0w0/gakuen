/**
 * HMAC Request Signing for API Protection
 * 
 * This prevents:
 * 1. Request tampering - signature changes if payload modified
 * 2. Replay attacks - timestamp validation
 * 3. Unauthorized API access - requires secret key
 */

// Signing secret - should be in env vars in production
const SIGNING_SECRET = process.env.API_SIGNING_SECRET || 'gakuen-api-secret-key-2024';

// Max age for signed requests (5 minutes)
const MAX_REQUEST_AGE_MS = 5 * 60 * 1000;

/**
 * Generate HMAC signature for a request
 * @param method - HTTP method
 * @param path - API path
 * @param body - Request body (stringified JSON)
 * @param timestamp - Unix timestamp in ms
 */
export async function generateSignature(
    method: string,
    path: string,
    body: string,
    timestamp: number
): Promise<string> {
    const message = `${method}:${path}:${body}:${timestamp}`;

    // Use Web Crypto API (works in both browser and Node)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SIGNING_SECRET);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert to hex string
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Verify HMAC signature from a request
 */
export async function verifySignature(
    method: string,
    path: string,
    body: string,
    timestamp: number,
    signature: string
): Promise<{ valid: boolean; error?: string }> {
    // Check timestamp age
    const now = Date.now();
    const age = now - timestamp;

    if (age > MAX_REQUEST_AGE_MS) {
        return { valid: false, error: 'Request expired' };
    }

    if (age < 0) {
        return { valid: false, error: 'Invalid timestamp (future)' };
    }

    // Generate expected signature
    const expectedSignature = await generateSignature(method, path, body, timestamp);

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
        return { valid: false, error: 'Invalid signature' };
    }

    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (mismatch !== 0) {
        return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
}

/**
 * Get signature headers for a request
 */
export function getSignatureHeaders(signature: string, timestamp: number): Record<string, string> {
    return {
        'X-Signature': signature,
        'X-Timestamp': String(timestamp),
    };
}
