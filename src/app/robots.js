import { connectToDatabase } from '@/lib/db';

export default async function robots() {
    const baseUrl = process.env.SITE_URL || 'https://www.cartowingnearme.co.uk';

    try {
        const { db } = await connectToDatabase();
        const seoDoc = await db.collection('seo_settings').findOne({ _id: 'seo_config' });

        if (seoDoc && seoDoc.robots_txt) {
            // Parse the custom robots.txt content from the database
            const lines = seoDoc.robots_txt.split('\n');
            const rules = [];
            let currentRule = null;
            let sitemap = null;

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;

                if (trimmed.toLowerCase().startsWith('user-agent:')) {
                    if (currentRule) rules.push(currentRule);
                    currentRule = {
                        userAgent: trimmed.split(':').slice(1).join(':').trim(),
                        allow: [],
                        disallow: []
                    };
                } else if (trimmed.toLowerCase().startsWith('allow:') && currentRule) {
                    const value = trimmed.split(':').slice(1).join(':').trim();
                    if (value) currentRule.allow.push(value);
                } else if (trimmed.toLowerCase().startsWith('disallow:') && currentRule) {
                    const value = trimmed.split(':').slice(1).join(':').trim();
                    if (value) currentRule.disallow.push(value);
                } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
                    sitemap = trimmed.split(':').slice(1).join(':').trim();
                }
            }

            if (currentRule) rules.push(currentRule);

            // Convert to Next.js robots format
            const robotsConfig = {
                rules: rules.length > 0 ? rules.map(r => ({
                    userAgent: r.userAgent,
                    allow: r.allow.length === 1 ? r.allow[0] : r.allow.length > 0 ? r.allow : undefined,
                    disallow: r.disallow.length === 1 ? r.disallow[0] : r.disallow.length > 0 ? r.disallow : undefined,
                })) : [{ userAgent: '*', allow: '/', disallow: '/admin/' }],
                sitemap: sitemap || `${baseUrl}/sitemap.xml`,
            };

            return robotsConfig;
        }
    } catch (error) {
        console.error('Error reading robots.txt from DB:', error);
    }

    // Default fallback
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: '/admin/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
