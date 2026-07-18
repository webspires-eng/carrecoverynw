import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const NEAREST_LIMIT = 6;
const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

function unauthorized() {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

/**
 * POST /api/admin/rebuild-all-links
 *
 * Full rebuild of nearby_areas_slugs (outbound) and internal_links_from (inbound)
 * for every active area that has lat/lng.
 *
 * Steps:
 *   1. Fetch all active areas.
 *   2. For each area with geo, compute 6 nearest neighbours → nearby_areas_slugs.
 *   3. Derive internal_links_from for each area by inverting the outbound map.
 *   4. Bulk-write everything in one pass.
 *   5. Revalidate all area pages + sitemap.
 */
export async function POST(request) {
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie?.value) return unauthorized();

    const { db } = await connectToDatabase();

    // 1. Load all active areas
    const areas = await db
        .collection('areas')
        .find(
            { is_active: true },
            { projection: { _id: 1, slug: 1, name: 1, latitude: 1, longitude: 1 } }
        )
        .toArray();

    const geoAreas = areas.filter(
        (a) =>
            typeof a.latitude === 'number' &&
            typeof a.longitude === 'number' &&
            !Number.isNaN(a.latitude) &&
            !Number.isNaN(a.longitude)
    );

    const noGeo = areas.length - geoAreas.length;

    // 2. Compute nearby_areas_slugs for each geo area
    // outbound[slug] = [slug1, slug2, ...] (up to 6)
    const outbound = {};
    for (const area of geoAreas) {
        const nearest = geoAreas
            .filter((a) => a.slug !== area.slug)
            .map((a) => ({
                slug: a.slug,
                dist: haversineKm(area.latitude, area.longitude, a.latitude, a.longitude),
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, NEAREST_LIMIT)
            .map((a) => a.slug);
        outbound[area.slug] = nearest;
    }

    // 3. Build internal_links_from by inverting the outbound map
    // inbound[slug] = set of slugs that link TO this slug
    const inbound = {};
    for (const area of geoAreas) inbound[area.slug] = new Set();
    for (const [fromSlug, targets] of Object.entries(outbound)) {
        for (const toSlug of targets) {
            if (inbound[toSlug]) inbound[toSlug].add(fromSlug);
        }
    }

    // 4. Bulk-write all areas with geo; clear links for areas without geo
    const bulkOps = [];
    for (const area of geoAreas) {
        bulkOps.push({
            updateOne: {
                filter: { slug: area.slug },
                update: {
                    $set: {
                        nearby_areas_slugs: outbound[area.slug],
                        internal_links_from: Array.from(inbound[area.slug]),
                        updated_at: new Date(),
                    },
                },
            },
        });
    }
    // Clear stale link data on areas that have no geo
    const noGeoSlugs = areas.filter((a) => !outbound[a.slug]).map((a) => a.slug);
    if (noGeoSlugs.length > 0) {
        bulkOps.push({
            updateMany: {
                filter: { slug: { $in: noGeoSlugs } },
                update: {
                    $set: {
                        nearby_areas_slugs: [],
                        internal_links_from: [],
                        updated_at: new Date(),
                    },
                },
            },
        });
    }

    let writeResult = { modifiedCount: 0 };
    if (bulkOps.length > 0) {
        writeResult = await db.collection('areas').bulkWrite(bulkOps, { ordered: false });
    }

    // 5. Revalidate all pages
    const errors = [];
    const BATCH = 20;
    const allSlugs = areas.map((a) => a.slug).filter(Boolean);
    for (let i = 0; i < allSlugs.length; i += BATCH) {
        const batch = allSlugs.slice(i, i + BATCH);
        await Promise.all(
            batch.map((slug) => {
                try {
                    revalidatePath(`/areas/${slug}`);
                } catch (err) {
                    errors.push(`revalidate ${slug}: ${err.message}`);
                }
            })
        );
    }
    try {
        revalidateTag('areas');
        revalidatePath('/areas');
        revalidatePath('/');
        revalidatePath('/sitemap.xml');
        revalidatePath('/sitemap-html');
    } catch (err) {
        errors.push(`root paths: ${err.message}`);
    }

    return NextResponse.json({
        success: errors.length === 0,
        total: areas.length,
        withGeo: geoAreas.length,
        noGeo,
        modified: writeResult.modifiedCount ?? 0,
        revalidated: allSlugs.length,
        errors,
    });
}
