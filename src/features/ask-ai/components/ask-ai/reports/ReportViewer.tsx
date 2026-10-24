'use client'

import { Download, FileJson, FileText } from 'lucide-react'
import type { ReportSpec } from '@/features/ask-ai/lib/reports/schema'
import { downloadReport } from './report-export'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Renders a finalized `generateReport` payload inside the conversation:
 * title, timestamp + provenance, summary, structured sections with evidence,
 * export buttons (Markdown/JSON now, PDF disabled) and the honesty
 * disclaimers.
 */
export function ReportViewer({ spec }: { spec: ReportSpec }) {
  const { language } = useLanguage()
  const es = language === 'es'
  const heading = spec.title ?? spec.type

  return (
    <section
      aria-label={es ? 'Informe generado' : 'Generated report'}
      className="console my-3 rounded-xl border p-4"
      style={{ borderColor: 'var(--border-interactive)', background: 'var(--surface-fill)' }}
    >
      <header className="mb-3">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{heading}</h3>
        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
          {spec.generatedAt} · {spec.provenance.map((p) => `${p.source} (${p.mode})`).join(' · ') || '—'}
        </p>
      </header>

      <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{spec.summary}</p>

      <div className="space-y-3">
        {spec.sections.map((section, index) => (
          <div key={`${section.heading}-${index}`} className="rounded-lg bg-black/40 p-3">
            <h4 className="mb-1 text-xs font-semibold" style={{ color: 'var(--text)' }}>{section.heading}</h4>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text)' }}>{section.body}</p>
            {section.evidence.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                {section.evidence.map((evidence, evidenceIndex) => (
                  <li key={`${evidence.source}-${evidenceIndex}`}>
                    · {evidence.source} ({evidence.mode}){evidence.fetchedAt ? ` — ${evidence.fetchedAt}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadReport(spec, 'md')}
          aria-label="Descargar Markdown"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
          style={{ borderColor: 'var(--border-interactive)', color: 'var(--text)' }}
        >
          <FileText className="h-3.5 w-3.5" /> Markdown
        </button>
        <button
          type="button"
          onClick={() => downloadReport(spec, 'json')}
          aria-label="Descargar JSON"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
          style={{ borderColor: 'var(--border-interactive)', color: 'var(--text)' }}
        >
          <FileJson className="h-3.5 w-3.5" /> JSON
        </button>
        <button
          type="button"
          disabled
          aria-label="Descargar PDF (próximamente)"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs opacity-50"
          style={{ borderColor: 'var(--border-interactive)', color: 'var(--text)' }}
        >
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
      </div>

      <ul className="mt-3 space-y-1 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
        {spec.disclaimers.map((disclaimer) => (
          <li key={disclaimer}>· {disclaimer}</li>
        ))}
      </ul>
    </section>
  )
}
