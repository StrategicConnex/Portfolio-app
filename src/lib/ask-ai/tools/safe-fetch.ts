/**
 * Safe fetch wrapper for external tools.
 * Prevents SSRF by blocking private/internal IP ranges,
 * enforces timeouts, and validates URL structure.
 *
 * Two layers:
 * - `validateUrl` (sync): syntactic checks — scheme, blocked hostnames,
 *   and literal IPs against the private ranges (incl. CGNAT, RFC 2544
 *   benchmark, IPv6 with brackets and IPv4-mapped forms).
 * - `validateUrlResolved` (async): adds DNS resolution of the hostname
 *   and re-checks every resolved address, so FQDNs that resolve to
 *   loopback/private space (e.g. `localhost.localdomain`,
 *   `127.0.0.1.nip.io`) are blocked before the fetch happens.
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const PRIVATE_IPV4_RANGES = [
  /^0\./,
  /^10\./,
  // CGNAT 100.64.0.0/10 (RFC 6598)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  // Benchmarking 198.18.0.0/15 (RFC 2544)
  /^198\.1[89]\./,
];

// IPv6 prefixes (normalized: lowercase, no brackets).
const PRIVATE_IPV6_PREFIXES = [
  '::', // unspecified ::/128 (also covers ::1 loopback and ::/8 reserved space)
  'fc', 'fd', // ULA fc00::/7
  'fe8', 'fe9', 'fea', 'feb', // link-local fe80::/10
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
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

/** Strips IPv6 brackets and lowercases — `[fe80::1]` → `fe80::1`. */
function normalizeHost(hostname: string): string {
  let host = hostname.trim().toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  return host;
}

function isPrivateIpv4(host: string): boolean {
  return PRIVATE_IPV4_RANGES.some((range) => range.test(host));
}

/**
 * Extracts the dotted IPv4 from a normalized IPv4-mapped address
 * (::ffff:7f00:1 → 127.0.0.1). The embedded IPv4 is always the last
 * two hextets of the address.
 */
function ipv4FromMapped(host: string): string | null {
  const groups = host.split(':').filter(Boolean);
  const tail = groups.slice(-2);
  if (tail.length < 2) {
    return null;
  }
  const hex = tail.map((group) => group.padStart(4, '0')).join('');
  if (!/^[0-9a-f]{8}$/.test(hex)) {
    return null;
  }
  return hex
    .match(/.{2}/g)!
    .map((byte) => parseInt(byte, 16))
    .join('.');
}

function isPrivateIpv6(host: string): boolean {
  // IPv4-mapped/translated (::ffff:a.b.c.d, or the hex-normalized form
  // ::ffff:7f00:1): only the embedded IPv4 matters — the ::ffff: prefix
  // is a technical mapping mechanism, not private space by itself.
  if (host.startsWith('::ffff:')) {
    const mapped = ipv4FromMapped(host);
    return mapped ? isPrivateIpv4(mapped) : true; // unparseable → fail closed
  }
  if (host.includes('.')) {
    return isPrivateIpv4(host.slice(host.lastIndexOf(':') + 1));
  }
  return PRIVATE_IPV6_PREFIXES.some((prefix) => host.startsWith(prefix));
}

function isPrivateIp(hostname: string): boolean {
  const host = normalizeHost(hostname);
  const version = isIP(host);
  if (version === 4) {
    return isPrivateIpv4(host);
  }
  if (version === 6) {
    return isPrivateIpv6(host);
  }
  return false;
}

/**
 * Sync, syntactic validation. Does NOT resolve DNS — use
 * `validateUrlResolved` where the URL will actually be fetched.
 */
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

    // Check private IPs if hostname is a literal IP
    if (isIP(normalizeHost(hostname)) !== 0 && isPrivateIp(hostname)) {
      return { valid: false, error: 'Private IP ranges are not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/** Resolves a hostname to all its IP addresses (A + AAAA). Injectable for tests. */
export type ResolveHostname = (hostname: string) => Promise<string[]>;

const defaultResolve: ResolveHostname = async (hostname) => {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
};

/**
 * Async validation: syntactic checks plus DNS resolution of the hostname.
 * Every resolved address is re-checked against the private ranges, so
 * hostnames that resolve to loopback/private space are blocked
 * (DNS-rebinding defense in depth). Resolution failures fail closed.
 */
export async function validateUrlResolved(
  url: string,
  resolve: ResolveHostname = defaultResolve,
): Promise<{ valid: boolean; error?: string }> {
  const syntactic = validateUrl(url);
  if (!syntactic.valid) {
    return syntactic;
  }

  const hostname = normalizeHost(new URL(url).hostname);

  // Literal IPs are fully checked syntactically — nothing to resolve.
  if (isIP(hostname) !== 0) {
    return { valid: true };
  }

  let addresses: string[];
  try {
    addresses = await resolve(hostname);
  } catch {
    return { valid: false, error: `DNS resolution failed for ${hostname}` };
  }

  if (addresses.length === 0) {
    return { valid: false, error: `DNS resolution failed for ${hostname}` };
  }

  for (const address of addresses) {
    if (isPrivateIp(address)) {
      return {
        valid: false,
        error: `Resolved IP ${address} for ${hostname} is private`,
      };
    }
  }

  return { valid: true };
}

export async function safeFetch(
  url: string,
  options: RequestInit & SafeFetchOptions = {},
): Promise<Response> {
  const validation = await validateUrlResolved(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const timeout = options.timeout ?? DEFAULT_OPTIONS.timeout;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
      redirect: 'manual', // Handle redirects manually to validate each step
    });

    // Handle redirects with validation
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        const redirectValidation = await validateUrlResolved(redirectUrl);
        if (!redirectValidation.valid) {
          throw new Error(`Redirect blocked: ${redirectValidation.error}`);
        }
      }
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
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
