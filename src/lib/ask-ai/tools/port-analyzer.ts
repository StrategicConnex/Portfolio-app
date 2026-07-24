import { z } from 'zod';

export const portAnalyzerSchema = z.object({
  service: z.string().min(1).max(100).describe('Service name to get port and security info for (e.g., SSH, HTTP, RDP, SMB, DNS)'),
});

export type PortAnalyzerInput = z.infer<typeof portAnalyzerSchema>;

export interface PortInfo {
  port: number;
  protocol: 'TCP' | 'UDP';
  service: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface PortAnalyzerResult {
  service: string;
  ports: PortInfo[];
  error?: string;
}

const PORT_DATABASE: Record<string, PortInfo[]> = {
  ssh: [
    { port: 22, protocol: 'TCP', service: 'SSH', description: 'Secure Shell - remote administration access', risk: 'high', recommendation: 'Disable password auth, use key-only access. Change default port if possible. Implement fail2ban.' },
  ],
  http: [
    { port: 80, protocol: 'TCP', service: 'HTTP', description: 'HyperText Transfer Protocol - unencrypted web traffic', risk: 'medium', recommendation: 'Redirect all traffic to HTTPS (443). Disable HTTP if possible.' },
    { port: 443, protocol: 'TCP', service: 'HTTPS', description: 'HTTP over TLS/SSL - encrypted web traffic', risk: 'low', recommendation: 'Keep TLS 1.2+ enabled. Disable TLS 1.0/1.1. Use strong ciphers.' },
    { port: 8080, protocol: 'TCP', service: 'HTTP-Alt', description: 'Alternative HTTP port', risk: 'medium', recommendation: 'Do not expose to internet. Use firewall to restrict access.' },
    { port: 8443, protocol: 'TCP', service: 'HTTPS-Alt', description: 'Alternative HTTPS port', risk: 'low', recommendation: 'Ensure certificate is valid. Restrict access if possible.' },
  ],
  rdp: [
    { port: 3389, protocol: 'TCP', service: 'RDP', description: 'Remote Desktop Protocol - Windows remote access', risk: 'critical', recommendation: 'Do NOT expose RDP directly to the internet. Use VPN or RD Gateway. Enable NLA.' },
  ],
  smb: [
    { port: 445, protocol: 'TCP', service: 'SMB', description: 'Server Message Block - file sharing', risk: 'critical', recommendation: 'Block SMB at the firewall for internet-facing networks.' },
    { port: 139, protocol: 'TCP', service: 'NetBIOS-SSN', description: 'NetBIOS Session Service - legacy file sharing', risk: 'high', recommendation: 'Disable NetBIOS over TCP/IP. Block port 139 at firewall.' },
  ],
  dns: [
    { port: 53, protocol: 'UDP', service: 'DNS', description: 'Domain Name System - name resolution', risk: 'low', recommendation: 'Restrict recursive queries to internal networks. Implement DNSSEC.' },
    { port: 53, protocol: 'TCP', service: 'DNS-TCP', description: 'DNS over TCP - zone transfers', risk: 'medium', recommendation: 'Restrict zone transfers to authorized secondary DNS servers only.' },
  ],
  mysql: [
    { port: 3306, protocol: 'TCP', service: 'MySQL/MariaDB', description: 'MySQL/MariaDB database server', risk: 'high', recommendation: 'Never expose databases to internet. Use VPN or SSH tunneling.' },
  ],
  postgresql: [
    { port: 5432, protocol: 'TCP', service: 'PostgreSQL', description: 'PostgreSQL database server', risk: 'high', recommendation: 'Never expose PostgreSQL to internet. Use SSL/TLS connections.' },
  ],
  mssql: [
    { port: 1433, protocol: 'TCP', service: 'MS SQL Server', description: 'Microsoft SQL Server database', risk: 'high', recommendation: 'Do not expose to internet. Use VPN. Enable SSL encryption.' },
  ],
  telnet: [
    { port: 23, protocol: 'TCP', service: 'Telnet', description: 'Telnet - unencrypted remote terminal access', risk: 'critical', recommendation: 'DISABLE TELNET IMMEDIATELY. Replace with SSH. Credentials sent in plaintext.' },
  ],
  ftp: [
    { port: 21, protocol: 'TCP', service: 'FTP', description: 'File Transfer Protocol - unencrypted file transfer', risk: 'high', recommendation: 'Replace with SFTP or FTPS. FTP sends credentials in plaintext.' },
    { port: 990, protocol: 'TCP', service: 'FTPS', description: 'FTP over SSL/TLS', risk: 'low', recommendation: 'Use strong ciphers. Ensure valid certificate.' },
  ],
  smtp: [
    { port: 25, protocol: 'TCP', service: 'SMTP', description: 'Simple Mail Transfer Protocol - email delivery', risk: 'medium', recommendation: 'Restrict port 25 to mail servers only.' },
    { port: 587, protocol: 'TCP', service: 'SMTP-Submission', description: 'SMTP with authentication', risk: 'low', recommendation: 'Require STARTTLS and authentication. Implement SPF, DKIM, DMARC.' },
  ],
  docker: [
    { port: 2375, protocol: 'TCP', service: 'Docker API (unencrypted)', description: 'Docker REST API without TLS', risk: 'critical', recommendation: 'NEVER expose Docker API without TLS. Use port 2376 (TLS) or Unix sockets.' },
    { port: 2376, protocol: 'TCP', service: 'Docker API (TLS)', description: 'Docker REST API with TLS', risk: 'medium', recommendation: 'Use TLS certificates. Restrict access via firewall.' },
  ],
  kubernetes: [
    { port: 6443, protocol: 'TCP', service: 'Kubernetes API', description: 'Kubernetes API Server', risk: 'critical', recommendation: 'Use TLS. Implement RBAC. Restrict with network policies.' },
    { port: 10250, protocol: 'TCP', service: 'Kubelet API', description: 'Kubernetes Kubelet API', risk: 'critical', recommendation: 'Disable anonymous access. Restrict with firewall.' },
  ],
  modbus: [
    { port: 502, protocol: 'TCP', service: 'Modbus TCP', description: 'Modbus TCP - Industrial automation protocol', risk: 'critical', recommendation: 'NEVER expose Modbus TCP to internet. Use OT-specific firewalls. Implement Purdue segmentation.' },
  ],
  ['iec-61850']: [
    { port: 102, protocol: 'TCP', service: 'IEC 61850 MMS', description: 'IEC 61850 - Substation automation protocol', risk: 'critical', recommendation: 'Isolate in OT network per Purdue levels 1-2. Use industrial firewalls.' },
  ],
};

const SERVICE_ALIASES: Record<string, string> = {
  www: 'http', web: 'http', https: 'http',
  'remote-desktop': 'rdp', 'windows-remote': 'rdp',
  'file-sharing': 'smb', cifs: 'smb',
  database: 'mysql', sql: 'mysql', pgsql: 'postgresql', postgres: 'postgresql',
  'sql-server': 'mssql',
  mail: 'smtp', email: 'smtp',
  container: 'docker', k8s: 'kubernetes',
  scada: 'modbus', industrial: 'modbus',
  automation: 'iec-61850', substation: 'iec-61850',
};

export async function analyzePort(input: PortAnalyzerInput): Promise<PortAnalyzerResult> {
  const searchTerm = input.service.trim().toLowerCase();
  const resolvedService = SERVICE_ALIASES[searchTerm] || searchTerm;

  const ports = PORT_DATABASE[resolvedService];

  if (!ports) {
    // Fuzzy search
    const matchingServices: string[] = [];
    for (const [key] of Object.entries(PORT_DATABASE)) {
      if (key.includes(resolvedService) || resolvedService.includes(key)) {
        matchingServices.push(key);
      }
    }

    if (matchingServices.length > 0) {
      return {
        service: input.service,
        ports: matchingServices.flatMap(s => PORT_DATABASE[s] || []),
      };
    }

    return {
      service: input.service,
      ports: [],
      error: `No port info found for "${input.service}". Try: SSH, HTTP, RDP, SMB, DNS, MySQL, PostgreSQL, MSSQL, FTP, SMTP, Docker, Kubernetes, Modbus, or IEC-61850.`,
    };
  }

  return { service: input.service, ports };
}
