import type { TranslationModule } from './index'

const es = {
  'trust.label': 'Validación profesional',
  'trust.title': 'Empresas &',
  'trust.highlight': 'Estándares',
  'trust.history': 'Historial corporativo',
  'trust.standards': 'Marcos y estándares',
  'trust.ecosystem': 'Ecosistema de clientes — Oil & Gas',
  'trust.years.present': '2025 – Actual',
  'trust.years.ops': '2013 – 2024',
  'trust.years.ext': '2003 – 2013',
  'trust.operators.oil': 'Operadoras líderes · Oil & Gas',
  'trust.operators.energy': 'Empresas de energía',
  'trust.operators.services': 'Servicios petroleros',
  'trust.operators.basin': 'Cuenca Neuquina · Vaca Muerta',
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
  'trust.standards': 'Frameworks & standards',
  'trust.ecosystem': 'Client ecosystem — Oil & Gas',
  'trust.years.present': '2025 – Present',
  'trust.years.ops': '2013 – 2024',
  'trust.years.ext': '2003 – 2013',
  'trust.operators.oil': 'Leading operators · Oil & Gas',
  'trust.operators.energy': 'Energy companies',
  'trust.operators.services': 'Oilfield services',
  'trust.operators.basin': 'Neuquén Basin · Vaca Muerta',
  'trust.operators.homologacion': 'Technical homologation',
  'trust.operators.gestion': 'File management',
  'trust.operators.b2b': 'B2B services',
  'trust.operators.regional': 'Regional ecosystem',
}

export const trust = { es, en }
