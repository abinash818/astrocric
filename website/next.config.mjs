import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/en/predictions',
        destination: '/en/analysis',
        permanent: true,
      },
      {
        source: '/ta/predictions',
        destination: '/ta/analysis',
        permanent: true,
      },
      {
        source: '/en/prediction-disclaimer',
        destination: '/en/analysis-disclaimer',
        permanent: true,
      },
      {
        source: '/ta/prediction-disclaimer',
        destination: '/ta/analysis-disclaimer',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
