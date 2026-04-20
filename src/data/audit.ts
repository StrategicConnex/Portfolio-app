export const COMPLIANCE_MARCOS = [
  { name: 'ISO 27001:2022', progress: 94, color: '#3B82F6', description: 'Sistema de Gestión de Seguridad de la Información (SGSI).' },
  { name: 'IEC 62443-4-2', progress: 88, color: '#10B981', description: 'Seguridad para sistemas de control y automatización industrial (IACS).' },
  { name: 'NIST CSF v2.0', progress: 91, color: '#6366F1', description: 'Marco de Ciberseguridad para infraestructuras críticas.' },
  { name: 'GDPR / LGPD', progress: 100, color: '#8B5CF6', description: 'Protección de datos y privacidad industrial.' }
]

export const AUDIT_FINDINGS = [
  {
    id: 'AUD-2024-001',
    severity: 'High',
    status: 'Remediated',
    control: 'Access Control (Level 2)',
    description: 'Falta de autenticación multifactor (MFA) en HMI de zona de procesos.',
    remediation: 'Implementación de PAM con integración Duo Security para acceso a activos críticos.',
    impact: 'Riesgo Crítico de acceso no autorizado a sistemas de control de planta (SCADA).',
    evidence: 'Log: Unauthenticated login attempts detected from IP 10.2.45.12 via Port 502 (Modbus).',
    timestamp: '2024-02-15 14:30'
  },
  {
    id: 'AUD-2024-002',
    severity: 'Medium',
    status: 'In Progress',
    control: 'Network Segmentation',
    description: 'Reglas de firewall permisivas entre Nivel 3 y Nivel 4 (Purdue).',
    remediation: 'Reconfiguración de IDS Inline y Micro-segmentación mediante FortiGate OT.',
    impact: 'Movimiento lateral potencial entre redes IT y OT, exponiendo PLCs.',
    evidence: 'Scan: ICMP traffic detected through VLAN 20 (Production) towards VLAN 1 (Corporate).',
    timestamp: '2024-02-18 09:15'
  },
  {
    id: 'AUD-2024-003',
    severity: 'Low',
    status: 'Remediated',
    control: 'Inventory Management',
    description: 'Dispositivos IoT no inventariados en VLAN de servicios generales.',
    remediation: 'Despliegue de Claroty CTD para visibilidad pasiva de activos OT.',
    impact: 'Pérdida parcial de visibilidad en el inventario de activos no críticos.',
    evidence: 'Packet Capture: Unknown vendor MAC addresses (RaspberryPi) broadcasting on industrial VLAN.',
    timestamp: '2024-02-20 16:45'
  },
  {
    id: 'AUD-2024-004',
    severity: 'Medium',
    status: 'Planned',
    control: 'Encryption at Rest',
    description: 'Logs históricos de PLC guardados en texto plano en historiador.',
    remediation: 'Encriptación AES-256 en base de datos de historiador y firma digital.',
    impact: 'Posible manipulación de registros históricos de producción (Data Integrity).',
    evidence: 'Audit: /opt/historian/logs available via SSH without encrypted file system check.',
    timestamp: '2024-02-22 11:20'
  }
]

export const DOMAIN_HEALTH = [
  { domain: 'Identificación', score: 92 },
  { domain: 'Protección', score: 88 },
  { domain: 'Detección', score: 95 },
  { domain: 'Respuesta', score: 98 },
  { domain: 'Recuperación', score: 90 }
]

export const AUDIT_SUMMARY = {
  totalControls: 142,
  passed: 131,
  failed: 4,
  inWarnings: 7,
  lastAuditDate: '2024-Q1',
  nextAuditDate: '2024-Q3'
}
