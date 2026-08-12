# ADR-004: Router FREE-first del SC Platform en la orquestación del AI Copilot

**Status:** ✅ Implemented (aprobado por el usuario, 2026-08-12 — `report-adr004-freefirst-router.md`)
**Status previo:** Proposed (requiere aprobación explícita para ejecutar — clasificado RISKY, SPEC §56)
**Date:** 2026-08-12
**Branch:** `feat/living-datacenter`
**Relates to:** CONSTITUTION RULE 04 (AI Copilot sagrado), SPEC §56 (change control), skill `.agents/sc-platform-universal-ai-skill` (orchestrator/router.py, docs/ROUTING_POLICY.md), ADR-002 (CSP/backend)

---

## Context

El skill vendorizado `SC Platform Universal AI v1.0` trae un `FreeFirstRouter`
(`orchestrator/router.py`) y una política de routing (`docs/ROUTING_POLICY.md`):
FREE-first con ranking por `score`, retry de fallos transitorios, fallback pago
solo tras fallo free o umbral de calidad, y registro de modelo/latencia/éxito/
razón de fallback.

La pregunta: ¿integrar esa política en la **capa de orquestación** del AI Copilot
**sin tocar su lógica sagrada** (CONSTITUTION R4)?

**Hallazgo clave de la inspección:** el proyecto **ya implementa routing
FREE-first** en `src/app/api/ask-ai/route.ts` (el `chat/route.ts` fue movido por
el otro thread): pool de modelos `:free` (`OPENROUTER_MODEL_POOL`, 4 defaults),
fallback pago (`OPENROUTER_MODEL`, `google/gemini-3.6-flash`), y un loop que
recorre el pool en orden. O sea: la **intención** de la política SC ya existe;
la evaluación es sobre las **brechas** entre la implementación actual y la
política completa del skill.

### Brechas (actual vs ROUTING_POLICY SC)

| # | Política SC | Implementación actual | Brecha |
|---|---|---|---|
| 1 | Candidato free con mayor `score` primero | Pool en orden de inserción (sin score) | **Menor** — el orden del env ya es prioridad implícita; falta el `score` |
| 2 | Retry de fallos transitorios dentro de presupuesto | Sin retry: un fallo → siguiente modelo | **Media** — un hiccup de red salta de modelo sin reintentar |
| 3 | Recorrer candidatos free | ✅ loop sobre el pool | — |
| 4 | Fallback pago solo tras fallo free **o umbral de calidad** | Fallback solo tras fallo duro | **Alta** — no hay evaluación de calidad; el pago nunca se usa si el free responde mal |
| 5 | Registrar modelo, latencia, éxito y razón de fallback | Solo `console.warn` en fallo | **Media** — sin observabilidad estructurada |
| — | Fallos **mid-stream** | El loop solo captura errores pre-stream (`streamText` devuelve el stream de inmediato) | **Alta (UX)** — un modelo que falla a mitad del streaming deja al usuario con stream roto, sin fallback |

### Frontera sagrada (análisis R4)

Lo sagrado: prompts, memoria, tools, streaming (`toUIMessageStreamResponse`),
estado, eventos, comportamiento. **La selección de modelo es la costura de
orquestación** entre el request y el provider — no la lógica del Copilot.
Integrar ahí es aditivo si se hace como **módulo nuevo** que la ruta importa
(swap de ~2 líneas en `modelsToTry`), dejando prompts/memoria/tools/streaming
byte-idénticos. Aun así, tocar `ask-ai/route.ts` es clasificado **RISKY** por
SPEC §56 → requiere explicación y aprobación antes de ejecutar.

## Decision

**ADOPTAR (opción A, alcance limitado):** portar la política SC a un módulo TS
puro `src/lib/ask-ai/routing/freeFirst.ts` (espejo de `router.py` + pasos 2–5 de
la política), consumido por la ruta en la construcción de `modelsToTry`:

1. `FreeFirstRouter` con `Candidate { provider, model, score }` y
   `routePlan()` = free ordenados por score desc + paid (espejo exacto de
   `router.py`, en TS).
2. **Retry transitorio**: 1 reintento por modelo ante errores clasificables
   (5xx/red/timeout), dentro de un presupuesto de intentos totales (p. ej. ≤ 6).
3. **Observabilidad**: registro estructurado por intento — modelo, latencia,
   éxito, razón de fallback — a `console` + store (PostHog si ya está activo;
   sin tocar la observabilidad del sitio).
4. **Scores** configurables por env (formato `model:score` con retrocompat
   con el formato actual separado por comas).

**DEFERIDO (explícitamente NO en esta iteración):**
- **Umbral de calidad (brecha 4):** evaluar calidad de respuesta mid-stream es
  complejo, toca el contrato de streaming y sube el riesgo de regresión en la
  UX del Copilot. Se documenta como mejora futura con su propio ADR.
- **Fallback mid-stream (brecha 6):** requiere wrap del stream (errores del
  `UIMessageStreamResponse`) — arquitectónicamente invasivo sobre la parte
  sagrada; se documenta, no se ejecuta.
- **Sidecar Python (opción B):** el router es una lista ordenada estática —
  un microservicio Python para eso agrega infra/red sin beneficio. Rechazado.
- **Cambiar la lista de modelos**: la pool actual (`gemma-4-*`, `ling-3.0`) es
  más actual que `models.yaml` del skill (`llama-3.3`, `qwen3-32b`). Se mantiene
  la del proyecto; el skill queda como referencia de política, no de catálogo.

## Consequences

**Positivas**
- Cierra brechas 1, 2, 3, 5 de la política SC con un módulo puro, testeable y
  reversible (el revert es quitar el import y volver al array literal).
- Observabilidad del routing: permite responder "¿cuánto cuesta realmente el
  Copilot y qué modelos fallan?" con datos, no suposiciones.
- Sin cambio de prompts, memoria, tools ni formato de streaming → la regla R4
  se respeta en el contrato funcional.

**Negativas / riesgos**
- Tocar `ask-ai/route.ts` aunque sea en 2 líneas = cambio RISKY (SPEC §56):
  se ejecuta solo con aprobación explícita y con plan de revert.
- El retry agrega latencia máxima +1 intento ante fallos transitorios (acotado
  por el presupuesto de intentos).
- Cambiar el formato de env (`OPENROUTER_MODEL_POOL`) rompe config existente →
  se mantiene retrocompat (score opcional).
- Depender de la clasificación de "transitorio" (5xx vs 4xx) para no gastar
  intentos en errores permanentes.

## Validation

- `npm run typecheck` + `vitest run src/lib/ask-ai src/app/api/ask-ai` + lint + build.
- Unit del router: `routePlan()` ordena por score; presupuesto de intentos;
  clasificación de errores transitorios (espejo de `tests/test_router.py`).
- Probe runtime con fallos forzados (model pool inválido) verificando:
  orden de intentos, 1 retry en 5xx, fallback pago solo tras agotar free,
  y entradas de telemetría con razón de fallback.
- Gate de no-regresión del Copilot: chat normal end-to-end (streaming, tools,
  memoria) idéntico antes/después.

---

**Decisión de ejecución:** ✅ IMPLEMENTADA (aprobación explícita del usuario).
`src/lib/ask-ai/routing/freeFirst.ts` + swap del seam en `ask-ai/route.ts`
(streamText byte-idéntico) + `freeFirst.test.ts` (22 tests). Reporte de fase:
`docs/datacenter/reports/report-adr004-freefirst-router.md`.
**Hallazgo del probe (pre-existente):** el pool default tiene entradas obsoletas
(`openrouter/free` devuelve content vacío; `inclusionai/ling-3.0-flash:free` ya
no es free → 404). Fix recomendado por env (scores/reorder), fuera del alcance
de este ADR (la lista de modelos se mantiene — ver Consequences).
