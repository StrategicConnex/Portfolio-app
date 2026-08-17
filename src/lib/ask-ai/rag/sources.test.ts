import { describe, it, expect } from 'vitest'
import { ALL_SOURCES, SOURCE_COUNT } from './sources'
import { translations } from '@/context/translations'
import { ATTACK_VECTORS } from '@/data/siem'
import { AUDIT_SUMMARY, COMPLIANCE_MARCOS } from '@/data/audit'
import { JOBS } from '@/data/experiencia'
import { BLOG_POSTS } from '@/data/blog'

const es = ALL_SOURCES.filter((s) => s.locale === 'es')
const en = ALL_SOURCES.filter((s) => s.locale === 'en')

const tr = (lang: 'es' | 'en', key: string): string => translations[lang][key] ?? key

describe('corpus projection — derived, not duplicated (C2)', () => {
  it('projects the SIEM attack vectors verbatim (no drift)', () => {
    const siem = ALL_SOURCES.find((s) => s.id === 'siem-dashboard')
    expect(siem).toBeDefined()
    for (const v of ATTACK_VECTORS) {
      expect(siem!.content).toContain(`${v.label} (${v.pct}%)`)
    }
  })

  it('projects the compliance progress and the ISO controls summary', () => {
    for (const marco of COMPLIANCE_MARCOS) {
      const entry = ALL_SOURCES.find((s) => s.title === marco.name)
      expect(entry, `missing entry for ${marco.name}`).toBeDefined()
      expect(entry!.content).toContain(`Progreso: ${marco.progress}%`)
    }
    const iso = ALL_SOURCES.find((s) => s.id === 'compliance-iso27001')!
    expect(iso.content).toContain(`${AUDIT_SUMMARY.totalControls} totales`)
    expect(iso.content).toContain(`${AUDIT_SUMMARY.passed} pasados`)
    expect(iso.content).toContain(AUDIT_SUMMARY.lastAuditDate)
  })

  it('projects every job from experiencia.ts', () => {
    for (const job of JOBS) {
      expect(es.some((s) => s.title.startsWith(job.company))).toBe(true)
    }
  })

  it('projects every blog post with its translated title', () => {
    for (const post of BLOG_POSTS) {
      const title = tr('es', post.titleKey)
      expect(es.some((s) => s.content.includes(title))).toBe(true)
    }
  })

  it('profile carries the page claim of "20+ years" (drift fixed)', () => {
    const profile = ALL_SOURCES.find((s) => s.id === 'profile-summary')!
    expect(profile.content).toContain('20 años')
    const profileEn = ALL_SOURCES.find((s) => s.id === 'profile-summary-en')!
    expect(profileEn.content).toContain('20 years')
  })

  it('projects the case study base from the projects section', () => {
    const segmentation = ALL_SOURCES.find((s) => s.id === 'case-ot-segmentation')!
    expect(segmentation.content).toContain('Operadora Petrolera')
    const resilience = ALL_SOURCES.find((s) => s.id === 'case-resiliencia')!
    expect(resilience.content).toContain('$420,000')
  })

  it('is fully per-locale: no "both" entries, every es entry has an en sibling', () => {
    expect(ALL_SOURCES.every((s) => s.locale === 'es' || s.locale === 'en')).toBe(true)
    const esIds = new Set(es.map((s) => s.id))
    const enIds = new Set(en.map((s) => s.id))
    for (const id of esIds) {
      expect(enIds.has(`${id}-en`), `missing EN sibling for ${id}`).toBe(true)
    }
  })

  it('exports a consistent source count (es + en)', () => {
    expect(SOURCE_COUNT).toBe(ALL_SOURCES.length)
    expect(SOURCE_COUNT).toBe(es.length + en.length)
  })
})
