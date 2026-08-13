// Reading the admin session inside API routes.
//
// `middleware.js` only guards the /admin *pages* — it does not cover /api/*.
// So any API route that issues or revokes credentials has to check for itself.
// The admin dashboard calls these routes same-origin, so the session cookie
// rides along automatically.

const COOKIE = 'admin_session';

/**
 * Parse the admin session cookie, or null if absent/unreadable.
 * The cookie is JSON written by /api/auth/login: { id, email, name, role }.
 */
export function getAdminSession(request) {
    const raw = request.cookies?.get(COOKIE)?.value;
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        // Some clients percent-encode the cookie value; try once more.
        try {
            return JSON.parse(decodeURIComponent(raw));
        } catch {
            return null;
        }
    }
}

/**
 * Require a signed-in admin.
 * @returns {{ ok: true, user: object } | { ok: false, status: number, error: string }}
 */
export function requireAdmin(request) {
    const user = getAdminSession(request);

    if (!user?.email) {
        return { ok: false, status: 401, error: 'You must be signed in to do that.' };
    }

    return { ok: true, user };
}
