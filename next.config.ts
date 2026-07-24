import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://scaudit.vercel.app https://*.posthog.com https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://scaudit.vercel.app https://*.vercel-scripts.com https://vitals.vercel-insights.com https://openrouter.ai https://*.posthog.com https://*.sentry.io https://unpkg.com wss://*.posthog.com; worker-src 'self' blob:; frame-ancestors 'self';",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.41'],
  turbopack: {
    root: __dirname,
  },
  images: {
    qualities: [100, 75],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
