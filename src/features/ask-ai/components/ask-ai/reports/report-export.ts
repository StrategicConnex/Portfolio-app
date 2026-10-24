import type { ReportSpec } from '@/features/ask-ai/lib/reports/schema'
import { renderReportMarkdown } from '@/features/ask-ai/lib/reports/render-markdown'
import { renderReportJson } from '@/features/ask-ai/lib/reports/render-json'

export type ReportFormat = 'md' | 'json'

export function reportFileName(spec: ReportSpec, format: ReportFormat): string {
  const stamp = spec.generatedAt.slice(0, 10)
  return `informe-${spec.type}-${stamp}.${format}`
}

export function downloadReport(spec: ReportSpec, format: ReportFormat): void {
  const content = format === 'md' ? renderReportMarkdown(spec) : renderReportJson(spec)
  const mime = format === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8'
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = reportFileName(spec, format)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
