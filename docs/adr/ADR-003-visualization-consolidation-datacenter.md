# ADR-003: Visualización Única — Consolidación de Contextos (Living Datacenter)

**Status:** Proposed
**Date:** 2026-08-10
**Branch:** `remediation/portfolio-production-hardening`
**Relates to:** plan "THE LIVING DATACENTER" (Fases 1–4), ADR-001, ADR-002

---

## Context

Al introducir el `DatacenterCanvas` fijo (capa Z-20), el sitio tendrá varios
sistemas de visualización coexistiendo. Antes de escribir código, se auditaron
todos los canvas del proyecto (verificado en `src/`):

| Componente | Tecnología | Contexto | Uso en producción | Costo |
| --- | --- | --- | --- | --- |
| `MindMap3D.tsx` | R3F (`<Canvas>`, Stars, OrbitControls, points, Text) | WebGL | **Código muerto**: no se importa en ninguna ruta (solo en `MindMap3D.test.tsx`). Su data `src/data/mindmap.ts` tampoco tiene otro consumidor | Alto (contexto + rAF continuo) |
| `ParticleCanvas.tsx` | tsparticles (preset-links) | Canvas 2D (CPU) | Hero (`dynamic`, `ssr:false`) | Medio (100 partículas + hover/click handlers) |
| `RadarSweep.tsx` | Canvas 2D manual (rAF, 220×220) | Canvas 2D (CPU) | Hero, solo desktop (`hero-radar` oculto < lg) | Bajo |
| `CaseStudyDetail.tsx` | R3F (`<Canvas>` + `NetworkGraph`: 3 esferas + 2 líneas + OrbitControls autoRotate) | WebGL | `Proyecto.tsx` → modal full-screen (transitorio, solo abierto) | Medio (contexto + autoRotate) |
| `PurdueModel2D.tsx` | DOM + framer-motion + imágenes | — | `Arquitectura.tsx` (#arquitectura) | Ninguno (no canvas) |

**Hallazgo clave:** en el estado actual, en page load hay **0 contextos WebGL**
activos (MindMap3D es código muerto). El único contexto WebGL real se crea
cuando el usuario abre un case study (modal). Esto hace que el objetivo "un
solo contexto activo" sea alcanzable sin renunciar a nada.

## Decision

### 1. Política global: ONE ACTIVE WEBGL CONTEXT

- Máximo **2 contextos WebGL montados** en cualquier momento:
  `DatacenterCanvas` (permanente, Z-20) y `CaseStudyDetail` (transitorio).
- Nunca **2 contextos renderizando simultáneamente**: mientras el modal esté
  abierto, `DatacenterCanvas` entra en estado `suspended` (frameloop demand +
  sin invalidaciones → 0 trabajo GPU, el contexto permanece vivo pero idle).
- En tier LOW/STATIC, `CaseStudyDetail` **no crea contexto WebGL**: el
  `NetworkGraph` se sustituye por composición estática (SVG/DOM) — el 3D del
  modal es decorativo, el contenido es DOM.
- Gestión centralizada mínima: hook `useWebGLContextManager` (registry con
  refcount + flag `suspended`) y handler global de `webglcontextlost` sobre el
  canvas del datacenter → desmontar y mostrar `StaticPoster` (nunca romper la
  app).
- Sin nuevos canvas 2D de alta frecuencia fuera de los ya existentes.

### 2. `MindMap3D.tsx` → eliminar (código muerto), reciclar su data

- Eliminar `MindMap3D.tsx` y `MindMap3D.test.tsx` (sin consumidores en
  producción; es el mismo anti-patrón de ADR-002 con `/api/chat`).
- **Conservar `src/data/mindmap.ts`** (nodes/edges): alimentará la topología
  holográfica decorativa de la Escena 2 (Core Architecture) **dentro** del
  `DatacenterCanvas` (drei `Line` + `Points`, sin interacción, labels vía
  `HudLabel` con claves i18n). Mismo contenido, un solo contexto.

### 3. `ParticleCanvas.tsx` → retirar del Hero (no borrar aún)

- En el path 3D, la Escena 1 (Boot Sequence) provee sus propias partículas
  (drei `Points`) — no duplicar partículas por capa.
- Quitar el render de `ParticleCanvas` de `Hero.tsx`. El archivo y su test se
  conservan temporalmente por si `StaticPoster` necesita un fondo 2D sutil;
  decisión de borrado definitivo en la fase del poster (probablemente se
  reemplace por gradiente CSS estático, dado que reduced-motion prohíbe
  animación).
- `Hero.test.tsx` se actualiza: deja de esperar `ParticleCanvas`.

### 4. `RadarSweep.tsx` → repurposar como HUD (no borrar)

- Es 2D (sin contexto WebGL) y ya está testeado. Se reubica como overlay de la
  capa HUD (Z-30) de la Escena 1–2 del datacenter, coherente con la estética
  "control room".
- Reglas: solo renderiza mientras su escena está activa; se congela (anillos
  estáticos, sin sweep) con `prefers-reduced-motion` y con `document.hidden`;
  pausa su rAF cuando la escena no está en progreso.

### 5. `CaseStudyDetail.tsx` → conservar con ciclo de vida estricto

- Mantener el montaje condicional actual (solo abierto). Añadir:
  - `dpr={[1, 1.5]}` en su `<Canvas>`.
  - Pausar `autoRotate` con reduced-motion y con `document.hidden`.
  - Al cerrar: desmontaje + `renderer.dispose()` (R3F lo hace al unmount;
    verificarlo, no asumirlo) y registro en el context manager.
  - Tier LOW: `NetworkGraph` → variante estática sin WebGL.
- El `NetworkGraph` queda como el **único 3D interactivo permitido** (es
  decorativo dentro de un modal de contenido).

### 6. Capas y presupuesto de contextos (integra con Z-plan)

```
Z 50  AI Copilot
Z 40  DOM content          (secciones, modal CaseStudyDetail)
Z 30  HUD overlays         (RadarSweep repurposado, HudLabel Html)
Z 20  DatacenterCanvas     (contexto WebGL permanente — único activo en reposo)
Z 10  StaticPoster         (fallback / reduced-motion / LOW tier)
```

## Alternatives

- **Mantener MindMap3D como isla con mount-on-viewport** (IntersectionObserver
  + dispose): descartado — es código muerto hoy; mantenerlo exige ciclo de
  vida complejo para un segundo contexto que nadie usa en producción.
- **Fusionar la Purdue/Arquitectura en el canvas del datacenter como modo
  interactivo**: descartado por ahora — viola DOM-first (contenido interactivo
  en canvas) y complejiza el sistema de cámara; el datacenter la representa de
  forma decorativa y `PurdueModel2D` (DOM) sigue siendo la fuente interactiva.
- **Mantener ParticleCanvas bajo el datacenter**: descartado — duplica
  partículas y suma CPU sin aporte visual (la Escena 1 ya tiene partículas).

## Consequences

- **Positivas**: un único contexto WebGL activo (GPU predecible); menos CPU
  (sin tsparticles ni rAF duplicados); menos código (MindMap3D muerto fuera);
  el concepto "holographic topology" reutiliza data testeada; modal sin
  contexto WebGL en tier bajo.
- **Negativas**: `RadarSweep` pierde su posición en el Hero desktop (se
  compensa con el HUD de la Escena 1); `ParticleCanvas` deja de dar fondo al
  Hero (la Escena 1 lo reemplaza); se pierde el (no usado) MindMap3D.

## Risks

- **Doble contexto durante el modal abierto** (datacenter + case study): se
  mitiga con `suspended` (0 render del datacenter) y dpr acotado; verificar
  memoria en repetidas aperturas/cierres (sin leak → `renderer.dispose()`).
- **Context loss del datacenter** en dispositivos débiles: handler global →
  StaticPoster, nunca excepción no capturada.
- **Hero.test.tsx y otros tests** dependen de los componentes retirados:
  actualizar en la misma fase que el cambio.

## Migration / Rollback

1. **Fase A (inmediata, sin datacenter)**: borrar `MindMap3D.*`; retirar
   `ParticleCanvas` del Hero; actualizar tests. Rollback: `git revert`.
2. **Fase B (con Fase 1 del datacenter)**: `DatacenterCanvas` + `StaticPoster`
   + `useWebGLContextManager` + handler de context loss + `suspended` en modal.
3. **Fase C (Escena 2)**: topología holográfica desde `mindmap.ts` dentro del
   canvas; RadarSweep → capa HUD Escena 1–2; decisión final de borrado de
   `ParticleCanvas`.
4. **Fase D (QA)**: verificación de un solo contexto, memoria, mobile,
   reduced-motion, modal abierto/cerrado.

## Validation

```text
npm run typecheck    → exit 0
npm run test         → suite completa en verde (tests actualizados)
npm run build        → exit 0
# Dev: contar contextos WebGL en runtime (devtools) →
#   page load: 1 (datacenter) · modal abierto: 2 (datacenter idle) · modal cerrado: 1
#   tier LOW / reduced-motion / sin WebGL: 0 contextos + StaticPoster
#   repetir 10× abrir/cerrar modal sin crecimiento de memoria
```

---

## Traceability

| Requerimiento | Decisión | Artefacto |
| --- | --- | --- |
| Un solo contexto WebGL activo | Política ONE ACTIVE + `suspended` en modal | `useWebGLContextManager`, `DatacenterCanvas`, `CaseStudyDetail` |
| MindMap3D muerto | Eliminar componente + test | `MindMap3D.tsx` (borrado), `MindMap3D.test.tsx` (borrado) |
| Topología holográfica Escena 2 | Reciclar `mindmap.ts` dentro del canvas | `src/data/mindmap.ts`, escena CoreArchitecture |
| ParticleCanvas duplicado | Retirar del Hero (borrado en Fase C) | `Hero.tsx`, `ParticleCanvas.tsx` |
| RadarSweep decorativo | Repurposar como HUD (Z-30) | `RadarSweep.tsx`, capa HUD |
| Modal case study 3D | Conservar con ciclo de vida estricto + tier LOW estático | `CaseStudyDetail.tsx` |
| Documentar | Este ADR | `docs/adr/ADR-003-visualization-consolidation-datacenter.md` |
