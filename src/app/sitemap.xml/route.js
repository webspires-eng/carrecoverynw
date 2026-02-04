import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensure it's not cached static

export async function GET() {
    const baseUrl = process.env.SITE_URL || 'https://cartowingnearme.co.uk';

    let areas = [];
    try {
        const { db } = await connectToDatabase();
        areas = await db.collection('areas')
            .find({ is_active: true }, { projection: { slug: 1, updated_at: 1, created_at: 1 } })
            .toArray();
    } catch (e) {
        console.error('Sitemap DB error:', e);
    }

    const simpleRoutes = [
        { url: baseUrl, changeFreq: 'daily', priority: '1.0' },
        { url: `${baseUrl}/areas`, changeFreq: 'daily', priority: '0.9' },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${simpleRoutes.map(route => `
    <url>
        <loc>${route.url}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${route.changeFreq}</changefreq>
        <priority>${route.priority}</priority>
    </url>
    `).join('')}
    ${areas.map(area => `
    <url>
        <loc>${baseUrl}/area/${area.slug}</loc>
        <lastmod>${new Date(area.updated_at || area.created_at || new Date()).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    `).join('')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
