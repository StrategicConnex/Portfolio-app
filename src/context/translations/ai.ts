import type { TranslationModule } from './index'

const es = {
  'ai.welcome': 'Hola, soy Nacho Assistant, el consultor IA de Juan. ¿En qué puedo ayudarte hoy sobre su perfil IT/OT?',
  'ai.placeholder': 'Escribe tu consulta sobre Juan...',
  'ai.subtitle': 'Arquitecto IT/OT IA',
  'ai.footer': 'Responde basado en la experiencia de Juan en IT/OT',
  'ai.error': 'Actualmente tengo problemas de conexión. Por favor, intenta de nuevo más tarde.',
  'ai.close': 'Cerrar chat',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'ai.welcome': "Hi, I am Nacho Assistant, Juan's AI consultant. How can I help you today regarding his IT/OT profile?",
  'ai.placeholder': 'Write your query about Juan...',
  'ai.subtitle': 'AI IT/OT Architect',
  'ai.footer': "Responds based on Juan's IT/OT experience",
  'ai.error': 'I currently have connection problems. Please try again later.',
  'ai.close': 'Close chat',
}

export const ai = { es, en }
