// Imports the filled content worksheet (see export-content-worksheet.mjs) and
// updates area docs. Validates before writing:
//   - postcode_districts must look like UK postcode districts (SP1, B23, EC1A)
//   - extra_roads are checked against the road corridor dataset; a road that
//     provably doesn't pass near the town is rejected (unknown roads are
//     accepted with a warning — the dataset only covers trunk routes)
//   - no {{template}} placeholders
//   - near-duplicate local_notes across rows are rejected (the whole point is
//     unique content per city)
//
// Usage:
//   node scripts/import-content-worksheet.mjs <file.csv>            # dry run
//   node scripts/import-content-worksheet.mjs <file.csv> --apply    # write to DB

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';
import { ROADS, distToPolylineKm, normaliseRoadName, parseArr } from './geo-data.mjs';

const APPLY = process.argv.includes('--apply');
const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
    console.error('Usage: node scripts/import-content-worksheet.mjs <file.csv> [--apply]');
    process.exit(1);
}
const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

const POSTCODE_DISTRICT = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/;
const ROAD_MAX_KM = 35;

// Minimal CSV parser handling quoted fields with commas/newlines.
function parseCsv(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (ch === '"') inQuotes = false;
            else field += ch;
        } else if (ch === '"') inQuotes = true;
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.some((f) => f !== '')) rows.push(row);
            row = [];
        } else field += ch;
    }
    if (field !== '' || row.length) { row.push(field); if (row.some((f) => f !== '')) rows.push(row); }
    return rows;
}

const splitList = (s) => String(s || '').split(';').map((x) => x.trim()).filter(Boolean);
const tokens = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3));
function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    for (const t of a) if (b.has(t)) inter++;
    return inter / (a.size + b.size - inter);
}

async function main() {
    const raw = fs.readFileSync(file, 'utf8');
    const rows = parseCsv(raw);
    const header = rows.shift().map((h) => h.trim());
    const col = (name) => header.indexOf(name);
    for (const required of ['slug', 'h1_title', 'intro_text', 'local_notes', 'local_landmarks', 'postcode_districts', 'extra_roads']) {
        if (col(required) === -1) { console.error(`Missing column: ${required}`); process.exit(1); }
    }

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const coll = db.collection('areas');
    const dbAreas = await coll.find({ is_active: true }).toArray();
    const bySlug = new Map(dbAreas.map((a) => [a.slug, a]));

    const errors = [], warnings = [], updates = [];
    const notesTokens = []; // for cross-row duplicate detection

    for (const r of rows) {
        const slug = r[col('slug')]?.trim();
        if (!slug) continue;
        const area = bySlug.get(slug);
        if (!area) { errors.push(`${slug}: not found in DB (or inactive)`); continue; }
        if (!area.latitude || !area.longitude) warnings.push(`${slug}: no coordinates; road validation skipped`);

        const set = {};
        const val = (name) => (r[col(name)] ?? '').trim();

        for (const f of ['h1_title', 'intro_text', 'local_notes']) {
            const v = val(f).replace(/\\n\\n/g, '\n\n'); // allow literal \n\n typed in a spreadsheet
            if (!v) continue;
            if (v.includes('{{')) { errors.push(`${slug}: ${f} contains a {{placeholder}}`); continue; }
            set[f] = v;
        }
        if (set.intro_text && set.intro_text.length < 60) warnings.push(`${slug}: intro_text is very short (${set.intro_text.length} chars)`);
        if (set.local_notes) {
            if (set.local_notes.length < 200) warnings.push(`${slug}: local_notes is short (${set.local_notes.length} chars) — aim for 2-3 real paragraphs`);
            const tk = tokens(set.local_notes);
            for (const prev of notesTokens) {
                if (jaccard(tk, prev.tk) > 0.6) {
                    errors.push(`${slug}: local_notes is near-duplicate of ${prev.slug} — content must be unique per city`);
                    break;
                }
            }
            notesTokens.push({ slug, tk });
        }

        const landmarks = splitList(val('local_landmarks'));
        if (landmarks.length) set.local_landmarks = landmarks;

        const postcodes = splitList(val('postcode_districts')).map((p) => p.toUpperCase());
        if (postcodes.length) {
            const bad = postcodes.filter((p) => !POSTCODE_DISTRICT.test(p));
            if (bad.length) errors.push(`${slug}: invalid postcode district(s): ${bad.join(', ')}`);
            else {
                set.postcode_districts = postcodes;
                if (!area.postcode_prefix) set.postcode_prefix = postcodes[0];
            }
        }

        const extraRoads = splitList(val('extra_roads'));
        if (extraRoads.length && area.latitude && area.longitude) {
            const existing = parseArr(area.major_roads).map(String);
            const have = new Set(existing.map(normaliseRoadName));
            const accepted = [];
            for (const road of extraRoads) {
                const key = normaliseRoadName(road);
                if (have.has(key)) continue;
                const line = ROADS[key];
                if (line) {
                    const d = distToPolylineKm(area.latitude, area.longitude, line);
                    if (d > ROAD_MAX_KM) { errors.push(`${slug}: road ${road} is ${Math.round(d)}km away — rejected`); continue; }
                } else if (/^M\d+$/.test(key)) {
                    // The dataset covers all GB motorways, so an unknown M-road
                    // is a typo or doesn't exist.
                    errors.push(`${slug}: unknown motorway ${road} — rejected`);
                    continue;
                } else {
                    warnings.push(`${slug}: road ${road} not in validation dataset — accepted unverified`);
                }
                accepted.push(road);
                have.add(key);
            }
            if (accepted.length) set.major_roads = [...existing, ...accepted];
        }

        if (Object.keys(set).length > 0) updates.push({ slug, set });
    }

    console.log(`Rows parsed: ${rows.length}, updates staged: ${updates.length}`);
    if (warnings.length) { console.log(`\nWarnings (${warnings.length}):`); warnings.forEach((w) => console.log('  ⚠ ' + w)); }
    if (errors.length) {
        console.log(`\nErrors (${errors.length}):`); errors.forEach((e) => console.log('  ✖ ' + e));
        console.log('\nFix the errors and re-run. Nothing was written.');
        await client.close();
        process.exit(1);
    }

    if (!APPLY) {
        updates.slice(0, 5).forEach((u) => console.log(`\n${u.slug}: ${Object.keys(u.set).join(', ')}`));
        console.log('\nDry run. Re-run with --apply to write to the database.');
        await client.close();
        return;
    }

    for (const u of updates) {
        await coll.updateOne({ slug: u.slug }, { $set: { ...u.set, updated_at: new Date() } });
    }
    console.log(`Updated ${updates.length} areas.`);
    console.log('NOTE: redeploy or call /api/admin/revalidate-all for changes to go live.');
    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
