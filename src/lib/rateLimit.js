// Per-key request throttling for the mobile API.
//
// The key lives inside a mobile app, and mobile apps can be unpacked — so
// assume a key will leak eventually. This does not prevent that; it makes the
// aftermath slow and noisy instead of a single quiet scrape of every customer
// record.
//
// LIMITATION, worth knowing: this counter is in-process memory. On Vercel each
// serverless instance has its own, so the real ceiling is roughly
// MAX_REQUESTS × (number of warm instances), and it resets on cold start. That
// is a weak guarantee but a useful one — it turns "download everything in
// seconds" into something that takes a long time and shows up in the logs. A
// hard global limit would need shared state (Redis, or a Mongo counter on
// every request); worth doing only if this proves insufficient.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

// bucketKey -> { count, resetAt }
const buckets = new Map();

// Stop the map growing without bound on a long-lived instance.
function prune(now) {
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

/**
 * Count a request against a bucket.
 *
 * @param {string} bucketKey  Usually the API key's id.
 * @returns {{ ok: true, remaining: number } | { ok: false, retryAfter: number }}
 *          `retryAfter` is in seconds, for the Retry-After header.
 */
export function checkRateLimit(bucketKey, { max = MAX_REQUESTS, windowMs = WINDOW_MS } = {}) {
    const now = Date.now();

    // Cheap opportunistic cleanup — no timers to leak in a serverless runtime.
    if (buckets.size > 500) prune(now);

    const existing = buckets.get(bucketKey);

    if (!existing || existing.resetAt <= now) {
        buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
        return { ok: true, remaining: max - 1 };
    }

    if (existing.count >= max) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
    }

    existing.count += 1;
    return { ok: true, remaining: max - existing.count };
}
