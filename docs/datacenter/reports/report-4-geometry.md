# Report — Fase 4: Geometría (instancing + translucidez)

**Fecha:** 2026-08-10 · **GATE: ✅ PASS** · **Escalamiento:** ninguno requerido

## IMPLEMENTED

- **Layout data-driven** (`src/lib/datacenter.layout.ts`): posiciones de racks (4 filas × 6), unidades backup, puntos de datos, topología y conteos por tier de calidad (incluye `STATIC` con cero geometría).
- **`ServerRackPool`**: racks modulares con `Instances` (1 geometry + 1 material, N instancias) — presupuesto de draw calls respetado; LEDs de estado con parpadeo (seed determinista).
- **`DustParticles`**: partículas de polvo con PRNG **determinista puro** (idempotente — ver FIX abajo).
- **`DataStreams`**: flujos de datos (líneas animadas entre puntos) para Escena 3.
- **`BackupUnits`**: unidades de respaldo/mass storage para Escena 4.
- **`PurdueHologram`**: topología holográfica (Escena 2) alimentada por `src/data/mindmap.ts` reciclado (10 nodos, 12 aristas) — el contenido que antes vivía en el código muerto `MindMap3D`.
- **`MicroAnimDriver`**: driver de micro-animaciones (LEDs, partículas, streams) con **invalidación híbrida** — anima solo lo visible, GPU idle en reposo.
- **`DatacenterScene`**: composición de los 6 elementos por escena (fog/visibilidad por `visualEvents`).
- **Pass de translucidez**: fondos opacos → translúcidos en Perfil, Arquitectura, Experiencia, TrustBadges, SIEM, Blog, Stack, Certificaciones y Footer — **sin tocar estructura ni IDs de secciones** (cambio SAFE, solo CSS).
- **`ParticleCanvas` eliminado** (ADR-003 Fase C): verificado que no quedaban imports; ahora el datacenter tiene partículas propias.

## FILES CREATED

- `src/lib/datacenter.layout.ts`
- `src/components/datacenter/ServerRackPool.tsx`
- `src/components/datacenter/DustParticles.tsx`
- `src/components/datacenter/DataStreams.tsx`
- `src/components/datacenter/BackupUnits.tsx`
- `src/components/datacenter/PurdueHologram.tsx`
- `src/components/datacenter/MicroAnimDriver.tsx`
- `src/components/datacenter/DatacenterScene.tsx`

## FILES MODIFIED

- `src/components/datacenter/DatacenterCanvas.tsx` (monta `DatacenterScene` + `MicroAnimDriver`)
- `src/components/Perfil.tsx`, `Arquitectura.tsx`, `Experiencia.tsx`, `TrustBadges.tsx`, `SIEMDashboard.tsx`, `Blog.tsx`, `Stack.tsx`, `Certificaciones.tsx`, `Footer.tsx` (solo fondo → translúcido)
- Eliminados: `src/components/ParticleCanvas.tsx` + test

## DEPENDENCIES

- **Ninguna nueva.** Todo procedural (drei `Instances`/`Line`/`Points` ya presentes en el stack).

## ARCHITECTURAL IMPACT

**MEDIUM** — nueva capa de geometría bajo el canvas existente; estructura de secciones intacta (ver Decision Engine).

## PERFORMANCE (deltas vs baseline Fase 0)

| Métrica | Baseline | Fase 4 | Delta |
| --- | --- | --- | --- |
| FPS (dev, desktop) | 60 | 60 | 0 |
| Draw calls (teórico) | 0 | < 20 (instancing: racks ≈ 1 call) | +20 |
| Contextos WebGL | 0 | 1 | +1 (política ADR-003 ✓) |
| Bundle | 19 MB `.next/static` | sin cambios significativos (geometría procedural, sin assets) | ~0 |
| GPU en reposo | n/a | idle (invalidación híbrida) | ✓ |

## ACCESSIBILITY

- Canvas sigue `aria-hidden="true"`, `pointer-events="none"` (R5). El pass de translucidez no altera contraste de contenido (los fondos tenían blur propio y el contenido mantiene sus tarjetas).
- Foto y texto del Hero **intactos** (invariante R1 del propietario) — verificado en runtime.

## SECURITY/CSP

- **Cero requests externas**: env procedural, materiales procedurales, sin HDRI/GLB/CDN. CSP sin cambios.

## I18N

- Sin texto en geometría (los HUDs llegan en Fase 5). `PurdueHologram` usa etiquetas del sistema i18n existente.

## COPILOT

**UNCHANGED** — sin modificaciones en esta fase (solo styling llega en Fase 7).

## TESTS

- `npm run typecheck` → PASS (exit 0)
- `npm test` → **257 passed** (29 archivos)
- `npx eslint src/components/datacenter/ src/lib/` → 0 errores
- `npm run build` → PASS

## VERIFICACIÓN RUNTIME

- 1 contexto WebGL, canvas Z-20, hero transparente con foto + texto íntegros.
- Scroll completo por las 13 secciones: **consola sin errores** (solo CORS pre-existente de SCAudit en localhost).
- **Log del dev server confirma render real**: programas de shader compilados por la GPU (warnings X4122 del compilador D3D — precisión, inofensivos). Nota: `THREE.Clock deprecated` es un aviso interno de drei (lib), no del proyecto.

## FIX POST-GATE (autocrítica CONSTITUTION §11)

**Problema:** lint `react-hooks/purity` — `Math.random()` (impuro) dentro de `useMemo` en `DustParticles`.
**Causa:** generación de posiciones aleatorias durante render.
**Fix:** PRNG determinista puro `seededUnit(seed, i)` (hash imul → [0,1)) — mismo (seed, i) → mismo valor; idempotente y estable entre renders. Sin estado ni efectos.
**Resultado:** lint 0 errores; posiciones estables (mejora colateral: sin parpadeo entre renders).

## DECISION ENGINE (impacto MEDIUM — pass de translucidez)

**Problema:** los fondos opacos de 9 bloques tapan un canvas fijo (Z-20 bajo contenido Z-40).

| Alternativa | Performance | Mantenibilidad | A11y | Riesgo | Veredicto |
| --- | --- | --- | --- | --- | --- |
| A. Hacer el canvas *detrás* del contenido opaco (visible solo en hero) | Óptima | Simple | Alta | El 3D invisible en 80% del scroll — mata la narrativa | ✗ |
| B. Translucidez CSS en las 9 secciones (backdrop-blur + bg translúcido) | Alta (GPU barata) | Simple, reversible | Media (verificar contraste) | Contraste de texto sobre fondo 3D — mitigado con blur fuerte + tarjetas propias | ✅ |
| C. Reestructurar secciones (quitar bloques, contenido flotante sobre canvas) | Alta | Alta complejidad | Baja | **Toca estructura de secciones** — exige aprobación (matriz §2.4) | ✗ |

**DECISIÓN:** B. **RAZÓN:** respeta DOM-first e IDs (cambio SAFE), narrativa visible en todo el scroll, reversible línea por línea. **Medido:** contenido legible (blur + opacidad), zero layout shift, sin cambios de estructura.

## GATE

**PASS** — typecheck ✅ · 257 tests ✅ · lint ✅ · build ✅ · runtime sin errores · translucidez sin tocar estructura.

## NEXT PHASE

**Fase 5 — HUD + i18n + fuentes self-hosted** (report-5-hud-i18n-fonts.md).
