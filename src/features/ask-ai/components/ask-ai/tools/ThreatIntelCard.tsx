'use client'

import { ExternalLink, Map, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { ThreatIntelSummary } from '@/features/ask-ai/lib/tools/threat-intel'

/**
 * Verifica en runtime el output de `getThreatIntel` antes de renderizarlo.
 *
 * El contenido de una tool es dato, no contrato: si el modelo, una caché o
 * una conversación guardada traen algo con otra forma, la tarjeta no se
 * dibuja y el chat cae al resultado genérico en vez de mostrar números
 * inventados.
 */
export function isThreatIntelSummary(value: unknown): value is ThreatIntelSummary {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<ThreatIntelSummary>
  const status = s.sourceStatus as
    | { dshield?: unknown; kev?: unknown }
    | undefined
  return (
    typeof s.fetchedAt === 'string' &&
    (s.dataSource === 'live' || s.dataSource === 'degraded') &&
    !!s.totals &&
    typeof s.totals.events === 'number' &&
    typeof s.totals.kev === 'number' &&
    Array.isArray(s.topCountries) &&
    Array.isArray(s.topTypes) &&
    Array.isArray(s.events) &&
    !!status &&
    typeof status.dshield === 'string' &&
    typeof status.kev === 'string'
  )
}

const SEVERITY_CLASS: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/10 text-red-300',
  high: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  medium: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  low: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
}

function severityLabel(severity: string, es: boolean): string {
  const labels: Record<string, [string, string]> = {
    critical: ['CRÍTICA', 'CRITICAL'],
    high: ['ALTA', 'HIGH'],
    medium: ['MEDIA', 'MEDIUM'],
    low: ['BAJA', 'LOW'],
  }
  const pair = labels[severity]
  if (!pair) return severity.toUpperCase()
  return es ? pair[0] : pair[1]
}

/**
 * Tarjeta compacta del feed real del mapa, renderizada dentro del chat.
 *
 * Muestra los datos que devolvió `getThreatIntel` (DShield top talkers + CISA
 * KEV) con su procedencia, el estado de cada fuente y el enlace de cada IP a
 * VirusTotal. Cuando `dataSource` es `degraded` se declara explícitamente: esas
 * filas son la muestra del proveedor, no eventos en vivo.
 */
export function ThreatIntelCard({ summary }: { summary: ThreatIntelSummary }) {
  const { language } = useLanguage()
  const es = language === 'es'
  const degraded = summary.dataSource === 'degraded'
  const visibleEvents = summary.events.slice(0, 3)

  return (
    <section
      aria-label={es ? 'Inteligencia de amenazas en vivo' : 'Live threat intelligence'}
      className="console my-2 rounded-xl border p-4"
      style={{ borderColor: 'var(--border-interactive)', background: 'var(--surface-fill)' }}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--text)' }}>
            {degraded ? (
              <ShieldAlert className="h-3.5 w-3.5 text-yellow-400" aria-hidden />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            )}
            {es ? 'Inteligencia de amenazas' : 'Threat intelligence'}
          </h3>
          <p
            className="mt-0.5 text-[10px] font-mono uppercase tracking-wider"
            style={{ color: 'var(--text-subtle)' }}
          >
            DShield · CISA KEV — {summary.fetchedAt}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
            degraded
              ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {degraded ? (es ? 'DEGRADADO' : 'DEGRADED') : es ? 'EN VIVO' : 'LIVE'}
        </span>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-black/40 p-2">
          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
            {es ? 'Eventos del feed' : 'Feed events'}
          </p>
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {summary.totals.events}
          </p>
        </div>
        <div className="rounded-lg bg-black/40 p-2">
          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
            {es ? 'CVEs explotadas (KEV)' : 'Exploited CVEs (KEV)'}
          </p>
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {summary.totals.kev}
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
        <span style={{ color: 'var(--text-subtle)' }}>
          DShield:{' '}
          <strong style={{ color: 'var(--text)' }}>
            {summary.sourceStatus.dshield === 'live' ? (es ? 'activo' : 'live') : es ? 'sin datos' : 'no data'}
          </strong>
        </span>
        <span style={{ color: 'var(--text-subtle)' }}>
          CISA KEV:{' '}
          <strong style={{ color: 'var(--text)' }}>
            {summary.sourceStatus.kev === 'live' ? (es ? 'activo' : 'live') : es ? 'sin datos' : 'no data'}
          </strong>
        </span>
      </div>

      {summary.topCountries.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
            {es ? 'Orígenes' : 'Origins'}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {summary.topCountries.map((item) => (
              <li
                key={`country-${item.country}`}
                className="rounded-full border px-2 py-0.5 text-[10px]"
                style={{ borderColor: 'var(--border-interactive)', color: 'var(--text)' }}
              >
                {item.country} · {item.count}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.topTypes.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
            {es ? 'Tipos de ataque' : 'Attack types'}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {summary.topTypes.map((item) => (
              <li
                key={`type-${item.type}`}
                className="rounded-full border px-2 py-0.5 text-[10px]"
                style={{ borderColor: 'var(--border-interactive)', color: 'var(--text)' }}
              >
                {item.type} · {item.count}
              </li>
            ))}
          </ul>
        </div>
      )}

      {visibleEvents.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
            {degraded
              ? es
                ? 'Muestra del proveedor (no son eventos en vivo)'
                : 'Provider sample (not live events)'
              : es
                ? 'Eventos reales del feed'
                : 'Real feed events'}
          </p>
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-black/40 px-2 py-1.5"
            >
              <span
                className={`rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                  SEVERITY_CLASS[event.severity] ?? SEVERITY_CLASS.low
                }`}
              >
                {severityLabel(event.severity, es)}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text)' }}>
                {event.type}
              </span>
              {event.originCountry && (
                <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                  · {event.originCountry}
                </span>
              )}
              {event.originIp && (
                <a
                  href={`https://www.virustotal.com/gui/ip-address/${encodeURIComponent(event.originIp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[10px] underline"
                  style={{ color: 'var(--accent, #fb923c)' }}
                  aria-label={
                    es
                      ? `Ver la IP ${event.originIp} en VirusTotal`
                      : `View IP ${event.originIp} on VirusTotal`
                  }
                >
                  {event.originIp}
                  <ExternalLink className="h-2.5 w-2.5" aria-hidden />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href="/cyber-attack-map"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px]"
          style={{ borderColor: 'var(--border-interactive)', color: 'var(--text)' }}
        >
          <Map className="h-3 w-3" aria-hidden />
          {es ? 'Ver en el mapa' : 'View on the map'}
        </a>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
        {es
          ? 'Datos públicos de DShield (SANS ISC) y CISA KEV; no provienen de una red propia y los enlaces externos son solo consulta.'
          : 'Public DShield (SANS ISC) and CISA KEV data; not from a private network, and external links are read-only.'}
      </p>
    </section>
  )
}
