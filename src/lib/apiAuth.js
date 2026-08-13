import { timingSafeEqual } from 'node:crypto';

// Shared secret for the mobile app's booking API.
// Set MOBILE_API_KEY in the Vercel project env vars; without it the API
// refuses every request rather than falling open.
const ENV_KEY = 'MOBILE_API_KEY';

function safeEquals(a, b) {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    // timingSafeEqual throws on length mismatch, so compare lengths first.
    // The length itself is not secret; the key contents are.
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
}

/**
 * Verify the caller's API key.
 *
 * Accepts either header, so the app can use whichever its HTTP client
 * makes easiest:
 *   X-API-Key: <key>
 *   Authorization: Bearer <key>
 *
 * @returns {{ ok: true } | { ok: false, status: number, message: string }}
 */
export function verifyApiKey(request) {
    const expected = process.env[ENV_KEY];

    if (!expected) {
        // Misconfiguration, not a client error — never fall open.
        console.error(`[apiAuth] ${ENV_KEY} is not set; rejecting request.`);
        return { ok: false, status: 503, message: 'The API is not configured yet. Please contact support.' };
    }

    const headerKey = request.headers.get('x-api-key');
    const bearer = request.headers.get('authorization');
    const bearerKey = bearer?.toLowerCase().startsWith('bearer ')
        ? bearer.slice(7).trim()
        : null;

    const supplied = headerKey || bearerKey;

    if (!supplied) {
        return { ok: false, status: 401, message: 'Missing API key.' };
    }

    if (!safeEquals(supplied, expected)) {
        return { ok: false, status: 401, message: 'Invalid API key.' };
    }

    return { ok: true };
}
