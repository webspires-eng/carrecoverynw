// DELETE /api/admin/api-keys/:id — revoke a key.
//
// Revoking sets `revokedAt` rather than deleting the row, so the audit trail
// (who issued it, when, when it was last used) survives. Takes effect on the
// very next request — no redeploy.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminSession';
import { revokeApiKey } from '@/lib/apiKeys';
import { logActivity } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
    const auth = requireAdmin(request);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    try {
        const result = await revokeApiKey(id);

        if (!result.ok) {
            const notFound = result.reason === 'not-found';
            return NextResponse.json(
                { success: false, error: notFound ? 'API key not found.' : 'That key is already revoked.' },
                { status: notFound ? 404 : 409 }
            );
        }

        await logActivity('API_KEY_REVOKED', { id, by: auth.user.email }, 'success');

        return NextResponse.json({ success: true, message: 'API key revoked.' });
    } catch (error) {
        console.error('[Admin API keys] revoke failed:', error);
        return NextResponse.json({ success: false, error: 'Could not revoke the API key.' }, { status: 500 });
    }
}
