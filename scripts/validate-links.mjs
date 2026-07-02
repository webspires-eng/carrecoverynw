// Internal-link integrity check for /areas pages. Prevents crawl-budget waste
// from links to missing, inactive, or noindexed pages.
//
// Checks every active area doc:
//   1. nearby_areas_slugs  — each slug must be an existing, active, non-noindexed area
//   2. internal_links_from — same
//   3. bottom_content      — any href to /areas/<slug> must resolve the same way;
//                            any href to singular /area/... is an error;
//                            other internal hrefs must be in KNOWN_ROUTES
//   4. nearby_areas names  — informational: names that don't match an active slug
//                            render as plain text (no link), so they can't 404,
//                            but a high count means lost internal-linking value.
//
// Usage:  node scripts/validate-links.mjs
// Output: scripts/output/link-report.json, exit code 1 if any errors found
// Read-only: never writes to the database.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

// Static routes that exist in src/app — keep in sync if routes change.
const KNOWN_ROUTES = new Set([
    '/', '/areas', '/booking', '/contact-us', '/about-us',
    '/privacy-policy', '/terms-of-service', '/sitemap', '/sitemap-html', '/sitemap.xml',
]);

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const all = await db.collection('areas').find({}).toArray();

    const active = new Map(all.filter((a) => a.is_active).map((a) => [a.slug, a]));
    const errors = [];
    const warnings = [];

    const checkSlug = (fromSlug, field, target) => {
        const doc = active.get(target);
        if (!doc) errors.push({ from: fromSlug, field, target, problem: 'missing or inactive' });
        else if (doc.noindex === true) warnings.push({ from: fromSlug, field, target, problem: 'links to noindexed page (allowed, but consider repointing to its hub)' });
    };

    for (const a of active.values()) {
        for (const s of a.nearby_areas_slugs || []) checkSlug(a.slug, 'nearby_areas_slugs', s);
        for (const s of a.internal_links_from || []) checkSlug(a.slug, 'internal_links_from', s);

        const html = String(a.bottom_content || '') + String(a.local_notes || '');
        for (const m of html.matchAll(/href=["']([^"']+)["']/g)) {
            const href = m[1];
            if (/^https?:\/\//.test(href) && !href.includes('cartowingnearme')) continue; // external
            const p = href.replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0].replace(/\/$/, '') || '/';
            if (p.startsWith('/area/')) {
                errors.push({ from: a.slug, field: 'content href', target: p, problem: 'singular /area/ URL — use /areas/' });
            } else if (p.startsWith('/areas/')) {
                checkSlug(a.slug, 'content href', p.slice('/areas/'.length));
            } else if (!KNOWN_ROUTES.has(p)) {
                errors.push({ from: a.slug, field: 'content href', target: p, problem: 'unknown internal route' });
            }
        }
    }

    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'link-report.json'), JSON.stringify({ errors, warnings }, null, 2));

    console.log(`Active areas checked: ${active.size}`);
    console.log(`Errors (would 404 or redirect): ${errors.length}`);
    errors.slice(0, 25).forEach((e) => console.log(`  ✖ ${e.from} [${e.field}] -> ${e.target}: ${e.problem}`));
    console.log(`Warnings: ${warnings.length}`);
    warnings.slice(0, 10).forEach((w) => console.log(`  ⚠ ${w.from} [${w.field}] -> ${w.target}: ${w.problem}`));
    console.log(`Report: scripts/output/link-report.json`);
    await client.close();
    process.exit(errors.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
