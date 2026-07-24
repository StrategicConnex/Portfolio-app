export const SITE_KEYWORDS: string[] = [
  'Ciberseguridad Industrial', 'IT/OT', 'IEC 62443', 'NIST', 'SCADA',
  'Ciberseguridad para Oil & Gas en Vaca Muerta', 'Consultoría IT/OT Neuquén',
  'Oil & Gas', 'Vaca Muerta', 'Neuquén', 'Argentina',
  'Security Onion', 'SIEM', 'Modelo Purdue', 'ISO 27001', 'SOX',
  'Juan Felipe Palacios', 'Consultoría IT/OT', 'Infraestructura crítica',
]

export const SITE = {
  url: 'https://juanpalacios.vercel.app',
  name: 'Juan Felipe Palacios',
  locale: 'es_AR',
  applicationName: 'Portfolio - Juan Felipe Palacios',
  description:
    'Consultoría IT/OT y ciberseguridad industrial para Oil & Gas en Vaca Muerta. Experiencia en IEC 62443, NIST, SCADA y redes críticas. Basado en Neuquén, Argentina.',
  publisher: 'Juan Felipe Palacios',
  creator: 'Juan Felipe Palacios',
  keywords: SITE_KEYWORDS,
  social: {
    linkedin: 'https://linkedin.com/in/juanfpalacios',
    github: 'https://github.com/juanfpalacios',
    twitter: 'https://twitter.com/juanfpalacios',
  },
  profileImage: 'https://juanpalacios.vercel.app/JuanPalacios.webp',
  email: {
    from: process.env.CONTACT_FROM_EMAIL ?? 'portfolio@juanpalacios.vercel.app',
    to: process.env.CONTACT_TO_EMAIL ?? '',
  },
  scaudit: {
    projectId: '7c9945ad-c235-484d-98fa-1d8fe7e9ee40',
    apiUrl: 'https://scaudit.vercel.app/api/telemetry/vitals',
    scriptUrl: 'https://scaudit.vercel.app/scripts/vitals.js',
    appUrl: 'https://scaudit.vercel.app',
  },
} as const
