// GET /api/mobile/places/autocomplete?q=...&session=...
//
// Address suggestions for the pickup/dropoff fields. Read-only.
import { guard, fail, json, preflight } from '@/lib/mobileApi';
import { autocomplete } from '@/lib/googleMaps';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return preflight();
}

export async function GET(request) {
    const denied = await guard(request, 'read');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const session = searchParams.get('session') || undefined;

    if (query === null) {
        return fail('Provide a search term in the "q" parameter.', 400);
    }

    // Short queries return [] without calling Google — see lib/googleMaps.js
    const result = await autocomplete(query, session);

    if (result.status === 'ok') {
        return json({ data: result.data });
    }

    return fail('Address search is unavailable right now. Type the address manually.', 502);
}
