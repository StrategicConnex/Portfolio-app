import type { TranslationModule } from './index'

const es = {
  'ai.welcome': 'Hola, soy Nacho Assistant, el consultor IA de Juan. ¿En qué puedo ayudarte hoy sobre su perfil IT/OT?',
  'ai.placeholder': 'Escribe tu consulta sobre Juan...',
  'ai.subtitle': 'Arquitecto IT/OT IA',
  'ai.footer': 'Responde basado en la experiencia de Juan en IT/OT',
  'ai.error': 'Actualmente tengo problemas de conexión. Por favor, intenta de nuevo más tarde.',
  'ai.close': 'Cerrar chat',
  'ai.followup.iec_nist': 'Compara IEC 62443 con NIST CSF',
  'ai.followup.security_onion': '¿Cómo aplica Security Onion en OT?',
  'ai.source.profile': 'Perfil Profesional',
  'ai.source.experience': 'Experiencia IT/OT',
  'ai.source.stack': 'Stack Tecnológico',
  'ai.source.certs': 'Certificaciones',
  'ai.suggest.resume': 'Resume mi perfil profesional',
  'ai.suggest.purdue': 'Explica el modelo Purdue en OT',
  'ai.suggest.services': 'Servicios de ciberseguridad industrial',
  'ai.suggest.iec_nist': 'IEC 62443 vs NIST CSF',
  'ai.model.free': 'gratis',
  'ai.retrying': 'Reintentando con otro modelo...',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'ai.welcome': "Hi, I am Nacho Assistant, Juan's AI consultant. How can I help you today regarding his IT/OT profile?",
  'ai.placeholder': 'Write your query about Juan...',
  'ai.subtitle': 'AI IT/OT Architect',
  'ai.footer': "Responds based on Juan's IT/OT experience",
  'ai.error': 'I currently have connection problems. Please try again later.',
  'ai.close': 'Close chat',
  'ai.followup.iec_nist': 'Compare IEC 62443 vs NIST CSF',
  'ai.followup.security_onion': 'How does Security Onion apply to OT?',
  'ai.source.profile': 'Professional Profile',
  'ai.source.experience': 'IT/OT Experience',
  'ai.source.stack': 'Tech Stack',
  'ai.source.certs': 'Certifications',
  'ai.suggest.resume': 'Summarize my professional profile',
  'ai.suggest.purdue': 'Explain the Purdue model in OT',
  'ai.suggest.services': 'Industrial cybersecurity services',
  'ai.suggest.iec_nist': 'IEC 62443 vs NIST CSF',
  'ai.model.free': 'free',
  'ai.retrying': 'Retrying with another model...',
}

export const ai = { es, en }
