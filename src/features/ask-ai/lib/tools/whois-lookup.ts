import { z } from 'zod';
import { extractDomain, safeFetch } from './safe-fetch';

export const whoisSchema = z.object({
  domain: z.string().min(1).max(253).describe('Domain to look up via RDAP'),
});

export type WhoisInput = z.infer<typeof whoisSchema>;

interface RdapEntity {
  handle?: string;
  roles?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vcardArray?: any[];
  email?: string;
}

interface RdapResponse {
  handle?: string;
  ldhName?: string;
  events?: { eventAction: string; eventDate: string }[];
  entities?: RdapEntity[];
  status?: string[];
  nameservers?: { ldhName: string }[];
  port43?: string;
  remarks?: { title: string; description: string[] }[];
  errorCode?: number;
  title?: string;
  description?: string[];
}

export interface WhoisResult {
  domain: string;
  handle?: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  lastUpdated?: string;
  nameServers?: string[];
  status?: string[];
  error?: string;
}

const RDAP_BASE_URLS = [
  'https://rdap.verisign.com/com/v1/domain',
  'https://rdap.nic.net/v1/domain',
  'https://rdap.afilias-srs.net/v1/domain',
  'https://rdap.publicinterestregistry.org/v1/domain',
  'https://rdap.nic.ar/v1/domain', // Argentina TLD
];

/**
 * Query the RDAP (Registration Data Access Protocol) for domain information.
 * Tries multiple RDAP servers in sequence.
 */
export async function whoisLookup(input: WhoisInput): Promise<WhoisResult> {
  const domain = extractDomain(input.domain);

  if (!domain) {
    return { domain: input.domain, error: 'Invalid domain format' };
  }

  const tld = domain.split('.').pop()?.toLowerCase();
  if (!tld) {
    return { domain, error: 'Could not determine TLD' };
  }

  // Try RDAP first
  for (const baseUrl of RDAP_BASE_URLS) {
    try {
      const url = `${baseUrl}/${domain}`;
      const response = await safeFetch(url, { timeout: 8_000 });

      if (response.ok) {
        const data: RdapResponse = await response.json();

        const result: WhoisResult = {
          domain,
          handle: data.handle,
          nameServers: data.nameservers?.map((ns) => ns.ldhName),
          status: data.status,
        };

        if (data.events) {
          for (const event of data.events) {
            if (event.eventAction === 'registration') {
              result.creationDate = event.eventDate;
            } else if (event.eventAction === 'expiration') {
              result.expirationDate = event.eventDate;
            } else if (event.eventAction === 'last changed') {
              result.lastUpdated = event.eventDate;
            }
          }
        }

        // Extract registrar from entities
        if (data.entities) {
          const registrar = data.entities.find(
            (e) => e.roles?.includes('registrar'),
          );
          if (registrar?.vcardArray?.[1]) {
            const vcardEntries = registrar.vcardArray[1];
            for (const entry of vcardEntries) {
              if (entry[0] === 'fn') {
                result.registrar = entry[3];
                break;
              }
            }
          }
        }

        return result;
      }
    } catch {
      // Try next RDAP server
      continue;
    }
  }

  return { domain, error: 'Could not retrieve RDAP information for this domain' };
}
