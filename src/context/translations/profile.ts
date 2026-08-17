import type { TranslationModule } from './index'

const es = {
  'profile.label': 'Sobre mí',
  'profile.title': 'Perfil',
  'profile.highlight': 'Profesional',
  'profile.description1': 'Profesional en Ciberseguridad y Arquitectura de Redes con más de 20 años de trayectoria en el sector industrial. Especialista en la convergencia IT/OT con sólida experiencia en el diseño e implementación del Modelo Purdue para la protección de infraestructuras críticas en Oil & Gas.',
  'profile.description2': 'Experto en defensa activa mediante SIEM (Security Onion), gestión de identidades (IAM) y aseguramiento de la continuidad operativa bajo los estándares IEC 62443, NIST y SOX.',
  'profile.skills_header': 'Dominio técnico completo',
  'profile.metric.availability': 'Disponibilidad de red garantizada',
  'profile.metric.incidents': 'Reducción de incidentes de seguridad',
  'profile.metric.automation': 'Ahorro semanal con automatización Python',
  'profile.metric.virtualization': 'Eficiencia operativa en virtualización',
  'profile.comp.cyber': 'Ciberseguridad Industrial',
  'profile.comp.network': 'Redes & Infraestructura',
  'profile.comp.cloud': 'Cloud & Virtualización',
  'profile.comp.ot': 'OT / Control Industrial',
  'profile.comp.dev': 'Desarrollo & Automatización',
  'profile.comp.grc': 'Gestión & GRC',
  'profile.photo_alt': 'Foto de perfil de Juan Palacios',
  'profile.item.fiber_optics': 'Fibra Óptica',
  'profile.item.industrial_control': 'Control Industrial',
  'profile.item.industrial_firewalls': 'Firewalls Industriales',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'profile.label': 'About me',
  'profile.title': 'Professional',
  'profile.highlight': 'Profile',
  'profile.description1': 'Cybersecurity and Network Architecture professional with over 20 years of experience in the industrial sector. Specialist in IT/OT convergence with solid experience in the design and implementation of the Purdue Model for critical infrastructure protection in Oil & Gas.',
  'profile.description2': 'Expert in active defense through SIEM (Security Onion), Identity and Access Management (IAM), and ensuring operational continuity under IEC 62443, NIST, and SOX standards.',
  'profile.skills_header': 'Complete technical mastery',
  'profile.metric.availability': 'Guaranteed network availability',
  'profile.metric.incidents': 'Reduction in security incidents',
  'profile.metric.automation': 'Weekly savings with Python automation',
  'profile.metric.virtualization': 'Operational efficiency in virtualization',
  'profile.comp.cyber': 'Industrial Cybersecurity',
  'profile.comp.network': 'Networks & Infrastructure',
  'profile.comp.cloud': 'Cloud & Virtualization',
  'profile.comp.ot': 'OT / Industrial Control',
  'profile.comp.dev': 'Development & Automation',
  'profile.comp.grc': 'Management & GRC',
  'profile.photo_alt': 'Profile photo of Juan Palacios',
  'profile.item.fiber_optics': 'Fiber Optics',
  'profile.item.industrial_control': 'Industrial Control',
  'profile.item.industrial_firewalls': 'Industrial Firewalls',
}

export const profile = { es, en }
