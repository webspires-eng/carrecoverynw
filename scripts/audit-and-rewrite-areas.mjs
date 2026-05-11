// CLI wrapper around src/lib/contentAudit.js.
// The same logic powers the /admin/content-audit page + /api/admin/content-audit route —
// keep them in sync by editing src/lib/contentAudit.js, not this file.
//
// Usage:
//   node scripts/audit-and-rewrite-areas.mjs                    # audit-only CSV
//   node scripts/audit-and-rewrite-areas.mjs --rewrite           # audit + Claude rewrite + DB update
//   node scripts/audit-and-rewrite-areas.mjs --rewrite --limit 5
//   node scripts/audit-and-rewrite-areas.mjs --rewrite --no-llm  # templated draft only
//
// Requires: MONGODB_URI (and ANTHROPIC_API_KEY unless --no-llm) in .env.local.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { auditArea, rewriteArea } from '../src/lib/contentAudit.js';

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('Missing MONGODB_URI in .env.local');
    process.exit(1);
}

const args = process.argv.slice(2);
const REWRITE = args.includes('--rewrite');
const USE_LLM = !args.includes('--no-llm');
const limitArg = args.indexOf('--limit');
const REWRITE_LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

if (REWRITE && USE_LLM && !process.env.DASHSCOPE_API_KEY) {
    console.error('Missing DASHSCOPE_API_KEY in .env.local (or pass --no-llm to skip the LLM step).');
    process.exit(1);
}

function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const coll = db.collection('areas');

    const areas = await coll.find({ is_active: true }).toArray();
    console.log(`Loaded ${areas.length} active areas.`);

    // Audit + CSV
    const rows = areas.map(area => ({ area, audit: auditArea(area) }));
    const flagged = rows.filter(r => r.audit.is_thin || r.audit.major_roads_missing).length;

    const csv = ['slug,area_name,county,services_thin,bottom_content_thin,faqs_missing,major_roads_missing'];
    for (const { area, audit } of rows) {
        csv.push([
            area.slug || '',
            area.name || '',
            area.county || '',
            audit.services_thin,
            audit.bottom_content_thin,
            audit.faqs_missing,
            audit.major_roads_missing,
        ].map(csvEscape).join(','));
    }

    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'area-audit.csv');
    fs.writeFileSync(outFile, csv.join('\n') + '\n', 'utf8');
    console.log(`Audit CSV written: ${outFile}`);
    console.log(`Flagged ${flagged} / ${areas.length} areas.`);

    if (!REWRITE) {
        console.log('\nDry run complete. Re-run with --rewrite to update flagged areas.');
        await client.close();
        return;
    }

    // Rewrite step
    let updated = 0;
    for (const { area, audit } of rows) {
        if (updated >= REWRITE_LIMIT) break;
        if (!audit.is_thin) continue;
        try {
            const result = await rewriteArea(area, { useLlm: USE_LLM, callDelayMs: 500 });
            if (result.skipped) continue;
            await coll.updateOne({ _id: area._id }, { $set: result.update });
            updated++;
            console.log(`Updated [${updated}] /areas/${area.slug} — ${result.fieldsUpdated.join(', ')}`);
        } catch (err) {
            console.error(`Failed /areas/${area.slug}: ${err.message}`);
        }
    }
    console.log(`\nRewrite complete. ${updated} areas updated.`);
    await client.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
