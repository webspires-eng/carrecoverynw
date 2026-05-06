import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin')) {
        const session = request.cookies.get('admin_session');

        if (!session) {
            const target = new URL('/signin', request.url);
            if (target.pathname !== pathname) {
                return NextResponse.redirect(target);
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*']
};
