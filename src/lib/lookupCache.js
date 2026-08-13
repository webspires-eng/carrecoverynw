// Cache for billed upstream lookups (DVLA, Google).
//
// Stored in MongoDB rather than process memory on purpose: serverless
// instances are short-lived and numerous, so an in-memory cache would miss
// nearly every time — which is the opposite of the point when every miss is a
// charged API call.
//
// Documents use the cache key as _id (no secondary index needed) and expire
// via a TTL index on `expiresAt`.
import { connectToDatabase } from '@/lib/db';

const COLLECTION = 'lookupCache';

let indexPromise = null;

async function getCollection() {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    if (!indexPromise) {
        // expireAfterSeconds: 0 means "delete once expiresAt is in the past".
        indexPromise = collection
            .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expiresAt_ttl' })
            .catch((err) => {
                indexPromise = null;
                throw err;
            });
    }
    await indexPromise;

    return collection;
}

/**
 * Read a cached value, or null on a miss.
 *
 * Mongo's TTL monitor only sweeps about once a minute, so expired documents
 * can still be present — check `expiresAt` here rather than trusting the sweep.
 * A cache failure must never break the request, so errors resolve to a miss.
 */
export async function getCached(key) {
    try {
        const collection = await getCollection();
        const row = await collection.findOne({ _id: key });

        if (!row) return null;
        if (row.expiresAt && new Date(row.expiresAt).getTime() <= Date.now()) return null;

        return row.value;
    } catch (error) {
        console.error('[lookupCache] read failed:', error.message);
        return null;
    }
}

/** Write a value. Fire-and-forget — never make the caller wait on the cache. */
export function setCached(key, value, ttlSeconds) {
    getCollection()
        .then((collection) =>
            collection.updateOne(
                { _id: key },
                { $set: { value, expiresAt: new Date(Date.now() + ttlSeconds * 1000), cachedAt: new Date() } },
                { upsert: true }
            )
        )
        .catch((error) => console.error('[lookupCache] write failed:', error.message));
}
