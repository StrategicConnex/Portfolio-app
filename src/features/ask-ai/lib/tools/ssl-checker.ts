import { z } from 'zod';
import { extractDomain } from './safe-fetch';
import tls from 'tls';

export const sslCheckerSchema = z.object({
  hostname: z.string().min(1).max(253).describe('Hostname to check SSL certificate for'),
  port: z.number().min(1).max(65535).optional().default(443).describe('Port to connect to'),
});

export type SslCheckerInput = z.infer<typeof sslCheckerSchema>;

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

export async function checkSsl(input: SslCheckerInput): Promise<SslResult> {
  const hostname = extractDomain(input.hostname);

  if (!hostname) {
    return { hostname: input.hostname, valid: false, error: 'Invalid hostname format' };
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        hostname,
        valid: false,
        error: 'Connection timed out (10s)',
      });
    }, 10_000);

    try {
      const socket = tls.connect(
        input.port,
        hostname,
        { servername: hostname, rejectUnauthorized: false },
        () => {
          clearTimeout(timeout);
          const cert = socket.getPeerCertificate(true);

          if (!cert || !Object.keys(cert).length) {
            resolve({ hostname, valid: false, error: 'No certificate received' });
            socket.end();
            return;
          }

          const now = new Date();
          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.floor(
            (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          const issuerVal = cert.issuer?.O || cert.issuer?.CN;
          const subjectVal = cert.subject?.CN;

          resolve({
            hostname,
            valid: daysRemaining > 0,
            issuer: Array.isArray(issuerVal) ? issuerVal[0] : issuerVal,
            subject: Array.isArray(subjectVal) ? subjectVal[0] : subjectVal,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysRemaining,
            san: cert.subjectaltname
              ? cert.subjectaltname
                  .split(', ')
                  .map((s) => s.replace(/^DNS:/, ''))
              : [],
            protocol: socket.getProtocol() || undefined,
          });

          socket.end();
        },
      );

      socket.on('error', (err: Error) => {
        clearTimeout(timeout);
        resolve({
          hostname,
          valid: false,
          error: err.message,
        });
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : String(err);
      resolve({
        hostname,
        valid: false,
        error: message,
      });
    }
  });
}
