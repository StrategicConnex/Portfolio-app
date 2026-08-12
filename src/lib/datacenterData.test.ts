import { describe, it, expect } from 'vitest'
import { buildEmbodiedMetrics, kpiToValue, passedControlsPct, parseCounter, formatCounter, easeOutCubic } from './datacenterData'
import { AUDIT_SUMMARY } from '@/data/audit'
import { OPERATIONAL_KPIS } from '@/data/siem'

describe('datacenterData — datos encarnados (audit G3)', () => {
  it('kpiToValue parsea KPIs reales (99.9%, −30%, −10h/sem)', () => {
    expect(kpiToValue('99.9%')).toBe(99.9)
    expect(kpiToValue('−30%')).toBe(30)
    expect(kpiToValue('−10h/sem')).toBe(10)
    expect(kpiToValue('< 15 min')).toBe(15)
    expect(kpiToValue('')).toBe(0)
  })

  it('passedControlsPct usa los datos reales del audit (131/142 → 92.2)', () => {
    const pct = passedControlsPct(AUDIT_SUMMARY.passed, AUDIT_SUMMARY.totalControls)
    expect(pct).toBeGreaterThan(90)
    expect(pct).toBeLessThan(95)
    expect(passedControlsPct(0, 142)).toBe(0)
    expect(passedControlsPct(10, 0)).toBe(0)
  })

  it('buildEmbodiedMetrics deriva TODAS las métricas de src/data (sin hardcode)', () => {
    const metrics = buildEmbodiedMetrics()
    // 4 marcos + 4 KPIs + 1 controles + 4 amenazas
    expect(metrics.length).toBe(13)

    const kpiUptime = metrics.find((m) => m.labelKey === 'siem.kpi.uptime')
    expect(kpiUptime?.display).toBe('99.9%')
    expect(kpiUptime?.value).toBe(99.9)
    const kpiMttr = metrics.find((m) => m.labelKey === 'siem.ui.mttr')
    expect(kpiMttr?.display).toBe(OPERATIONAL_KPIS[0].val) // '< 15 min'
    expect(kpiMttr?.value).toBe(15)

    const controls = metrics.find((m) => m.id === 'audit-controls')
    expect(controls?.display).toBe('131/142')
    expect(controls?.value).toBeGreaterThan(92)
  })

  it('todas las métricas tienen labelKey, color y posición válidos', () => {
    for (const m of buildEmbodiedMetrics()) {
      expect(m.labelKey).toMatch(/^(dc\.data|siem\.kpi|siem\.ui|audit\.)/)
      expect(m.color).toMatch(/^#/)
      expect(Array.isArray(m.position)).toBe(true)
      expect(m.position.length).toBe(3)
      expect(m.value).toBeGreaterThanOrEqual(0)
      expect(m.value).toBeLessThanOrEqual(100)
    }
  })

  it('escenas cubiertas: S2 (marcos), S3 (KPIs+amenazas), S4 (controles)', () => {
    const scenes = new Set(buildEmbodiedMetrics().map((m) => m.scene))
    expect(scenes.has(1)).toBe(true)
    expect(scenes.has(2)).toBe(true)
    expect(scenes.has(3)).toBe(true)
  })
})

describe('datacenterData — count-up (animación de contadores, audit G3)', () => {
  it('parseCounter descompone displays reales (prefijo/número/decimales/sufijo)', () => {
    expect(parseCounter('99.9%')).toEqual({ prefix: '', target: 99.9, decimals: 1, suffix: '%' })
    expect(parseCounter('−30%')).toEqual({ prefix: '−', target: 30, decimals: 0, suffix: '%' })
    expect(parseCounter('131/142')).toEqual({ prefix: '', target: 131, decimals: 0, suffix: '/142' })
    expect(parseCounter('< 15 min')).toEqual({ prefix: '< ', target: 15, decimals: 0, suffix: ' min' })
    expect(parseCounter('−10h/sem')).toEqual({ prefix: '−', target: 10, decimals: 0, suffix: 'h/sem' })
  })

  it('parseCounter tolera entradas no numéricas (null seguro)', () => {
    expect(parseCounter('')).toBeNull()
    expect(parseCounter('ONLINE')).toBeNull()
  })

  it('formatCounter anima el número sin tocar prefijo/sufijo', () => {
    const spec = parseCounter('−30%')!
    expect(formatCounter(spec, 0)).toBe('−0%')
    expect(formatCounter(spec, 0.5)).toBe('−15%')
    expect(formatCounter(spec, 1)).toBe('−30%')
    const frac = parseCounter('131/142')!
    expect(formatCounter(frac, 0)).toBe('0/142')
    expect(formatCounter(frac, 1)).toBe('131/142')
  })

  it('formatCounter respeta decimales (99.9%)', () => {
    const spec = parseCounter('99.9%')!
    expect(formatCounter(spec, 0.5)).toBe('50.0%')
    expect(formatCounter(spec, 1)).toBe('99.9%')
  })

  it('easeOutCubic es monótono, arranca 0 y termina 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(2)).toBe(1)
  })
})
