import type { TranslationModule } from './index'

const es = {
  'theme.label': 'Tema',
  'theme.system': 'Sistema',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'theme.label': 'Theme',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
}

export const theme = { es, en }
