import { unstable_cache } from 'next/cache'

/**
 * `unstable_cache` de Next solo funciona dentro de un contexto de petición de
 * Next (route handler, render de App Router). Fuera de él —tests de vitest,
 * scripts, utilidades— lanza:
 *
 *   Invariant: incrementalCache missing in unstable_cache ...
 *
 * El invariante se comprueba ANTES de invocar la función envuelta, así que
 * nunca se repite el trabajo caro: cuando no hay caché disponible se ejecuta
 * directamente y se devuelve el resultado sin caché.
 */
function isMissingIncrementalCache(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('incrementalCache missing') ||
      error.message.includes('Invariant: incrementalCache missing'))
  )
}

export interface CachedDataOptions {
  /** Segundos hasta la revalidación. */
  revalidate?: number
  /** Etiquetas para invalidar la entrada con `revalidateTag`. */
  tags?: string[]
}

/**
 * Envuelve un cálculo caro en la caché de datos de Next.
 *
 * @param fn Cálculo a cachear. No debe leer datos de la petición (headers,
 *           cookies) porque su resultado se comparte entre peticiones.
 * @param keyPart Clave de caché. Debe incluir todo lo que discrimine el
 *                resultado (por ejemplo el nombre del proveedor).
 * @param options `revalidate` en segundos y `tags` para invalidación manual.
 */
export function cachedData<T>(
  fn: () => Promise<T>,
  keyPart: string,
  options: CachedDataOptions = {},
): () => Promise<T> {
  const cached = unstable_cache(fn, [keyPart], {
    revalidate: options.revalidate ?? 300,
    tags: options.tags,
  })

  return async () => {
    try {
      return await cached()
    } catch (error) {
      if (isMissingIncrementalCache(error)) {
        // Sin caché de Next disponible (contexto no-Next): cálculo directo.
        return fn()
      }
      throw error
    }
  }
}
