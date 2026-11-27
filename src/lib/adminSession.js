// Admin sign-in: one passcode, and a signed session cookie.
//
// The passcode lives in the ADMIN_PASSCODE environment variable (never in the
// database or the repo). Signing in sets `admin_session` to a token of the form
// `v1.<expiry>.<hmac>`; the HMAC key is built from SESSION_SECRET and the
// passcode, so a cookie cannot be forged, and changing either value signs
// everyone out.
//
// Only Web Crypto is used (no Node `crypto` import) so the same code runs in
// middleware.js as well as in API routes.
//
// `middleware.js` only guards the /admin *pages*; every admin API route must
// call requireAdmin() or adminGuard() itself.
//
// No imports on purpose: the module is unit-tested with plain `node --test`.

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

// What the rest of the app sees as "the signed-in user". There is one admin.
const ADMIN_USER = Object.freeze({ id: 'admin', email: 'admin', name: 'Admin', role: 'admin' });

const encoder = new TextEncoder();

/** True when both settings needed for admin sign-in are present. */
export function adminLoginConfigured() {
    return Boolean(process.env.ADMIN_PASSCODE && process.env.SESSION_SECRET);
}

async function hmacHex(keyMaterial, message) {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(keyMaterial),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare two strings without returning early on the first difference. */
function constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

function signingKey() {
    return `${process.env.SESSION_SECRET}:${process.env.ADMIN_PASSCODE}`;
}

/** Check a typed passcode against ADMIN_PASSCODE. False when not configured. */
export async function passcodeMatches(input) {
    if (!adminLoginConfigured() || typeof input !== 'string' || !input) return false;
    // Hash both sides first so the comparison length does not reveal anything.
    const [a, b] = await Promise.all([
        hmacHex(process.env.SESSION_SECRET, `passcode:${input}`),
        hmacHex(process.env.SESSION_SECRET, `passcode:${process.env.ADMIN_PASSCODE}`),
    ]);
    return constantTimeEqual(a, b);
}

/** New session token, valid for SESSION_MAX_AGE seconds from `now`. */
export async function createSessionToken(now = Date.now()) {
    if (!adminLoginConfigured()) throw new Error('Admin login is not configured');
    const expires = Math.floor(now / 1000) + SESSION_MAX_AGE;
    const sig = await hmacHex(signingKey(), `admin:${expires}`);
    return `v1.${expires}.${sig}`;
}

/** True only for an unexpired token signed with the current key. */
export async function verifySessionToken(token, now = Date.now()) {
    if (!adminLoginConfigured() || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 'v1' || !/^\d{1,12}$/.test(parts[1])) return false;
    const expires = Number(parts[1]);
    if (expires * 1000 <= now) return false;
    const expected = await hmacHex(signingKey(), `admin:${expires}`);
    return constantTimeEqual(parts[2], expected);
}

function cookieFrom(request) {
    return request?.cookies?.get?.(SESSION_COOKIE)?.value;
}

/** The signed-in admin, or null. */
export async function getAdminSession(request) {
    return (await verifySessionToken(cookieFrom(request))) ? ADMIN_USER : null;
}

/**
 * Require a signed-in admin.
 * @returns {Promise<{ ok: true, user: object } | { ok: false, status: number, error: string }>}
 */
export async function requireAdmin(request) {
    const user = await getAdminSession(request);
    if (!user) {
        return { ok: false, status: 401, error: 'You must be signed in to do that.' };
    }
    return { ok: true, user };
}

/**
 * For route handlers: a 401 response to return, or null when signed in.
 *   const denied = await adminGuard(request); if (denied) return denied;
 */
export async function adminGuard(request) {
    const auth = await requireAdmin(request);
    if (auth.ok) return null;
    return Response.json({ success: false, error: auth.error }, { status: auth.status });
}
