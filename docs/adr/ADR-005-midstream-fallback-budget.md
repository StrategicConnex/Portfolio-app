# ADR-005: Fallback mid-stream del AI Copilot con presupuesto

**Status:** ✅ Implemented (aprobado por el usuario, 2026-08-13 — `report-adr005-midstream-fallback.md`)
**Date:** 2026-08-13
**Branch:** `feat/living-datacenter`
**Relates to:** ADR-004 (brecha 6 diferida), CONSTITUTION RULE 04 (AI Copilot sagrado), SPEC §56 (change control), `src/lib/ask-ai/routing/`

---

## Context

El ADR-004 dejó explícitamente **diferida** la brecha 6 de la política SC: los
fallos **mid-stream** del provider. La evidencia real lo confirmó en la misma
sesión: el pool free compartido de Google AI Studio devuelve **429
intermitentes** que ocurren después de que la ruta ya devolvió el stream — el
cliente ve `"An error occurred."` y la generación se corta, sin fallback.

**Cómo funciona el SDK (`ai` v7, verificado en `node_modules`):**
1. `streamText(...)` es **síncrono**: devuelve el resultado al instante.
2. `result.stream` emite `{type:'start'}` **antes** del fetch (scaffolding), y
   después las partes de contenido (`text-delta`, `tool-call`, `reasoning`, …),
   cerrando con `{type:'finish'}`.
3. Un error del provider (ej. 429) llega como **parte `{type:'error', error}`**
   o como **throw** en la lectura del stream, según el path interno del SDK.
4. `toUIMessageStreamResponse()` (usado por la ruta) transforma `result.stream`
   a chunks del protocolo UI (`start`, `text-delta`, `tool-call`/`tool-input-*`,
   `finish`, `error`) y los serializa a SSE (`data: {...}\n\n` … `data: [DONE]`).

Como la ruta devuelve el `Response` en cuanto crea el `streamText`, cualquier
error posterior (429, 5xx, corte de red) ocurre **fuera de alcance del loop de
fallback** — el único loop de la ruta solo captura fallos síncronos, que en la
práctica no existen (el SDK es lazy).

## Decision

**ADOPTAR (opción A, acotada):** envolver el stream en un wrapper
`withMidStreamFallback()` que **absorbe la selección de modelo dentro del
propio stream**, con presupuesto y fronteras explícitas:

1. **Un único loop de intentos** (misma semántica de presupuesto que ADR-004:
   `maxRetriesPerModel = 1` para errores transitorios, `maxTotalAttempts = 6`).
   El loop pre-stream de la ruta desaparece — los intentos síncronos y
   mid-stream se tratan uniformemente.
2. **Fallback pre-contenido:** si un modelo falla **antes de emitir contenido**
   (primer chunk de contenido), se descarta y se pasa al siguiente intento
   (con las reglas de retry transitorio existentes). El `{type:'start'}`
   scaffolding del SDK **no cuenta como contenido**: el `start` del protocolo
   UI se emite **lazy**, una sola vez, al momento en que un modelo confirma
   contenido real → el cliente nunca ve un modelo fallido.
3. **Frontera post-contenido:** si un modelo falla **después** de emitir
   contenido (ya hay `text-delta`/tool-chunks en el cliente), **NO se reinicia**
   — se emite el chunk `{type:'error'}` y se cierra el stream. Reiniciar
   concatenaría parciales duplicados y rompería el contrato de streaming. Esa
   frontera es la acotación deliberada de este ADR (la mitigación para esos
   casos es reintentar el request, que el cliente ya puede hacer).
4. **Contrato del Response intacto:** el stream de chunks resultante se
   envuelve con `createUIMessageStreamResponse({ stream })` (helper público de
   `ai` v7) → **mismos headers, status 200, framing SSE y `[DONE]`** que
   `toUIMessageStreamResponse()` actual. Los chunks se generan con el converter
   oficial `toUIMessageChunk` (mismas opciones por defecto, `sendStart:false`
   porque el `start` lo maneja el wrapper).
5. **`streamText` byte-idéntico:** la llamada al modelo (model, messages,
   tools, maxOutputTokens, system) queda literal, solo cambia el ensamblado de
   la respuesta. R4 (prompts, memoria, tools, protocolo de streaming) intacta.
6. **Telemetría:** misma firma `RoutingAttemptLog` (model, attempt, isRetry,
   ok, latencyMs, reason) + nueva razón `'mid-stream-error'` para fallos
   post-contenido. Entradas por intento consumido, nunca se tira.
7. **Cancelación:** `stop()` del cliente sigue propagándose — el `cancel` del
   stream wrapper cancela el reader del modelo activo.

**Diferido (explícitamente NO en este ADR):**
- **Reinicio post-contenido con dedup de parciales** (re-emitir el texto ya
  enviado y continuar con el siguiente modelo): alto riesgo de duplicación e
  inconsistencia de tool-calls; si se requiere, su propio ADR con test e2e de
  duplicación cero.
- **Umbral de calidad (brecha 4 de ADR-004):** sigue diferido.

## Consequences

**Positivas**
- Los 429/5xx del pool free **dejan de cortar la conversación**: el usuario
  recibe la respuesta de un modelo que sí generó, sin ver modelos fallidos.
- Presupuesto compartido: el fallback mid-stream **no puede** exceder 6
  intentos totales por request (mismo tope que ADR-004).
- Protocolo UI byte-idéntico en el caso feliz (el `start` lazy es el único
  cambio de timing, y ocurre antes del primer contenido — el cliente no
  percibe diferencia).
- El caso "todos los modelos fallaron" pasa de 503 JSON (prácticamente
  inalcanzable, el SDK es lazy) a **200 + chunk `error`** — el cliente ya lo
  maneja vía `onError` y muestra el mensaje de error en el hilo.

**Negativas / riesgos**
- Tocar `ask-ai/route.ts` = cambio RISKY (SPEC §56): se ejecuta con
  aprobación explícita (esta) y plan de revert trivial (volver al loop
  anterior).
- Post-contenido: si el fallo ocurre tras emitir texto, el usuario ve el texto
  parcial + error (frontera acotada y documentada; el botón "reintentar" del
  cliente cubre el camino de recuperación).
- Costo de latencia: cada intento fallido suma su tiempo al TTFT del que
  responde (acotado por presupuesto).

## Validation

- Unit del wrapper (`midStreamFallback.test.ts`): éxito feliz con chunks en
  orden `[start, text-delta…, finish]`; fallback pre-contenido transitorio →
  retry mismo modelo; fallback pre-contenido permanente → siguiente modelo;
  presupuesto agotado → chunk `error` y cierre; **frontera post-contenido** →
  `error` sin reinicio; parte `{type:'error'}` (no throw) tratada igual;
  stream vacío → `start` + cierre limpio; cancelación → reader del modelo
  cancelado.
- Gate completo: typecheck + suite + lint + build.
- Probe runtime no-regresión (server 3100): POST → 200 `text/event-stream` +
  `ui=v1`, SSE fluye, `[DONE]`; 400 intacto. El camino de fallback real (429)
  se valida con units (no se puede forzar un 429 del provider en CI).

---

**Decisión de ejecución:** ✅ IMPLEMENTADA (aprobación explícita del usuario).
`src/lib/ask-ai/routing/midStreamFallback.ts` + swap del seam en
`ask-ai/route.ts` + `midStreamFallback.test.ts`. Reporte de fase:
`docs/datacenter/reports/report-adr005-midstream-fallback.md`.
