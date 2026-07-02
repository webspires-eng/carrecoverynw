// Repairs the geography data flagged by validate-geo.mjs.
//
// What it does, per area:
//   1. COORD_FIXES — corrects known-bad geocodes (page whose lat/lng landed on
//      the wrong town entirely; neighbours were correct, coordinates weren't).
//   2. nearby_areas — removes entries further than NEARBY_FLAG_KM, keeps
//      verified-close and unresolvable (small village) entries, then tops the
//      list up to TARGET_NEARBY with the nearest real area pages within
//      TOPUP_RADIUS_KM. Never invents places: top-ups come from the DB.
//   3. major_roads — removes roads whose corridor never passes within
//      ROAD_FLAG_KM; adds any motorway corridor within ROAD_ADD_KM that is
//      missing. Unverifiable roads (minor A/B roads not in the dataset) are
//      only kept when the page was NOT part of a bulk-seeded regional set —
//      on those pages the whole list is untrusted.
//   4. nearby_areas_slugs — recomputes the nearest-6-within-25km internal
//      links (same policy as src/lib/publishPipeline.js) when missing or when
//      any existing link is further than LINK_FLAG_KM.
//
// Usage:
//   node scripts/fix-geo-data.mjs             # dry run: writes plan, no DB writes
//   node scripts/fix-geo-data.mjs --apply     # backs up affected docs, then updates
//
// Backup: scripts/output/geo-fix-backup-<timestamp>.json (previous field values).
// Plan:   scripts/output/geo-fix-plan.json

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { GAZETTEER, ROADS, haversineKm, distToPolylineKm, normaliseRoadName, parseArr, normName } from './geo-data.mjs';

const NEARBY_FLAG_KM = 40;
const TOPUP_RADIUS_KM = 30;
const TARGET_NEARBY = 8;
const ROAD_FLAG_KM = 35;
const ROAD_ADD_KM = 20;
const LINK_FLAG_KM = 45;
const LINK_RADIUS_KM = 25;   // matches publishPipeline REVERSE_LINK_RADIUS_KM
const LINK_LIMIT = 6;        // matches publishPipeline NEAREST_LIMIT

// Pages whose geocode landed on the wrong town (verified manually).
const COORD_FIXES = {
    'stratford':     { latitude: 51.5416, longitude: -0.0032, county: 'Greater London', note: 'was Stratford-upon-Avon coords' },
    'tower-hamlets': { latitude: 51.5203, longitude: -0.0293, county: 'Greater London', note: 'was near Dover' },
};

// The five bulk-seeded regional sets (nearby_areas joined) — on these pages the
// whole major_roads list is untrusted, so unverifiable roads are dropped too.
const BULK_SETS = new Set([
    'Greater London,Reading,Slough,Watford,Croydon',
    'Leeds,Sheffield,York,Newcastle,Middlesbrough',
    'Bristol,Exeter,Plymouth,Gloucester,Bath',
    'Manchester,Liverpool,Preston,Bolton,Stockport',
    'Cambridge,Norwich,Peterborough,Ipswich,Luton',
]);

const APPLY = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const coll = db.collection('areas');
    const areas = await coll.find({ is_active: true }).toArray();

    // Apply coordinate fixes in-memory first so downstream distance maths uses
    // corrected positions.
    for (const a of areas) {
        const fix = COORD_FIXES[a.slug];
        if (fix) { a.latitude = fix.latitude; a.longitude = fix.longitude; a._coordFixed = true; }
    }

    const byName = new Map();
    for (const a of areas) {
        if (a.latitude && a.longitude) byName.set(normName(a.name), [a.latitude, a.longitude]);
    }
    const lookup = (name) => byName.get(normName(name)) || GAZETTEER[normName(name)] || null;

    const nearestAreas = (a, radiusKm, limit) =>
        areas
            .filter((o) => o.slug !== a.slug && o.latitude && o.longitude)
            .map((o) => ({ o, km: haversineKm(a.latitude, a.longitude, o.latitude, o.longitude) }))
            .filter((x) => x.km <= radiusKm)
            .sort((x, y) => x.km - y.km)
            .slice(0, limit);

    const motorwaysNear = (a, km) =>
        Object.entries(ROADS)
            .filter(([name]) => /^M\d|^M6 TOLL|\(M\)$/.test(name))
            .filter(([, line]) => distToPolylineKm(a.latitude, a.longitude, line) <= km)
            .map(([name]) => name);

    const plan = [];
    for (const a of areas) {
        if (!a.latitude || !a.longitude) continue;
        const changes = {};

        if (a._coordFixed) {
            changes.latitude = a.latitude;
            changes.longitude = a.longitude;
            if (!a.county) changes.county = COORD_FIXES[a.slug].county;
        }

        // --- nearby_areas ---
        const nearby = parseArr(a.nearby_areas).map(String);
        const isBulk = BULK_SETS.has(nearby.join(','));
        const kept = [];
        let removed = [];
        for (const n of nearby) {
            const pos = lookup(n);
            if (!pos) { kept.push(n); continue; } // small village not in DB/gazetteer: keep
            const d = haversineKm(a.latitude, a.longitude, pos[0], pos[1]);
            if (d > NEARBY_FLAG_KM) removed.push(`${n} (${Math.round(d)}km)`); else kept.push(n);
        }
        if (removed.length > 0 || kept.length < 3) {
            const existing = new Set(kept.map(normName));
            existing.add(normName(a.name));
            // Widen the radius for rural areas with few pages nearby, but stay
            // well under the 40 km "wrong" threshold used by the validator.
            for (const radius of [TOPUP_RADIUS_KM, 38]) {
                for (const { o } of nearestAreas(a, radius, 20)) {
                    if (kept.length >= TARGET_NEARBY) break;
                    if (existing.has(normName(o.name))) continue;
                    kept.push(o.name);
                    existing.add(normName(o.name));
                }
                if (kept.length >= 4) break;
            }
            changes.nearby_areas = kept;
        }

        // --- major_roads ---
        const roads = parseArr(a.major_roads).map(String);
        const keptRoads = [];
        const removedRoads = [];
        for (const r of roads) {
            const line = ROADS[normaliseRoadName(r)];
            if (!line) {
                if (isBulk) removedRoads.push(`${r} (unverifiable, bulk-seeded)`);
                else keptRoads.push(r);
                continue;
            }
            const d = distToPolylineKm(a.latitude, a.longitude, line);
            if (d > ROAD_FLAG_KM) removedRoads.push(`${r} (${Math.round(d)}km)`); else keptRoads.push(r);
        }
        if (removedRoads.length > 0) {
            const have = new Set(keptRoads.map((r) => normaliseRoadName(r)));
            for (const m of motorwaysNear(a, ROAD_ADD_KM)) {
                if (!have.has(m)) { keptRoads.push(m); have.add(m); }
            }
            changes.major_roads = keptRoads;
        }

        // --- nearby_areas_slugs ---
        const slugsNow = Array.isArray(a.nearby_areas_slugs) ? a.nearby_areas_slugs : [];
        const bySlug = new Map(areas.map((o) => [o.slug, o]));
        const hasFarLink = slugsNow.some((s) => {
            const o = bySlug.get(s);
            return o && o.latitude && haversineKm(a.latitude, a.longitude, o.latitude, o.longitude) > LINK_FLAG_KM;
        });
        if (slugsNow.length === 0 || hasFarLink || a._coordFixed) {
            let near = nearestAreas(a, LINK_RADIUS_KM, LINK_LIMIT);
            if (near.length < 3) near = nearestAreas(a, LINK_RADIUS_KM * 2, LINK_LIMIT);
            const newSlugs = near.map((x) => x.o.slug);
            if (newSlugs.length && JSON.stringify(newSlugs) !== JSON.stringify(slugsNow)) {
                changes.nearby_areas_slugs = newSlugs;
            }
        }

        if (Object.keys(changes).length > 0) {
            plan.push({
                slug: a.slug, name: a.name,
                removed_nearby: removed, removed_roads: removedRoads,
                changes,
            });
        }
    }

    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'geo-fix-plan.json'), JSON.stringify(plan, null, 2));

    console.log(`Areas needing fixes: ${plan.length} / ${areas.length}`);
    console.log(`  nearby_areas rebuilt: ${plan.filter((p) => p.changes.nearby_areas).length}`);
    console.log(`  major_roads rebuilt:  ${plan.filter((p) => p.changes.major_roads).length}`);
    console.log(`  nearby_areas_slugs:   ${plan.filter((p) => p.changes.nearby_areas_slugs).length}`);
    console.log(`  coordinate fixes:     ${plan.filter((p) => p.changes.latitude).length}`);
    console.log(`Plan: scripts/output/geo-fix-plan.json`);

    if (!APPLY) {
        console.log('\nDry run. Re-run with --apply to write to the database.');
        await client.close();
        return;
    }

    // Backup previous values of every field we are about to change.
    const backup = [];
    for (const p of plan) {
        const doc = await coll.findOne({ slug: p.slug });
        const prev = { slug: p.slug };
        for (const k of Object.keys(p.changes)) prev[k] = doc[k] ?? null;
        backup.push(prev);
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(outDir, `geo-fix-backup-${stamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`Backup written: ${backupFile}`);

    let updated = 0;
    for (const p of plan) {
        await coll.updateOne({ slug: p.slug }, { $set: { ...p.changes, updated_at: new Date() } });
        updated++;
        if (updated % 50 === 0) console.log(`  updated ${updated}/${plan.length}`);
    }
    console.log(`Updated ${updated} areas.`);
    console.log('NOTE: pages are statically generated — redeploy or call /api/admin/revalidate-all for changes to go live.');
    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
