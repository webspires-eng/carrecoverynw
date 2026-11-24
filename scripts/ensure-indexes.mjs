// Creates (or drops) the one index the query evidence justifies, and prints
// explain("executionStats") for the queries it serves, before and after.
//
// Usage:
//   node scripts/ensure-indexes.mjs            # dry run: explain only, changes nothing
//   node scripts/ensure-indexes.mjs --apply    # create the index, explain again
//   node scripts/ensure-indexes.mjs --drop     # rollback: drop the index
//   node scripts/ensure-indexes.mjs --db NAME  # run against another database (testing)
//
// Why this index: every "list the active areas" query fetched all ~835 area
// documents (~18 KB each, ~15 MB) just to read slug/name/county/region, and
// the /areas page also sorted them in memory. With these five fields in the
// index, MongoDB answers from the index alone (no FETCH, no SORT stage).
// The projections must exclude _id for that to work — see areas/page.jsx.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DROP = args.includes('--drop');
const dbIdx = args.indexOf('--db');
const DB_NAME = dbIdx !== -1 ? args[dbIdx + 1] : 'carrecoverynw';

const INDEX_NAME = 'areas_active_name_cover';
const INDEX_KEYS = { is_active: 1, name: 1, slug: 1, county: 1, region: 1 };

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

const ACTIVE = { is_active: true };
const QUERIES = [
    ['/areas list', (c) => c.find(ACTIVE, { projection: { _id: 0, slug: 1, name: 1, county: 1, region: 1 } }).sort({ name: 1 })],
    ['/sitemap pages', (c) => c.find(ACTIVE, { projection: { _id: 0, slug: 1, name: 1 } }).sort({ name: 1 })],
    ['active slugs', (c) => c.find(ACTIVE, { projection: { _id: 0, slug: 1 } })],
];

function stages(plan) {
    const out = [plan.stage];
    if (plan.inputStage) out.push(...stages(plan.inputStage));
    for (const child of plan.inputStages || []) out.push(...stages(child));
    return out;
}

async function explainAll(coll, label) {
    console.log(`\n${label}`);
    let allCovered = true;
    for (const [name, build] of QUERIES) {
        const e = await build(coll).explain('executionStats');
        const s = e.executionStats;
        const plan = stages(e.queryPlanner.winningPlan);
        const covered = s.totalDocsExamined === 0 && !plan.includes('SORT');
        if (!covered) allCovered = false;
        console.log(
            `  ${name.padEnd(16)} plan=${plan.join('<')} returned=${s.nReturned} ` +
            `keys=${s.totalKeysExamined} docs=${s.totalDocsExamined} ms=${s.executionTimeMillis}` +
            (covered ? '  [covered]' : '')
        );
    }
    return allCovered;
}

async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, appName: 'ensure-indexes' });
    await client.connect();
    try {
        const coll = client.db(DB_NAME).collection('areas');
        const exists = (await coll.indexes()).some((i) => i.name === INDEX_NAME);

        if (DROP) {
            if (!exists) { console.log(`${INDEX_NAME} is not present; nothing to drop.`); return; }
            await coll.dropIndex(INDEX_NAME);
            console.log(`Dropped ${INDEX_NAME}.`);
            await explainAll(coll, 'After drop:');
            return;
        }

        await explainAll(coll, exists ? `Current (${INDEX_NAME} present):` : 'Before (index absent):');

        if (exists) { console.log('\nIndex already present; nothing to do.'); return; }
        if (!APPLY) { console.log('\nDry run. Re-run with --apply to create the index.'); return; }

        await coll.createIndex(INDEX_KEYS, { name: INDEX_NAME });
        console.log(`\nCreated ${INDEX_NAME} ${JSON.stringify(INDEX_KEYS)}`);
        const covered = await explainAll(coll, 'After:');
        if (!covered) {
            console.error('\nWARNING: a query is still not covered. To undo: node scripts/ensure-indexes.mjs --drop');
            process.exitCode = 2;
        }
    } finally {
        await client.close();
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
