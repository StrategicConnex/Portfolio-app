/**
 * Knowledge corpus — derived, not duplicated (candidate C2).
 *
 * The copilot's retrieval corpus used to be a hand-written mirror of the
 * site's content, which drifted silently (the copilot said "15+ years" while
 * the page says "20+", SIEM vectors and compliance progress diverged). Now
 * the corpus is a *projection*: entries for profile, experience, SIEM,
 * compliance, blog and case studies are built from the live content modules
 * (`src/data/*`) and the translation dictionaries, so editing the page
 * updates the copilot by construction.
 *
 * Entries that have no live page source stay in the explicit MANUAL registry
 * below (contact, stack, certifications, services) — with both locales.
 *
 * Per-locale (N3): every section emits an `es` entry and an `en` entry with
 * content resolved through `translations[lang]`; the old `'both'` entries
 * that carried Spanish content for English users are gone.
 */
import { translations } from '@/context/translations'
import { JOBS } from '@/data/experiencia'
import { ATTACK_VECTORS, OPERATIONAL_KPIS, PURDUE_ZONES, TOP_ATTACKERS } from '@/data/siem'
import { AUDIT_SUMMARY, COMPLIANCE_MARCOS } from '@/data/audit'
import { BLOG_POSTS } from '@/data/blog'

export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  tags: string[];
  locale: 'es' | 'en' | 'both';
  type: 'profile' | 'experience' | 'stack' | 'certification' | 'case-study' | 'audit' | 'siem' | 'blog' | 'service';
  url?: string;
}

type Locale = 'es' | 'en'

/** Resolve a translation key for a locale; unknown keys fall back to the key itself. */
const tr = (lang: Locale, key: string): string => translations[lang][key] ?? key

/** Resolve a tag: translation keys (e.g. 'exp.tag.fiber') resolve per locale, raw stays. */
const resolveTag = (lang: Locale, tag: string): string => translations[lang][tag] ?? tag

const projectId = (lang: Locale, id: string): string => (lang === 'en' ? `${id}-en` : id)

// ─── Manual registry (knowledge with no live page source) ───────────────────
// Author both locales once; the projection below cannot cover these because
// their data lives only in the corpus (services), in component-local arrays
// (stack, certifications) or as stable reference info (contact).

const MANUAL_CONTACT: KnowledgeSource[] = [
  {
    id: 'contact-info',
    title: 'Información de Contacto',
    content: 'LinkedIn: linkedin.com/in/juanfpalacios. GitHub: github.com/juanfpalacios. Email disponible en sección de contacto. Basado en Neuquén, Argentina. Disponible para proyectos de alta criticidad en Oil & Gas e infraestructura crítica.',
    tags: ['contacto', 'linkedin', 'github', 'neuquén', 'email'],
    locale: 'es',
    type: 'profile',
  },
  {
    id: 'contact-info-en',
    title: 'Contact Information',
    content: 'LinkedIn: linkedin.com/in/juanfpalacios. GitHub: github.com/juanfpalacios. Based in Neuquén, Argentina. Available for high-criticality projects in Oil & Gas and critical infrastructure.',
    tags: ['contact', 'linkedin', 'github', 'neuquen', 'email'],
    locale: 'en',
    type: 'profile',
  },
]

const MANUAL_STACK: KnowledgeSource[] = [
  {
    id: 'stack-seguridad',
    title: 'Stack - Seguridad',
    content: 'Security Onion, Firewalls Industriales, SIEM, SOAR, IDS/IPS, Fortinet, Cisco ASA, WAF, DDoS Mitigation (Radware), Endpoint Protection, MFA. Seguridad perimetral y de redes industriales.',
    tags: ['seguridad', 'security onion', 'firewall', 'siem', 'soar', 'ids', 'ips', 'fortinet', 'cisco', 'waf', 'ddos', 'radware'],
    locale: 'es',
    type: 'stack',
  },
  {
    id: 'stack-seguridad-en',
    title: 'Stack - Security',
    content: 'Security Onion, Industrial Firewalls, SIEM, SOAR, IDS/IPS, Fortinet, Cisco ASA, WAF, DDoS Mitigation (Radware), Endpoint Protection, MFA. Perimeter security and industrial networks.',
    tags: ['security', 'security onion', 'firewall', 'siem', 'soar', 'ids', 'ips', 'fortinet', 'cisco', 'waf', 'ddos', 'radware'],
    locale: 'en',
    type: 'stack',
  },
  {
    id: 'stack-redes',
    title: 'Stack - Redes y Comunicaciones',
    content: 'Cisco (CCNA), MikroTik, VSAT, MPLS, SD-WAN, Fibra Óptica, Riverbed, Modbus, DNP3, Protocolos Industriales, TCP/IP, VLAN, VPN. Redes OT e infraestructura de comunicaciones crítica.',
    tags: ['redes', 'cisco', 'ccna', 'mikrotik', 'vsat', 'mpls', 'sd-wan', 'fibra', 'riverbed', 'modbus', 'dnp3'],
    locale: 'es',
    type: 'stack',
  },
  {
    id: 'stack-redes-en',
    title: 'Stack - Networks & Communications',
    content: 'Cisco (CCNA), MikroTik, VSAT, MPLS, SD-WAN, Fiber Optics, Riverbed, Modbus, DNP3, Industrial Protocols, TCP/IP, VLAN, VPN. OT networks and critical communications infrastructure.',
    tags: ['networks', 'cisco', 'ccna', 'mikrotik', 'vsat', 'mpls', 'sd-wan', 'fiber', 'riverbed', 'modbus', 'dnp3'],
    locale: 'en',
    type: 'stack',
  },
  {
    id: 'stack-cloud',
    title: 'Stack - Cloud e Infraestructura',
    content: 'Azure, AWS, VMware VCA-DCV, Virtualización, Docker, SQL Server, Power BI, Python, PowerShell, Bash. Infraestructura híbrida y automatización.',
    tags: ['cloud', 'azure', 'aws', 'vmware', 'virtualización', 'docker', 'sql server', 'power bi', 'python', 'powershell'],
    locale: 'es',
    type: 'stack',
  },
  {
    id: 'stack-cloud-en',
    title: 'Stack - Cloud & Infrastructure',
    content: 'Azure, AWS, VMware VCA-DCV, Virtualization, Docker, SQL Server, Power BI, Python, PowerShell, Bash. Hybrid infrastructure and automation.',
    tags: ['cloud', 'azure', 'aws', 'vmware', 'virtualization', 'docker', 'sql server', 'power bi', 'python', 'powershell'],
    locale: 'en',
    type: 'stack',
  },
]

const MANUAL_CERTS: KnowledgeSource[] = [
  {
    id: 'certs-main',
    title: 'Certificaciones Principales',
    content: 'PMP (Project Management Professional), CCNA Routing & Switching, Microsoft MCSE, VMware VCA-DCV, Cisco Cybersecurity Analyst. Certificaciones en ciberseguridad, cloud y gestión de proyectos.',
    tags: ['certificaciones', 'pmp', 'ccna', 'mcse', 'vmware', 'cisco', 'microsoft'],
    locale: 'es',
    type: 'certification',
  },
  {
    id: 'certs-main-en',
    title: 'Main Certifications',
    content: 'PMP (Project Management Professional), CCNA Routing & Switching, Microsoft MCSE, VMware VCA-DCV, Cisco Cybersecurity Analyst. Certifications in cybersecurity, cloud and project management.',
    tags: ['certifications', 'pmp', 'ccna', 'mcse', 'vmware', 'cisco', 'microsoft'],
    locale: 'en',
    type: 'certification',
  },
  {
    id: 'certs-cybersecurity',
    title: 'Cursos de Ciberseguridad',
    content: 'Arquitectura de Seguridad CompTIA Security+, Automatización y Programación de Redes Cisco, Bash para Ciberseguridad, IA para Reversing de Malware, Defensa de la Red (Cisco), Fortinet 7.X Security Specialist, Network Defense.',
    tags: ['ciberseguridad', 'comptia', 'security+', 'bash', 'malware', 'fortinet', 'network defense'],
    locale: 'es',
    type: 'certification',
  },
  {
    id: 'certs-cybersecurity-en',
    title: 'Cybersecurity Courses',
    content: 'CompTIA Security+ Security Architecture, Cisco Network Automation & Programming, Bash for Cybersecurity, AI for Malware Reversing, Network Defense (Cisco), Fortinet 7.X Security Specialist, Network Defense.',
    tags: ['cybersecurity', 'comptia', 'security+', 'bash', 'malware', 'fortinet', 'network defense'],
    locale: 'en',
    type: 'certification',
  },
  {
    id: 'certs-data-ai',
    title: 'Cursos de Datos e IA',
    content: 'IA Generativa y LLM Apps, Análisis Estratégico de IA, Power BI Avanzado, Azure Machine Learning, Python Microservicios, SQL Server Machine Learning, Power Automate, Excel Copilot.',
    tags: ['ia', 'datos', 'power bi', 'azure ml', 'python', 'sql server', 'machine learning', 'power automate', 'copilot'],
    locale: 'es',
    type: 'certification',
  },
  {
    id: 'certs-data-ai-en',
    title: 'Data & AI Courses',
    content: 'Generative AI and LLM Apps, Strategic AI Analysis, Advanced Power BI, Azure Machine Learning, Python Microservices, SQL Server Machine Learning, Power Automate, Excel Copilot.',
    tags: ['ai', 'data', 'power bi', 'azure ml', 'python', 'sql server', 'machine learning', 'power automate', 'copilot'],
    locale: 'en',
    type: 'certification',
  },
]

const MANUAL_SERVICES: KnowledgeSource[] = [
  {
    id: 'service-audit',
    title: 'Servicio: Auditoría de Seguridad OT/IT',
    content: 'Auditoría completa de seguridad OT/IT. Evaluación de cumplimiento contra IEC 62443, NIST CSF, ISO 27001. Identificación de brechas y plan de remediación. Análisis de segmentación de red y control de accesos.',
    tags: ['servicio', 'auditoría', 'ot', 'it', 'iec 62443', 'nist', 'iso 27001', 'cumplimiento'],
    locale: 'es',
    type: 'service',
  },
  {
    id: 'service-audit-en',
    title: 'Service: OT/IT Security Audit',
    content: 'Complete OT/IT security audit. Compliance assessment against IEC 62443, NIST CSF, ISO 27001. Gap identification and remediation plan. Network segmentation and access control analysis.',
    tags: ['service', 'audit', 'ot', 'it', 'iec 62443', 'nist', 'iso 27001', 'compliance'],
    locale: 'en',
    type: 'service',
  },
  {
    id: 'service-siem',
    title: 'Servicio: Implementación SIEM',
    content: 'Diseño e implementación de SIEM con Security Onion. Correlación IT/OT, dashboards personalizados, reglas de detección, integración SOAR, playbooks de respuesta a incidentes.',
    tags: ['servicio', 'siem', 'security onion', 'soar', 'detección', 'incidentes'],
    locale: 'es',
    type: 'service',
  },
  {
    id: 'service-siem-en',
    title: 'Service: SIEM Implementation',
    content: 'SIEM design and implementation with Security Onion. IT/OT correlation, custom dashboards, detection rules, SOAR integration, incident response playbooks.',
    tags: ['service', 'siem', 'security onion', 'soar', 'detection', 'incidents'],
    locale: 'en',
    type: 'service',
  },
  {
    id: 'service-purdue',
    title: 'Servicio: Arquitectura Purdue IT/OT',
    content: 'Diseño e implementación de arquitectura de redes industriales basada en el Modelo Purdue. Segmentación de niveles 0-4, DMZ industrial, control de accesos, monitoreo de tráfico OT.',
    tags: ['servicio', 'purdue', 'arquitectura', 'segmentación', 'dmz', 'industrial'],
    locale: 'es',
    type: 'service',
  },
  {
    id: 'service-purdue-en',
    title: 'Service: Purdue IT/OT Architecture',
    content: 'Design and implementation of industrial network architecture based on the Purdue Model. Level 0-4 segmentation, industrial DMZ, access control, OT traffic monitoring.',
    tags: ['service', 'purdue', 'architecture', 'segmentation', 'dmz', 'industrial'],
    locale: 'en',
    type: 'service',
  },
  {
    id: 'service-compliance',
    title: 'Servicio: Consultoría Cumplimiento',
    content: 'Consultoría en marcos de cumplimiento: IEC 62443 (Seguridad Industrial), NIST CSF (Ciberseguridad), ISO 27001 (SGSI), SOX (Control Financiero). Preparación para auditorías y certificaciones.',
    tags: ['servicio', 'cumplimiento', 'consultoría', 'iec 62443', 'nist', 'iso 27001', 'sox'],
    locale: 'es',
    type: 'service',
  },
  {
    id: 'service-compliance-en',
    title: 'Service: Compliance Consulting',
    content: 'Compliance framework consulting: IEC 62443 (Industrial Security), NIST CSF (Cybersecurity), ISO 27001 (ISMS), SOX (Financial Control). Audit and certification preparation.',
    tags: ['service', 'compliance', 'consulting', 'iec 62443', 'nist', 'iso 27001', 'sox'],
    locale: 'en',
    type: 'service',
  },
]

// ─── Projected: profile (from profile.ts translations) ──────────────────────

function projectProfile(lang: Locale): KnowledgeSource {
  return {
    id: projectId(lang, 'profile-summary'),
    title: lang === 'en' ? 'Professional Profile' : 'Perfil Profesional',
    content: `${tr(lang, 'profile.description1')} ${tr(lang, 'profile.description2')}`,
    tags: lang === 'en'
      ? ['profile', 'juan', 'palacios', 'neuquen', 'argentina', 'architect', 'it/ot', 'cybersecurity', 'industrial']
      : ['perfil', 'juan', 'palacios', 'neuquén', 'argentina', 'arquitecto', 'it/ot', 'ciberseguridad', 'industrial'],
    locale: lang,
    type: 'profile',
  }
}

// ─── Projected: experience (from experiencia.ts + experience.ts) ────────────

const EXP_IDS = ['exp-ypy', 'exp-ops', 'exp-ext'] as const

const EXP_ANCHORS: Record<string, { es: string[]; en: string[] }> = {
  'exp-ypy': { es: ['ypy', 'oilfield', 'oil & gas', 'siem'], en: ['ypy', 'oilfield', 'oil & gas', 'siem'] },
  'exp-ops': { es: ['ops', 'oilfield production'], en: ['ops', 'oilfield production'] },
  'exp-ext': { es: ['exterran', 'latinoamérica'], en: ['exterran', 'latin america'] },
}

function projectExperience(lang: Locale): KnowledgeSource[] {
  return JOBS.map((job, i) => {
    const baseId = EXP_IDS[i]
    const role = tr(lang, job.roleKey)
    const anchors = EXP_ANCHORS[baseId][lang]
    const tags = [...anchors, ...job.tags.map((tag) => resolveTag(lang, tag))]
    return {
      id: projectId(lang, baseId),
      title: `${job.company} - ${role}`,
      content: [
        role,
        tr(lang, job.periodKey),
        ...job.achievements.map((a) => tr(lang, a.textKey)),
        ...job.bullets.map((b) => tr(lang, b)),
      ].join('. '),
      tags,
      locale: lang,
      type: 'experience',
    }
  })
}

// ─── Projected: SIEM dashboard (from siem.ts + siem.ts translations) ────────

function projectSiem(lang: Locale): KnowledgeSource {
  const vectors = ATTACK_VECTORS.map((v) => `${v.label} (${v.pct}%)`).join(', ')
  const attackers = TOP_ATTACKERS.map((a) => `${a.label} (${a.pct}%)`).join(', ')
  const zones = PURDUE_ZONES.map(
    (z) => `${tr(lang, z.labelKey)} (${z.pct}% ${lang === 'en' ? 'effectiveness' : 'efectividad'})`,
  ).join(', ')
  const kpis = OPERATIONAL_KPIS.map(
    (k) => `${tr(lang, k.labelKey)} ${tr(lang, k.valKey)}`,
  ).join(', ')
  const labels = lang === 'en'
    ? {
        intro: 'Interactive SIEM simulation dashboard. Real-time threat monitoring with ALERT, WARN, INFO levels.',
        vectors: 'Vectors:',
        attackers: 'Top attackers:',
        zones: 'Protected Purdue zones:',
        kpis: 'KPIs:',
        outro: 'DDoS mitigation with Radware DefensePro.',
      }
    : {
        intro: 'Dashboard interactivo de simulación SIEM. Monitoreo de amenazas en tiempo real con niveles ALERT, WARN, INFO.',
        vectors: 'Vectores de ataque:',
        attackers: 'Top atacantes:',
        zones: 'Zonas Purdue protegidas:',
        kpis: 'KPIs:',
        outro: 'Mitigación DDoS con Radware DefensePro.',
      }
  return {
    id: projectId(lang, 'siem-dashboard'),
    title: lang === 'en' ? 'SIEM Simulation - Dashboard' : 'Simulación SIEM - Dashboard',
    content: `${labels.intro} ${labels.vectors} ${vectors}. ${labels.attackers} ${attackers}. ${labels.zones} ${zones}. ${labels.kpis} ${kpis}. ${labels.outro}`,
    tags: ['siem', 'dashboard', 'threat', 'alerts', 'ddos', 'radware', 'tcp flood', 'purdue', 'mttr'],
    locale: lang,
    type: 'siem',
  }
}

// ─── Projected: compliance (from audit.ts + audit.ts translations) ──────────

const COMPLIANCE_IDS = ['compliance-iso27001', 'compliance-iec62443', 'compliance-nist', 'compliance-gdpr'] as const

const COMPLIANCE_TAGS: Record<string, { es: string[]; en: string[] }> = {
  'compliance-iso27001': {
    es: ['iso 27001', 'sgsi', 'cumplimiento', 'auditoría'],
    en: ['iso 27001', 'isms', 'compliance', 'audit'],
  },
  'compliance-iec62443': {
    es: ['iec 62443', 'industrial', 'automation', 'oil & gas', 'vaca muerta'],
    en: ['iec 62443', 'industrial', 'automation', 'oil & gas', 'vaca muerta'],
  },
  'compliance-nist': {
    es: ['nist', 'csf', 'framework', 'gobernanza', 'riesgo'],
    en: ['nist', 'csf', 'framework', 'governance', 'risk'],
  },
  'compliance-gdpr': {
    es: ['gdpr', 'lgpd', 'privacidad', 'datos'],
    en: ['gdpr', 'lgpd', 'privacy', 'data'],
  },
}

function projectCompliance(lang: Locale): KnowledgeSource[] {
  return COMPLIANCE_MARCOS.map((marco, i) => {
    const baseId = COMPLIANCE_IDS[i]
    let content = `${marco.name}. ${tr(lang, marco.descriptionKey)} Progreso: ${marco.progress}%.`
    // The ISO 27001 SGSI entry also carries the controls summary.
    if (i === 0) {
      content += lang === 'en'
        ? ` Controls: ${AUDIT_SUMMARY.totalControls} total, ${AUDIT_SUMMARY.passed} passed, ${AUDIT_SUMMARY.failed} failed, ${AUDIT_SUMMARY.inWarnings} in warning. Last audit: ${AUDIT_SUMMARY.lastAuditDate}. Next audit: ${AUDIT_SUMMARY.nextAuditDate}.`
        : ` Controles: ${AUDIT_SUMMARY.totalControls} totales, ${AUDIT_SUMMARY.passed} pasados, ${AUDIT_SUMMARY.failed} fallados, ${AUDIT_SUMMARY.inWarnings} en advertencia. Auditoría última: ${AUDIT_SUMMARY.lastAuditDate}. Auditoría próxima: ${AUDIT_SUMMARY.nextAuditDate}.`
    }
    return {
      id: projectId(lang, baseId),
      title: marco.name,
      content,
      tags: COMPLIANCE_TAGS[baseId][lang],
      locale: lang,
      type: 'audit',
    }
  })
}

// ─── Projected: blog (from blog.ts + blog.ts translations) ──────────────────

const BLOG_ID_MAP: Record<string, string> = {
  'iec-62443-vaca-muerta': 'blog-iec-62443',
  'siem-it-ot-convergencia': 'blog-siem-convergencia',
  'nist-csf-critical-infrastructure': 'blog-nist-csf',
}

function projectBlog(lang: Locale): KnowledgeSource[] {
  return BLOG_POSTS.map((post) => {
    const title = tr(lang, post.titleKey)
    const baseId = BLOG_ID_MAP[post.id]
    return {
      id: projectId(lang, baseId),
      title,
      content: `${title}. ${tr(lang, post.excerptKey)} (Categoría: ${post.category}).`,
      tags: lang === 'en'
        ? ['blog', post.category.toLowerCase(), 'oil & gas']
        : ['blog', post.category.toLowerCase(), 'oil & gas'],
      locale: lang,
      type: 'blog',
    }
  })
}

// ─── Projected: case studies (projects.ts base + manual intro) ──────────────

const CASE_META: Record<string, { caseKey: 1 | 2 | 3; intro: { es: string; en: string } }> = {
  'case-ot-segmentation': {
    caseKey: 1,
    intro: {
      es: 'Segmentación de red OT en operaciones Oil & Gas. Implementación de firewalls industriales, DMZ y control de acceso basado en el Modelo Purdue. Reducción de superficie de ataque y mejora en detección de amenazas.',
      en: 'OT network segmentation in Oil & Gas operations. Industrial firewalls, DMZ and access control based on the Purdue Model. Reduced attack surface and improved threat detection.',
    },
  },
  'case-siem': {
    caseKey: 2,
    intro: {
      es: 'Implementación completa de SIEM corporativo con Security Onion. Correlación de eventos IT y OT, reducción del tiempo de respuesta a incidentes y automatización de la respuesta con SOAR.',
      en: 'Full corporate SIEM implementation with Security Onion. IT and OT event correlation, reduced incident response time and SOAR-automated response.',
    },
  },
  'case-resiliencia': {
    caseKey: 3,
    intro: {
      es: 'Caso de éxito en manufactura de procesos continuos. Reducción de MTTR de 4.2 horas a 15 minutos y ahorro anual de $420,000 USD, con detección de manipulación de setpoints en SCADA en tiempo récord.',
      en: 'Success case in continuous process manufacturing. MTTR reduced from 4.2 hours to 15 minutes and $420,000 USD in annual savings, detecting SCADA setpoint manipulation in record time.',
    },
  },
}

/** Collect translation keys with a numeric suffix that exist in the dictionary. */
function collectKeys(lang: Locale, prefix: string, max: number): string[] {
  const out: string[] = []
  for (let i = 1; i <= max; i++) {
    const key = `${prefix}.${i}`
    const value = translations[lang][key]
    if (value !== undefined) out.push(value)
  }
  return out
}

function projectCases(lang: Locale): KnowledgeSource[] {
  return Object.entries(CASE_META).map(([baseId, meta]) => {
    const casePrefix = `projects.case${meta.caseKey}`
    const title = tr(lang, `${casePrefix}.title`)
    const company = tr(lang, `${casePrefix}.company`)
    const desc = tr(lang, `${casePrefix}.desc`)
    const before = collectKeys(lang, `${casePrefix}.before`, 5).join(', ')
    const after = collectKeys(lang, `${casePrefix}.after`, 5).join(', ')
    const metrics = collectKeys(lang, `${casePrefix}.metric`, 2).join(', ')
    const labels = lang === 'en'
      ? { before: 'Before', after: 'After', metrics: 'Metrics' }
      : { before: 'Antes', after: 'Después', metrics: 'Métricas' }
    return {
      id: projectId(lang, baseId),
      title: lang === 'en' ? `Case Study: ${title}` : `Caso de Estudio: ${title}`,
      content: `${meta.intro[lang]} ${title} - ${company}. ${desc} ${labels.before}: ${before}. ${labels.after}: ${after}. ${labels.metrics}: ${metrics}.`,
      tags: lang === 'en'
        ? ['case', 'resilience', 'mttr', 'siem', 'soar', 'dmz', 'purdue', 'scada', 'oil & gas']
        : ['caso', 'resiliencia', 'mttr', 'siem', 'soar', 'dmz', 'purdue', 'scada', 'oil & gas'],
      locale: lang,
      type: 'case-study',
    }
  })
}

// ─── Export consolidated ────────────────────────────────────────────────────

export const ALL_SOURCES: KnowledgeSource[] = [
  projectProfile('es'),
  projectProfile('en'),
  ...MANUAL_CONTACT,
  ...projectExperience('es'),
  ...projectExperience('en'),
  ...MANUAL_STACK,
  ...MANUAL_CERTS,
  ...projectCases('es'),
  ...projectCases('en'),
  projectSiem('es'),
  projectSiem('en'),
  ...MANUAL_SERVICES,
  ...projectCompliance('es'),
  ...projectCompliance('en'),
  ...projectBlog('es'),
  ...projectBlog('en'),
]

export const SOURCE_COUNT = ALL_SOURCES.length
