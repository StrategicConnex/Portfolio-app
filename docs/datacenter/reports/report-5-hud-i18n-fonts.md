# Report — Fase 5: HUD + i18n + fuentes self-hosted

**Fecha:** 2026-08-10 · **GATE: ✅ PASS** · **Escalamiento:** ninguno requerido (agregar claves i18n NO escala — matriz E6; `next/font` es built-in — E5 no aplica)

## IMPLEMENTED

- **`HudLabel`** (`src/components/datacenter/HudLabel.tsx`): label diegético basado en `drei <Html transform distanceFactor>` (SPEC §13) — traducible vía `t()` de `LanguageContext`, anclado a posición 3D, con variantes `scene` / `node` / `status`, colores de los tokens semánticos y **cero texto hardcoded**.
- **`activeScene` store** (`src/lib/activeScene.ts`): escena activa (0–4) compartida entre el frame loop y los HUDs — el frame loop escribe un número (sin estado React), `HudLabel` re-renderiza solo al cruzar de escena (`useSyncExternalStore`). Mismo patrón de módulo-store que `useWebGLContextManager`.
- **i18n** (`src/context/translations/datacenter.ts` + import en `index.ts`): 21 claves ES/EN (7 labels de escena/narrativa, 4 status, 10 nodos Purdue) + `NODE_LABEL_KEYS` (label de `mindmap.ts` → clave i18n). **Agregar claves NO tocó `LanguageContext`** (escalamiento E6 no aplicó).
- **HUDs por escena**: Escena 1 (SYSTEM INITIALIZING / NETWORK ONLINE / AI CORE READY), Escena 2 (CORE ARCHITECTURE + 10 labels de nodos en `PurdueHologram` vía i18n), Escena 3 (DATA IN MOTION), Escena 4 (RESILIENCE & DEPTH), Escena 5 (CONNECTION POINT).
- **Fuentes self-hosted** (`src/app/fonts.ts` + `layout.tsx` + `globals.css`): Inter (`--font-sans`), Space Grotesk (`--font-heading`, headings h1–h3), JetBrains Mono (`--font-mono`, `.mono`/HUD). 17 woff2 en `/_next/static/media/`.

## FILES CREATED

- `src/lib/activeScene.ts` + test
- `src/context/translations/datacenter.ts` + test de paridad
- `src/components/datacenter/HudLabel.tsx`
- `src/app/fonts.ts`

## FILES MODIFIED

- `src/context/translations/index.ts` (registro del módulo `datacenter`)
- `src/components/datacenter/DatacenterScene.tsx` (HudLabels por escena)
- `src/components/datacenter/PurdueHologram.tsx` (labels de nodos con i18n)
- `src/components/datacenter/DatacenterCamera.tsx` (publica escena activa + invalidate al cruzar sección)
- `src/hooks/useSectionProgress.ts` (**fix de heurística** — ver abajo) + test de regresión
- `src/app/layout.tsx` (className del body: variables de fuente — sin tocar metadata/JSON-LD)
- `src/app/globals.css` (tokens tipográficos)

## DEPENDENCIES

- **Ninguna nueva** (`next/font/google` es built-in de Next 16).

## ARCHITECTURAL IMPACT

**MEDIUM** — store de módulo compartido (patrón ya existente) + fix del sistema de cámara (Fase 2).

## FIX POST-GATE (autocrítica CONSTITUTION §11) — Bug crítico en `useSectionProgress`

**Problema:** los HUDs quedaban congelados en la Escena 1 sin importar el scroll; la cámara **nunca viajó por las escenas** desde la Fase 2.
**Causa raíz:** la heurística de sección activa usaba `p = clamp((centro − top)/height)` y elegía el máximo. Al scrollear, toda sección arriba del centro alcanzaba `p = 1` y, como la primera (`#home`) lo alcanzaba primero, **nunca podía ser superada** (`p > bestProgress` con bestProgress ya = 1). Verificado con logs temporales: `measure best= 0 section= 1.00` tras scrollear a `#contacto`.
**Fix:** sección activa = la de **punto medio más cercano al centro del viewport** (min-dist), con progreso = `(centro − top)/height`. Estable y sin flicker (secciones altas).
**Resultado:** las 5 escenas se activan correctamente (verificado en runtime con los HUDs), test de regresión agregado (`useSectionProgress.test.ts`).

## PERFORMANCE (deltas vs baseline Fase 0)

| Métrica | Baseline | Fase 5 | Delta |
| --- | --- | --- | --- |
| FPS (dev, desktop) | 60 | 60 | 0 |
| Bundle `.next/static` | 19 MB | 20 MB | +1 MB (3 familias de fuentes woff2, lazy por subset) |
| Requests de fuentes externas | n/a | **0** (solo `/_next/static/media/`) | ✓ |
| Contextos WebGL | 0 | 1 | ✓ (política ADR-003) |
| Re-renders HUD | n/a | solo al cruzar de escena (useSyncExternalStore) | ✓ |

## ACCESSIBILITY

- HUDs dentro del canvas `aria-hidden` — nunca anunciados por screen readers (el contenido real sigue en DOM). Sin interacción: `pointer-events: none`.
- `frameloop="demand"` + invalidation por escena: sin trabajo GPU en reposo.
- Contraste: labels con fondo oscuro translúcido + borde del color semántico.

## SECURITY/CSP

- **CSP sin cambios** (`font-src 'self' data:`): `next/font` sirve same-origin. Verificado por `performance.getEntriesByType('resource')`: orígenes de fuentes = solo el origin local. Sin requests externas nuevas (solo RUM pre-existente de SCAudit).

## I18N

- **ES y EN verificados en runtime**: cambiar idioma re-renderiza los HUDs sin reconstruir la escena ni reiniciar la cámara (claves resueltas en `HudLabel`). Paridad garantizada por test (key sets idénticos + sin key-echo + `NODE_LABEL_KEYS` cubre los 10 nodos).

## COPILOT

**UNCHANGED** — sin modificaciones en esta fase.

## TESTS

- `npm run typecheck` → PASS · `npm test` → **265 passed** (31 archivos, +8: paridad 4, activeScene 3, regresión 1)
- `npx eslint` (archivos nuevos/modificados) → 0 errores · `npm run build` → PASS

## VERIFICACIÓN RUNTIME

- Las 5 escenas activan su HUD correctamente: boot (3 labels) → architecture (CORE ARCHITECTURE + 10 nodos Purdue) → data-in-motion (DATA IN MOTION) → resilience (RESILIENCE & DEPTH) → connection (CONNECTION POINT).
- ES↔EN: HUDs cambian de idioma al instante; hero y contenido DOM intactos (invariante R1).
- Fuentes aplicadas: body=Inter, h1=Space Grotesk, HUD=JetBrains Mono (computed styles verificados).
- Red: 6 requests externas = solo SCAudit RUM pre-existente; cero de fuentes/3D.

## DECISION ENGINE (impacto MEDIUM — visibilidad del HUD)

**Problema:** los HUDs deben aparecer/desaparecer según la escena activa sin re-renders por scroll.

| Alternativa | Complejidad | Re-renders | Frame loop | Veredicto |
| --- | --- | --- | --- | --- |
| A. `useState` por componente + props desde el canvas | Media | Por scroll (viola SPEC §22) | n/a | ✗ |
| B. Store de módulo + `useSyncExternalStore` | Baja (~30 líneas) | Solo al cruzar escena | 1 asignación idempotente | ✅ |
| C. CSS `visibility` con clases por escena | Baja | n/a | — | ✗ (no escala a labels dinámicos/i18n) |

**DECISIÓN:** B — patrón ya usado en el repo (`useWebGLContextManager`), cero estado React en el frame loop, idempotente.

## GATE

**PASS** — typecheck ✅ · 265 tests ✅ · lint ✅ · build ✅ · 5 escenas con HUD verificado · ES/EN sin romper escena · fuentes self-hosted sin requests externas.

## NEXT PHASE

**Fase 7 — Copilot visual shell + event bus** (report-7-copilot-shell.md). Fase 6 (GLB) se salta por default (SPEC §12: procedural alcanza).
