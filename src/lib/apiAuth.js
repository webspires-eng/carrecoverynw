import { timingSafeEqual } from 'node:crypto';
import { findActiveKey, touchLastUsed } from '@/lib/apiKeys';

// Legacy single-secret fallback, kept only for the migration window.
// Once a key issued from the admin dashboard is live in the mobile app,
// delete MOBILE_API_KEY from the environment and this branch goes dead.
const LEGACY_ENV_KEY = 'MOBILE_API_KEY';

function safeEquals(a, b) {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    // timingSafeEqual throws on length mismatch, so compare lengths first.
    // The length itself is not secret; the key contents are.
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
}

/** Pull the key out of either accepted header. */
function extractKey(request) {
    const headerKey = request.headers.get('x-api-key');
    if (headerKey) return headerKey.trim();

    const bearer = request.headers.get('authorization');
    if (bearer?.toLowerCase().startsWith('bearer ')) {
        return bearer.slice(7).trim();
    }

    return null;
}

/**
 * Verify the caller's API key against the `apiKeys` collection.
 *
 * Accepts either header, so the app can use whichever its HTTP client
 * makes easiest:
 *   X-API-Key: <key>
 *   Authorization: Bearer <key>
 *
 * Unknown, revoked, and malformed keys all fail identically — the response
 * must never reveal whether a key ever existed.
 *
 * @returns {Promise<{ ok: true, keyId: ObjectId|null, label: string, scopes: string[] }
 *                 | { ok: false, status: number, message: string }>}
 */
export async function verifyApiKey(request) {
    const supplied = extractKey(request);

    if (!supplied) {
        return { ok: false, status: 401, message: 'Missing API key.' };
    }

    let record;
    try {
        record = await findActiveKey(supplied);
    } catch (error) {
        // Database trouble is our problem, not the caller's — don't report it
        // as an auth failure, and never fall open.
        console.error('[apiAuth] Key lookup failed:', error.message);
        return { ok: false, status: 503, message: 'Could not verify the API key right now. Please try again.' };
    }

    if (record) {
        touchLastUsed(record._id);   // fire-and-forget
        return {
            ok: true,
            keyId: record._id,
            label: record.label,
            scopes: record.scopes?.length ? record.scopes : ['read', 'write'],
        };
    }

    // --- migration fallback -------------------------------------------------
    const legacy = process.env[LEGACY_ENV_KEY];
    if (legacy && safeEquals(supplied, legacy)) {
        console.warn(
            `[apiAuth] Request authenticated with the legacy ${LEGACY_ENV_KEY} env var. ` +
            'Issue a key from Admin → Settings → Mobile API keys, then remove this variable.'
        );
        return { ok: true, keyId: null, label: 'legacy-env-key', scopes: ['read', 'write'] };
    }
    // ------------------------------------------------------------------------

    return { ok: false, status: 401, message: 'Invalid API key.' };
}
