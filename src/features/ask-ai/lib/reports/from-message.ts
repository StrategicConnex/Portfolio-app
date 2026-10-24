import type { ReportSpec } from './schema'

/**
 * Part shape actually stored by the chat UI for tool calls:
 * `{ type: 'tool-invocation', toolInvocation: { toolName, state, result } }`.
 * `toolInvocation` is typed loosely so the existing message prop type
 * (`Record<string, unknown>`) stays assignable.
 */
interface PartLike {
  type: string
  toolInvocation?: unknown
}

/** Collect finalized `generateReport` payloads in document order. */
export function extractReportsFromParts(parts: PartLike[]): ReportSpec[] {
  const reports: ReportSpec[] = []
  for (const part of parts) {
    if (part.type !== 'tool-invocation') continue
    const invocation = part.toolInvocation as
      | { toolName?: string; state?: string; result?: unknown }
      | undefined
    if (!invocation || invocation.toolName !== 'generateReport' || invocation.state !== 'result') continue
    const result = invocation.result as { data?: unknown } | undefined
    const data = result?.data as ReportSpec | undefined
    if (data && typeof data === 'object' && Array.isArray((data as ReportSpec).sections)) {
      reports.push(data)
    }
  }
  return reports
}
