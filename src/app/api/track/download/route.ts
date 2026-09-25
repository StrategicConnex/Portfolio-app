import { NextResponse, type NextRequest } from 'next/server'
import { isTrackableFile, recordDownload, type DownloadEvent } from '@/lib/download-stats'
import { checkRateLimit, getClientId } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Descargas por minuto y cliente (ventana fija Redis/memoria). */
const DOWNLOADS_PER_MIN = 30

/**
 * Registra una descarga de la biblioteca y redirige (307) al archivo estático.
 *
 *   GET /api/track/download?f=/recursos/estandares/IEC_62443_resumen.docx
 *
 * El registro guarda timestamp, archivo, IP real (x-forwarded-for), país
 * (header edge de Vercel/Cloudflare), user-agent y referer. Solo se aceptan
 * rutas saneables bajo `/recursos/` (validación en `isTrackableFile`);
 * cualquier otra cosa responde 404 y no se registra nada.
 */
export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get('f')
  if (!isTrackableFile(file)) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Rate limit por cliente (última entrada de x-forwarded-for, la que añade
  // el edge confiable). Fail-open: si Redis cae, la descarga pasa igual.
  // Un humano no descarga 30 documentos/minuto; un scraper sí.
  const limit = await checkRateLimit(getClientId(req), DOWNLOADS_PER_MIN)
  if (!limit.allowed) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(limit.resetIn / 1000)) },
    })
  }

  const forwarded = req.headers.get('x-forwarded-for')
  const ev: DownloadEvent = {
    file,
    ts: new Date().toISOString(),
    ip: forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown',
    country:
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      undefined,
    ua: req.headers.get('user-agent')?.slice(0, 200) || undefined,
    ref: req.headers.get('referer') || undefined,
  }
  // Nunca falla la descarga por el log: recordDownload traga sus errores.
  await recordDownload(ev)

  return NextResponse.redirect(new URL(file, req.url), 307)
}
