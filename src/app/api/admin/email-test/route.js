import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminSession';
import { sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/admin/email-test — sends a test message using the saved mail settings.
export async function POST(request) {
    const auth = requireAdmin(request);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const result = await sendTestEmail();
    if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }
    return NextResponse.json({ success: true, to: result.to });
}
