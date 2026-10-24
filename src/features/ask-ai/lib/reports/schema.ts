import { z } from 'zod'
import type { DataMode, Provenance } from '@/features/ask-ai/lib/tools/result'

export const REPORT_TYPES = [
  'threat-landscape',
  'executive-brief',
  'library-brief',
  'domain-diagnostic',
  'compliance-reference',
  'tech-comparison',
] as const

export type ReportType = (typeof REPORT_TYPES)[number]
export type ReportLocale = 'es' | 'en'

const modeSchema = z.enum(['live', 'static', 'demo'])

export const provenanceSchema = z.object({
  source: z.string().min(1).max(120),
  mode: modeSchema,
  fetchedAt: z.string().datetime().optional(),
})

export const evidenceSchema = provenanceSchema.extend({
  url: z.string().url().max(2048).optional(),
})

export const reportSectionSchema = z.object({
  heading: z.string().min(1).max(120),
  body: z.string().min(1).max(4000),
  evidence: z.array(evidenceSchema).max(20).default([]),
})

export const reportInputSchema = z
  .object({
    type: z.enum(REPORT_TYPES),
    title: z.string().max(120).optional(),
    summary: z.string().min(1).max(600),
    sections: z.array(reportSectionSchema).min(1).max(8),
  })
  .strict()

export const reportSpecSchema = reportInputSchema.extend({
  locale: z.enum(['es', 'en']),
  generatedAt: z.string().datetime(),
  provenance: z.array(provenanceSchema).max(20),
  disclaimers: z.array(z.string().min(1)).min(1).max(5),
})

/**
 * Lado de ENTRADA del contrato: `z.input` (los `default` del schema —p. ej.
 * `evidence: []`— los completa `finalizeReportSpec` vía `reportSpecSchema.parse`).
 * `ReportSpec = z.infer` sí es la salida ya con defaults aplicados.
 */
export type ReportInput = z.input<typeof reportInputSchema>
export type ReportSpec = z.infer<typeof reportSpecSchema>

const DISCLAIMERS: Record<ReportType, Record<ReportLocale, string[]>> = {
  'threat-landscape': {
    es: ['Datos del feed público DShield/CISA KEV; no provienen de una red propia.', 'Los destinos de los arcos pueden ser ilustrativos.'],
    en: ['Data from the public DShield/CISA KEV feed; not from an owned network.', 'Arc destinations may be illustrative.'],
  },
  'executive-brief': {
    es: ['Resumen generado a partir del contenido publicado del portfolio; sin métricas no verificadas.'],
    en: ['Summary generated from the portfolio’s published content; no unverified metrics.'],
  },
  'library-brief': {
    es: ['Resumen de documentos descargables de la biblioteca; no constituye asesoría.'],
    en: ['Summary of downloadable library documents; not professional advice.'],
  },
  'domain-diagnostic': {
    es: ['Análisis puntual de datos observados en el momento indicado; no es una auditoría.'],
    en: ['Point-in-time analysis of data observed at the indicated time; not an audit.'],
  },
  'compliance-reference': {
    es: ['Marco de referencia (IEC 62443 / NIST CSF / ISO 27001); no es una auditoría de un cliente.'],
    en: ['Reference framework (IEC 62443 / NIST CSF / ISO 27001); not a client audit.'],
  },
  'tech-comparison': {
    es: ['Datos observados en el momento indicado; pueden variar.'],
    en: ['Data observed at the indicated time; it may change.'],
  },
}

function dedupeProvenance(provenance: Provenance[]): Provenance[] {
  const seen = new Set<string>()
  return provenance.filter((entry) => {
    const key = `${entry.source}|${entry.mode}|${entry.fetchedAt ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function finalizeReportSpec(
  input: ReportInput,
  ctx: { locale: ReportLocale; generatedAt: string },
): ReportSpec {
  const evidence = input.sections.flatMap((section) => section.evidence ?? [])
  const provenance: Provenance[] = dedupeProvenance(
    evidence.map(({ source, mode, fetchedAt }) => ({ source, mode, fetchedAt })),
  )

  return reportSpecSchema.parse({
    ...input,
    locale: ctx.locale,
    generatedAt: ctx.generatedAt,
    provenance,
    disclaimers: DISCLAIMERS[input.type][ctx.locale],
  })
}

export type { DataMode, Provenance }
