import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { getSiteUrl } from '@/lib/siteUrl';
import { SEO_CACHE_TAG } from '@/lib/seoSettings';

function normalizeCanonicalBaseUrl(value, fallback) {
    const candidate = (typeof value === 'string' ? value.trim() : '') || fallback;

    try {
        const parsed = new URL(candidate);
        return parsed.origin;
    } catch {
        return null;
    }
}

// GET SEO settings
export async function GET() {
    try {
        const siteUrl = getSiteUrl();
        const { db } = await connectToDatabase();
        const seoDoc = await db.collection('seo_settings').findOne({ _id: 'seo_config' });

        const defaults = {
            schema_markup: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": "Car Recovery UK",
                "url": siteUrl,
                "description": "24/7 Emergency Car Recovery Service covering the entire UK.",
                "telephone": "+447360544819",
                "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "GB"
                }
            }, null, 4),
            robots_txt: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n\nDisallow: /admin/`,
            canonical_base_url: siteUrl
        };

        const data = seoDoc ? {
            schema_markup: seoDoc.schema_markup || defaults.schema_markup,
            robots_txt: seoDoc.robots_txt || defaults.robots_txt,
            canonical_base_url: normalizeCanonicalBaseUrl(seoDoc.canonical_base_url, siteUrl) || siteUrl
        } : defaults;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching SEO settings:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT update SEO settings
export async function PUT(request) {
    try {
        const body = await request.json();
        const siteUrl = getSiteUrl();
        const { db } = await connectToDatabase();

        // Validate schema markup JSON if provided
        if (body.schema_markup) {
            try {
                JSON.parse(body.schema_markup);
            } catch (e) {
                return NextResponse.json({
                    success: false,
                    error: 'Invalid JSON in Schema Markup. Please check your JSON-LD syntax.'
                }, { status: 400 });
            }
        }

        const canonicalBaseUrl = normalizeCanonicalBaseUrl(body.canonical_base_url, siteUrl);
        if (!canonicalBaseUrl) {
            return NextResponse.json({
                success: false,
                error: 'Canonical Base URL must be a valid absolute URL (e.g. https://www.cartowingnearme.co.uk).'
            }, { status: 400 });
        }

        await db.collection('seo_settings').updateOne(
            { _id: 'seo_config' },
            {
                $set: {
                    schema_markup: body.schema_markup,
                    robots_txt: body.robots_txt,
                    canonical_base_url: canonicalBaseUrl,
                    updated_at: new Date()
                }
            },
            { upsert: true }
        );

        // Flush cached SEO reads + force regeneration of cached pages that consume them.
        try {
            revalidateTag(SEO_CACHE_TAG);
            revalidatePath('/robots.txt');
            revalidatePath('/', 'layout');
        } catch (err) {
            console.error('[seo PUT] revalidate failed:', err.message);
        }

        return NextResponse.json({ success: true, message: 'SEO settings saved successfully' });
    } catch (error) {
        console.error('Error saving SEO settings:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
