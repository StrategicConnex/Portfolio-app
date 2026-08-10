# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`Fase 2 — Camera system`

## STATUS

`PASS`

## IMPLEMENTED

- `src/lib/datacenter.tokens.ts`: tokens centralizados (SPEC §3) — colores, fog, cámara (lambda 3.2, maxDelta 0.1, settle 650 ms).
- `src/lib/scenes.ts`: config data-driven de las 5 escenas (SPEC §5, §20) con IDs reales de secciones, waypoints entry/mid/exit por escena, fog por escena y `visualEvents`. Helpers puros: `resolveSceneForSection`, `computeSceneProgress`, `interpolateWaypoints`.
- `src/hooks/useSectionProgress.ts` (SPEC §21): geometría DOM real (sin alturas hardcoded), un único listener pasivo rAF-throttled, estado mutable en ref para el bucle de cámara; `active` solo cambia al cruzar sección.
- `src/hooks/useDatacenterCamera.ts` (SPEC §6): easing exponencial (nunca cortes), sin allocations dentro del frame (vectores preasignados), fov y fog interpolados.
- `src/components/datacenter/DatacenterCamera.tsx`: scroll → `invalidate()` + ventana de settle → **GPU idle en reposo** (frameloop demand).
- `DatacenterCanvas`: cámara inicial = entry de la Escena 1; fog con ref (actualizable por escena).

## FILES CREATED

```
- src/lib/datacenter.tokens.ts
- src/lib/scenes.ts
- src/lib/scenes.test.ts
- src/hooks/useSectionProgress.ts
- src/hooks/useSectionProgress.test.ts
- src/hooks/useDatacenterCamera.ts
- src/components/datacenter/DatacenterCamera.tsx
```

## FILES MODIFIED

```
- src/components/datacenter/DatacenterCanvas.tsx (cámara entry + fog ref)
```

## DEPENDENCIES

`Ninguna nueva` (three/framer ya instalados).

## ARCHITECTURAL IMPACT

`MEDIUM` — ver DECISION ENGINE.

## PERFORMANCE (deltas vs baseline)

| Métrica | Baseline | Actual | Delta | Objetivo |
| --- | --- | --- | --- | --- |
| Typecheck | PASS | PASS | 0 | — |
| Tests | 249 | **257** (29 files) | +8 (scenes 6 + section progress 2) | — |
| Build | PASS | PASS | 0 | — |
| Contextos WebGL | 1 | 1 | 0 | 1 |
| Allocations en frame | — | 0 (vectores preasignados) | — | SPEC §22 |
| GPU en reposo | — | idle (frameloop demand + settle) | — | SPEC §33 |

## ACCESSIBILITY

`STATUS: PASS` — canvas `aria-hidden`; reduced-motion ⇒ el canvas no se monta (poster); scroll nativo intacto (sin hijacking).

## SECURITY / CSP

`STATUS: PASS` — sin cambios; sin assets.

## I18N

`STATUS: PASS` — sin claves nuevas (sin HUD aún).

## COPILOT

`UNCHANGED`

## TESTS

```text
npm run typecheck  → exit 0
npm test           → 29 files / 257 tests passed
npx eslint (nuevos archivos) → 0 errors, 0 warnings
npm run build      → exit 0
```

## GATE

`PASS` — runtime verificado: 1 contexto WebGL, scroll completo sin errores, consola limpia (solo CORS pre-existente de SCAudit en localhost). La prueba visual de la cámara llega con la geometría (Fase 4); la matemática está cubierta por tests unitarios.

## NEXT PHASE

`Fase 3 — Environment procedural` — Lightformer + luces base + fog por escena.

---

## DECISION ENGINE

**PROBLEM:** derivar el progreso de scroll → cámara sin romper el scroll nativo ni el presupuesto de renders.

| Alternativa | Performance | Mantenibilidad | A11y | Seguridad | SEO | Complejidad | Bundle | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: framer-motion `useScroll`/`useTransform` | motion values + re-renders por scroll | media (plumbing de motion values) | sin impacto | sin impacto | sin impacto | baja | +0 | ok |
| B: `useSectionProgress` custom + `useDatacenterCamera` | ref mutable, sin re-renders; frameloop demand + settle | alta (helpers puros testeables) | sin impacto | sin impacto | sin impacto | media | +0 | ok |
| C: drei `ScrollControls` | secuestra el scroll (prohibido, R3) | — | rompe anclas/teclado | — | — | — | — | — |

**DECISION:** B
**REASON:** único esquema que cumple R3 (sin hijacking), usa geometría DOM real (SPEC §21), mantiene el canvas en `demand` con GPU idle, y expone la matemática (interpolación, progreso) como funciones puras unit-testeadas.
**MEASURED RESULT:** 257 tests verdes, 0 allocations por frame, consola sin errores, red sin requests nuevas.
