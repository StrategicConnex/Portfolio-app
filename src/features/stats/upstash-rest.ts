/**
 * Cliente mínimo de la REST API de Upstash Redis, compartido por todos los
 * consumidores (registro de descargas, rate limiting, …).
 *
 * Contrato: **un comando plano por petición** — el endpoint rechaza con 400
 * los pipelines anidados (`[[cmd, …], …]`), así que cada comando viaja solo
 * y el primer elemento es siempre un string.
 */

export function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

/** ¿Está configurado el backend durable de Redis? (para avisos del panel). */
export const isUpstashConfigured = () => upstashConfig() !== null

/**
 * Ejecuta un comando Redis vía REST. Falla con Error si no está configurado
 * o si la respuesta HTTP no es 2xx — los consumidores deciden si tragan el
 * error (fail-open) o lo propagan.
 */
export async function upstashRest(cmd: (string | number)[]): Promise<unknown> {
  const cfg = upstashConfig()
  if (!cfg) throw new Error('upstash no configurado')
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
    cache: 'no-store',
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`upstash HTTP ${res.status}: ${detail}`)
  }
  return res.json()
}
