/**
 * Adds the internal-linking fields to every existing area document.
 * Idempotent — safe to run multiple times.
 *
 * Run:  node scripts/migrate-internal-linking.mjs
 *
 * New fields (snake_case, matches existing schema):
 *   - nearby_areas_slugs   : string[]  (default [])
 *   - internal_links_from  : string[]  (default [])
 *   - linked_in_content    : boolean   (default false)
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

const client = new MongoClient(uri);
await client.connect();
const db = client.db('carrecoverynw');
const areas = db.collection('areas');

const result = await areas.updateMany(
    {
        $or: [
            { nearby_areas_slugs: { $exists: false } },
            { internal_links_from: { $exists: false } },
            { linked_in_content: { $exists: false } },
        ],
    },
    {
        $set: {
            nearby_areas_slugs: [],
            internal_links_from: [],
            linked_in_content: false,
        },
    }
);

await areas.createIndex({ slug: 1 }, { unique: true });
await areas.createIndex({ is_active: 1 });
await areas.createIndex({ internal_links_from: 1 });

console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount} documents.`);
await client.close();
