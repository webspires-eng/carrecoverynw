/**
 * Audit sub-area linking coverage across all active area pages.
 *
 * Run with: npx ts-node scripts/auditSubAreaLinks.ts
 *           (or: npx tsx scripts/auditSubAreaLinks.ts)
 *
 * Output: scripts/output/subarea-audit.json
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { buildSubAreasHTML } from '../src/lib/slugMatcher';

type AreaDoc = {
    slug: string;
    name?: string;
    nearby_areas?: string | string[] | null;
};

type PerAreaReport = {
    slug: string;
    name: string;
    total: number;
    linked: number;
    unmatched: string[];
};

type AuditReport = {
    generatedAt: string;
    totalPages: number;
    totalSubAreaMentions: number;
    totalLinkable: number;
    totalUnmatched: number;
    perArea: PerAreaReport[];
};

function parseNearby(value: string | string[] | null | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // fall through to comma/newline split
    }
    return value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('carrecoverynw');

    const areas = await db
        .collection<AreaDoc>('areas')
        .find({ is_active: true }, { projection: { slug: 1, name: 1, nearby_areas: 1 } })
        .toArray();

    const allSlugs = areas.map((a) => a.slug).filter(Boolean);

    const perArea: PerAreaReport[] = [];
    let totalSubAreaMentions = 0;
    let totalLinkable = 0;
    let totalUnmatched = 0;

    for (const area of areas) {
        const names = parseNearby(area.nearby_areas);
        const { html, linked, total } = buildSubAreasHTML(names, allSlugs, area.slug);
        const unmatched = html.filter((i) => !i.slug).map((i) => i.name);

        perArea.push({
            slug: area.slug,
            name: area.name || area.slug,
            total,
            linked,
            unmatched,
        });

        totalSubAreaMentions += total;
        totalLinkable += linked;
        totalUnmatched += unmatched.length;

        console.log(
            `${area.name || area.slug}: ${total} sub-areas, ${linked} will be linked, ${unmatched.length} have no matching page`
        );
    }

    const report: AuditReport = {
        generatedAt: new Date().toISOString(),
        totalPages: areas.length,
        totalSubAreaMentions,
        totalLinkable,
        totalUnmatched,
        perArea,
    };

    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'subarea-audit.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

    console.log('---');
    console.log(
        `Total: ${areas.length} pages, ${totalLinkable} sub-area mentions will become links, ${totalUnmatched} have no matching page (review manually)`
    );
    console.log(`Report saved to ${outPath}`);

    await client.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
