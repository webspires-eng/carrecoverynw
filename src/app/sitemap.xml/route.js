import { connectToDatabase } from '@/lib/db';
import { getSiteUrl } from '@/lib/siteUrl';

// Cached, NOT force-dynamic. This document is ~674 URLs (~140 KB) and is hit
// constantly by crawlers; regenerating it per request meant a fresh Mongo query
// + 140 KB of origin transfer every time, which was a top consumer of both
// Fast Origin Transfer and Fluid Active CPU.
//
// 24h ISR = one write per day for this route, and the publish pipeline already
// calls revalidatePath('/sitemap.xml'), so a newly published area still appears
// in the sitemap immediately rather than waiting out the window.
export const revalidate = 86400;

export async function GET() {
    const baseUrl = getSiteUrl();

    let areas = [];
    try {
        const { db } = await connectToDatabase();
        // Only canonical, indexable pages belong in the sitemap: active areas
        // that are not flagged noindex (thin pages pending unique content).
        // Every slug here is in generateStaticParams(), so every URL returns 200.
        areas = await db.collection('areas')
            .find(
                { is_active: true, noindex: { $ne: true } },
                { projection: { slug: 1, updated_at: 1, created_at: 1 } }
            )
            .toArray();
    } catch (e) {
        console.error('Sitemap DB error:', e);
    }

    const areaEntries = areas.map((area) => ({
        loc: `${baseUrl}/areas/${area.slug}`,
        lastmod: new Date(area.updated_at || area.created_at || Date.now()).toISOString(),
        changeFreq: 'weekly',
        priority: '0.8',
    }));

    // Derive the site-level lastmod from real content changes. Using
    // `new Date()` here meant every fetch advertised a brand-new lastmod, which
    // tells crawlers the whole site just changed and invites them back
    // constantly — traffic we were then paying to serve uncached.
    const latestAreaChange = areaEntries.reduce(
        (latest, entry) => (entry.lastmod > latest ? entry.lastmod : latest),
        new Date(0).toISOString()
    );

    const entries = [
        { loc: baseUrl, lastmod: latestAreaChange, changeFreq: 'daily', priority: '1.0' },
        { loc: `${baseUrl}/areas`, lastmod: latestAreaChange, changeFreq: 'daily', priority: '0.9' },
        ...areaEntries,
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
        (entry) => `    <url>
        <loc>${entry.loc}</loc>
        <lastmod>${entry.lastmod}</lastmod>
        <changefreq>${entry.changeFreq}</changefreq>
        <priority>${entry.priority}</priority>
    </url>`
    )
    .join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            // Let the CDN absorb crawler traffic instead of the origin.
            'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}
