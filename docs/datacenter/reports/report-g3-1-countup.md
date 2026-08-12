# PHASE G3.1 — COUNT-UP EN CONTADORES DE DATOS ENCARNADOS

**PHASE:** G3.1 — extensión del count-up (animación de conteo en DataRings)
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12

## PROBLEMA
Los anillos/contadores de G3 mostraban el valor final estático al entrar en
escena. La referencia Mastercard "Business Outcomes" anima los números
(count-up). El contador debe subir de 0 → valor con easing al entrar en la
escena, sin re-renders de React (SPEC §32) y estático con reduced-motion
(SPEC §17).

## BUG RAÍZ ENCONTRADO Y CORREGIDO
`usePrefersReducedMotion()` devuelve `{ reduced, toggle }` (objeto), pero
`DataRings`, `HudLabel` y `FocusNodeLayer` lo usaban como booleano → `reduced`
era un objeto **siempre truthy** → todo congelado en runtime: el count-up
mostraba el valor final directo Y el pulso de la baliza G2 nunca animaba.
Solo `DatacenterExperience` hacía el destructuring correcto.

**Fix:** destructuring correcto `const { reduced } = usePrefersReducedMotion()`
en los tres componentes. Este bug afectaba también al pulso de opacidad de G2
(visible ahora) y a todos los micro-labels con reduced-motion.

## IMPLEMENTED
1. **`src/lib/datacenterData.ts`** — funciones puras `parseCounter()`,
   `formatCounter()`, `easeOutCubic()` (testeadas): parsea '99.9%' / '131/142' /
   '-30%' → valor + prefijo + sufijo + maxValue, formatea el progreso.
2. **`HudLabel`** — prop aditiva `countUp?: boolean`:
   - El `useFrame` escribe `textContent` DIRECTAMENTE en el DOM (cero setState,
     SPEC §32); la invalidación la aporta `MicroAnimDriver`; al completar deja
     de escribir.
   - Arranca cuando `valueRef.current` existe (el `Html` de drei monta su DOM
     con delay — si arrancaba al montar el componente React, la animación
     terminaba antes de ser visible).
   - Con `reduced` → valor final estático (sin animación).
3. **`DataRings`** — activa `countUp` en todos sus HudLabel.

## FILES MODIFIED
- `src/lib/datacenterData.ts` (+ `parseCounter`/`formatCounter`/`easeOutCubic`)
- `src/lib/datacenterData.test.ts` (+ tests de parseo/format, 10/10)
- `src/components/datacenter/HudLabel.tsx` (prop `countUp`, fix destructuring)
- `src/components/datacenter/HudLabel.countUp.test.tsx` (nuevo, test del count-up)
- `src/components/datacenter/DataRings.tsx` (activa `countUp`, fix destructuring)
- `src/components/datacenter/FocusNodeLayer.tsx` (fix destructuring — desbloquea
  el pulso de la baliza G2)

## ARCHITECTURAL IMPACT
**LOW** — extensiones aditivas sobre G3; sin tocar secciones, DOM ni Copilot.

## VALIDACIÓN RUNTIME (navegador real, build actual en 3100)
Count-up medido con polling interno (sin round-trips) tras entrar a escena:

| Escena | Muestras capturadas |
|--------|---------------------|
| S2 architecture | `8% → 27% → 42% → 55% → 66% → 75% → 81% → 86% → 88% → 92% → 93% → 94%` (~1.1s, easing) ✅ |
| S4 resilience | `11/142 → 37/142 → 59/142 → 77/142 → 92/142 → 104/142 → ... → 131/142` (~1s) ✅ |

`prefers-reduced-motion` verificado: **false** en el preview (la animación corre
como diseñado); con `reduce` el valor final se muestra directo (cubierto por
test y por el guard `reduced` en código).

## PERFORMANCE
- Escritura directa a `textContent` en `useFrame` — cero re-renders de React.
- El contador deja de escribir al completar (una escritura final fija el valor
  exacto); la invalidación del frame la sigue dando `MicroAnimDriver` (Hz
  reducido), GPU idle en reposo.
- Sin requests nuevos (R5), sin dependencias nuevas.

## ACCESSIBILITY
Reduced-motion → valor final estático, sin animación. El contador sigue siendo
DOM del `Html` (no anunciado, `pointer-events: none`); los datos reales viven
en el DOM de las secciones (fuente de verdad).

## COPILOT
**UNCHANGED** — sin tocar lógica, estado, API ni z-index.

## GATE
**PASS** — typecheck 0 · tests 147/147 (23 files) · lint 0 · build OK ·
runtime S2/S4 verificados con count-up visible y easing correcto.

## NEXT
QA en dispositivo real (deploy preview) y carga de outputs de Meshy en los
slots GLB — operativos, no gaps.
