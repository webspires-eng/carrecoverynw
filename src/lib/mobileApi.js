// Shared plumbing for every /api/mobile/* endpoint: CORS, response shape,
// and the auth + throttle + scope check.
//
// Keeping this in one place means a change to how keys are checked applies to
// all endpoints at once, and every route answers errors in the single shape
// the app knows how to display: {"message": "..."}.
import { NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rateLimit';

// Native apps don't enforce CORS, but a webview/Expo-web build does.
// Safe to allow broadly: auth is a header key, not a cookie.
export const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization, If-Unmodified-Since',
    // Without this a browser/webview client cannot read Retry-After on a 429.
    'Access-Control-Expose-Headers': 'Retry-After',
    'Access-Control-Max-Age': '86400',
};

export function json(body, status = 200, extraHeaders = {}) {
    return NextResponse.json(body, { status, headers: { ...CORS_HEADERS, ...extraHeaders } });
}

/** Human-readable error, in the shape the app displays to the user. */
export function fail(message, status) {
    return json({ message }, status);
}

export function preflight() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Authenticate the key, throttle it, and check it carries `scope`.
 *
 * @param {Request} request
 * @param {'read'|'write'} scope
 * @returns {Promise<Response|null>} A response to return as-is, or null when
 *          the request may proceed.
 */
export async function guard(request, scope) {
    const auth = await verifyApiKey(request);
    if (!auth.ok) return fail(auth.message, auth.status);

    // Throttle per key, so one leaked key can't quietly scrape every record.
    // Legacy env-var auth has no key id — give it its own bucket.
    const limit = checkRateLimit(auth.keyId ? auth.keyId.toString() : 'legacy-env-key');
    if (!limit.ok) {
        return json(
            { message: 'Too many requests. Please wait a moment and try again.' },
            429,
            { 'Retry-After': String(limit.retryAfter) }
        );
    }

    if (!auth.scopes.includes(scope)) {
        return fail(
            scope === 'write'
                ? 'This API key is read-only and cannot create or change bookings.'
                : 'This API key does not have permission to read data.',
            403
        );
    }

    return null;
}

/**
 * fetch() with a timeout, so a hanging upstream can't hold a serverless
 * function open until the platform kills it.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}
