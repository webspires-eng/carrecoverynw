// Web app manifest — makes the site installable ("Add to Home Screen").
// Next.js serves this at /manifest.webmanifest and links it automatically.
export default function manifest() {
    return {
        name: '24 Hours Car Recovery',
        short_name: 'Car Recovery',
        description: '24/7 Emergency Car Recovery Service covering the UK',
        start_url: '/admin/bookings',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
            { src: '/app-icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/app-icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
