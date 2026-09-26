import { z } from 'zod';
import { extractDomain } from './safe-fetch';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolveCname = promisify(dns.resolveCname);

export const dnsAnalyzerSchema = z.object({
  domain: z.string().min(1).max(253).describe('Domain to analyze (e.g., example.com)'),
  recordTypes: z
    .array(z.enum(['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME']))
    .optional()
    .default(['A', 'MX', 'NS', 'TXT'])
    .describe('DNS record types to query'),
});

export type DnsAnalyzerInput = z.infer<typeof dnsAnalyzerSchema>;

export interface DnsResult {
  domain: string;
  records: {
    type: string;
    values: string[];
  }[];
  error?: string;
}

export async function analyzeDns(input: DnsAnalyzerInput): Promise<DnsResult> {
  const domain = extractDomain(input.domain);

  if (!domain) {
    return { domain: input.domain, records: [], error: 'Invalid domain format' };
  }

  const records: { type: string; values: string[] }[] = [];
  const resolvers: Record<string, () => Promise<string[]>> = {
    A: async () => (await resolve4(domain)).map(String),
    AAAA: async () => (await resolve6(domain)).map(String),
    MX: async () => {
      const mx = await resolveMx(domain);
      return mx.map((r) => `${r.exchange} (priority ${r.priority})`);
    },
    TXT: async () => {
      const txt = await resolveTxt(domain);
      return txt.map((t) => t.join(' '));
    },
    NS: async () => await resolveNs(domain),
    CNAME: async () => await resolveCname(domain),
  };

  for (const type of input.recordTypes) {
    try {
      if (resolvers[type]) {
        const values = await resolvers[type]();
        if (values.length > 0) {
          records.push({ type, values });
        }
      }
    } catch (err: unknown) {
      const nodeErr = err as { code?: string; message?: string };
      if (nodeErr?.code !== 'ENODATA' && nodeErr?.code !== 'ENOTFOUND') {
        records.push({ type, values: [`Error: ${nodeErr?.message || 'Unknown error'}`] });
      }
    }
  }

  return { domain, records };
}
