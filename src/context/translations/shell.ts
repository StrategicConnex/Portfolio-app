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
}

export const shell = { es, en }
