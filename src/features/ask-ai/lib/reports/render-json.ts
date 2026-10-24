import type { ReportSpec } from './schema'

export function renderReportJson(spec: ReportSpec): string {
  return JSON.stringify(spec, null, 2)
}
