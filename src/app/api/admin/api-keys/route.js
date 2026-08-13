// Admin-only management of mobile API keys.
//
//   GET  /api/admin/api-keys   list issued keys (never the keys themselves)
//   POST /api/admin/api-keys   issue a new key (returns the plaintext ONCE)
//
// Guarded by the admin session cookie: middleware.js covers the /admin pages
// but not /api/*, so these routes check for themselves. Without that, anyone
// could mint a key for the booking API.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminSession';
import { createApiKey, listApiKeys, SCOPES } from '@/lib/apiKeys';
import { logActivity } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const MAX_LABEL = 60;

export async function GET(request) {
    const auth = requireAdmin(request);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        return NextResponse.json({ success: true, data: await listApiKeys() });
    } catch (error) {
        console.error('[Admin API keys] list failed:', error);
        return NextResponse.json({ success: false, error: 'Could not load API keys.' }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = requireAdmin(request);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const label = typeof body?.label === 'string' ? body.label.trim() : '';
    if (!label) {
        return NextResponse.json(
            { success: false, error: 'Give the key a label so you can recognise it later.' },
            { status: 400 }
        );
    }
    if (label.length > MAX_LABEL) {
        return NextResponse.json(
            { success: false, error: `Label must be ${MAX_LABEL} characters or fewer.` },
            { status: 400 }
        );
    }

    const scopes = Array.isArray(body?.scopes)
        ? body.scopes.filter((s) => SCOPES.includes(s))
        : null;

    if (Array.isArray(body?.scopes) && scopes.length === 0) {
        return NextResponse.json(
            { success: false, error: 'A key needs at least one permission.' },
            { status: 400 }
        );
    }

    try {
        const { key, record } = await createApiKey({
            label,
            scopes,
            createdBy: auth.user.email,
        });

        // Log that a key was issued — never the key or its hash.
        await logActivity(
            'API_KEY_CREATED',
            { label: record.label, prefix: record.prefix, scopes: record.scopes, by: auth.user.email },
            'success'
        );

        // `key` appears in this response and nowhere else, ever again.
        return NextResponse.json({ success: true, key, data: record }, { status: 201 });
    } catch (error) {
        console.error('[Admin API keys] create failed:', error);
        return NextResponse.json({ success: false, error: 'Could not create the API key.' }, { status: 500 });
    }
}
