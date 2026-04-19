export const LOG_LINES = [
  { id: 1,  time: '10:38:13', level: 'ALERT', src: '203.0.113.45 (US)',   msg: 'TCP Flood detected on edge firewall',          color: '#EF4444', mitigation: { action: 'DDoS mitigation activated via Radware DefensePro', steps: ['Traffic rerouted through scrubbing center', 'Rate-limit rules applied at edge', 'Malicious session terminated'], time: '< 60s' } },
  { id: 2,  time: '10:38:27', level: 'WARN',  src: '198.51.100.22 (CN)', msg: 'UDP Flood targeting public web gateway',      color: '#F97316', mitigation: null },
  { id: 3,  time: '10:38:39', level: 'ALERT', src: '192.0.2.18 (SG)',   msg: 'DNS Flood on resolver cluster',               color: '#EF4444', mitigation: { action: 'DNS sinkhole applied and cache refreshed', steps: ['Suspicious query patterns blocked', 'Recursive service isolated', 'Failover to secondary DNS enabled'], time: '< 90s' } },
  { id: 4,  time: '10:38:50', level: 'INFO',  src: '204.120.0.55 (DE)', msg: 'Botnet scan blocked against web application', color: '#10B981', mitigation: null },
  { id: 5,  time: '10:39:03', level: 'WARN',  src: '172.16.0.4 (IN)',   msg: 'IP Flood observed on VPN ingress',           color: '#F59E0B', mitigation: null },
  { id: 6,  time: '10:39:17', level: 'INFO',  src: '203.0.113.74 (US)', msg: 'SSH brute-force blocked by IDS rule',         color: '#10B981', mitigation: null },
  { id: 7,  time: '10:39:29', level: 'ALERT', src: '198.51.100.88 (CN)', msg: 'Low and Slow attack detected on API portal', color: '#EF4444', mitigation: { action: 'Connection throttling and behavioral blocklist enabled', steps: ['Slow POST requests dropped', 'Session anomaly logged', 'Client fingerprinting updated'], time: '< 2 min' } },
  { id: 8,  time: '10:39:42', level: 'INFO',  src: '192.0.2.20 (SG)',   msg: 'Threat intelligence feed updated',            color: '#10B981', mitigation: null },
  { id: 9,  time: '10:39:56', level: 'WARN',  src: '204.120.0.33 (DE)', msg: 'Application violation: SQL injection blocked', color: '#F97316', mitigation: null },
  { id: 10, time: '10:40:08', level: 'ALERT', src: '203.0.113.89 (US)', msg: 'DDoS mitigation applied for peak volumetrics', color: '#EF4444', mitigation: { action: 'Adaptive profile engaged and traffic filtered', steps: ['Botnet signatures enforced', 'Anomalous flows quarantined', 'Business-critical traffic preserved'], time: '< 45s' } },
]

export const PURDUE_ZONES = [
  { label: 'Nivel 4 – Corporativo',   pct: 98,   color: '#10B981', events: 1204 },
  { label: 'Nivel 3 – SCADA/DCS',     pct: 99.9, color: '#1E90FF', events: 318  },
  { label: 'Nivel 2 – Control',        pct: 99.9, color: '#1E90FF', events: 142  },
  { label: 'Nivel 1 – Field Devices',  pct: 97,   color: '#C5A46D', events: 87   },
  { label: 'Nivel 0 – Sensores/OT',    pct: 100,  color: '#10B981', events: 23   },
]

export const TOP_ATTACKERS = [
  { label: 'United States', pct: 82 },
  { label: 'China', pct: 8 },
  { label: 'Singapore', pct: 5 },
  { label: 'Germany', pct: 3 },
  { label: 'India', pct: 2 },
]

export const TOP_ATTACKED = [
  { label: 'United States', pct: 24 },
  { label: 'Switzerland', pct: 24 },
  { label: 'Canada', pct: 20 },
  { label: 'India', pct: 20 },
  { label: 'Israel', pct: 12 },
]

export const ATTACK_VECTORS = [
  { label: 'TCP Flood', pct: 66 },
  { label: 'UDP Flood', pct: 28 },
  { label: 'DNS Flood', pct: 4 },
  { label: 'IP Flood', pct: 1 },
  { label: 'Low and Slow', pct: 1 },
]

export const THREAT_LEVELS = [
  { label: 'CRITICAL', count: 4,  color: '#EF4444' },
  { label: 'HIGH',     count: 8,  color: '#F97316' },
  { label: 'MEDIUM',   count: 15, color: '#F59E0B' },
  { label: 'LOW',      count: 27, color: '#10B981' },
]

export const OPERATIONAL_KPIS = [
  { label: 'MTTR',     val: '< 15 min', icon: 'timer' },
  { label: 'Uptime',   val: '99.9%',    icon: 'results' },
  { label: 'Incid/M',  val: '−30%',     icon: 'analytics' },
  { label: 'Automat.', val: '−10h/sem', icon: 'automation' },
]
