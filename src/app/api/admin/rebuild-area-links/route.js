import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

function hasGeo(a) {
    return (
        typeof a.latitude === 'number' &&
        typeof a.longitude === 'number' &&
        !Number.isNaN(a.latitude) &&
        !Number.isNaN(a.longitude)
    );
}

function nearestSlugs(area, geoAreas) {
    return geoAreas
        .filter((a) => a.slug !== area.slug)
        .map((a) => ({
            slug: a.slug,
            dist: haversineKm(area.latitude, area.longitude, a.latitude, a.longitude),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, NEAREST_LIMIT)
        .map((a) => a.slug);
}

/**
 * POST /api/admin/rebuild-area-links  { slug }
 *
 * Scoped counterpart to /api/admin/rebuild-all-links: relinks ONE area
 * instead of the whole set.
 *
 * Writes are limited to changes that involve this slug:
 *   1. This area's own nearby_areas_slugs (outbound) + internal_links_from (inbound).
 *   2. Neighbours that should gain or lose a link to/from this slug. Their other
 *      links are left untouched, so nothing unrelated is churned.
 *
 * Only the affected pages get revalidated.
 */
export async function POST(request) {
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie?.value) return unauthorized();

    let body = {};
    try {
        body = await request.json();
    } catch {
        // empty body handled below
    }
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    if (!slug) {
        return NextResponse.json({ success: false, error: 'slug is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const areas = await db
        .collection('areas')
        .find(
            { is_active: true },
            {
                projection: {
                    _id: 1,
                    slug: 1,
                    name: 1,
                    latitude: 1,
                    longitude: 1,
                    nearby_areas_slugs: 1,
                    internal_links_from: 1,
                },
            }
        )
        .toArray();

    const target = areas.find((a) => a.slug === slug);
    if (!target) {
        return NextResponse.json(
            { success: false, error: 'Area not found or not active' },
            { status: 404 }
        );
    }
    if (!hasGeo(target)) {
        return NextResponse.json(
            { success: false, error: 'Area has no latitude/longitude — save coordinates first' },
            { status: 400 }
        );
    }

    const geoAreas = areas.filter(hasGeo);

    // 1. This area's outbound links
    const targetOutbound = nearestSlugs(target, geoAreas);
    const targetOutboundSet = new Set(targetOutbound);

    // Pending per-slug updates, keyed by slug
    const updates = new Map();
    const setField = (s, field, value) => {
        const current = updates.get(s) || {};
        current[field] = value;
        updates.set(s, current);
    };

    // 2. Neighbours: add/remove this slug from their outbound list only
    const targetInbound = new Set();
    for (const other of geoAreas) {
        if (other.slug === slug) continue;

        const currentOut = Array.isArray(other.nearby_areas_slugs)
            ? other.nearby_areas_slugs.slice()
            : [];
        const shouldLink = nearestSlugs(other, geoAreas).includes(slug);
        const linksNow = currentOut.includes(slug);

        let nextOut = currentOut;
        if (shouldLink && !linksNow) {
            // Insert at the position its distance warrants, then trim to the limit
            const distTo = (s) => {
                const a = geoAreas.find((x) => x.slug === s);
                return a ? haversineKm(other.latitude, other.longitude, a.latitude, a.longitude) : Infinity;
            };
            const targetDist = distTo(slug);
            const idx = currentOut.findIndex((s) => distTo(s) > targetDist);
            nextOut = currentOut.slice();
            nextOut.splice(idx === -1 ? nextOut.length : idx, 0, slug);
            nextOut = nextOut.slice(0, NEAREST_LIMIT);
            setField(other.slug, 'nearby_areas_slugs', nextOut);
        } else if (!shouldLink && linksNow) {
            nextOut = currentOut.filter((s) => s !== slug);
            setField(other.slug, 'nearby_areas_slugs', nextOut);
        }

        if (nextOut.includes(slug)) targetInbound.add(other.slug);

        // 3. Keep the neighbour's inbound list in sync with this area's outbound
        const currentIn = Array.isArray(other.internal_links_from)
            ? other.internal_links_from
            : [];
        const shouldBeLinkedFromTarget = targetOutboundSet.has(other.slug);
        const listedNow = currentIn.includes(slug);
        if (shouldBeLinkedFromTarget && !listedNow) {
            setField(other.slug, 'internal_links_from', [...currentIn, slug]);
        } else if (!shouldBeLinkedFromTarget && listedNow) {
            setField(other.slug, 'internal_links_from', currentIn.filter((s) => s !== slug));
        }
    }

    // This area's own record
    setField(slug, 'nearby_areas_slugs', targetOutbound);
    setField(slug, 'internal_links_from', Array.from(targetInbound));

    const bulkOps = Array.from(updates.entries()).map(([s, fields]) => ({
        updateOne: {
            filter: { slug: s },
            update: { $set: { ...fields, updated_at: new Date() } },
        },
    }));

    let writeResult = { modifiedCount: 0 };
    if (bulkOps.length > 0) {
        writeResult = await db.collection('areas').bulkWrite(bulkOps, { ordered: false });
    }

    // 4. Revalidate only the affected pages
    const errors = [];
    const affected = Array.from(updates.keys());
    for (const s of affected) {
        try {
            revalidatePath(`/areas/${s}`);
        } catch (err) {
            errors.push(`revalidate ${s}: ${err.message}`);
        }
    }
    try {
        revalidateTag('areas');
        revalidatePath('/areas');
        revalidatePath('/sitemap.xml');
        revalidatePath('/sitemap-html');
    } catch (err) {
        errors.push(`root paths: ${err.message}`);
    }

    return NextResponse.json({
        success: errors.length === 0,
        slug,
        outbound: targetOutbound.length,
        inbound: targetInbound.size,
        neighboursUpdated: Math.max(0, affected.length - 1),
        modified: writeResult.modifiedCount ?? 0,
        revalidated: affected.length,
        errors,
    });
}
