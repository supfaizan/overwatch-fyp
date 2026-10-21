import type { NextConfig } from 'next';
import { EMBED_ORIGINS } from './features/docs/embeds';

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise makes
  // Next infer the wrong root (Turbopack is the default bundler in v16).
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    // the waitlist used to be its own page; it's now a section of the landing page
    return [{ source: '/waitlist', destination: '/#waitlist', permanent: true }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // pages may only frame the players of sites docs can embed, and nobody may frame us (clickjacking)
          {
            key: 'Content-Security-Policy',
            value: `frame-src 'self' ${
              EMBED_ORIGINS.join(' ')
            }; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`,
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // an invite page's address may still carry its token: never send it on as a referrer
      { source: '/invite/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] },
      { source: '/invite', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] },
    ];
  },
};

export default nextConfig;
