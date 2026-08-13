// GET /api/mobile/vehicle/:registration — DVLA lookup.
//
// A GET proxy over what is a POST upstream, so the app can cache and retry it
// safely. Read-only: it creates nothing.
import { guard, fail, json, preflight } from '@/lib/mobileApi';
import { lookupVehicle, normalizeRegistration, isPlausibleRegistration } from '@/lib/vehicleLookup';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return preflight();
}

export async function GET(request, { params }) {
    const denied = await guard(request, 'read');
    if (denied) return denied;

    const { registration } = await params;

    // Next already decodes route params, but a stray "%" in the URL makes a
    // second decodeURIComponent throw — so try it, and fall back to the raw
    // value rather than 500-ing on a typo.
    let raw = registration || '';
    try {
        raw = decodeURIComponent(raw);
    } catch {
        /* keep the undecoded value; normalising strips the junk anyway */
    }

    const plate = normalizeRegistration(raw);

    if (!plate) {
        return fail('Enter a registration number.', 400);
    }
    if (!isPlausibleRegistration(plate)) {
        return fail('That does not look like a registration number.', 400);
    }

    const result = await lookupVehicle(plate);

    switch (result.status) {
        case 'ok':
            return json(result.data);

        case 'not-found':
            return fail('No vehicle found for that registration.', 404);

        case 'not-configured':
            // Our misconfiguration, not the caller's. The app falls back to
            // manual entry either way.
            return fail('Vehicle lookup is unavailable right now. Enter the details manually.', 502);

        default:
            return fail('The DVLA service is not responding. Enter the details manually.', 502);
    }
}
