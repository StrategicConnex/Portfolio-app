import { z } from 'zod';
import { safeFetch } from './safe-fetch';

export const httpHeadersSchema = z.object({
  url: z.string().min(1).max(2048).describe('URL to analyze HTTP headers for'),
});

export type HttpHeadersInput = z.infer<typeof httpHeadersSchema>;

const SECURITY_HEADERS: Record<string, { name: string; description: string }> = {
  'strict-transport-security': {
    name: 'HSTS',
    description: 'HTTP Strict Transport Security - forces HTTPS connections',
  },
  'content-security-policy': {
    name: 'CSP',
    description: 'Content Security Policy - controls resource loading',
  },
  'x-frame-options': {
    name: 'XFO',
    description: 'Clickjacking protection',
  },
  'x-content-type-options': {
    name: 'XCTO',
    description: 'MIME type sniffing protection',
  },
  'x-xss-protection': {
    name: 'XSS',
    description: 'Cross-site scripting filter',
  },
  'referrer-policy': {
    name: 'Referrer-Policy',
    description: 'Referrer information control',
  },
  'permissions-policy': {
    name: 'Permissions-Policy',
    description: 'Browser feature permissions',
  },
  'access-control-allow-origin': {
    name: 'CORS',
    description: 'Cross-Origin Resource Sharing policy',
  },
};

export interface HeaderResult {
  header: string;
  name: string;
  value: string;
  present: boolean;
  description: string;
}

export interface HttpHeadersResult {
  url: string;
  status: number;
  headers: HeaderResult[];
  server?: string;
  contentType?: string;
  otherNotable: { header: string; value: string }[];
  error?: string;
}

export async function analyzeHttpHeaders(input: HttpHeadersInput): Promise<HttpHeadersResult> {
  try {
    const response = await safeFetch(input.url, {
      method: 'HEAD',
      timeout: 10_000,
    });

    const headerEntries: HeaderResult[] = [];
    const otherNotable: { header: string; value: string }[] = [];

    for (const [key, config] of Object.entries(SECURITY_HEADERS)) {
      const value = response.headers.get(key);
      headerEntries.push({
        header: key,
        name: config.name,
        value: value || '',
        present: !!value,
        description: config.description,
      });
    }

    // Collect other notable headers
    const notablePrefixes = ['x-', 'cf-', 'server', 'powered-by'];
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        !SECURITY_HEADERS[lower] &&
        notablePrefixes.some((p) => lower.startsWith(p))
      ) {
        otherNotable.push({ header: key, value: value.substring(0, 200) });
      }
    });

    return {
      url: input.url,
      status: response.status,
      headers: headerEntries,
      server: response.headers.get('server') || undefined,
      contentType: response.headers.get('content-type') || undefined,
      otherNotable: otherNotable.slice(0, 5),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      url: input.url,
      status: 0,
      headers: [],
      otherNotable: [],
      error: message,
    };
  }
}
