import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Single-flight connection cache. The promise (not the resolved client) is
// cached so that concurrent first callers — e.g. the flood of parallel page
// renders at the start of a static build — share ONE connection attempt
// instead of each spawning its own MongoClient. Without this, build workers
// opened hundreds of simultaneous connections and Atlas rate-limiting
// surfaced as "Server selection timed out" errors mid-build.
//
// The promise lives on globalThis, not in a module variable: Next.js can load
// this file more than once in one process (pages and API routes are bundled as
// separate module graphs, and dev hot-reload re-evaluates it), and each copy
// of a module variable would open its own client and pool.
const CACHE_KEY = Symbol.for('carrecoverynw.mongoClientPromise');

export async function connectToDatabase() {
    if (!uri) {
        throw new Error('Missing MONGODB_URI environment variable');
    }

    if (!globalThis[CACHE_KEY]) {
        const client = new MongoClient(uri, {
            // Builds run up to 7 parallel workers, each with its own client;
            // keep per-process pools small so the total stays low.
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 15000,
            // Shows up in the MongoDB log, so app connections can be told
            // apart from health checks and one-off scripts.
            appName: 'carrecoverynw-web',
        });
        globalThis[CACHE_KEY] = client.connect().catch((err) => {
            // Reset so the next caller can retry with a fresh client.
            globalThis[CACHE_KEY] = null;
            throw err;
        });
    }

    const client = await globalThis[CACHE_KEY];
    return { client, db: client.db('carrecoverynw') };
}

export default connectToDatabase;
