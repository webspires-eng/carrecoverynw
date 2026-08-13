// GET /api/mobile/distance?from_lat=&from_lng=&to_lat=&to_lng=
//     GET /api/mobile/distance?from=<address>&to=<address>
//
// Driving distance and time, for quoting. Read-only.
// Coordinates are preferred — the app already has them from /places/details,
// and they cache far better than free text.
import { guard, fail, json, preflight } from '@/lib/mobileApi';
import { distance } from '@/lib/googleMaps';

export const dynamic = 'force-dynamic';

// ~11 m of precision. Enough to be exact for coordinates the app got from
// /places/details, while still collapsing near-identical repeat lookups.
const CACHE_PRECISION = 4;

function parseCoordinate(value, limit) {
    if (value === null || value === undefined || String(value).trim() === '') return undefined;
    const num = Number(value);
    if (Number.isNaN(num) || Math.abs(num) > limit) return null;   // present but invalid
    return num;
}

export async function OPTIONS() {
    return preflight();
}

export async function GET(request) {
    const denied = await guard(request, 'read');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);

    const fromLat = parseCoordinate(searchParams.get('from_lat'), 90);
    const fromLng = parseCoordinate(searchParams.get('from_lng'), 180);
    const toLat = parseCoordinate(searchParams.get('to_lat'), 90);
    const toLng = parseCoordinate(searchParams.get('to_lng'), 180);

    const coords = [fromLat, fromLng, toLat, toLng];
    if (coords.some((c) => c === null)) {
        return fail('Coordinates must be valid numbers.', 400);
    }

    const suppliedCoords = coords.filter((c) => c !== undefined).length;

    let origin;
    let destination;
    let cacheKey;

    if (suppliedCoords === 4) {
        origin = `${fromLat},${fromLng}`;
        destination = `${toLat},${toLng}`;
        cacheKey = `distance:${fromLat.toFixed(CACHE_PRECISION)},${fromLng.toFixed(CACHE_PRECISION)}`
            + `|${toLat.toFixed(CACHE_PRECISION)},${toLng.toFixed(CACHE_PRECISION)}`;
    } else if (suppliedCoords > 0) {
        return fail('Provide all four of from_lat, from_lng, to_lat and to_lng, or use from and to instead.', 400);
    } else {
        origin = searchParams.get('from')?.trim();
        destination = searchParams.get('to')?.trim();

        if (!origin || !destination) {
            return fail('Provide a start and end point, either as coordinates or as addresses.', 400);
        }

        cacheKey = `distance:text:${origin.toLowerCase()}|${destination.toLowerCase()}`;
    }

    const result = await distance(origin, destination, cacheKey);

    switch (result.status) {
        case 'ok':
            return json(result.data);

        case 'no-route':
            return fail('No driving route found between those two places.', 404);

        default:
            return fail('Distance lookup is unavailable right now. Enter the distance manually.', 502);
    }
}
