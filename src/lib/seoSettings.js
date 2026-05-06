import { unstable_cache } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { getSiteUrl } from '@/lib/siteUrl';

export const SEO_CACHE_TAG = 'seo-settings';

async function fetchSeoDoc() {
    try {
        const { db } = await connectToDatabase();
        const doc = await db.collection('seo_settings').findOne({ _id: 'seo_config' });
        return doc || null;
    } catch (err) {
        console.error('[seoSettings] DB read failed:', err);
        return null;
    }
}

const getCachedSeoDoc = unstable_cache(fetchSeoDoc, ['seo-settings-doc'], {
    tags: [SEO_CACHE_TAG],
    revalidate: 300,
});

export async function getCanonicalBaseUrl() {
    const fallback = getSiteUrl();
    const doc = await getCachedSeoDoc();
    const candidate = (doc?.canonical_base_url || '').trim();
    if (!candidate) return fallback;
    try {
        return new URL(candidate).origin;
    } catch {
        return fallback;
    }
}

export async function canonicalUrl(pathname = '/') {
    const base = await getCanonicalBaseUrl();
    if (!pathname || pathname === '/') return base;
    const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${base}${path}`;
}

export async function getCustomSchemaMarkup() {
    const doc = await getCachedSeoDoc();
    const raw = doc?.schema_markup;
    if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
    try {
        return JSON.parse(raw);
    } catch (err) {
        console.error('[seoSettings] Invalid schema_markup JSON in DB, ignoring:', err.message);
        return null;
    }
}

export async function getRobotsDoc() {
    return getCachedSeoDoc();
}
