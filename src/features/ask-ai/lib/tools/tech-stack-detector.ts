import { z } from 'zod';
import { safeFetch } from './safe-fetch';

export const techStackSchema = z.object({
  url: z.string().min(1).max(2048).describe('URL to detect technology stack for'),
});

export type TechStackInput = z.infer<typeof techStackSchema>;

export interface TechStackResult {
  url: string;
  server?: string;
  framework?: string;
  cdn?: string;
  analytics?: string[];
  headers: { name: string; value: string; hint: string }[];
  error?: string;
}

const TECHNOLOGY_SIGNATURES: { key: string; match: string; label: string }[] = [
  { key: 'x-powered-by', match: 'Next.js', label: 'Next.js' },
  { key: 'x-powered-by', match: 'Express', label: 'Express.js' },
  { key: 'x-powered-by', match: 'ASP.NET', label: 'ASP.NET' },
  { key: 'x-powered-by', match: 'PHP', label: 'PHP' },
  { key: 'server', match: 'cloudflare', label: 'Cloudflare' },
  { key: 'server', match: 'cloudfront', label: 'AWS CloudFront' },
  { key: 'server', match: 'nginx', label: 'Nginx' },
  { key: 'server', match: 'apache', label: 'Apache' },
  { key: 'cf-ray', match: '.', label: 'Cloudflare' },
  { key: 'strict-transport-security', match: '.', label: 'HSTS Enabled' },
  { key: 'x-content-type-options', match: 'nosniff', label: 'XCTO Protection' },
  { key: 'x-frame-options', match: '.', label: 'Clickjacking Protection' },
  { key: 'set-cookie', match: '_ga', label: 'Google Analytics' },
  { key: 'set-cookie', match: '_fbp', label: 'Meta Pixel' },
];

export async function detectTechStack(input: TechStackInput): Promise<TechStackResult> {
  try {
    const response = await safeFetch(input.url, { method: 'GET', timeout: 10_000 });
    const detected: { name: string; value: string; hint: string }[] = [];
    const analytics: string[] = [];
    let server: string | undefined;
    let framework: string | undefined;
    let cdn: string | undefined;

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'server') server = value;

      for (const sig of TECHNOLOGY_SIGNATURES) {
        const headerVal = value.toLowerCase();
        const matchVal = sig.match.toLowerCase();
        const headerKey = key.toLowerCase();

        if (headerKey === sig.key.toLowerCase() && (matchVal === '.' || headerVal.includes(matchVal))) {
          const entry = { name: sig.label, value: value.substring(0, 100), hint: `HTTP header: ${key}` };
          detected.push(entry);
          if (['Next.js', 'Express.js', 'ASP.NET', 'PHP'].includes(sig.label)) framework = sig.label;
          else if (['Cloudflare', 'AWS CloudFront', 'Nginx', 'Apache'].includes(sig.label)) cdn = sig.label;
          else if (['Google Analytics', 'Meta Pixel'].includes(sig.label)) analytics.push(sig.label);
        }
      }
    });

    return {
      url: input.url, server, framework, cdn,
      analytics: analytics.length > 0 ? [...new Set(analytics)] : undefined,
      headers: detected,
    };
  } catch (err: unknown) {
    return { url: input.url, headers: [], error: err instanceof Error ? err.message : String(err) };
  }
}
