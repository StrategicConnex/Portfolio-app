import type { TranslationModule } from './index'

const es = {
  'hero.title.first': 'Juan Felipe',
  'hero.title.last': 'Palacios',
  'hero.subtitle': 'Project Manager IT | Cybersecurity Leader | SysAdmin',
  'hero.role': 'IT/OT Network Architect',
  'hero.tagline': 'Resiliencia digital para infraestructuras críticas y el sector de Oil & Gas.',
  'hero.cta.history': 'Historial Crítico',
  'hero.cta.architecture': 'Arquitectura OT',
  'hero.system_active': 'Sistema Activo',
  'hero.protocol': 'Protocolo IT/OT · Ciberseguridad',
  'hero.role_details': 'Project Manager IT | Cybersecurity Leader | SysAdmin',
  'hero.scroll': 'Sistema de Scroll',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'hero.title.first': 'Juan Felipe',
  'hero.title.last': 'Palacios',
  'hero.subtitle': 'Project Manager IT | Cybersecurity Leader | SysAdmin',
  'hero.role': 'IT/OT Network Architect',
  'hero.tagline': 'Digital resilience for critical infrastructures and the Oil & Gas sector.',
  'hero.cta.history': 'Critical History',
  'hero.cta.architecture': 'OT Architecture',
  'hero.system_active': 'System Active',
  'hero.protocol': 'IT/OT Protocol · Cybersecurity',
  'hero.role_details': 'Project Manager IT | Cybersecurity Leader | SysAdmin',
  'hero.scroll': 'Scroll System',
}

export const hero = { es, en }
