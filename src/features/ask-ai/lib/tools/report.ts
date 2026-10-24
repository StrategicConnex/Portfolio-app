import {
  finalizeReportSpec,
  reportInputSchema,
  type ReportInput,
  type ReportSpec,
} from '@/features/ask-ai/lib/reports/schema'
import type { ToolResult } from './result'

export interface GenerateReportTool {
  description: string
  inputSchema: typeof reportInputSchema
  execute: (input: ReportInput, options?: unknown) => Promise<ToolResult<ReportSpec>>
}

export function createGenerateReportTool(locale: 'es' | 'en'): GenerateReportTool {
  return {
    description:
      'Generate a structured report (Markdown + JSON export). Types: threat-landscape, executive-brief, library-brief, domain-diagnostic, compliance-reference, tech-comparison. Every section must cite evidence (RAG source or tool result); never invent metrics. Do not set generatedAt/provenance yourself — the server adds them.',
    inputSchema: reportInputSchema,
    execute: async (input: ReportInput): Promise<ToolResult<ReportSpec>> => {
      const spec = finalizeReportSpec(input, {
        locale,
        generatedAt: new Date().toISOString(),
      })
      return {
        data: spec,
        provenance: spec.provenance,
        warnings: spec.sections.some((section) => (section.evidence ?? []).length === 0)
          ? ['Some sections have no evidence; mark them as unavailable in the body.']
          : undefined,
      }
    },
  }
}
