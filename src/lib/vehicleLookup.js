// DVLA vehicle lookup, with the MOT History API filling in the model.
//
// NOTE: `fetchMotModel` mirrors the implementation in
// src/app/api/dvla/route.js, which serves the admin dashboard. That route is
// left untouched deliberately — it works and the dashboard depends on it — but
// the two should be merged onto this module when someone next touches either.
import { fetchWithTimeout } from '@/lib/mobileApi';
import { getCached, setCached } from '@/lib/lookupCache';

const DVLA_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

// A day. Make and colour never change, but tax and MOT status do, so this is
// deliberately not longer.
const CACHE_TTL_SECONDS = 24 * 60 * 60;

/** Strip spaces and punctuation, uppercase: "ma19 xkr" -> "MA19XKR". */
export function normalizeRegistration(input) {
    return String(input ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/** Loose plausibility check — DVLA is the real authority on what exists. */
export function isPlausibleRegistration(reg) {
    return /^[A-Z0-9]{2,8}$/.test(reg);
}

// DVLA VES returns make/colour/year/fuel but NO model name. The DVSA MOT
// History API does, so use it when its credentials are configured.
// Register (free) at https://documentation.history.mot.api.gov.uk/ then set:
// MOT_TOKEN_URL, MOT_CLIENT_ID, MOT_CLIENT_SECRET, MOT_API_KEY
async function fetchMotModel(registrationNumber) {
    const { MOT_TOKEN_URL, MOT_CLIENT_ID, MOT_CLIENT_SECRET, MOT_API_KEY } = process.env;
    if (!MOT_TOKEN_URL || !MOT_CLIENT_ID || !MOT_CLIENT_SECRET || !MOT_API_KEY) return null;

    try {
        const tokenRes = await fetchWithTimeout(MOT_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: MOT_CLIENT_ID,
                client_secret: MOT_CLIENT_SECRET,
                scope: 'https://tapi.dvsa.gov.uk/.default',
            }),
        });
        if (!tokenRes.ok) return null;

        const { access_token: accessToken } = await tokenRes.json();
        if (!accessToken) return null;

        const res = await fetchWithTimeout(
            `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(registrationNumber)}`,
            { headers: { Authorization: `Bearer ${accessToken}`, 'X-API-Key': MOT_API_KEY } }
        );
        if (!res.ok) return null;

        const vehicle = await res.json();
        return vehicle?.model || null;
    } catch (error) {
        // Enrichment is optional — never fail the lookup over it.
        console.error('[vehicleLookup] MOT History lookup failed:', error.message);
        return null;
    }
}

/** Map DVLA's payload onto the app's shape. Absent fields become null. */
function present(dvla, registration) {
    return {
        registration_number: dvla.registrationNumber || registration,
        make: dvla.make ?? null,
        model: dvla.model ?? null,
        colour: dvla.colour ?? null,
        fuel_type: dvla.fuelType ?? null,
        year_of_manufacture: dvla.yearOfManufacture ?? null,
        engine_capacity: dvla.engineCapacity ?? null,
        wheelplan: dvla.wheelplan ?? null,
        tax_status: dvla.taxStatus ?? null,
        tax_due_date: dvla.taxDueDate ?? null,
        mot_status: dvla.motStatus ?? null,
        mot_expiry_date: dvla.motExpiryDate ?? null,
    };
}

/**
 * Look up a vehicle by registration.
 *
 * @returns {Promise<{ status: 'ok', data: object, cached: boolean }
 *                 | { status: 'not-found' }
 *                 | { status: 'upstream-error' }
 *                 | { status: 'not-configured' }>}
 */
export async function lookupVehicle(registration) {
    const cacheKey = `vehicle:${registration}`;

    const cached = await getCached(cacheKey);
    if (cached) return { status: 'ok', data: cached, cached: true };

    const apiKey = process.env.DVLA_API_KEY;
    if (!apiKey) {
        console.error('[vehicleLookup] DVLA_API_KEY is not set.');
        return { status: 'not-configured' };
    }

    let response;
    try {
        response = await fetchWithTimeout(DVLA_URL, {
            method: 'POST',
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrationNumber: registration }),
        });
    } catch (error) {
        console.error('[vehicleLookup] DVLA request failed:', error.message);
        return { status: 'upstream-error' };
    }

    // 404 = no such vehicle. 400 = DVLA rejected the format; from the app's
    // point of view that is still "this plate found nothing".
    if (response.status === 404 || response.status === 400) {
        return { status: 'not-found' };
    }

    if (!response.ok) {
        console.error(`[vehicleLookup] DVLA responded ${response.status}`);
        return { status: 'upstream-error' };
    }

    let dvla;
    try {
        dvla = await response.json();
    } catch (error) {
        console.error('[vehicleLookup] DVLA returned unreadable JSON:', error.message);
        return { status: 'upstream-error' };
    }

    if (!dvla.model) {
        const model = await fetchMotModel(registration);
        if (model) dvla.model = model;
    }

    const data = present(dvla, registration);
    setCached(cacheKey, data, CACHE_TTL_SECONDS);   // fire-and-forget

    return { status: 'ok', data, cached: false };
}
