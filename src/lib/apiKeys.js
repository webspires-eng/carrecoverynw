// Mobile API key storage.
//
// Keys are stored as SHA-256 hashes, never in plaintext. If the database
// leaks, the hashes are not usable as credentials. The consequence is that
// the dashboard genuinely cannot show an existing key — the plaintext is
// returned exactly once, at creation, and is unrecoverable after that.
//
// SHA-256 (not bcrypt/argon2) is the right choice here: these are 256-bit
// random keys, not user-chosen passwords, so there is nothing to brute-force
// and the lookup runs on every single API request.
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';

const COLLECTION = 'apiKeys';

export const SCOPES = ['read', 'write'];
const DEFAULT_SCOPES = ['read', 'write'];

// createIndex is idempotent but still a round trip, so only do it once per
// process. On failure the promise is cleared so the next call can retry.
let indexPromise = null;

async function getCollection() {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    if (!indexPromise) {
        indexPromise = collection
            .createIndex({ keyHash: 1 }, { unique: true, name: 'keyHash_unique' })
            .catch((err) => {
                indexPromise = null;
                throw err;
            });
    }
    await indexPromise;

    return collection;
}

export function hashKey(plaintext) {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
}

/** Shape a record for the dashboard. Never includes the hash. */
function present(row) {
    return {
        id: row._id.toString(),
        label: row.label,
        prefix: row.prefix,
        scopes: row.scopes?.length ? row.scopes : DEFAULT_SCOPES,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        createdBy: row.createdBy || null,
        lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
        revokedAt: row.revokedAt ? new Date(row.revokedAt).toISOString() : null,
        active: !row.revokedAt,
    };
}

/**
 * Issue a new key.
 * @returns {{ key: string, record: object }} `key` is the plaintext — return it
 *          to the caller once, then discard it. It cannot be recovered.
 */
export async function createApiKey({ label, scopes, createdBy }) {
    const collection = await getCollection();

    const key = crypto.randomBytes(32).toString('hex');
    const requested = Array.isArray(scopes) ? scopes.filter((s) => SCOPES.includes(s)) : [];

    const doc = {
        label: String(label).trim(),
        keyHash: hashKey(key),
        prefix: key.slice(0, 8),
        scopes: requested.length ? requested : DEFAULT_SCOPES,
        createdAt: new Date(),
        createdBy: createdBy || null,
        lastUsedAt: null,
        revokedAt: null,
    };

    const result = await collection.insertOne(doc);

    return { key, record: present({ ...doc, _id: result.insertedId }) };
}

/** All keys, newest first. Revoked ones are included so the list stays honest. */
export async function listApiKeys() {
    const collection = await getCollection();
    const rows = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return rows.map(present);
}

/**
 * Look up an active key by its plaintext.
 * Returns null for unknown AND revoked keys — the caller must not be able to
 * tell the difference.
 */
export async function findActiveKey(plaintext) {
    const collection = await getCollection();
    return collection.findOne({ keyHash: hashKey(plaintext), revokedAt: null });
}

/**
 * Record that a key was just used. Fire-and-forget: a request must never wait
 * on this write, and a failure here must never fail the request.
 */
export function touchLastUsed(id) {
    connectToDatabase()
        .then(({ db }) => db.collection(COLLECTION).updateOne({ _id: id }, { $set: { lastUsedAt: new Date() } }))
        .catch((err) => console.error('[apiKeys] lastUsedAt update failed:', err.message));
}

/** Revoke a key. Takes effect on the next request; no redeploy needed. */
export async function revokeApiKey(id) {
    if (!ObjectId.isValid(id)) return { ok: false, reason: 'not-found' };

    const collection = await getCollection();
    const result = await collection.updateOne(
        { _id: new ObjectId(id), revokedAt: null },
        { $set: { revokedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
        // Either no such key, or it was already revoked. Both are no-ops.
        const exists = await collection.findOne({ _id: new ObjectId(id) }, { projection: { _id: 1 } });
        return { ok: false, reason: exists ? 'already-revoked' : 'not-found' };
    }

    return { ok: true };
}
