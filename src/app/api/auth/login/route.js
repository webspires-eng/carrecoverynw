import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    SESSION_COOKIE,
    SESSION_MAX_AGE,
    adminLoginConfigured,
    createSessionToken,
    passcodeMatches,
} from '@/lib/adminSession';
import { checkRateLimit } from '@/lib/rateLimit';

// Attempts allowed per IP, and in total, per window. The total cap stops a
// guesser who spreads attempts over many IP addresses.
const PER_IP = { max: 10, windowMs: 15 * 60 * 1000 };
const OVERALL = { max: 100, windowMs: 60 * 60 * 1000 };

function clientIp(request) {
    // nginx sets X-Real-IP to the connecting address; X-Forwarded-For's first
    // entry can be supplied by the client, so it is only a fallback.
    return request.headers.get('x-real-ip')
        || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
        || 'unknown';
}

function tooMany(retryAfter) {
    return NextResponse.json(
        { success: false, error: 'Too many attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
}

export async function POST(request) {
    if (!adminLoginConfigured()) {
        console.error('[Auth] ADMIN_PASSCODE or SESSION_SECRET is not set; admin sign-in is disabled.');
        return NextResponse.json({ success: false, error: 'Admin sign-in is not set up yet.' }, { status: 503 });
    }

    const ip = clientIp(request);

    // Every attempt counts, right or wrong.
    const perIp = checkRateLimit(`login:ip:${ip}`, PER_IP);
    if (!perIp.ok) return tooMany(perIp.retryAfter);
    const overall = checkRateLimit('login:all', OVERALL);
    if (!overall.ok) return tooMany(overall.retryAfter);

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const passcode = typeof body?.passcode === 'string' ? body.passcode.trim() : '';
    if (!(await passcodeMatches(passcode))) {
        console.warn(`[Auth] Failed admin sign-in from ${ip}`);
        return NextResponse.json({ success: false, error: 'Wrong passcode' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, await createSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({ success: true, user: { name: 'Admin' } });
}
