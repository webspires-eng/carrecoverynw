// Exports a per-city content worksheet (CSV) for filling in genuinely local
// details. Columns left of `h1_title` are context; fill in the rest and import
// with:  node scripts/import-content-worksheet.mjs scripts/output/content-worksheet.csv
//
// Field guide (all optional — blank cells are skipped on import):
//   h1_title           unique page H1, e.g. "Car Recovery Salisbury – A303, A30 & City Centre"
//   intro_text         1–2 unique sentences shown under the H1
//   local_notes        2–3 unique paragraphs (separate paragraphs with a blank line
//                      or literal \n\n) — local roads, breakdown hotspots, what makes
//                      recovery in this town different
//   local_landmarks    semicolon-separated, e.g. "Salisbury Cathedral; Old Sarum; Southampton Road Retail Park"
//   postcode_districts semicolon-separated postcode districts, e.g. "SP1; SP2; SP4"
//   extra_roads        semicolon-separated roads to ADD to major_roads (validated on import)
//
// Usage:
//   node scripts/export-content-worksheet.mjs             # all areas, thinnest first
//   node scripts/export-content-worksheet.mjs --thin-only # only areas missing local content

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { parseArr } from './geo-data.mjs';

const THIN_ONLY = process.argv.includes('--thin-only');
const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const areas = await db.collection('areas').find({ is_active: true }).sort({ name: 1 }).toArray();

    const rows = areas.map((a) => {
        const missing = [];
        if (!String(a.intro_text || '').trim()) missing.push('intro');
        if (!String(a.h1_title || '').trim()) missing.push('h1');
        if (!String(a.local_notes || '').trim()) missing.push('local_notes');
        if (!Array.isArray(a.local_landmarks) || !a.local_landmarks.length) missing.push('landmarks');
        if (!Array.isArray(a.postcode_districts) || !a.postcode_districts.length) missing.push('postcodes');
        return { a, missing };
    });

    const selected = THIN_ONLY ? rows.filter((r) => r.missing.length > 0) : rows;
    // Thinnest first so the highest-impact rows are at the top of the sheet.
    selected.sort((x, y) => y.missing.length - x.missing.length || x.a.name.localeCompare(y.a.name));

    const header = [
        'slug', 'name', 'county', 'missing', 'current_roads', 'current_nearby',
        'h1_title', 'intro_text', 'local_notes', 'local_landmarks', 'postcode_districts', 'extra_roads',
    ];
    const csv = [header.join(',')];
    for (const { a, missing } of selected) {
        csv.push([
            a.slug, esc(a.name), esc(a.county || ''), esc(missing.join('|')),
            esc(parseArr(a.major_roads).join('; ')),
            esc(parseArr(a.nearby_areas).join('; ')),
            esc(a.h1_title || ''), esc(a.intro_text || ''), esc(a.local_notes || ''),
            esc((a.local_landmarks || []).join('; ')),
            esc((a.postcode_districts || []).join('; ')),
            '', // extra_roads: always starts blank
        ].join(','));
    }

    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, 'content-worksheet.csv');
    fs.writeFileSync(file, csv.join('\n') + '\n');
    console.log(`Worksheet: ${file} (${selected.length} rows${THIN_ONLY ? ', thin only' : ''})`);
    console.log('Fill in columns h1_title → extra_roads, then run:');
    console.log('  node scripts/import-content-worksheet.mjs scripts/output/content-worksheet.csv');
    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
