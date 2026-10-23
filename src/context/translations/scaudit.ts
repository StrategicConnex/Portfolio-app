import type { TranslationModule } from './index'

/**
 * Copy de la sección "PRODUCTO SAAS · StrategicAudit Pro".
 *
 * Fuente de verdad: https://scaudit.vercel.app (verificado 2026-10-21).
 *   · /mitre-coverage  → 23 técnicas, 7/14 tácticas, 46 herramientas
 *   · /openapi.json    → 10 endpoints, API v1.0.0, Bearer sa_live_*
 *   · /disclaimer      → estado beta + hoja de ruta pública con fechas
 *
 * No prometer SOC 2 / PCI DSS: la hoja de ruta los fecha en 2026-11-28 y
 * 2026-12-14. Cualquier cambio de cifras acá debe re-verificarse en vivo.
 */
const es = {
  'scaudit.label': 'PRODUCTO SAAS',
  'scaudit.title': 'StrategicAudit',
  'scaudit.highlight': 'Pro',
  'scaudit.description':
    'Plataforma de inteligencia de infraestructura cibernética: descubrimiento continuo de activos expuestos, escaneo DNS/TLS/OSINT/email y hallazgos mapeados a MITRE ATT&CK. Suma alertas SIEM multi-canal, reportes PDF white-label y una API REST v1 para CI/CD. Hoy en beta pública, con hoja de ruta fechada y publicada.',
  'scaudit.status.live': 'En vivo · Producción · Beta',
  'scaudit.img.alt':
    'Panel de StrategicAudit Pro con la cobertura MITRE ATT&CK por táctica, el inventario de activos descubiertos y los hallazgos de superficie de ataque.',
  'scaudit.feat.discovery.name': 'Descubrimiento Continuo',
  'scaudit.feat.discovery.desc':
    'DNS brute force, Certificate Transparency y shadow assets, cada 6 h.',
  'scaudit.feat.mitre.name': 'MITRE ATT&CK',
  'scaudit.feat.mitre.desc':
    '23 técnicas sobre 7 de 14 tácticas Enterprise: 46 herramientas.',
  'scaudit.feat.api.name': 'API REST v1',
  'scaudit.feat.api.desc':
    '10 endpoints con Bearer sa_live_*, scopes y rate limit IETF.',
  'scaudit.feat.siem.name': 'Alertas SIEM',
  'scaudit.feat.siem.desc':
    '7 reglas hacia Slack, PagerDuty, Splunk y email, con heartbeat.',
  'scaudit.feat.ai.name': 'Copilot IA',
  'scaudit.feat.ai.desc':
    'OpenRouter primario con failover a Groq y Gemini.',
  'scaudit.feat.reports.name': 'Reportes PDF',
  'scaudit.feat.reports.desc':
    'PDF white-label con logo, colores y hallazgos por severidad.',
  'scaudit.feat.defense.name': 'Hardening',
  'scaudit.feat.defense.desc':
    'CSP con nonce, rate limit fail-closed y egress-guard anti-SSRF.',
  'scaudit.feat.pwa.name': 'PWA + Push',
  'scaudit.feat.pwa.desc':
    'Instalable, con caché offline y push para alertas críticas.',
  'scaudit.metrics.title': 'CAPACIDAD VERIFICADA · OCTUBRE 2026',
  'scaudit.metrics.source': 'scaudit.vercel.app',
  'scaudit.cta.badge': 'BETA PÚBLICA · PRODUCCIÓN',
  'scaudit.cta.title': 'Auditá tu superficie de ataque con StrategicAudit Pro',
  'scaudit.cta.desc':
    'Accedé con magic link —sin contraseña—, sumá un dominio y obtené inventario de activos, hallazgos mapeados a MITRE y reportes PDF. La hoja de ruta con fechas está publicada en la plataforma.',
  'scaudit.cta.primary': 'Abrir SCAudit',
  'scaudit.cta.secondary': 'Ver hoja de ruta',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'scaudit.label': 'SAAS PRODUCT',
  'scaudit.title': 'StrategicAudit',
  'scaudit.highlight': 'Pro',
  'scaudit.description':
    'Cyber infrastructure intelligence platform: continuous discovery of exposed assets, DNS/TLS/OSINT/email scanning, and findings mapped to MITRE ATT&CK. Adds multi-channel SIEM alerts, white-label PDF reports, and a REST API v1 for CI/CD. Currently in public beta, with a dated roadmap published in the platform.',
  'scaudit.status.live': 'Live · Production · Beta',
  'scaudit.img.alt':
    'StrategicAudit Pro dashboard with MITRE ATT&CK coverage by tactic, the discovered asset inventory, and attack-surface findings.',
  'scaudit.feat.discovery.name': 'Continuous Discovery',
  'scaudit.feat.discovery.desc':
    'DNS brute force, Certificate Transparency and shadow assets, every 6 h.',
  'scaudit.feat.mitre.name': 'MITRE ATT&CK',
  'scaudit.feat.mitre.desc':
    '23 techniques across 7 of 14 Enterprise tactics: 46 tools.',
  'scaudit.feat.api.name': 'REST API v1',
  'scaudit.feat.api.desc':
    '10 endpoints with Bearer sa_live_* keys, scopes and IETF limits.',
  'scaudit.feat.siem.name': 'SIEM Alerts',
  'scaudit.feat.siem.desc':
    '7 rules routed to Slack, PagerDuty, Splunk and email, with heartbeat.',
  'scaudit.feat.ai.name': 'AI Copilot',
  'scaudit.feat.ai.desc':
    'OpenRouter primary with Groq and Gemini failover.',
  'scaudit.feat.reports.name': 'PDF Reports',
  'scaudit.feat.reports.desc':
    'White-label PDF with logo, colors and findings by severity.',
  'scaudit.feat.defense.name': 'Hardening',
  'scaudit.feat.defense.desc':
    'CSP nonce, fail-closed rate limiting and an SSRF egress guard.',
  'scaudit.feat.pwa.name': 'PWA + Push',
  'scaudit.feat.pwa.desc':
    'Installable, with offline cache and push for critical alerts.',
  'scaudit.metrics.title': 'VERIFIED CAPABILITY · OCTOBER 2026',
  'scaudit.metrics.source': 'scaudit.vercel.app',
  'scaudit.cta.badge': 'PUBLIC BETA · PRODUCTION',
  'scaudit.cta.title': 'Audit your attack surface with StrategicAudit Pro',
  'scaudit.cta.desc':
    'Sign in with a magic link —no password—, add a domain, and get an asset inventory, MITRE-mapped findings and PDF reports. The dated roadmap is published in the platform.',
  'scaudit.cta.primary': 'Open SCAudit',
  'scaudit.cta.secondary': 'View roadmap',
}

export const scaudit = { es, en }
