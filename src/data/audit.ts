export const COMPLIANCE_MARCOS = [
  { name: 'ISO 27001:2022', progress: 94, color: '#3B82F6', descriptionKey: 'audit.marco.iso.desc' },
  { name: 'IEC 62443-4-2', progress: 88, color: '#10B981', descriptionKey: 'audit.marco.iec.desc' },
  { name: 'NIST CSF v2.0', progress: 91, color: '#6366F1', descriptionKey: 'audit.marco.nist.desc' },
  { name: 'GDPR / LGPD', progress: 100, color: '#8B5CF6', descriptionKey: 'audit.marco.gdpr.desc' }
]

export const AUDIT_FINDINGS = [
  {
    id: 'AUD-2024-001',
    severity: 'High',
    status: 'Remediated',
    control: 'Access Control (Level 2)',
    descriptionKey: 'audit.finding.001.desc',
    remediationKey: 'audit.finding.001.remediation',
    impactKey: 'audit.finding.001.impact',
    evidence: 'Log: Unauthenticated login attempts detected from IP 10.2.45.12 via Port 502 (Modbus).',
    timestamp: '2024-02-15 14:30'
  },
  {
    id: 'AUD-2024-002',
    severity: 'Medium',
    status: 'In Progress',
    control: 'Network Segmentation',
    descriptionKey: 'audit.finding.002.desc',
    remediationKey: 'audit.finding.002.remediation',
    impactKey: 'audit.finding.002.impact',
    evidence: 'Scan: ICMP traffic detected through VLAN 20 (Production) towards VLAN 1 (Corporate).',
    timestamp: '2024-02-18 09:15'
  },
  {
    id: 'AUD-2024-003',
    severity: 'Low',
    status: 'Remediated',
    control: 'Inventory Management',
    descriptionKey: 'audit.finding.003.desc',
    remediationKey: 'audit.finding.003.remediation',
    impactKey: 'audit.finding.003.impact',
    evidence: 'Packet Capture: Unknown vendor MAC addresses (RaspberryPi) broadcasting on industrial VLAN.',
    timestamp: '2024-02-20 16:45'
  },
  {
    id: 'AUD-2024-004',
    severity: 'Medium',
    status: 'Planned',
    control: 'Encryption at Rest',
    descriptionKey: 'audit.finding.004.desc',
    remediationKey: 'audit.finding.004.remediation',
    impactKey: 'audit.finding.004.impact',
    evidence: 'Audit: /opt/historian/logs available via SSH without encrypted file system check.',
    timestamp: '2024-02-22 11:20'
  }
]

export const DOMAIN_HEALTH = [
  { domainKey: 'audit.domain.id', score: 92 },
  { domainKey: 'audit.domain.prot', score: 88 },
  { domainKey: 'audit.domain.det', score: 95 },
  { domainKey: 'audit.domain.resp', score: 98 },
  { domainKey: 'audit.domain.rec', score: 90 }
]

export const AUDIT_SUMMARY = {
  totalControls: 142,
  passed: 131,
  failed: 4,
  inWarnings: 7,
  lastAuditDate: '2024-Q1',
  nextAuditDate: '2024-Q3'
}
