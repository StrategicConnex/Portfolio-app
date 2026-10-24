import { NextResponse } from 'next/server'
import { getSiemFeedData } from '@/lib/siem-feed'

/**
 * Feed SIEM agregado en tiempo real (Abuse.ch Feodo Tracker + DShield/SANS ISC).
 *
 * La agregación vive en `src/lib/siem-feed.ts` — este handler es solo el
 * transporte. El dashboard del portfolio y la herramienta `querySiem` del
 * copilot leen el mismo payload, así que panel, API y chatbot reportan los
 * mismos datos (source única de verdad).
 *
 * Caché: `getSiemFeedData` está envuelto en `cachedData` (revalidate 30 s) y
 * además cada proveedor tiene su propio `next.revalidate` (Feodo 60 s,
 * DShield 300 s), de modo que el sondeo del dashboard cada 10 s por visitante
 * no multiplica el tráfico hacia Abuse.ch ni hacia SANS.
 */

/** Presupuesto total de la ruta: si los feeds no responden a tiempo se degrada rápido. */
const TOTAL_BUDGET_MS = 10_000

function degraded() {
  return NextResponse.json({
    logs: [],
    lastUpdated: new Date().toISOString(),
    source: 'Agregación en tiempo real: Abuse.ch Feodo Tracker + DShield (SANS ISC)',
    usingLiveData: false,
    summary: { critical: 0, alert: 0, warn: 0, info: 0, c2Unique: 0, targetedPorts: 0, scanReports: 0 },
    attackers: [],
    ports: [],
    malware: [],
    // Ninguna fuente aportó datos en ESTA respuesta. Se declara, no se inventa.
    feedsStatus: { feodo: 'unavailable' as const, dshield: 'unavailable' as const },
    cacheTtlSeconds: { feodo: 60, dshield: 300, payload: 30 },
  })
}

export async function GET() {
  let budgetTimer: ReturnType<typeof setTimeout> | undefined
  const budget = new Promise<never>((_, reject) => {
    budgetTimer = setTimeout(
      () => reject(new Error('siem-feed: time budget exceeded')),
      TOTAL_BUDGET_MS,
    )
  })

  try {
    const data = await Promise.race([getSiemFeedData(), budget])
    return NextResponse.json(data)
  } catch {
    // Feed lento o caído: degradar rápido dejando claro que no hubo datos,
    // sin fingir un stream simulado.
    return degraded()
  } finally {
    if (budgetTimer) clearTimeout(budgetTimer)
  }
}
