import type { ToolSet } from 'ai';
import { analyzeDns, dnsAnalyzerSchema } from './dns-analyzer';
import { checkSsl, sslCheckerSchema } from './ssl-checker';
import { analyzeHttpHeaders, httpHeadersSchema } from './http-headers';
import { whoisLookup, whoisSchema } from './whois-lookup';
import { detectTechStack, techStackSchema } from './tech-stack-detector';
import { analyzePort, portAnalyzerSchema } from './port-analyzer';
import { querySiem, querySiemSchema } from './query-siem';
import { threatIntelTool } from './threat-intel';
import { createLibraryTool } from './library';
import { createGenerateReportTool } from './report';
import { mapControlTool } from './map-control';
import { siemControlTool } from './siem-control';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function buildTools({ locale }: { locale: 'es' | 'en' }): ToolSet {
  return {
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
    querySiem: {
      description: 'Read the live aggregated threat-intelligence feed that powers the SIEM dashboard (Abuse.ch Feodo Tracker botnet C2 infrastructure + DShield/SANS ISC most-attacked ports and reported IPs). Use when the user asks about current threats, the SIEM panel, active botnets, or targeted ports. IMPORTANT: this is global intelligence, not the user\'s private network logs.',
      inputSchema: querySiemSchema,
      execute: async (input: Record<string, unknown>) => {
        try { return await querySiem(input as Parameters<typeof querySiem>[0]); }
        catch (err: unknown) { return { disclaimer: 'REAL DATA: global threat-intelligence aggregates (Abuse.ch Feodo + DShield). Not the user\'s private network logs.', focus: input.focus as string, error: getErrorMessage(err) }; }
      },
    },
    getThreatIntel: threatIntelTool,
    controlMapView: mapControlTool,
    controlSiemView: siemControlTool,
    searchLibrary: createLibraryTool(locale),
    generateReport: createGenerateReportTool(locale),
  };
}

export function createAskAiTools(options: { locale: 'es' | 'en' }): ToolSet {
  return buildTools(options);
}

/** Default (ES) registry kept for tests and tool-shape assertions. */
export const askAiTools: ToolSet = buildTools({ locale: 'es' });
