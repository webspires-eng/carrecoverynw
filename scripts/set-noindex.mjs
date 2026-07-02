// Sets / clears the `noindex` flag on area docs. Noindexed pages:
//   - still render (200) and are still linked internally,
//   - emit <meta name="robots" content="noindex, follow"> (see areas/[slug]/page.jsx),
//   - are excluded from sitemap.xml.
//
// Usage:
//   node scripts/set-noindex.mjs --from-prune-report          # dry run: PRUNE verdicts from prune-recommendations.json
//   node scripts/set-noindex.mjs --slugs soho,mayfair          # dry run: explicit list
//   node scripts/set-noindex.mjs --from-prune-report --apply   # write
//   node scripts/set-noindex.mjs --slugs soho --clear --apply  # un-noindex
//
// Re-run prune-analysis after filling the worksheet: pages that gain unique
// local content stop being PRUNE candidates, then --clear them here.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const CLEAR = args.includes('--clear');
const slugsIdx = args.indexOf('--slugs');

let slugs = [];
if (slugsIdx !== -1) {
    slugs = (args[slugsIdx + 1] || '').split(',').map((s) => s.trim()).filter(Boolean);
} else if (args.includes('--from-prune-report')) {
    const rec = JSON.parse(fs.readFileSync('scripts/output/prune-recommendations.json', 'utf8'));
    slugs = rec.filter((r) => r.verdict === 'PRUNE').map((r) => r.slug);
} else {
    console.error('Pass --slugs a,b,c or --from-prune-report');
    process.exit(1);
}
if (!slugs.length) { console.log('No slugs selected.'); process.exit(0); }

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const coll = client.db('carrecoverynw').collection('areas');

    const found = await coll.find({ slug: { $in: slugs } }, { projection: { slug: 1, noindex: 1 } }).toArray();
    const foundSlugs = new Set(found.map((f) => f.slug));
    const missing = slugs.filter((s) => !foundSlugs.has(s));
    if (missing.length) console.log(`Not in DB (skipped): ${missing.join(', ')}`);

    console.log(`${CLEAR ? 'Clearing' : 'Setting'} noindex on ${found.length} areas.`);
    if (!APPLY) {
        console.log(found.map((f) => `  ${f.slug}${f.noindex ? ' (currently noindex)' : ''}`).slice(0, 30).join('\n'));
        console.log('\nDry run. Re-run with --apply to write.');
        await client.close();
        return;
    }

    const res = await coll.updateMany(
        { slug: { $in: [...foundSlugs] } },
        CLEAR
            ? { $unset: { noindex: '' }, $set: { updated_at: new Date() } }
            : { $set: { noindex: true, updated_at: new Date() } }
    );
    console.log(`Modified ${res.modifiedCount} docs.`);
    console.log('NOTE: redeploy or call /api/admin/revalidate-all so the robots meta + sitemap update.');
    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
