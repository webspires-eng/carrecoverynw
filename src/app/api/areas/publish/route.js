import { NextResponse } from 'next/server';
import { runPublishPipeline } from '@/lib/publishPipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function unauthorized() {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request) {
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie?.value) return unauthorized();

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }
    const { slug } = body || {};
    if (!slug || typeof slug !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 });
    }

    const result = await runPublishPipeline(slug);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
