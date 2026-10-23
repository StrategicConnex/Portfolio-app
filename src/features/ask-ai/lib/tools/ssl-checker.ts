import { z } from 'zod';
import { lookup } from 'node:dns/promises';
import tls from 'tls';
import { extractDomain, validateUrl, validateUrlResolved, type ResolveHostname } from './safe-fetch';

/**
 * Ports a public certificate check may legitimately target. Restricting the
 * port closes the "TLS handshake as a port scanner" half of the SSRF surface.
 */
export const ALLOWED_SSL_PORTS = [443, 8443] as const;

export const sslCheckerSchema = z.object({
  hostname: z.string().min(1).max(253).describe('Hostname to check SSL certificate for'),
  port: z
    .number()
    .int()
    .refine((port) => (ALLOWED_SSL_PORTS as readonly number[]).includes(port), {
      message: `Port must be one of ${ALLOWED_SSL_PORTS.join(', ')}`,
    })
    .optional()
    .default(443)
    .describe('TLS port (443 or 8443)'),
});

export type SslCheckerInput = z.input<typeof sslCheckerSchema>;

export interface SslResult {
  hostname: string;
  valid: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  san?: string[];
  protocol?: string;
  error?: string;
}

export interface CheckSslOptions {
  /** Injectable DNS resolver (tests). Defaults to `dns.lookup` (A + AAAA). */
  resolve?: ResolveHostname;
}

const defaultResolve: ResolveHostname = async (hostname) => {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
};

/**
 * Checks the TLS certificate served by a public hostname.
 *
 * Security (SSRF): the hostname is parsed with `extractDomain`, every resolved
 * address is validated by `validateUrlResolved` (loopback/private/CGNAT/
 * metadata space blocked), and the socket connects to the **validated IP**
 * with SNI pinned — no second DNS resolution, so there is no
 * validate→connect rebinding window. Only ports 443/8443 are allowed.
 */
export async function checkSsl(
  input: SslCheckerInput,
  options: CheckSslOptions = {},
): Promise<SslResult> {
  const hostname = extractDomain(input.hostname);

  if (!hostname) {
    return { hostname: input.hostname, valid: false, error: 'Invalid hostname format' };
  }

  const port = input.port ?? 443;
  if (!(ALLOWED_SSL_PORTS as readonly number[]).includes(port)) {
    return { hostname, valid: false, error: `Port ${port} not allowed (use 443 or 8443)` };
  }

  // Syntactic gate first (blocked hostnames, literal private IPs) — no DNS yet.
  const syntactic = validateUrl(`https://${hostname}`);
  if (!syntactic.valid) {
    return { hostname, valid: false, error: syntactic.error ?? 'Hostname not allowed' };
  }

  // Resolve once, validate every address, then pin the connection to the IP.
  const resolveHost = options.resolve ?? defaultResolve;
  let addresses: string[];
  try {
    addresses = await resolveHost(hostname);
  } catch {
    return { hostname, valid: false, error: `DNS resolution failed for ${hostname}` };
  }

  if (!addresses || addresses.length === 0) {
    return { hostname, valid: false, error: `DNS resolution failed for ${hostname}` };
  }

  const validation = await validateUrlResolved(`https://${hostname}`, async () => addresses);
  if (!validation.valid) {
    return { hostname, valid: false, error: validation.error ?? 'Hostname not allowed' };
  }

  const address = addresses[0];

  return new Promise((resolve) => {
    let socket: tls.TLSSocket | undefined;
    let settled = false;

    const finish = (result: SslResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket?.destroy();
      resolve(result);
    };

    const timeout = setTimeout(() => {
      finish({ hostname, valid: false, error: 'Connection timed out (10s)' });
    }, 10_000);

    try {
      socket = tls.connect(
        { host: address, port, servername: hostname, rejectUnauthorized: false },
        () => {
          const cert = socket!.getPeerCertificate(true);

          if (!cert || !Object.keys(cert).length) {
            finish({ hostname, valid: false, error: 'No certificate received' });
            return;
          }

          const now = new Date();
          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.floor(
            (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          const issuerVal = cert.issuer?.O || cert.issuer?.CN;
          const subjectVal = cert.subject?.CN;

          finish({
            hostname,
            valid: daysRemaining > 0,
            issuer: Array.isArray(issuerVal) ? issuerVal[0] : issuerVal,
            subject: Array.isArray(subjectVal) ? subjectVal[0] : subjectVal,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysRemaining,
            san: cert.subjectaltname
              ? cert.subjectaltname.split(', ').map((s) => s.replace(/^DNS:/, ''))
              : [],
            protocol: socket!.getProtocol() || undefined,
          });
        },
      );

      socket.once('error', (err: Error) => {
        finish({ hostname, valid: false, error: err.message });
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      finish({ hostname, valid: false, error: message });
    }
  });
}
