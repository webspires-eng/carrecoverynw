import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/geocode?q=Camden
 *
 * Looks up coordinates for a UK place via OpenStreetMap Nominatim.
 * Returns { lat, lng, displayName } or { error }.
 *
 * Nominatim usage policy requires a descriptive User-Agent and at most
 * 1 req/sec — fine for admin form usage. Free, no API key.
 */
export async function GET(request) {
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get('q');
    if (!q || q.trim().length < 2) {
        return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    const params = new URLSearchParams({
        q: `${q.trim()}, United Kingdom`,
        format: 'json',
        limit: '1',
        countrycodes: 'gb',
        addressdetails: '0',
    });

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'User-Agent': 'cartowingnearme.co.uk admin geocoder (contact: support@cartowingnearme.co.uk)',
                'Accept-Language': 'en-GB',
            },
            cache: 'no-store',
        });
        if (!res.ok) {
            return NextResponse.json({ error: `Nominatim ${res.status}` }, { status: 502 });
        }
        const arr = await res.json();
        if (!Array.isArray(arr) || arr.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const hit = arr[0];
        return NextResponse.json({
            lat: parseFloat(hit.lat),
            lng: parseFloat(hit.lon),
            displayName: hit.display_name,
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
