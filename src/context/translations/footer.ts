import type { TranslationModule } from './index'

const es = {
  'footer.built_with': 'Construido con Next.js 14 · Framer Motion · Three.js',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'footer.built_with': 'Built with Next.js 14 · Framer Motion · Three.js',
}

export const footer = { es, en }
