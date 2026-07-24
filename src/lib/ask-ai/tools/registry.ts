import type { ToolSet } from 'ai';
import { analyzeDns, dnsAnalyzerSchema } from './dns-analyzer';
import { checkSsl, sslCheckerSchema } from './ssl-checker';
import { analyzeHttpHeaders, httpHeadersSchema } from './http-headers';
import { whoisLookup, whoisSchema } from './whois-lookup';
import { detectTechStack, techStackSchema } from './tech-stack-detector';
import { analyzePort, portAnalyzerSchema } from './port-analyzer';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export const askAiTools: ToolSet = {
  dnsAnalyzer: {
    description: 'Analyze DNS records for a domain. Returns A, AAAA, MX, TXT, NS, and CNAME records.',
    inputSchema: dnsAnalyzerSchema,
    execute: async (input: Record<string, unknown>) => {
      try { return await analyzeDns(input as Parameters<typeof analyzeDns>[0]); }
      catch (err: unknown) { return { error: getErrorMessage(err), domain: input.domain as string, records: [] }; }
    },
  },
  sslChecker: {
    description: 'Check SSL/TLS certificate for a hostname. Returns issuer, subject, validity, days remaining, SAN.',
    inputSchema: sslCheckerSchema,
    execute: async (input: Record<string, unknown>) => {
      try { return await checkSsl(input as Parameters<typeof checkSsl>[0]); }
      catch (err: unknown) { return { hostname: input.hostname as string, valid: false, error: getErrorMessage(err) }; }
    },
  },
  httpHeadersAnalyzer: {
    description: 'Analyze HTTP security headers for a URL. Returns HSTS, CSP, XFO, XCTO, CORS, and more.',
    inputSchema: httpHeadersSchema,
    execute: async (input: Record<string, unknown>) => {
      try { return await analyzeHttpHeaders(input as Parameters<typeof analyzeHttpHeaders>[0]); }
      catch (err: unknown) { return { url: input.url as string, status: 0, headers: [], otherNotable: [], error: getErrorMessage(err) }; }
    },
  },
  whoisLookup: {
    description: 'Look up domain registration information via RDAP. Returns registrar, dates, name servers.',
    inputSchema: whoisSchema,
    execute: async (input: Record<string, unknown>) => {
      try { return await whoisLookup(input as Parameters<typeof whoisLookup>[0]); }
      catch (err: unknown) { return { domain: input.domain as string, error: getErrorMessage(err) }; }
    },
  },
  techStackDetector: {
    description: 'Detect technology stack of a website via HTTP headers. Identifies server, framework, CDN, analytics tools.',
    inputSchema: techStackSchema,
    execute: async (input: Record<string, unknown>) => {
      try { return await detectTechStack(input as Parameters<typeof detectTechStack>[0]); }
      catch (err: unknown) { return { url: input.url as string, headers: [], error: getErrorMessage(err) }; }
    },
  },
  portAnalyzer: {
    description: 'Get security information about network ports and services. Provides risk level, description, and security recommendations for common services like SSH, RDP, SMB, DNS, HTTP, databases, and OT protocols like Modbus and IEC 61850.',
    inputSchema: portAnalyzerSchema,
    execute: async (input: Record<string, unknown>) => {
      try { return await analyzePort(input as Parameters<typeof analyzePort>[0]); }
      catch (err: unknown) { return { service: input.service as string, ports: [], error: getErrorMessage(err) }; }
    },
  },
};
