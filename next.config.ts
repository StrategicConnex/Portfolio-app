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
    // `blob:` en script-src es necesario para los workers de módulo: troika
    // (texto 3D de @react-three/drei) genera el SDF de las fuentes en un
    // worker creado con `new Worker(URL.createObjectURL(blob))`. Sin esa
    // directiva, `worker-src` permite crear el worker pero el módulo que
    // importa dentro queda bloqueado, el worker no inicializa y la
    // excepción tumba el <Canvas> entero.
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.vercel-scripts.com https://scaudit.vercel.app https://*.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.vercel-scripts.com https://vitals.vercel-insights.com https://openrouter.ai https://*.posthog.com https://*.sentry.io wss://*.posthog.com; worker-src 'self' blob:; frame-ancestors 'self'; report-uri /api/csp-report; report-to csp-endpoint;",
  },
  {
    key: 'Report-To',
    value: JSON.stringify({
      group: 'csp-endpoint',
      max_age: 10886400,
      endpoints: [{ url: '/api/csp-report' }],
    }),
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
