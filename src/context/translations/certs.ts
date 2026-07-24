import type { TranslationModule } from './index'

const es = {
  'certs.label': 'Validación Profesional',
  'certs.title': 'Certificaciones &',
  'certs.highlight': 'Logros',
  'certs.analyst': 'Analista de sistemas – UNCO',
  'certs.pm': 'Project Management & IEC 62443 – Universidad Siglo 21',
  'certs.english': 'Inglés B2 – Intermedio Alto',
  'certs.cat.all': 'Todos',
  'certs.cat.cybersecurity': 'Ciberseguridad & Redes',
  'certs.cat.data_ai': 'Data & IA',
  'certs.cat.cloud_dev': 'Cloud & Dev',
  'certs.cat.soft_skills': 'Habilidades Blandas',
  'certs.cat.other': 'Otros Certificados',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'certs.label': 'Professional Validation',
  'certs.title': 'Certifications &',
  'certs.highlight': 'Achievements',
  'certs.analyst': 'Systems Analyst – UNCO',
  'certs.pm': 'Project Management & IEC 62443 – Siglo 21 University',
  'certs.english': 'English B2 – Upper Intermediate',
  'certs.cat.all': 'All',
  'certs.cat.cybersecurity': 'Cybersecurity & Networks',
  'certs.cat.data_ai': 'Data & AI',
  'certs.cat.cloud_dev': 'Cloud & Dev',
  'certs.cat.soft_skills': 'Soft Skills',
  'certs.cat.other': 'Other Certificates',
}

export const certs = { es, en }
