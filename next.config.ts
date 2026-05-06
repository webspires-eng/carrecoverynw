import type { NextConfig } from "next";

const CANONICAL_HOST = "www.cartowingnearme.co.uk";

const nextConfig: NextConfig = {
  trailingSlash: false,
  async redirects() {
    return [
      // Canonical host: apex → www in a single 301.
      // Verify Vercel domain settings aren't already redirecting at the edge,
      // otherwise this stacks an extra hop.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'cartowingnearme.co.uk' }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      },
      {
        source: '/area',
        destination: '/areas',
        permanent: true,
      },
      {
        source: '/area/:path*',
        destination: '/areas/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/areas/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
