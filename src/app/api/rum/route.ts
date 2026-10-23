import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { SITE } from '@/lib/constants'
import { checkRateLimit, getClientId } from '@/lib/rate-limit'
import { reportRouteError } from '@/lib/observability/route-errors'

export const dynamic = 'force-dynamic'

/** Un flush real de vitals.js (vitals + recursos + eventos) ronda 2–8 KB. */
const MAX_BODY_BYTES = 32 * 1024
const REQUESTS_PER_MINUTE = 60
const UPSTREAM_TIMEOUT_MS = 8_000

/**
 * `vitals.js` v2 aplana las métricas (`fid`, `fcp`, `lcp`… con su
 * `*Rating` como hermanas) en vez de usar el objeto `{ value, rating }` de
 * web-vitals. Aceptamos ambos formatos y dejamos el objeto abierto por si el
 * script añade atribución/entries.
 */
const VitalValueSchema = z.union([
  z.number().finite(),
  z.string().max(64),
  z.looseObject({
    value: z.number().finite(),
    rating: z.string().max(32).optional(),
    delta: z.number().finite().optional(),
    id: z.string().max(128).optional(),
    navigationType: z.string().max(32).optional(),
  }),
])

/**
 * Envelope real de `vitals.js` v2 (no el `{ metrics: [...] }` del snippet
 * antiguo): el script agrupa vitals, recursos, errores e interacciones.
 * Validamos la identidad y el tipo de lo que el proxy necesita para enrutar;
 * el resto se conserva al reenviar y el tamaño total ya está acotado arriba.
 */
const RumPayloadSchema = z.looseObject({
  projectId: z.uuid(),
  sessionId: z.string().max(128).optional(),
  timestamp: z.string().max(64).optional(),
  url: z.string().max(2048).optional(),
  path: z.string().max(1024).optional(),
  referrer: z.string().max(2048).optional(),
  vitals: z.record(z.string().max(64), VitalValueSchema).optional(),
  isFinal: z.boolean().optional(),
})

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

/**
 * POST /api/rum — proxy same-origin de la telemetría SCAudit.
 *
 * `vitals.js` corre en el portfolio y hace `fetch('/api/rum')`; así el
 * navegador nunca llama a `scaudit.vercel.app` (sin CORS, sin exponer el
 * origen del producto en `connect-src`) y el servidor controla tamaño,
 * validación y rate limit.
 *
 * SCAudit valida el `Origin` contra `ALLOWED_TELEMETRY_ORIGINS`; el portfolio
 * está en ese allowlist, así que el reenvío server-side se identifica con su
 * propio origen. Es una integración server-to-server, no un bypass del
 * navegador.
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req)

  const limit = await checkRateLimit(clientId, REQUESTS_PER_MINUTE)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil(limit.resetIn / 1000))),
        },
      },
    )
  }

  const mediaType = req.headers
    .get('content-type')
    ?.split(';', 1)[0]
    ?.trim()
    .toLowerCase()
  if (mediaType !== 'application/json') {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 })
  }

  const declaredLength = req.headers.get('content-length')
  if (declaredLength !== null && Number(declaredLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const rawBody = await req.text()
  if (byteLength(rawBody) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const payload = RumPayloadSchema.safeParse(parsed)
  if (!payload.success || payload.data.projectId !== SITE.scaudit.projectId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // `vitals.js` envía `beaconToken: null` cuando el script no define
  // `data-beacon-token`; el upstream valida ese campo como string opcional y
  // rechaza el null. Se omite solo en ese caso (si hay token, se reenvía).
  const forwardedPayload: Record<string, unknown> = { ...payload.data }
  if (forwardedPayload.beaconToken == null) {
    delete forwardedPayload.beaconToken
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // El portfolio está en `ALLOWED_TELEMETRY_ORIGINS` de SCAudit.
    Origin: SITE.url,
    'User-Agent': 'Portfolio-RUM-Proxy/1.0',
  }
  // `getClientId` devuelve la última entrada de x-forwarded-for (la que añade
  // el edge confiable), nunca la primera, que el cliente puede falsificar.
  if (clientId !== 'internal') {
    headers['X-Forwarded-For'] = clientId
  }

  try {
    const upstream = await fetch(SITE.scaudit.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(forwardedPayload),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 300)
      console.warn('[RUM proxy] upstream rejected payload:', upstream.status, detail)
      reportRouteError('/api/rum', new Error(`Upstream ${upstream.status}`), {
        status: 502,
        stage: 'upstream',
      })
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }

    // 204 no lleva cuerpo; NextResponse.json con 204 lanzaría en el constructor.
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    console.error('[RUM proxy] upstream unreachable:', error)
    reportRouteError('/api/rum', error, {
      status: timedOut ? 504 : 503,
      stage: 'upstream',
    })
    return NextResponse.json(
      { error: timedOut ? 'Upstream timeout' : 'Upstream unreachable' },
      { status: timedOut ? 504 : 503 },
    )
  }
}
