import type { TranslationModule } from './index'

const es = {
  'nav.profile': 'Perfil',
  'nav.architecture': 'Arquitectura',
  'nav.experience': 'Experiencia',
  'nav.siem': 'SIEM',
  'nav.audit': 'Auditoría',
  'nav.blog': 'Inteligencia',
  'nav.stack': 'Stack',
  'nav.projects': 'Casos de Éxito',
  'nav.contact': 'Contacto',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'nav.profile': 'Profile',
  'nav.architecture': 'Architecture',
  'nav.experience': 'Experience',
  'nav.siem': 'SIEM',
  'nav.audit': 'Audit',
  'nav.blog': 'Intelligence',
  'nav.stack': 'Stack',
  'nav.projects': 'Case Studies',
  'nav.contact': 'Contact',
}

export const nav = { es, en }
