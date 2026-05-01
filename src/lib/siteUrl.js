const DEFAULT_SITE_URL = 'https://www.cartowingnearme.co.uk';

export function getSiteUrl() {
    const candidate = process.env.SITE_URL || DEFAULT_SITE_URL;

    try {
        const parsed = new URL(candidate);
        return parsed.origin;
    } catch {
        return DEFAULT_SITE_URL;
    }
}

export function absoluteUrl(pathname = '/') {
    const base = getSiteUrl();
    if (!pathname || pathname === '/') {
        return base;
    }

    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${base}${normalizedPath}`;
}
