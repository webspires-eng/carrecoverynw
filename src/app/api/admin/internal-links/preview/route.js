import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import {
    haversineKm,
    calculateNearestAreas,
} from '@/lib/internalLinking';

export const dynamic = 'force-dynamic';

const REVERSE_LINK_RADIUS_KM = 25;

function unauthorized() {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

/**
 * GET /api/admin/internal-links/preview?slug=...
 *   OR
 * GET /api/admin/internal-links/preview?lat=...&lng=...
 *
 * Returns:
 *   {
 *     nearest: AreaLink[],
 *     reverseTargets: { slug, name, distanceKm }[]
 *   }
 *
 * `nearest` = the 6 pages this area would link TO.
 * `reverseTargets` = existing pages within 25 km that would gain a link
 *                    pointing to this area when published.
 */
export async function GET(request) {
    const session = request.cookies.get('admin_session');
    if (!session?.value) return unauthorized();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    let lat;
    let lng;
    let selfSlug = slug || null;

    if (latParam !== null && lngParam !== null) {
        lat = Number(latParam);
        lng = Number(lngParam);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return NextResponse.json(
                { success: false, error: 'lat/lng must be numbers' },
                { status: 400 }
            );
        }
    } else if (slug) {
        const { db } = await connectToDatabase();
        const area = await db
            .collection('areas')
            .findOne({ slug }, { projection: { latitude: 1, longitude: 1 } });
        if (!area) {
            return NextResponse.json(
                { success: false, error: 'Area not found' },
                { status: 404 }
            );
        }
        lat = area.latitude;
        lng = area.longitude;
    } else {
        return NextResponse.json(
            { success: false, error: 'Provide slug or lat+lng' },
            { status: 400 }
        );
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return NextResponse.json(
            { success: false, error: 'Area has no geo coordinates' },
            { status: 400 }
        );
    }

    const { db } = await connectToDatabase();
    const all = await db
        .collection('areas')
        .find(
            { is_active: true },
            { projection: { _id: 0, slug: 1, name: 1, county: 1, latitude: 1, longitude: 1 } }
        )
        .toArray();

    const nearest = selfSlug
        ? await calculateNearestAreas(selfSlug)
        : all
              .filter(
                  (a) => typeof a.latitude === 'number' && typeof a.longitude === 'number'
              )
              .map((a) => ({
                  name: a.name,
                  slug: a.slug,
                  county: a.county || '',
                  distanceKm: haversineKm(lat, lng, a.latitude, a.longitude),
              }))
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .slice(0, 6);

    const reverseTargets = all
        .filter((a) => a.slug !== selfSlug)
        .filter((a) => typeof a.latitude === 'number' && typeof a.longitude === 'number')
        .map((a) => ({
            slug: a.slug,
            name: a.name,
            distanceKm: haversineKm(lat, lng, a.latitude, a.longitude),
        }))
        .filter((a) => a.distanceKm < REVERSE_LINK_RADIUS_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({ success: true, nearest, reverseTargets });
}
