import pool from '@/lib/db';

export default async function sitemap() {
    const baseUrl = process.env.SITE_URL || 'https://carrecoverynw.co.uk';

    // Static routes
    const routes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/areas`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
    ];

    // Dynamic routes (Areas)
    let areaRoutes = [];
    try {
        const [rows] = await pool.execute('SELECT slug, updated_at, created_at FROM areas WHERE is_active = 1');
        areaRoutes = rows.map((area) => ({
            url: `${baseUrl}/area/${area.slug}`,
            lastModified: new Date(area.updated_at || area.created_at || new Date()),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));
    } catch (e) {
        console.error('Sitemap DB error:', e);
    }

    return [...routes, ...areaRoutes];
}
