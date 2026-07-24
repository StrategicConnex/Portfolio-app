import { nav } from './nav'
import { hero } from './hero'
import { profile } from './profile'
import { experience } from './experience'
import { projects } from './projects'
import { siem } from './siem'
import { architecture } from './architecture'
import { audit } from './audit'
import { stack } from './stack'
import { certs } from './certs'
import { blog } from './blog'
import { ai } from './ai'
import { contact } from './contact'
import { scaudit } from './scaudit'
import { footer } from './footer'
import { tools } from './tools'

export interface TranslationModule {
  es: Record<string, string>
  en: Record<string, string>
}

const modules: TranslationModule[] = [
  nav, hero, profile, experience, projects, siem,
  architecture, audit, stack, certs, blog,
  ai, contact, scaudit, footer, tools,
]

function mergeModules(modules: TranslationModule[], lang: 'es' | 'en'): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const mod of modules) {
    Object.assign(merged, mod[lang])
  }
  return merged
}

export const translations: Record<'es' | 'en', Record<string, string>> = {
  es: mergeModules(modules, 'es'),
  en: mergeModules(modules, 'en'),
}
