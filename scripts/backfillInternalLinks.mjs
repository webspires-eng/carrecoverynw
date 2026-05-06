/**
 * Retrofit nearby_areas_slugs + internal_links_from for every active area.
 *
 *   node scripts/backfillInternalLinks.mjs
 *
 * Idempotent. Does NOT trigger ISR — call POST /api/admin/revalidate-all
 * after this finishes to flush the static cache.
 *
 * Estimated runtime: ~5–10 minutes for 334 areas.
 *
 * Algorithm mirrors src/lib/internalLinking.ts:
 *   - For each active area with geo, compute the 6 nearest active areas.
 *   - Store in `nearby_areas_slugs`.
 *   - For every neighbour within 25 km, record the source area in
 *     `internal_links_from`. We do this as a second pass so the inbound
 *     list is fully populated even when areas are processed in order.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient } from 'mongodb';

const NEAREST_LIMIT = 6;
const REVERSE_LINK_RADIUS_KM = 25;
const BATCH = 10;
const EARTH_RADIUS_KM = 6371;

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

function toRad(d) { return (d * Math.PI) / 180; }
function haversineKm(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
function hasGeo(a) {
    return typeof a.latitude === 'number' &&
        typeof a.longitude === 'number' &&
        !Number.isNaN(a.latitude) &&
        !Number.isNaN(a.longitude);
}

async function processInBatches(items, batchSize, worker) {
    for (let i = 0; i < items.length; i += batchSize) {
        const slice = items.slice(i, i + batchSize);
        await Promise.all(slice.map(worker));
        console.log(`Processed ${Math.min(i + batchSize, items.length)}/${items.length}...`);
    }
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db('carrecoverynw');
const areas = db.collection('areas');

console.log('Loading active areas...');
const all = (await areas
    .find(
        { is_active: true },
        { projection: { slug: 1, name: 1, county: 1, latitude: 1, longitude: 1 } }
    )
    .toArray()).filter(hasGeo);
console.log(`Loaded ${all.length} active areas with geo coordinates.`);

// Pass 1: outbound (nearest 6 per area)
const outboundBySlug = new Map();
console.log('\nPass 1: computing nearest 6 per area...');
await processInBatches(all, BATCH, async (self) => {
    const nearest = all
        .filter((a) => a.slug !== self.slug)
        .map((a) => ({
            slug: a.slug,
            distanceKm: haversineKm(self.latitude, self.longitude, a.latitude, a.longitude),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, NEAREST_LIMIT);
    const slugs = nearest.map((n) => n.slug);
    outboundBySlug.set(self.slug, slugs);
    await areas.updateOne(
        { slug: self.slug },
        { $set: { nearby_areas_slugs: slugs, updated_at: new Date() } }
    );
});

// Pass 2: inbound from text mentions + reverse-radius
// inbound[X] = every area within 25km of X that is among X's geo-neighbours
console.log('\nPass 2: computing inbound links from reverse radius + text mentions...');
const inboundBySlug = new Map();
function pushInbound(target, source) {
    const set = inboundBySlug.get(target) || new Set();
    set.add(source);
    inboundBySlug.set(target, set);
}

for (const source of all) {
    for (const target of all) {
        if (source.slug === target.slug) continue;
        const d = haversineKm(source.latitude, source.longitude, target.latitude, target.longitude);
        if (d < REVERSE_LINK_RADIUS_KM) {
            // Source links TO target via outbound? then target gets inbound from source
            const sourceOutbound = outboundBySlug.get(source.slug) || [];
            if (sourceOutbound.includes(target.slug)) {
                pushInbound(target.slug, source.slug);
            }
        }
    }
}

console.log('\nWriting internal_links_from to DB...');
const inboundEntries = Array.from(inboundBySlug.entries());
await processInBatches(inboundEntries, BATCH, async ([slug, set]) => {
    await areas.updateOne(
        { slug },
        { $set: { internal_links_from: Array.from(set), updated_at: new Date() } }
    );
});

// Make sure areas with zero inbound get an empty array (not absent)
const allSlugs = all.map((a) => a.slug);
await areas.updateMany(
    { slug: { $in: allSlugs }, internal_links_from: { $exists: false } },
    { $set: { internal_links_from: [] } }
);

console.log('\nDone.');
console.log(`  outbound rows written: ${outboundBySlug.size}`);
console.log(`  inbound rows written:  ${inboundBySlug.size}`);
console.log('\nNext step: trigger ISR for every active page:');
console.log('  curl -X POST https://www.cartowingnearme.co.uk/api/admin/revalidate-all \\');
console.log('       -H "Cookie: admin_session=<your-session>"');

await client.close();
