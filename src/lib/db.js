import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Single-flight connection cache. The promise (not the resolved client) is
// cached so that concurrent first callers — e.g. the flood of parallel page
// renders at the start of a static build — share ONE connection attempt
// instead of each spawning its own MongoClient. Without this, build workers
// opened hundreds of simultaneous connections and Atlas rate-limiting
// surfaced as "Server selection timed out" errors mid-build.
let clientPromise = null;

export async function connectToDatabase() {
    if (!uri) {
        throw new Error('Missing MONGODB_URI environment variable');
    }

    if (!clientPromise) {
        const client = new MongoClient(uri, {
            // Builds run up to 7 parallel workers, each with its own client;
            // keep per-process pools small so the total stays well under
            // Atlas shared-tier connection limits.
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 15000,
        });
        clientPromise = client.connect().catch((err) => {
            // Reset so the next caller can retry with a fresh client.
            clientPromise = null;
            throw err;
        });
    }

    const client = await clientPromise;
    return { client, db: client.db('carrecoverynw') };
}

export default connectToDatabase;
