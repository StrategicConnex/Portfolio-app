'use client'

/**
 * Datos encarnados (audit CREATIVE-AUDIT §5, gap G3 — estilo Mastercard):
 * anillos/contadores holográficos en el 3D alimentados por los datos REALES
 * de `src/data/` (`audit.ts`, `siem.ts`). El DOM es la fuente de verdad; este
 * módulo es un puente de LECTURA puro (cero estado, cero fetch) que traduce
 * las métricas existentes a una forma consumible por el anillo 3D.
 *
 * Reglas (SPEC §13): los labels son claves i18n (`labelKey`), nunca texto
 * hardcoded. Los valores numéricos se muestran tal cual vienen de `data/`
 * (display), mientras `value` (0-100) alimenta el arco del anillo.
 */
import { COMPLIANCE_MARCOS, AUDIT_SUMMARY } from '@/data/audit'
import { OPERATIONAL_KPIS, THREAT_LEVELS } from '@/data/siem'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

const { colors } = DATACENTER_TOKENS

export type EmbodiedMetric = {
  /** id estable para tests/key de React. */
  id: string
  /** Escena (índice 0-4) donde el anillo es visible. */
  scene: number
  /** Clave i18n del label (nunca texto crudo). */
  labelKey: string
  /** Valor 0-100 que alimenta el arco del anillo. */
  value: number
  /** Texto del contador (display real del dato, ej. '99.9%' / '131/142'). */
  display: string
  /** Color semántico del token. */
  color: string
  /** Posición del anillo en el espacio de la escena. */
  position: [number, number, number]
  /** Radio del anillo (por defecto 0.55). */
  radius?: number
}

/** Extrae el valor numérico de un KPI en string ('99.9%' → 99.9, '−30%' → 30,
 * '< 15 min' → 15, '−10h/sem' → 10). Tolerante a prefijos/sufijos. */
export function kpiToValue(raw: string): number {
  const m = raw.replace('−', '-').match(/[-+]?\d+(?:\.\d+)?/)
  if (!m) return 0
  const n = parseFloat(m[0])
  return Number.isFinite(n) ? Math.abs(n) : 0
}

/** Porcentaje de controles aprobados (131/142 → 92.25). */
export function passedControlsPct(passed: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((passed / total) * 1000) / 10
}

/**
 * Contador animado (count-up del audit G3): descompone el display real del
 * dato ('99.9%' · '−30%' · '131/142' · '< 15 min') en prefijo, número
 * objetivo, decimales y sufijo, para animar SOLO el número (0 → target).
 */
export type CounterSpec = {
  /** Texto previo al número ('−', '< ', ''). */
  prefix: string
  /** Valor numérico objetivo (30 · 99.9 · 131). */
  target: number
  /** Decimales del formato original (1 para '99.9%', 0 para '30'). */
  decimals: number
  /** Texto posterior al número ('%', ' min', '/142'). */
  suffix: string
}

export function parseCounter(value: string): CounterSpec | null {
  // El signo menos tipográfico '−' (U+2212) se captura en el prefijo tal cual;
  // el número (m[2]) es puro dígito y no requiere normalización para parseFloat.
  const m = value.match(/^(.*?)(\d+(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const target = parseFloat(m[2])
  if (!Number.isFinite(target)) return null
  const decimals = m[2].includes('.') ? m[2].split('.')[1].length : 0
  return { prefix: m[1], target, decimals, suffix: m[3] }
}

/** Formatea el contador en un progreso [0,1] → '30%' · '99.9%' · '131/142'. */
export function formatCounter(spec: CounterSpec, progress: number): string {
  const v = spec.target * Math.min(1, Math.max(0, progress))
  const body = spec.decimals > 0 ? v.toFixed(spec.decimals) : String(Math.round(v))
  return `${spec.prefix}${body}${spec.suffix}`
}

/** Easing suave para el count-up (SPEC §16 — nunca cambios bruscos). */
export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - x, 3)
}

/**
 * Métricas encarnadas por escena, derivadas de `src/data/`:
 * - S2 (architecture): cumplimiento de marcos (COMPLIANCE_MARCOS).
 * - S3 (data-in-motion): KPIs operacionales (OPERATIONAL_KPIS) + amenazas.
 * - S4 (resilience): controles de auditoría (AUDIT_SUMMARY).
 */
export function buildEmbodiedMetrics(): EmbodiedMetric[] {
  const metrics: EmbodiedMetric[] = []

  // S2 — marcos de cumplimiento (valores reales de COMPLIANCE_MARCOS)
  const marcoPositions: [number, number, number][] = [
    [-2.4, 4.4, -2.0],
    [-0.8, 4.4, -2.0],
    [0.8, 4.4, -2.0],
    [2.4, 4.4, -2.0],
  ]
  COMPLIANCE_MARCOS.forEach((m, i) => {
    metrics.push({
      id: `marco-${i}`,
      scene: 1,
      labelKey: `dc.data.${['iso', 'iec', 'nist', 'gdpr'][i] ?? `marco-${i}`}`,
      value: Math.min(100, m.progress),
      display: `${m.progress}%`,
      color: m.color,
      position: marcoPositions[i] ?? [0, 4.4, -2.0],
      radius: 0.5,
    })
  })

  // S3 — KPIs operacionales (valores reales de OPERATIONAL_KPIS)
  const kpiPositions: [number, number, number][] = [
    [0, 4.6, -1.6],
    [0, 3.4, -1.6],
    [0, 2.2, -1.6],
    [0, 1.0, -1.6],
  ]
  OPERATIONAL_KPIS.forEach((k, i) => {
    metrics.push({
      id: `kpi-${i}`,
      scene: 2,
      labelKey: k.labelKey,
      value: Math.min(100, kpiToValue(k.val)),
      display: k.val,
      color: colors.dataCyan,
      position: kpiPositions[i] ?? [0, 4.6, -1.6],
      radius: 0.45,
    })
  })

  // S4 — auditoría: anillo principal de controles validados (131/142)
  const controlsPct = passedControlsPct(AUDIT_SUMMARY.passed, AUDIT_SUMMARY.totalControls)
  metrics.push({
    id: 'audit-controls',
    scene: 3,
    labelKey: 'audit.stats.controls',
    value: controlsPct,
    display: `${AUDIT_SUMMARY.passed}/${AUDIT_SUMMARY.totalControls}`,
    color: colors.securityAmber,
    position: [0, 0.6, -3.6],
    radius: 0.7,
  })

  // S3 — mini-anillos de severidad de amenazas (THREAT_LEVELS, valores reales;
  // el SIEM está en data-in-motion, escena índice 2). Columna izquierda de S3
  // (la cámara viaja por el corredor a x≈1-2.5 mirando al centro; x=-2.8 queda
  // a la izquierda del frame junto al rack, fuera del eje de streams centrales).
  const threatPositions: [number, number, number][] = [
    [-2.8, 4.2, -1.0],
    [-2.8, 3.2, -1.0],
    [-2.8, 2.2, -1.0],
    [-2.8, 1.2, -1.0],
  ]
  const maxThreat = Math.max(...THREAT_LEVELS.map((t) => t.count), 1)
  THREAT_LEVELS.forEach((t, i) => {
    metrics.push({
      id: `threat-${i}`,
      scene: 2,
      labelKey: `dc.data.threat.${t.label.toLowerCase()}`,
      value: Math.round((t.count / maxThreat) * 100),
      display: String(t.count),
      color: t.color,
      position: threatPositions[i] ?? [-1.7, -0.2, -3.0],
      radius: 0.3,
    })
  })

  return metrics
}
