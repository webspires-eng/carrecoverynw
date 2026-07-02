// Geo-validation for /areas/[slug] pages.
//
// Flags any area whose displayed geography doesn't match its real location:
//   1. nearby_areas   — named towns resolved to coordinates (DB areas first,
//                       then a built-in gazetteer of major UK places); flagged
//                       when further than NEARBY_FLAG_KM from the area.
//   2. major_roads    — motorways + trunk A-roads checked against embedded
//                       corridor polylines; flagged when the road never passes
//                       within ROAD_FLAG_KM of the area. Roads not in the
//                       dataset are reported as "unverified" (not counted as
//                       mismatches).
//   3. nearby_areas_slugs — internal links checked by haversine distance
//                       between the two area docs.
// Also reports completeness gaps (empty intro_text, missing postcode,
// missing nearby_areas_slugs) used by the pruning analysis.
//
// Usage:  node scripts/validate-geo.mjs
// Output: scripts/output/geo-mismatch-report.json + geo-mismatch-report.csv
//
// Read-only: never writes to the database.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const NEARBY_FLAG_KM = 40;   // a "nearby area" further than this is wrong
const ROAD_FLAG_KM = 35;     // a listed road further than this is wrong
const LINK_FLAG_KM = 55;     // internal nearby-link further than this is wrong
                             // (rural coverage means nearest pages can be ~50 km away)

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

import { GAZETTEER, ROADS, haversineKm, distToPolylineKm, normaliseRoadName, parseArr, normName } from './geo-data.mjs';

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const areas = await db.collection('areas').find({ is_active: true }).toArray();

    const byName = new Map();
    const bySlug = new Map();
    for (const a of areas) {
        if (a.latitude && a.longitude) byName.set(normName(a.name), [a.latitude, a.longitude]);
        bySlug.set(a.slug, a);
    }
    const lookup = (name) => byName.get(normName(name)) || GAZETTEER[normName(name)] || null;

    const report = [];
    for (const a of areas) {
        if (!a.latitude || !a.longitude) {
            report.push({ slug: a.slug, name: a.name, error: 'missing coordinates' });
            continue;
        }
        const entry = {
            slug: a.slug, name: a.name, county: a.county || null,
            wrong_nearby: [], unresolved_nearby: [],
            wrong_roads: [], unverified_roads: [],
            wrong_links: [],
            completeness: {
                intro_text_empty: !String(a.intro_text || '').trim(),
                postcode_missing: !a.postcode_prefix,
                nearby_slugs_missing: !Array.isArray(a.nearby_areas_slugs) || a.nearby_areas_slugs.length === 0,
            },
        };

        for (const n of parseArr(a.nearby_areas)) {
            const pos = lookup(n);
            if (!pos) { entry.unresolved_nearby.push(n); continue; }
            const d = haversineKm(a.latitude, a.longitude, pos[0], pos[1]);
            if (d > NEARBY_FLAG_KM) entry.wrong_nearby.push({ name: n, km: Math.round(d) });
        }

        for (const r of parseArr(a.major_roads)) {
            const key = normaliseRoadName(r);
            const line = ROADS[key];
            if (!line) { entry.unverified_roads.push(String(r)); continue; }
            const d = distToPolylineKm(a.latitude, a.longitude, line);
            if (d > ROAD_FLAG_KM) entry.wrong_roads.push({ road: String(r), km: Math.round(d) });
        }

        for (const s of parseArr(a.nearby_areas_slugs)) {
            const other = bySlug.get(s);
            if (!other || !other.latitude) continue;
            const d = haversineKm(a.latitude, a.longitude, other.latitude, other.longitude);
            if (d > LINK_FLAG_KM) entry.wrong_links.push({ slug: s, km: Math.round(d) });
        }

        entry.has_mismatch = entry.wrong_nearby.length > 0 || entry.wrong_roads.length > 0 || entry.wrong_links.length > 0;
        report.push(entry);
    }

    const mismatched = report.filter((r) => r.has_mismatch);
    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'geo-mismatch-report.json'), JSON.stringify({ generated_for: areas.length, mismatched: mismatched.length, report }, null, 2));

    const csv = ['slug,name,county,wrong_nearby,wrong_roads,wrong_links,unverified_roads'];
    for (const r of mismatched) {
        const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
        csv.push([
            r.slug, esc(r.name), esc(r.county || ''),
            esc(r.wrong_nearby.map((x) => `${x.name}(${x.km}km)`).join('; ')),
            esc(r.wrong_roads.map((x) => `${x.road}(${x.km}km)`).join('; ')),
            esc(r.wrong_links.map((x) => `${x.slug}(${x.km}km)`).join('; ')),
            esc(r.unverified_roads.join('; ')),
        ].join(','));
    }
    fs.writeFileSync(path.join(outDir, 'geo-mismatch-report.csv'), csv.join('\n') + '\n');

    console.log(`Areas checked: ${areas.length}`);
    console.log(`Areas with geography mismatches: ${mismatched.length}`);
    console.log(`  - wrong nearby_areas: ${report.filter((r) => r.wrong_nearby?.length).length}`);
    console.log(`  - wrong major_roads:  ${report.filter((r) => r.wrong_roads?.length).length}`);
    console.log(`  - wrong internal links: ${report.filter((r) => r.wrong_links?.length).length}`);
    console.log(`Completeness: empty intro ${report.filter((r) => r.completeness?.intro_text_empty).length}, no postcode ${report.filter((r) => r.completeness?.postcode_missing).length}, no nearby slugs ${report.filter((r) => r.completeness?.nearby_slugs_missing).length}`);
    console.log(`\nWorst 15 offenders:`);
    for (const r of [...mismatched].sort((x, y) => (y.wrong_nearby.length + y.wrong_roads.length) - (x.wrong_nearby.length + x.wrong_roads.length)).slice(0, 15)) {
        console.log(`  ${r.slug}: ${r.wrong_nearby.length} wrong nearby, ${r.wrong_roads.length} wrong roads` +
            (r.wrong_nearby.length ? ` [${r.wrong_nearby.slice(0, 3).map((x) => x.name).join(', ')}…]` : ''));
    }
    console.log(`\nReports: scripts/output/geo-mismatch-report.{json,csv}`);
    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
