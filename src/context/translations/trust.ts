import type { TranslationModule } from './index'

const es = {
  'trust.label': 'Validación profesional',
  'trust.title': 'Empresas &',
  'trust.highlight': 'Estándares',
  'trust.history': 'Historial corporativo',
  'trust.standards': 'Certificaciones y estándares',
  'trust.ecosystem': 'Ecosistema de operadoras — Vaca Muerta',
  'trust.years.present': '2025 – Actual',
  'trust.years.ops': '2013 – 2024',
  'trust.years.ext': '2003 – 2013',
  'trust.operators.homologacion': 'Homologación técnica',
  'trust.operators.gestion': 'Gestión de legajos',
  'trust.operators.b2b': 'Servicios B2B',
  'trust.operators.regional': 'Ecosistema regional',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'trust.label': 'Professional Validation',
  'trust.title': 'Companies &',
  'trust.highlight': 'Standards',
  'trust.history': 'Corporate history',
  'trust.standards': 'Certifications & standards',
  'trust.ecosystem': 'Operator ecosystem — Vaca Muerta',
  'trust.years.present': '2025 – Present',
  'trust.years.ops': '2013 – 2024',
  'trust.years.ext': '2003 – 2013',
  'trust.operators.homologacion': 'Technical homologation',
  'trust.operators.gestion': 'File management',
  'trust.operators.b2b': 'B2B services',
  'trust.operators.regional': 'Regional ecosystem',
}

export const trust = { es, en }
