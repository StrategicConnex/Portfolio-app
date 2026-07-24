import type { TranslationModule } from './index'

const es = {
  'profile.label': 'Sobre mí',
  'profile.title': 'Perfil',
  'profile.highlight': 'Profesional',
  'profile.description1': 'Profesional en Ciberseguridad y Arquitectura de Redes con más de 20 años de trayectoria en el sector industrial. Especialista en la convergencia IT/OT con sólida experiencia en el diseño e implementación del Modelo Purdue para la protección de infraestructuras críticas en Oil & Gas.',
  'profile.description2': 'Experto en defensa activa mediante SIEM (Security Onion), gestión de identidades (IAM) y aseguramiento de la continuidad operativa bajo los estándares IEC 62443, NIST y SOX.',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'profile.label': 'About me',
  'profile.title': 'Professional',
  'profile.highlight': 'Profile',
  'profile.description1': 'Cybersecurity and Network Architecture professional with over 20 years of experience in the industrial sector. Specialist in IT/OT convergence with solid experience in the design and implementation of the Purdue Model for critical infrastructure protection in Oil & Gas.',
  'profile.description2': 'Expert in active defense through SIEM (Security Onion), Identity and Access Management (IAM), and ensuring operational continuity under IEC 62443, NIST, and SOX standards.',
}

export const profile = { es, en }
