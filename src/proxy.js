import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/adminSession';

// Guards the /admin pages only (Next 16 "proxy", Node.js runtime, so the
// session secret is read from the environment at request time). API routes check the session themselves
// (see lib/adminSession.js).
export async function proxy(request) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin')) {
        const token = request.cookies.get(SESSION_COOKIE)?.value;

        if (!(await verifySessionToken(token))) {
            const target = new URL('/signin', request.url);
            if (target.pathname !== pathname) {
                const response = NextResponse.redirect(target);
                // Drop an old-format or expired cookie so the browser stops sending it.
                if (token) response.cookies.delete(SESSION_COOKIE);
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*']
};
