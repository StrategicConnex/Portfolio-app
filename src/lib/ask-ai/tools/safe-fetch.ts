/**
 * Safe fetch wrapper for external tools.
 * Prevents SSRF by blocking private/internal IP ranges,
 * enforces timeouts, and validates URL structure.
 */

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'metadata.google.internal',
  '169.254.169.254', // cloud metadata
];

export interface SafeFetchOptions {
  timeout?: number;
  maxRedirects?: number;
  allowedSchemes?: string[];
}

const DEFAULT_OPTIONS: Required<SafeFetchOptions> = {
  timeout: 10_000,
  maxRedirects: 3,
  allowedSchemes: ['http:', 'https:'],
};

function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(hostname));
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Check scheme
    if (!DEFAULT_OPTIONS.allowedSchemes.includes(parsed.protocol)) {
      return { valid: false, error: `Unsupported protocol: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { valid: false, error: 'Blocked hostname' };
    }

    // Check private IPs if hostname is an IP
    const isIp = /^[\d.]+$/.test(hostname) || hostname.includes(':');
    if (isIp && isPrivateIp(hostname)) {
      return { valid: false, error: 'Private IP ranges are not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function safeFetch(
  url: string,
  options: RequestInit & SafeFetchOptions = {},
): Promise<Response> {
  const timeout = options.timeout ?? DEFAULT_OPTIONS.timeout;
  const maxRedirects = options.maxRedirects ?? DEFAULT_OPTIONS.maxRedirects;
  let currentUrl = url;
  let redirectsFollowed = 0;

  while (true) {
    const validation = validateUrl(currentUrl);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(currentUrl, {
        ...options,
        signal: options.signal ?? controller.signal,
        redirect: 'manual', // Handle redirects manually to validate each step
      });

      // Handle redirects with validation
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get('location');
        if (redirectUrl) {
          if (redirectsFollowed >= maxRedirects) {
            throw new Error(`Maximum redirects (${maxRedirects}) exceeded`);
          }

          // Resolve relative/absolute redirect URLs against current URL
          const resolvedUrl = new URL(redirectUrl, currentUrl).href;
          const redirectValidation = validateUrl(resolvedUrl);
          if (!redirectValidation.valid) {
            throw new Error(`Redirect blocked: ${redirectValidation.error}`);
          }

          currentUrl = resolvedUrl;
          redirectsFollowed++;
          continue;
        }
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function extractDomain(input: string): string | null {
  try {
    // Remove protocol and path
    let cleaned = input.trim().toLowerCase();

    // Add https:// if no protocol
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }

    const parsed = new URL(cleaned);
    const hostname = parsed.hostname;

    // Basic domain validation
    const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
    if (!domainRegex.test(hostname)) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}
