import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { auditArea, rewriteArea } from '@/lib/contentAudit';

export const dynamic = 'force-dynamic';
// Allow plenty of headroom for the LLM rewrite step (per-area can take ~30–60s).
export const maxDuration = 300;

// GET — return the audit for every active area
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const areas = await db.collection('areas')
            .find({ is_active: true })
            .project({
                slug: 1,
                name: 1,
                county: 1,
                custom_services: 1,
                custom_faqs: 1,
                bottom_content: 1,
                major_roads: 1,
                updated_at: 1,
            })
            .sort({ name: 1 })
            .toArray();

        const items = areas.map(area => {
            const a = auditArea(area);
            return {
                slug: area.slug,
                name: area.name,
                county: area.county || null,
                ...a,
                updated_at: area.updated_at || null,
            };
        });

        const counts = items.reduce((acc, it) => {
            acc.total++;
            if (it.is_thin) acc.thin++;
            if (it.services_thin) acc.services_thin++;
            if (it.bottom_content_thin) acc.bottom_content_thin++;
            if (it.faqs_missing) acc.faqs_missing++;
            if (it.major_roads_missing) acc.major_roads_missing++;
            return acc;
        }, { total: 0, thin: 0, services_thin: 0, bottom_content_thin: 0, faqs_missing: 0, major_roads_missing: 0 });
        counts.clean = counts.total - counts.thin;

        return NextResponse.json({ success: true, counts, items });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// POST — rewrite the next N thin areas (or specific slugs)
//   body: { limit?: number, slugs?: string[], useLlm?: boolean }
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const limit = Math.max(1, Math.min(parseInt(body.limit, 10) || 1, 5));
        const slugs = Array.isArray(body.slugs) ? body.slugs : null;
        const useLlm = body.useLlm !== false;

        if (useLlm && !process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'ANTHROPIC_API_KEY is not configured on the server.' },
                { status: 500 },
            );
        }

        const { db } = await connectToDatabase();
        const coll = db.collection('areas');

        const query = { is_active: true };
        if (slugs?.length) query.slug = { $in: slugs };

        const candidates = await coll.find(query).sort({ name: 1 }).toArray();

        const results = [];
        for (const area of candidates) {
            if (results.filter(r => r.updated).length >= limit) break;

            const audit = auditArea(area);
            if (!audit.is_thin) {
                if (slugs?.length) {
                    results.push({ slug: area.slug, updated: false, skipped: 'already passes audit' });
                }
                continue;
            }

            try {
                const { update, fieldsUpdated } = await rewriteArea(area, { useLlm, callDelayMs: 500 });
                await coll.updateOne({ _id: area._id }, { $set: update });
                try {
                    revalidatePath(`/areas/${area.slug}`);
                } catch { /* revalidation is best-effort */ }
                results.push({ slug: area.slug, name: area.name, updated: true, fields: fieldsUpdated });
            } catch (err) {
                results.push({ slug: area.slug, name: area.name, updated: false, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            updated: results.filter(r => r.updated).length,
            results,
        });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
