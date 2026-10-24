import { NextResponse } from 'next/server'
import { getThreatIntelSnapshot } from '@/features/threat-intel/server'

/**
 * Inteligencia de amenazas en vivo (transporte HTTP).
 *
 * Toda la lógica de datos (fuentes, caché, coalesce, degradación) vive en
 * `src/features/threat-intel/server.ts` — la misma implementación que consume
 * la tool `getThreatIntel` del copilot, de modo que panel, API y chatbot
 * reportan exactamente los mismos eventos (source única de verdad).
 *
 * El JSON de respuesta conserva el contrato público histórico: mismas claves,
 * mismos estados por fuente y mismos TTLs.
 */
export async function GET() {
  const snapshot = await getThreatIntelSnapshot()

  return NextResponse.json({
    events: snapshot.events,
    lastUpdated: snapshot.generatedAt,
    /** 'live' = IPs reales geolocalizadas; 'degraded' = muestra sin atribución. */
    dataSource: snapshot.dataSource,
    geolocatedCount: snapshot.geolocatedCount,
    sources: ['DShield (SANS ISC)', 'CISA KEV', 'ipwho.is (respaldo de geolocalización)'],
    /**
     * Estado real de cada fuente. La interfaz se apoya en esto para no
     * afirmar que hay datos de un feed que no respondió.
     */
    sourceStatus: snapshot.sourceStatus,
    /** TTLs aplicados, para que el comportamiento de caché sea auditable. */
    cacheTtlSeconds: snapshot.cacheTtlSeconds,
  })
}
