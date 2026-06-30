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

function logStep(slug, step, payload) {
    console.log(`[publish ${new Date().toISOString()} ${slug}] ${step}`, payload || '');
}

/**
 * Runs the full internal-linking pipeline for one area.
 * Each step is wrapped in try/catch — pipeline never throws.
 *
 * @param {string} slug
 * @param {{ force?: boolean, indexNow?: boolean }} [opts]
 * @returns {Promise<{
 *   success: boolean,
 *   newPage: string,
 *   nearestSlugs: string[],
 *   updatedPages: string[],
 *   skippedPages: string[],
 *   errors: string[],
 *   nearbyHtml: string,
 *   linkedSubAreasHtml: string,
 * }>}
 */
export async function runPublishPipeline(slug, opts = {}) {
    const { indexNow = true } = opts;
    const errors = [];
    const safe = async (label, fn) => {
        try {
            const result = await fn();
            logStep(slug, label, 'ok');
            return result;
        } catch (err) {
            const msg = `${label} failed: ${err.message}`;
            errors.push(msg);
            logStep(slug, label, msg);
            return null;
        }
    };

    const { db } = await connectToDatabase();
    const area = await db.collection('areas').findOne({ slug, is_active: true });
    if (!area) {
        return {
            success: false,
            newPage: slug,
            nearestSlugs: [],
            updatedPages: [],
            skippedPages: [],
            errors: [`Active area not found: ${slug}`],
            nearbyHtml: '',
            linkedSubAreasHtml: '',
        };
    }
    if (typeof area.latitude !== 'number' || typeof area.longitude !== 'number') {
        return {
            success: false,
            newPage: slug,
            nearestSlugs: [],
            updatedPages: [],
            skippedPages: [],
            errors: ['Area is missing latitude/longitude'],
            nearbyHtml: '',
            linkedSubAreasHtml: '',
        };
    }

    const nearest = (await safe('STEP 2 calculateNearestAreas', () =>
        calculateNearestAreas(slug)
    )) || [];

    await safe('STEP 3 store nearby_areas_slugs', () =>
        db.collection('areas').updateOne(
            { slug },
            { $set: { nearby_areas_slugs: nearest.map((a) => a.slug), updated_at: new Date() } }
        )
    );

    const slugMap = (await safe('STEP 4a buildSlugMap', () => buildSlugMap())) || new Map();
    const linkedSubAreasHtml = injectLinksIntoSubAreasSection(area, slugMap);
    await safe('STEP 4b store linked_in_content', () =>
        db.collection('areas').updateOne(
            { slug },
            { $set: { linked_in_content: linkedSubAreasHtml.length > 0 } }
        )
    );

    const nearbyHtml = generateNearbyAreasHTML(nearest, area.name);

    const reverse = (await safe('STEP 6 reverseLink_UpdateExistingPages', () =>
        reverseLink_UpdateExistingPages(slug, area.name, area.latitude, area.longitude)
    )) || { updatedPages: [], skippedPages: [], errors: [] };

    const toRevalidate = [slug, ...reverse.updatedPages];
    await safe('STEP 7 triggerISRRevalidation', () => triggerISRRevalidation(toRevalidate));

    if (indexNow) {
        await safe('STEP 8 submit to Google Indexing', async () => {
            for (const s of toRevalidate) {
                try {
                    await submitAndTrack(buildAreaUrl(s), 'URL_UPDATED');
                } catch (err) {
                    errors.push(`indexing ${s}: ${err.message}`);
                }
            }
        });
    }

    await safe('STEP 9 revalidate sitemap', () => {
        revalidatePath('/sitemap.xml');
        revalidatePath('/sitemap-html');
    });

    await safe('STEP 10 logActivity', () =>
        logActivity('area_publish', {
            slug,
            reverseUpdated: reverse.updatedPages.length,
            errorCount: errors.length,
        })
    );

    return {
        success: errors.length === 0,
        newPage: slug,
        nearestSlugs: nearest.map((a) => a.slug),
        updatedPages: reverse.updatedPages,
        skippedPages: reverse.skippedPages,
        errors: [...errors, ...(reverse.errors || [])],
        nearbyHtml,
        linkedSubAreasHtml,
    };
}
