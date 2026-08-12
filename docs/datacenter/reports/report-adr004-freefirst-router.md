# PHASE — ADR-004 IMPLEMENTADO: FreeFirstRouter en la orquestación del Copilot

**PHASE:** ADR-004 (aprobado) — port del routing FREE-first SC a la capa de orquestación
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12
**Clasificación:** RISKY (SPEC §56, toca `ask-ai/route.ts`) — aprobación explícita del usuario

## IMPLEMENTED

**1 archivo nuevo + swap del seam en la ruta (streamText byte-idéntico).**

- **`src/lib/ask-ai/routing/freeFirst.ts`** (puro, cero deps):
  - `parsePool()` — pool comma-separated retrocompatible; sufijo numérico opcional
    (`model:free:9`) como score, **sin colisión con `:free`** (non-numeric).
  - `routePlan()` — free ordenados por score desc + paid al final (espejo TS de
    `router.route_plan()` del skill; `test_router.py` cubierto).
  - `isTransientError()` — 5xx/429/red/timeout/abort (chequeo estructural
    name/message/status, agnóstico de entorno).
  - `iterateAttempts()` — generador: retry 1× por modelo SOLO si el fallo es
    transitorio (marcado por el caller), presupuesto total de intentos (default 6).
  - `FreeFirstRouter` + `consoleRoutingLogger` — telemetría estructurada por
    intento (model, attempt, isRetry, ok, latencyMs, reason); `log()` nunca tira.
- **`src/app/api/ask-ai/route.ts`** — el seam: `modelsToTry` literal → `router.iterate()`
  con retry/telemetría. El call `streamText({...})` queda **byte-idéntico**
  (CONSTITUTION R4: prompts, memoria, tools, streaming intactos).

## GATE: PASS ✅
- typecheck: 0 errores
- tests: **359/359** (337 previos + 22 nuevos de `freeFirst.test.ts`)
- lint: 0 · build: OK
- Probe runtime (`verify-adr004-router.mjs`, navegador real, server 3100):
  - [1] POST válido → **200 `text/event-stream` + `x-vercel-ai-ui-message-stream: v1`**
    (el router aceptó el primer free sin throw síncrono; no 503)
  - [2] body inválido → **400 JSON** (validación intacta)
  - [3] SSE fluye desde el provider

## HALLAZGO DEL PROBE (condición pre-existente, NO regresión)
El probe contra OpenRouter real (key válida, modelos existentes) reveló que el
**pool por defecto tiene entradas obsoletas** y el primer candidato devuelve vacío:

| Modelo (pool default) | Resultado directo |
|---|---|
| `openrouter/free` (primero) | 200 pero **content vacío** (finish `length`) → el Copilot responde stream sin texto |
| `google/gemma-4-31b-it:free` | 200 + **"¡Hola! 😊"** ✅ responde |
| `inclusionai/ling-3.0-flash:free` | **404 "unavailable for free"** — la entrada ya no es free |

**Impacto:** como el primer modelo "existe" (no tira sync error), el seam nunca
avanza al gemma que sí responde. Esto es **comportamiento previo al ADR-004**
(loop idéntico antes), pero la telemetría nueva lo hace visible.
**Fix recomendado (config, sin código):** scores por env en `OPENROUTER_MODEL_POOL`
(ej. `google/gemma-4-31b-it:free:9,openrouter/free:1,...`) y/o quitar
`inclusionai/ling-3.0-flash:free`. El ADR-004 dejó explícitamente la lista de
modelos fuera de alcance → se reporta, no se cambia sin aprobación.

## DEFERIDOS (ADR-004, explícitamente NO en esta iteración)
- Umbral de calidad (brecha 4) y fallback mid-stream (brecha 6) — tocan el
  contrato de streaming sagrado; requieren su propio ADR.

## ARCHITECTURAL IMPACT: LOW en la superficie (módulo nuevo + seam), RISKY por tocar la ruta (aprobado)
## ACCESSIBILITY / CSP / I18N: SIN CAMBIO · COPILOT: lógica sagrada byte-idéntica
## NEXT: fix de pool por env (decisión del usuario) · probar el retry en 5xx forzado cuando se apruebe el cambio de lista
