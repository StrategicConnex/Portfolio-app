# PHASE — ADR-005 IMPLEMENTADO: Fallback mid-stream del Copilot con presupuesto

**PHASE:** ADR-005 (aprobado) — brecha 6 del ADR-004: fallback cuando el provider falla a mitad del streaming
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-13
**Clasificación:** RISKY (SPEC §56, toca `ask-ai/route.ts`) — aprobación explícita del usuario

## IMPLEMENTED

**1 módulo nuevo + swap del seam en la ruta (streamText byte-idéntico).**

- **`src/lib/ask-ai/routing/midStreamFallback.ts`** (puro, solo tipos de `ai`):
  - `withMidStreamFallback()` — ReadableStream de chunks UI que **corre el loop
    de intentos dentro del stream** (misma semántica de presupuesto del
    ADR-004: `maxRetriesPerModel = 1`, `maxTotalAttempts = 6`).
  - **Fallback pre-contenido:** si el modelo falla antes de emitir contenido
    (parte `{type:'error'}` o throw al leer), se descarta y se pasa al
    siguiente intento con las reglas de retry transitorio. El `{type:'start'}`
    scaffolding del SDK **no cuenta como contenido**.
  - **`start` lazy único:** el chunk `start` del protocolo UI se emite una sola
    vez, cuando un modelo confirma contenido real → el cliente nunca ve un
    modelo fallido (un solo `start`, atribuido al modelo que responde).
  - **Frontera post-contenido (acotada):** si falla tras emitir contenido →
    chunk `{type:'error'}` y fin; **no se reinicia** (evita parciales
    duplicados/concatenados). Documentada en el ADR.
  - **Cancelación:** el `cancel` del wrapper cancela el reader del modelo
    activo (`stop()` del cliente sigue propagándose).
  - Telemetría por intento con `errorText` diagnóstico (nunca al cliente).
- **`src/app/api/ask-ai/route.ts`** — el loop pre-stream desaparece; el seam
  arma el stream con `withMidStreamFallback` y lo envuelve con
  `createUIMessageStreamResponse({ stream })` (helper público de `ai` v7) →
  **mismos headers/status/SSE/`[DONE]`** que `toUIMessageStreamResponse()`.
  El call `streamText({...})` queda **byte-idéntico** (CONSTITUTION R4).
- **`src/lib/ask-ai/routing/freeFirst.ts`** — razón `'mid-stream-error'`
  añadida a `FallbackReason` + `errorText?` en `RoutingAttemptLog` + getters
  de presupuesto + clasificador reconoce el wrapper de retry interno del SDK
  (`/failed after \d+ attempts/i` → transitorio; los 400 nunca disparan retry
  interno, así que el wrapper es señal de transitoriedad).

## GATE: PASS ✅
- typecheck: 0 errores
- tests: **372/372** (359 previos + 13 nuevos: 12 `midStreamFallback.test.ts` + 1 clasificador)
- lint: 0 · build: OK
- Probe runtime e2e (`verify-adr004-e2e.mjs`, server 3100, build real):

**El probe ejecutó el fallback mid-stream completo contra OpenRouter real:**

| Intento | Modelo | Resultado | Razón |
|---|---|---|---|
| 1 | `google/gemma-4-31b-it:free` | ok:false (7.7s) | `transient` — SDK "Failed after 3 attempts" (429 upstream) |
| 2 | `google/gemma-4-31b-it:free` (retry) | ok:false (12.5s) | `transient-retry-exhausted` |
| 3 | `google/gemma-4-26b-a4b-it:free` | **ok:true (2.2s)** | `none` → commit + stream completo |

Respuesta al cliente: **200 `text/event-stream` + `ui=v1`**, un solo `start`,
`text-delta` con texto real (`"datac"` + `"enter"` = "datacenter"), `[DONE]`.
**El cliente nunca vio el modelo fallido** — exactamente el bug documentado en
el addendum del ADR-004 ("el seam no puede hacer fallback: el cliente ve 'An
error occurred.'").

## CAMBIO DE COMPORTAMIENTO (documentado)
- Caso "todos los modelos fallan" (presupuesto agotado): ahora **200 + chunk
  `error`** en el stream (el cliente lo maneja vía `onError`) en lugar del 503
  JSON anterior — que era prácticamente inalcanzable (el SDK es lazy; los
  fallos reales ocurrían mid-stream, fuera del loop).
- Latencia: cada intento fallido suma al TTFT del que responde (acotado por
  presupuesto, peor caso ~6 intentos bajo `maxDuration = 30s`).

## ARCHITECTURAL IMPACT: LOW en la superficie (módulo nuevo + seam), RISKY por tocar la ruta (aprobado)
## ACCESSIBILITY / CSP / I18N: SIN CAMBIO · COPILOT: lógica sagrada byte-idéntica
## NEXT: (opcional) reinicio post-contenido con dedup de parciales (ADR propio) · umbral de calidad (brecha 4) · e2e del camino 429 forzado en staging
