import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { submitAndTrack, buildAreaUrl } from '@/lib/googleIndexing';
import { logActivity } from '@/lib/logger';
import {
    calculateNearestAreas,
    reverseLink_UpdateExistingPages,
    triggerISRRevalidation,
    buildSlugMap,
    injectLinksIntoSubAreasSection,
    generateNearbyAreasHTML,
} from '@/lib/internalLinking';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function logStep(step, payload) {
    console.log(`[publish ${new Date().toISOString()}] ${step}`, payload || '');
}

function unauthorized() {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request) {
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie?.value) return unauthorized();

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }
    const { slug } = body || {};
    if (!slug || typeof slug !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 });
    }

    const errors = [];
    const safe = async (label, fn) => {
        try {
            const result = await fn();
            logStep(label, 'ok');
            return result;
        } catch (err) {
            const msg = `${label} failed: ${err.message}`;
            errors.push(msg);
            logStep(label, msg);
            return null;
        }
    };

    // STEP 1 — fetch the published area
    const { db } = await connectToDatabase();
    const area = await db
        .collection('areas')
        .findOne({ slug, is_active: true });

    if (!area) {
        return NextResponse.json(
            { success: false, error: `Active area not found: ${slug}` },
            { status: 404 }
        );
    }
    logStep('STEP 1 fetched area', { slug, name: area.name });

    if (typeof area.latitude !== 'number' || typeof area.longitude !== 'number') {
        return NextResponse.json(
            { success: false, error: 'Area is missing latitude/longitude' },
            { status: 400 }
        );
    }

    // STEP 2 — nearest 6
    const nearest = (await safe('STEP 2 calculateNearestAreas', () =>
        calculateNearestAreas(slug)
    )) || [];

    // STEP 3 — store outbound slugs on this area
    await safe('STEP 3 store nearby_areas_slugs', () =>
        db.collection('areas').updateOne(
            { slug },
            { $set: { nearby_areas_slugs: nearest.map((a) => a.slug), updated_at: new Date() } }
        )
    );

    // STEP 4 — inject links into subAreas/nearby_areas string for this page
    const slugMap = (await safe('STEP 4a buildSlugMap', () => buildSlugMap())) || new Map();
    const linkedSubAreasHtml = injectLinksIntoSubAreasSection(area, slugMap);
    await safe('STEP 4b store linked_in_content', () =>
        db.collection('areas').updateOne(
            { slug },
            { $set: { linked_in_content: linkedSubAreasHtml.length > 0 } }
        )
    );

    // STEP 5 — produce HTML for new page (returned to caller; the public
    // template renders from nearby_areas_slugs directly, but exposing the
    // string lets the admin show a preview)
    const nearbyHtml = generateNearbyAreasHTML(nearest, area.name);

    // STEP 6 — reverse linking on neighbours
    const reverse = (await safe('STEP 6 reverseLink_UpdateExistingPages', () =>
        reverseLink_UpdateExistingPages(slug, area.name, area.latitude, area.longitude)
    )) || { updatedPages: [], skippedPages: [], errors: [] };

    // STEP 7 — ISR revalidation
    const toRevalidate = [slug, ...reverse.updatedPages];
    await safe('STEP 7 triggerISRRevalidation', () => triggerISRRevalidation(toRevalidate));

    // STEP 8 — IndexNow / Google Indexing API
    await safe('STEP 8 submit to Google Indexing', async () => {
        const urls = toRevalidate.map((s) => buildAreaUrl(s));
        for (const url of urls) {
            try {
                await submitAndTrack(url, 'URL_UPDATED');
            } catch (err) {
                errors.push(`indexing ${url}: ${err.message}`);
            }
        }
    });

    // STEP 9 — sitemap
    await safe('STEP 9 revalidate sitemap', () => {
        revalidatePath('/sitemap.xml');
    });

    await safe('STEP 10 logActivity', () =>
        logActivity('area_publish', {
            slug,
            reverseUpdated: reverse.updatedPages.length,
            errorCount: errors.length,
        })
    );

    // STEP 10 — response
    return NextResponse.json({
        success: errors.length === 0,
        newPage: slug,
        nearestSlugs: nearest.map((a) => a.slug),
        updatedPages: reverse.updatedPages,
        skippedPages: reverse.skippedPages,
        errors: [...errors, ...(reverse.errors || [])],
        nearbyHtml,
        linkedSubAreasHtml,
    });
}
