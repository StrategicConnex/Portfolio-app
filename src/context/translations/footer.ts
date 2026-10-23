import type { TranslationModule } from './index'

const es = {
  'footer.built_with': 'Construido con Next.js 16 · Framer Motion · Three.js',
  'footer.cookie_prefs': 'Cookies',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'footer.built_with': 'Built with Next.js 16 · Framer Motion · Three.js',
  'footer.cookie_prefs': 'Cookie settings',
}

export const footer = { es, en }
