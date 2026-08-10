# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`Fase 1 — Canvas shell`

## STATUS

`PASS`

## IMPLEMENTED

- Hooks: `useHardwareDetection` (tier HIGH/MEDIUM/LOW + WebGL), `usePrefersReducedMotion` (+ toggle manual persistido en localStorage), `useAdaptiveQuality` (ULTRA→STATIC con downgrade runtime por FPS), `useWebGLContextManager` (registry + `suspended` + `webglcontextlost`).
- Componentes: `DatacenterCanvas` (fijo Z-20, `aria-hidden`, `pointer-events: none`, `dpr` por perfil, `frameloop="demand"`, escena vacía color+fog), `StaticPoster` (modo operational, sin animación, aria-hidden), `DatacenterErrorBoundary` (fallback → poster), `DatacenterExperience` (orquestador + toggle manual Reduce Motion Z-60).
- Montaje: `DatacenterMount` (wrapper client con `ssr:false`) → `page.tsx`; `main` y Footer a `relative z-40` (DOM por encima del canvas, SPEC §2). Navbar ya era `z-[100]`, Copilot `z-50`.
- Fondo del Hero (`#home`) transparente → el canvas se ve en la Escena 1. Foto y texto intactos (CONSTITUTION R1).
- **Hallazgo Next 16 (AGENTS.md lo advertía):** `ssr: false` con `next/dynamic` **no está permitido en Server Components** → se resolvió con wrapper Client (`DatacenterMount.tsx`). Documentado para las siguientes fases.

## FILES CREATED

```
- src/hooks/useHardwareDetection.ts
- src/hooks/usePrefersReducedMotion.ts
- src/hooks/useAdaptiveQuality.ts
- src/hooks/useWebGLContextManager.ts
- src/components/datacenter/StaticPoster.tsx
- src/components/datacenter/DatacenterCanvas.tsx
- src/components/datacenter/DatacenterErrorBoundary.tsx
- src/components/datacenter/DatacenterExperience.tsx
- src/components/datacenter/DatacenterMount.tsx
- src/components/datacenter/DatacenterExperience.test.tsx
- src/components/datacenter/StaticPoster.test.tsx
```

## FILES MODIFIED

```
- src/app/page.tsx        (monta DatacenterMount; main y Footer a z-40)
- src/components/Hero.tsx (bg opaco → transparente; nada más cambió)
```

## DEPENDENCIES

`Ninguna nueva` — R3F/drei/three ya estaban instalados.

## ARCHITECTURAL IMPACT

`MEDIUM` — nueva capa de render fija (Z-20) gobernada por ADR-003. Decisión Engine al final.

## PERFORMANCE (deltas vs baseline)

| Métrica | Baseline | Actual | Delta | Objetivo |
| --- | --- | --- | --- | --- |
| Typecheck | PASS | PASS | 0 | — |
| Tests | 241 | 247 (26 files) | +6 (nuevos) | — |
| Build | PASS | PASS | 0 | — |
| Contextos WebGL (load) | 0 | **1** (datacenter) | +1 | 1 |
| Canvas Z / pointer | — | 20 / none | — | SPEC §2 |
| main Z | auto | 40 | — | SPEC §2 |

## ACCESSIBILITY

`STATUS: PASS` — canvas `aria-hidden` + `pointer-events: none`; toggle manual "Reducir animaciones 3D" con `aria-pressed` y label; foto/texto del Hero intactos; suite axe verde.

## SECURITY / CSP

`STATUS: PASS` — sin cambios de CSP; sin assets externos; zero network nueva (verificado en consola).

## I18N

`STATUS: PASS` — sin claves nuevas en esta fase (el poster es decorativo y aria-hidden).

## COPILOT

`UNCHANGED` — launcher visible (Z-50) en screenshot; lógica intacta.

## TESTS

```text
npm run typecheck  → exit 0
npm test           → 26 files / 247 tests passed
npx eslint src/hooks src/components/datacenter src/app/page.tsx src/components/Hero.tsx → exit 0
npm run build      → exit 0
```

## GATE

`PASS` — verificación en runtime (dev server):
- Canvas WebGL montado (1 contexto), `hasWebGL: true`, Z-20, `pointer-events: none`.
- Hero transparente (`rgba(0,0,0,0)`), foto + texto íntegros, scroll nativo y ancla `#perfil` funcionando.
- Consola sin errores.

## FIX POST-GATE (self-critique, CONSTITUTION §11)

**Problema:** `Maximum update depth exceeded` en runtime — `useWebGLContextManager` devolvía funciones nuevas en cada render; `DatacenterCanvas` las usaba como deps de efecto (`[setSuspended]`) → efecto re-ejecutado en cada render → `registerContext()` → `emit()` → re-render → bucle infinito. El error de `Navbar` reportado en consola era cascada de la misma tormenta de renders.

**Fix:** funciones estabilizadas con `useCallback([])` en el manager (`setSuspended`, `reportContextLost`, `resetContextLost`).

**Regresión:** `src/hooks/useWebGLContextManager.test.ts` (estabilidad de identidades entre renders + ciclo context lost).

**Verificado:** error ausente tras reload y scroll (consola limpia salvo CORS pre-existente de SCAudit RUM en localhost, ajeno a este thread).

## NEXT PHASE

`Fase 2 — Camera system` — `useSectionProgress` + `useDatacenterCamera` + `scenes.ts`/`datacenter.tokens.ts` (config data-driven), waypoints por escena con easing.

---

## DECISION ENGINE

**PROBLEM:** montar un canvas fijo sin romper el apilado Z ni el DOM.

| Alternativa | Performance | Mantenibilidad | A11y | Seguridad | SEO | Complejidad | Bundle | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: Canvas fijo Z-20 + contenido `relative z-40` | 1 contexto, frameloop demand | alta (layers explícitos) | aria-hidden + none | sin impacto | sin impacto | baja | 0 | ok (tiers) |
| B: Canvas absoluto solo en Hero | no narrativa global | media | igual | igual | igual | baja | 0 | ok |
| C: Canvas como fondo del `body` | contexto siempre activo | baja (conflictos de stacking) | riesgo de cubrir modales | igual | igual | media | 0 | riesgo |

**DECISION:** A
**REASON:** único esquema que soporta la narrativa de scroll global (SPEC §5) sin depender de fondos; Z explícitos (SPEC §2) y sin tocar estructura DOM.
**MEASURED RESULT:** canvas montado con 1 contexto, hero transparente, DOM arriba (z-40), sin errores.
