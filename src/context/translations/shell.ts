import type { TranslationModule } from './index'

const es = {
  'shell.notfound.eyebrow': 'Error 404 — Señal no encontrada',
  'shell.notfound.title': 'Esta coordenada no existe',
  'shell.notfound.description': 'La ruta solicitada no está mapeada en el portfolio. Volvé al inicio para seguir explorando la convergencia IT/OT.',
  'shell.notfound.back': 'Volver al inicio',
  'shell.error.eyebrow': 'Sistema degradado',
  'shell.error.title': 'Se interrumpió una sección del sitio',
  'shell.error.description': 'Ocurrió un error inesperado al renderizar esta parte de la página. El resto del portfolio funciona con normalidad.',
  'shell.error.retry': 'Reintentar',
  'shell.error.back': 'Volver al inicio',
  'shell.consent.aria': 'Preferencias de cookies',
  'shell.consent.text':
    'Uso analítica (PostHog) y medición de rendimiento (SCAudit RUM) para entender qué contenido resulta útil. No se activan hasta que aceptes; puedes cambiar tu decisión desde el pie de página.',
  'shell.consent.accept': 'Aceptar',
  'shell.consent.reject': 'Rechazar',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'shell.notfound.eyebrow': 'Error 404 — Signal not found',
  'shell.notfound.title': 'This coordinate does not exist',
  'shell.notfound.description': 'The requested route is not mapped in the portfolio. Go back to the start to keep exploring the IT/OT convergence.',
  'shell.notfound.back': 'Back to start',
  'shell.error.eyebrow': 'System degraded',
  'shell.error.title': 'A section of the site was interrupted',
  'shell.error.description': 'An unexpected error occurred while rendering this part of the page. The rest of the portfolio works normally.',
  'shell.error.retry': 'Retry',
  'shell.error.back': 'Back to start',
  'shell.consent.aria': 'Cookie preferences',
  'shell.consent.text':
    'I use analytics (PostHog) and performance measurement (SCAudit RUM) to understand which content is useful. Neither loads until you accept; you can change your decision from the footer.',
  'shell.consent.accept': 'Accept',
  'shell.consent.reject': 'Decline',
}

export const shell = { es, en }
