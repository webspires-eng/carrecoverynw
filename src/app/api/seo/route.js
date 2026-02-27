import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// GET SEO settings
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const seoDoc = await db.collection('seo_settings').findOne({ _id: 'seo_config' });

        const defaults = {
            schema_markup: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": "Car Recovery UK",
                "url": process.env.SITE_URL || "https://cartowingnearme.co.uk",
                "description": "24/7 Emergency Car Recovery Service covering the entire UK.",
                "telephone": "+447360544819",
                "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "GB"
                }
            }, null, 4),
            robots_txt: `User-agent: *\nAllow: /\n\nSitemap: ${process.env.SITE_URL || 'https://cartowingnearme.co.uk'}/sitemap.xml\n\nDisallow: /admin/`,
            canonical_base_url: process.env.SITE_URL || 'https://cartowingnearme.co.uk'
        };

        const data = seoDoc ? {
            schema_markup: seoDoc.schema_markup || defaults.schema_markup,
            robots_txt: seoDoc.robots_txt || defaults.robots_txt,
            canonical_base_url: seoDoc.canonical_base_url || defaults.canonical_base_url
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

        await db.collection('seo_settings').updateOne(
            { _id: 'seo_config' },
            {
                $set: {
                    schema_markup: body.schema_markup,
                    robots_txt: body.robots_txt,
                    canonical_base_url: body.canonical_base_url,
                    updated_at: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: 'SEO settings saved successfully' });
    } catch (error) {
        console.error('Error saving SEO settings:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
