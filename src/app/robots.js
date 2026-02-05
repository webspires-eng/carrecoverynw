export default function robots() {
    const baseUrl = process.env.SITE_URL || 'https://cartowingnearme.co.uk';
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
