import type { ReportSpec } from './schema'

export function renderReportMarkdown(spec: ReportSpec): string {
  const lines: string[] = [
    `# ${spec.title ?? spec.type}`,
    '',
    `**${spec.locale === 'es' ? 'Generado' : 'Generated'}:** ${spec.generatedAt}`,
    `**${spec.locale === 'es' ? 'Tipo' : 'Type'}:** ${spec.type}`,
    '',
    spec.summary,
    '',
  ]

  for (const section of spec.sections) {
    lines.push(`## ${section.heading}`, '', section.body, '')
    if (section.evidence.length > 0) {
      lines.push(`**${spec.locale === 'es' ? 'Evidencia' : 'Evidence'}:**`)
      for (const item of section.evidence) {
        const date = item.fetchedAt ? ` — ${item.fetchedAt}` : ''
        lines.push(`- ${item.source} (${item.mode})${date}`)
      }
      lines.push('')
    }
  }

  lines.push(`---`, '')
  lines.push(`**${spec.locale === 'es' ? 'Procedencia' : 'Provenance'}:** ${spec.provenance.map((p) => `${p.source} (${p.mode})`).join(', ') || '—'}`, '')
  for (const disclaimer of spec.disclaimers) lines.push(`> ${disclaimer}`)
  return lines.join('\n')
}
