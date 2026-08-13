// GET /api/mobile/places/details?place_id=...&session=...
//
// Resolves a suggestion to a full address plus coordinates, so the app can put
// the job on a map and open directions. Read-only.
import { guard, fail, json, preflight } from '@/lib/mobileApi';
import { placeDetails } from '@/lib/googleMaps';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return preflight();
}

export async function GET(request) {
    const denied = await guard(request, 'read');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id')?.trim();
    const session = searchParams.get('session') || undefined;

    if (!placeId) {
        return fail('Provide a place_id.', 400);
    }

    const result = await placeDetails(placeId, session);

    switch (result.status) {
        case 'ok':
            return json(result.data);

        case 'not-found':
            return fail('That address could not be found. Try searching again.', 404);

        default:
            return fail('Address lookup is unavailable right now. Type the address manually.', 502);
    }
}
