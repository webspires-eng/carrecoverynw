// Prune-vs-keep analysis for /areas pages.
//
// Signals per page:
//   max_similarity  — highest 5-gram shingle Jaccard similarity of this page's
//                     bottom_content (HTML stripped, own/other town names
//                     removed) against any other page. High = spun duplicate.
//   density_8km     — number of other area pages within 8 km. Dense clusters of
//                     micro-neighbourhood pages are classic doorway patterns.
//   local_fields    — whether unique local fields are filled (h1_title,
//                     intro_text, local_notes, landmarks, postcode_districts).
//
// Verdicts (empirical note: bottom_content turned out to be unique per page —
// median max_similarity 0.02 — so the doorway risk here is page DENSITY, not
// copied body text; similarity is still computed and reported as a guard):
//   KEEP     standalone town or has unique local fields — leave indexed.
//   IMPROVE  a real standalone town missing local fields — fill the worksheet.
//   PRUNE    micro-neighbourhood page in a dense cluster (≥ PRUNE_DENSITY other
//            pages within 8 km) with no unique local fields, or near-duplicate
//            body text — recommend noindex (scripts/set-noindex.mjs) until
//            unique content is added. Each gets a hub_suggestion: the nearest
//            KEEP page to consolidate towards.
//
// Usage:  node scripts/prune-analysis.mjs
// Output: scripts/output/prune-recommendations.{json,csv}
// Read-only: never writes to the database.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { haversineKm } from './geo-data.mjs';

const SIM_DUP = 0.55;        // above this, bottom_content counts as near-duplicate
const DENSITY_RADIUS_KM = 8;
const PRUNE_DENSITY = 10;    // ≥ this many neighbours within 8 km = doorway cluster
const MISSING_THIN = 4;      // missing ≥ this many of the 5 local fields = thin

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

function stripHtml(html) {
    return String(html || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/g, ' ')
        .toLowerCase();
}

function shingles(text, nameTokens) {
    const words = text
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w && !nameTokens.has(w));
    const set = new Set();
    for (let i = 0; i + 5 <= words.length; i++) set.add(words.slice(i, i + 5).join(' '));
    return set;
}

function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    const [small, large] = a.size < b.size ? [a, b] : [b, a];
    let inter = 0;
    for (const s of small) if (large.has(s)) inter++;
    return inter / (a.size + b.size - inter);
}

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const areas = await db.collection('areas').find({ is_active: true }).toArray();

    // Tokens from ALL area names are stripped before shingling, so "recovery in
    // salisbury" and "recovery in dover" hash identically — we compare the
    // template, not the town-name substitutions.
    const nameTokens = new Set();
    for (const a of areas) {
        for (const w of String(a.name).toLowerCase().split(/[^a-z0-9]+/)) if (w) nameTokens.add(w);
    }

    console.log('Shingling bottom_content…');
    const items = areas.map((a) => ({
        a,
        sh: shingles(stripHtml(a.bottom_content), nameTokens),
    }));

    console.log('Pairwise similarity…');
    const maxSim = new Array(items.length).fill(0);
    const simTo = new Array(items.length).fill(null);
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const s = jaccard(items[i].sh, items[j].sh);
            if (s > maxSim[i]) { maxSim[i] = s; simTo[i] = items[j].a.slug; }
            if (s > maxSim[j]) { maxSim[j] = s; simTo[j] = items[i].a.slug; }
        }
        if (i % 100 === 0) console.log(`  ${i}/${items.length}`);
    }

    const density = items.map(({ a }) =>
        a.latitude && a.longitude
            ? areas.filter((o) => o.slug !== a.slug && o.latitude &&
                haversineKm(a.latitude, a.longitude, o.latitude, o.longitude) <= DENSITY_RADIUS_KM).length
            : 0
    );

    const results = items.map(({ a }, i) => {
        const missing = [];
        if (!String(a.h1_title || '').trim()) missing.push('h1_title');
        if (!String(a.intro_text || '').trim()) missing.push('intro_text');
        if (!String(a.local_notes || '').trim()) missing.push('local_notes');
        if (!Array.isArray(a.local_landmarks) || !a.local_landmarks.length) missing.push('landmarks');
        if (!Array.isArray(a.postcode_districts) || !a.postcode_districts.length) missing.push('postcodes');
        const thin = missing.length >= MISSING_THIN;
        const dup = maxSim[i] >= SIM_DUP;
        const dense = density[i] >= PRUNE_DENSITY;

        // bottom_content and custom_faqs are already unique per page, so a
        // standalone town is KEEP even before the new local fields are filled.
        // Dense-cluster micro-pages need real local content to justify a page.
        let verdict;
        if (dup || (dense && thin)) verdict = 'PRUNE';
        else if (density[i] >= 4 && thin) verdict = 'IMPROVE';
        else verdict = 'KEEP';

        return {
            slug: a.slug, name: a.name, county: a.county || '',
            verdict,
            max_similarity: Number(maxSim[i].toFixed(3)),
            most_similar_to: simTo[i],
            pages_within_8km: density[i],
            missing_local_fields: missing,
            noindex_now: a.noindex === true,
        };
    });

    // Hub suggestion for PRUNE pages: nearest page that stays indexed.
    const keeps = results.filter((r) => r.verdict !== 'PRUNE');
    const bySlug = new Map(areas.map((a) => [a.slug, a]));
    for (const r of results) {
        if (r.verdict !== 'PRUNE') continue;
        const a = bySlug.get(r.slug);
        let best = null, bestKm = Infinity;
        for (const k of keeps) {
            const o = bySlug.get(k.slug);
            if (!o.latitude || !a.latitude) continue;
            const d = haversineKm(a.latitude, a.longitude, o.latitude, o.longitude);
            if (d < bestKm) { bestKm = d; best = k.slug; }
        }
        r.hub_suggestion = best;
        r.hub_km = best ? Math.round(bestKm) : null;
    }

    results.sort((x, y) => ({ PRUNE: 0, IMPROVE: 1, KEEP: 2 })[x.verdict] - ({ PRUNE: 0, IMPROVE: 1, KEEP: 2 })[y.verdict] || y.max_similarity - x.max_similarity);

    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'prune-recommendations.json'), JSON.stringify(results, null, 2));
    const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = ['slug,name,county,verdict,max_similarity,most_similar_to,pages_within_8km,missing_local_fields,hub_suggestion,hub_km'];
    for (const r of results) {
        csv.push([r.slug, esc(r.name), esc(r.county), r.verdict, r.max_similarity, r.most_similar_to, r.pages_within_8km, esc(r.missing_local_fields.join('|')), r.hub_suggestion || '', r.hub_km ?? ''].join(','));
    }
    fs.writeFileSync(path.join(outDir, 'prune-recommendations.csv'), csv.join('\n') + '\n');

    const counts = results.reduce((m, r) => ((m[r.verdict] = (m[r.verdict] || 0) + 1), m), {});
    console.log(`\nVerdicts: ${JSON.stringify(counts)}`);
    console.log(`Similarity: median ${[...maxSim].sort((a, b) => a - b)[Math.floor(maxSim.length / 2)].toFixed(2)}, >=${SIM_DUP}: ${maxSim.filter((s) => s >= SIM_DUP).length}`);
    console.log('\nPRUNE candidates (first 20):');
    results.filter((r) => r.verdict === 'PRUNE').slice(0, 20).forEach((r) =>
        console.log(`  ${r.slug} (sim ${r.max_similarity} vs ${r.most_similar_to}, ${r.pages_within_8km} pages <8km, hub: ${r.hub_suggestion} ${r.hub_km}km)`));
    console.log(`\nReports: scripts/output/prune-recommendations.{json,csv}`);
    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
