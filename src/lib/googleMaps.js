// Server-side Google Maps calls for the mobile API.
//
// The key never leaves the server: the app calls us, we call Google. That also
// means the key can stay referrer/IP restricted without breaking the app.
import { fetchWithTimeout } from '@/lib/mobileApi';
import { getCached, setCached } from '@/lib/lookupCache';

const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const DISTANCE_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

// Google bills per field group, so ask for exactly what the app needs.
const DETAILS_FIELDS = 'place_id,formatted_address,geometry,address_components';

const MIN_QUERY_LENGTH = 3;
const DISTANCE_CACHE_TTL_SECONDS = 60 * 60;   // an hour, as specified

export function getGoogleKey() {
    return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
}

/** Google returns a status string; anything but OK/ZERO_RESULTS is a fault. */
function isTransportOk(status) {
    return status === 'OK' || status === 'ZERO_RESULTS';
}

/**
 * Address suggestions, biased to the UK.
 *
 * Returns an empty list for short queries without calling Google — no point
 * paying for one or two characters.
 */
export async function autocomplete(query, sessionToken) {
    const input = String(query ?? '').trim();
    if (input.length < MIN_QUERY_LENGTH) return { status: 'ok', data: [] };

    const key = getGoogleKey();
    if (!key) {
        console.error('[googleMaps] No Google Maps API key configured.');
        return { status: 'not-configured' };
    }

    const params = new URLSearchParams({
        input,
        components: 'country:gb',
        region: 'gb',
        key,
    });
    if (sessionToken) params.set('sessiontoken', sessionToken);

    let payload;
    try {
        const response = await fetchWithTimeout(`${AUTOCOMPLETE_URL}?${params}`);
        payload = await response.json();
    } catch (error) {
        console.error('[googleMaps] autocomplete failed:', error.message);
        return { status: 'upstream-error' };
    }

    if (!isTransportOk(payload?.status)) {
        console.error(`[googleMaps] autocomplete status ${payload?.status}: ${payload?.error_message || ''}`);
        return { status: 'upstream-error' };
    }

    const data = (payload.predictions || []).map((prediction) => ({
        place_id: prediction.place_id,
        description: prediction.description,
        // The app renders these on two lines, which reads far better than one
        // long string. Fall back to the description if Google omits them.
        main_text: prediction.structured_formatting?.main_text ?? prediction.description ?? null,
        secondary_text: prediction.structured_formatting?.secondary_text ?? null,
    }));

    return { status: 'ok', data };
}

/**
 * Resolve a suggestion to an address and coordinates.
 *
 * Deliberately NOT cached. Google's session-token billing bundles a series of
 * autocomplete keystrokes with the details call that closes the session — if we
 * served details from cache and skipped that call, the session would never
 * close and Google would bill every keystroke request individually. Caching
 * here would cost more, not less.
 */
export async function placeDetails(placeId, sessionToken) {
    const key = getGoogleKey();
    if (!key) {
        console.error('[googleMaps] No Google Maps API key configured.');
        return { status: 'not-configured' };
    }

    const params = new URLSearchParams({
        place_id: placeId,
        fields: DETAILS_FIELDS,
        key,
    });
    if (sessionToken) params.set('sessiontoken', sessionToken);

    let payload;
    try {
        const response = await fetchWithTimeout(`${DETAILS_URL}?${params}`);
        payload = await response.json();
    } catch (error) {
        console.error('[googleMaps] place details failed:', error.message);
        return { status: 'upstream-error' };
    }

    if (payload?.status === 'NOT_FOUND' || payload?.status === 'ZERO_RESULTS' || payload?.status === 'INVALID_REQUEST') {
        return { status: 'not-found' };
    }
    if (payload?.status !== 'OK' || !payload.result) {
        console.error(`[googleMaps] place details status ${payload?.status}: ${payload?.error_message || ''}`);
        return { status: 'upstream-error' };
    }

    const result = payload.result;
    const postcode = (result.address_components || [])
        .find((component) => component.types?.includes('postal_code'))?.long_name ?? null;

    return {
        status: 'ok',
        data: {
            place_id: result.place_id ?? placeId,
            address: result.formatted_address ?? null,
            lat: result.geometry?.location?.lat ?? null,
            lng: result.geometry?.location?.lng ?? null,
            postcode,
        },
    };
}

/**
 * Google's imperial distance text is like "18.2 mi"; the app wants it spelled
 * out. Keep any other unit (feet, for very short hops) untouched.
 */
function spellOutMiles(text) {
    if (typeof text !== 'string') return text ?? null;
    return text.replace(/(\d(?:[\d.,]*)?)\s*mi\b/, (match, value) =>
        `${value} ${parseFloat(String(value).replace(/,/g, '')) === 1 ? 'mile' : 'miles'}`
    );
}

/**
 * Driving distance and time between two points.
 * `origin` and `destination` are already-formatted strings — either
 * "lat,lng" or free text.
 */
export async function distance(origin, destination, cacheKey) {
    if (cacheKey) {
        const cached = await getCached(cacheKey);
        if (cached) return { status: 'ok', data: cached, cached: true };
    }

    const key = getGoogleKey();
    if (!key) {
        console.error('[googleMaps] No Google Maps API key configured.');
        return { status: 'not-configured' };
    }

    const params = new URLSearchParams({
        origins: origin,
        destinations: destination,
        mode: 'driving',
        units: 'imperial',   // UK road business — staff think in miles
        region: 'gb',
        key,
    });

    let payload;
    try {
        const response = await fetchWithTimeout(`${DISTANCE_URL}?${params}`);
        payload = await response.json();
    } catch (error) {
        console.error('[googleMaps] distance matrix failed:', error.message);
        return { status: 'upstream-error' };
    }

    if (payload?.status !== 'OK') {
        console.error(`[googleMaps] distance status ${payload?.status}: ${payload?.error_message || ''}`);
        return { status: 'upstream-error' };
    }

    const element = payload.rows?.[0]?.elements?.[0];

    if (!element || element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
        return { status: 'no-route' };
    }
    if (element.status !== 'OK') {
        console.error(`[googleMaps] distance element status ${element.status}`);
        return { status: 'upstream-error' };
    }

    const data = {
        distance_metres: element.distance?.value ?? null,
        distance_text: spellOutMiles(element.distance?.text),
        duration_seconds: element.duration?.value ?? null,
        duration_text: element.duration?.text ?? null,
    };

    if (cacheKey) setCached(cacheKey, data, DISTANCE_CACHE_TTL_SECONDS);

    return { status: 'ok', data, cached: false };
}
