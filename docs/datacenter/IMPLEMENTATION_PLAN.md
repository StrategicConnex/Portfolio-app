# IMPLEMENTATION PLAN — THE LIVING DATACENTER (ejecución autónoma)

**Status:** Active
**Date:** 2026-08-10
**Objetivo:** implementar la experiencia 3D del portfolio **sin intervención humana**, salvo aprobación explícita de cambios que rompan el sistema (matriz de escalamiento §2).
**Gobernanza:** [`CONSTITUTION.md`](./CONSTITUTION.md) · [`SPEC.md`](./SPEC.md) · [`ADR-003`](../adr/ADR-003-visualization-consolidation-datacenter.md).

---

## 0. Modelo de ejecución

1. El agente ejecuta las fases **en orden**. Cada fase termina con un **gate** verificable (comandos + criterios). Gate PASS → siguiente fase. Gate FAIL → corregir internamente dentro de los invariantes; si la corrección exige violar un invariante → **STOP y escalar** (nunca workaround silencioso).
2. Cada fase produce el reporte del `SPEC.md §37` (PHASE / STATUS / IMPLEMENTED / FILES / DEPENDENCIAS / IMPACT / PERFORMANCE / A11Y / CSP / I18N / COPILOT / TESTS / GATE / NEXT).
3. Decisiones MEDIUM/HIGH usan el Decision Engine (CONSTITUTION §7): mínimo 3 alternativas + justificación en el reporte.
4. Al terminar una fase, verificar visualmente con dev server (`npm run dev` + preview/screenshots) cuando aplique (Fase 2 en adelante).
5. **Nunca** tocar archivos sucios de otros threads; **nunca** `git add -A`; commits propios por fase.

## 1. Higiene de git y estado del árbol

- Estado actual (2026-08-10): branch `remediation/portfolio-production-hardening` con cambios sin commitear de otro thread (`.github/workflows/ci.yml`, `.gitignore`, `README.md`, `eslint.config.mjs`, `next.config.ts`, `package*.json`, `tsconfig.json`, rutas API, `ObservabilityProvider.tsx`, `rate-limit.ts`, `server/` nuevo, `sentry.ts` eliminado).
- Trabajar en branch propio **sin commitear ni stagedear** nada ajeno: `git switch -c feat/living-datacenter` (los archivos sucios quedan en el working tree, sin stage; **no tocarlos**). Si un cambio propio colisiona con uno ajeno → STOP y escalar.
- Commits pequeños por fase: `feat(datacenter): …`, `chore(datacenter): …`. Revisar `git status` antes de cada commit.

## 2. Matriz de escalamiento (aprobación humana REQUERIDA)

El agente avanza solo **hasta** estas condiciones. Cualquiera de ellas detiene la ejecución y pide aprobación con: PROBLEMA / CAUSA / IMPACTO / OPCIONES / RECOMENDACIÓN.

| # | Condición | Ejemplos |
| --- | --- | --- |
| E1 | Cambios a la CSP o cabeceras de seguridad | `next.config.ts` headers |
| E2 | Lógica/API/estado del AI Copilot | AskAI internals (solo styling está permitido) |
| E3 | Estructura SEO/metadata del layout | `layout.tsx` metadata, JSON-LD, robots, sitemap |
| E4 | Estructura de secciones o navegación | renombrar IDs, reordenar `page.tsx`, eliminar contenido del Hero (prohibido por R1) |
| E5 | Nueva dependencia npm con impacto de bundle/seguridad | cualquier `npm install` que no sea `next/font` (cero deps nuevas) |
| E6 | Cambios a la arquitectura i18n | `LanguageContext` (agregar claves NO escala) |
| E7 | Gate de fase que no pasa sin violar un invariante | — |
| E8 | Colisión con archivos de otro thread | — |

Todo lo demás (crear componentes, hooks, estilos, re-layout del Hero, eliminación de código muerto aprobado en ADR-003) se ejecuta **sin consultar**.

## 3. Comandos globales de verificación

```bash
npm run typecheck          # tsc --noEmit
npm run lint               # eslint
npm test                   # vitest run (suite completa)
npm run build              # build de producción (Fase 8 y gates críticos)
npx playwright test        # e2e (requiere dev server; opcional por gate)
npm audit                  # seguridad de dependencias (Fase 0 y 8)
```

QA visual: `npm run dev` + preview del thread (screenshots por escena). Auditoría de red/consola: preview logs (sin HDR/GLB/fuentes externas). Contextos WebGL: devtools (page load = 1, modal abierto = 2 con datacenter idle, modal cerrado = 1, tier LOW/STATIC = 0).

## 4. Fases

| Fase | Nombre | Gate clave |
| --- | --- | --- |
| 0 | Discovery & Baseline | Report `discovery.md` completo |
| A | Limpieza (ADR-003 Fase A) | typecheck + tests en verde |
| 1 | Canvas shell | Canvas visible tras el Hero, DOM intacto |
| 2 | Camera system + datos de escenas | Movimiento suave, sin jitter |
| 3 | Environment procedural | CSP/Network limpios |
| 4 | Geometría + translucidez de secciones | Draw calls y FPS medidos |
| 5 | HUD + i18n + fuentes | ES/EN sin romper escena |
| 6 | GLB opcional (default: SKIP) | Solo si procedural no alcanza |
| 7 | Copilot visual shell + event bus | Copilot funcional intacto |
| 8 | QA final + acceptance | SPEC §35 completo |

---

### FASE 0 — Discovery & Baseline
**Objetivo:** registrar el estado real antes de tocar código.
**Acciones:**
- Generar `docs/datacenter/discovery.md`: stack y versiones verificados (`package.json`), IDs reales de secciones, fuentes (actualmente sin `next/font` — fallbacks de sistema), CSP vigente, tráfico de red legítimo, tests existentes que cubren componentes afectados.
- Baseline medido (registrar valores): resultado de `npm run build` (tamaños de bundle), `npm test` (count/pass), `npm run typecheck`, `npm audit`, y CWV de campo si hay acceso.
- Leer `node_modules/next/dist/docs/` relevante (Next 16 — `AGENTS.md` obliga).
**Verificación:** reporte completo + comandos ejecutados.
**Gate:** report existe y baseline registrado.
**Escalamiento:** ninguno (solo lectura/medición).
**Rollback:** n/a.

### FASE A — Limpieza (ADR-003 Fase A)
**Objetivo:** eliminar código muerto y duplicación antes del 3D.
**Acciones:**
- Verificar (búsqueda global) que `MindMap3D` no se importa en producción → borrar `src/components/MindMap3D.tsx` y `MindMap3D.test.tsx`. **Conservar `src/data/mindmap.ts`** (alimentará la topología de la Escena 2).
- Retirar `ParticleCanvas` del Hero (`src/components/Hero.tsx`): quitar import dinámico y render. Conservar el archivo (decisión de borrado final en Fase 5). **RadarSweep se conserva en el Hero.**
- Actualizar `Hero.test.tsx` (deja de esperar `ParticleCanvas`).
**Verificación:** `npm run typecheck` · `npm test` · `npm run lint`.
**Gate:** todo en verde; Hero mantiene foto + texto completo (R1).
**Escalamiento:** si `MindMap3D` resultara usado en producción → STOP (E4) y re-planificar.
**Rollback:** `git revert` del commit de la fase.

### FASE 1 — Canvas shell
**Objetivo:** montar el datacenter vacío como fondo, con fallbacks y gestión de contexto, **sin afectar nada existente**.
**Acciones:**
- Crear `src/hooks/useHardwareDetection.ts`, `usePrefersReducedMotion.ts`, `useAdaptiveQuality.ts`, `useWebGLContextManager.ts` (refcount + `suspended` + handler de `webglcontextlost`).
- Crear `src/components/datacenter/`: `DatacenterCanvas.tsx` (Canvas fijo `inset-0`, `aria-hidden`, `pointer-events: none`, `dpr={[1,2]}`, `frameloop="demand"`), `StaticPoster.tsx` (modo operational/low-power, sin animación), `DatacenterErrorBoundary.tsx` (fallback → StaticPoster).
- Hacer **transparente el fondo del Hero** (`#home`, `bg-[var(--bg)]` → transparente o gradiente sutil) para que el canvas se vea en la Escena 1. Las demás secciones conservan fondo opaco (el canvas solo se verá en el Hero en esta fase).
- Montar en `src/app/page.tsx` (o layout) con `dynamic(..., { ssr: false })` + Suspense. En tier LOW/STATIC o sin WebGL → StaticPoster, sin canvas.
- Verificar que el canvas no captura eventos ni anuncia al screen reader.
**Verificación:** `npm run typecheck` · `npm test` · `npm run lint` · `npm run dev` + screenshot del Hero (canvas visible, foto/texto intactos) · consola sin errores WebGL.
**Gate:** DOM, scroll, anchors, Copilot y screen readers funcionan; 1 contexto WebGL (o 0 en fallback).
**Escalamiento:** E1/E3/E4 solo si se tocan CSP/metadata/secciones (no debería ser necesario).
**Rollback:** revert; el Hero vuelve a `bg-[var(--bg)]`.

### FASE 2 — Camera system + datos de escenas
**Objetivo:** conectar el scroll DOM al movimiento de cámara.
**Acciones:**
- Crear `src/lib/datacenter.tokens.ts` (tokens §3 del SPEC) y `src/lib/scenes.ts` (config data-driven: 5 escenas con `sections` reales, waypoints entry/mid/exit, fog, `visualEvents`).
- Crear `src/hooks/useSectionProgress.ts` (geometría DOM real, sin alturas hardcoded) y `useDatacenterCamera.ts` (waypoints + lerp/spring; `useFrame` solo muta refs).
- Añadir `DatacenterCamera.tsx` al canvas. En esta fase el movimiento se valida visualmente en el Hero (única zona visible).
**Verificación:** `npm run typecheck` · `npm test` · dev server: scroll suave, sin cortes ni jitter, CPU razonable; reduced-motion → cámara congelada.
**Gate:** movimiento estable y sin regresión funcional.
**Escalamiento:** ninguno esperado.
**Rollback:** revert.

### FASE 3 — Environment procedural
**Objetivo:** iluminación y atmósfera sin assets externos.
**Acciones:**
- `DatacenterEnvironment.tsx`: `<Environment>` con `<Lightformer>` (o luces Three.js puras), fog por escena, luz fría base + acentos cálidos puntuales (tokens). Sin HDRI, sin red.
- Verificar CSP/Network (ninguna request nueva externa).
**Verificación:** typecheck + tests + preview: atmósfera coherente, sin request externa en logs.
**Gate:** CSP y Network limpios; calidad visual aceptable.
**Escalamiento:** E1 si se detectara que algo exige ampliar CSP (no debería — todo procedural).
**Rollback:** revert.

### FASE 4 — Geometría + translucidez de secciones
**Objetivo:** el datacenter visible en todo el recorrido.
**Acciones:**
- Crear geometría con **instancing**: `ServerRack.tsx`/`ServerRackPool.tsx` (drei `Instances`), `DataStreams.tsx`, `Particles.tsx` (Points de la Escena 1), `BackupUnits.tsx`, `PurdueHologram.tsx` + topología desde `src/data/mindmap.ts` (Line/Points decorativos, sin interacción), agrupadas por escena en `scenes/`.
- **Pass de translucidez (L3 presentación, transversal):** los fondos opacos de las 13 secciones (`bg-[var(--bg)]`, `bg-slate-900`, etc.) pasan a transparentes/gradientes sutiles para que el canvas fijo se vea a lo largo del scroll; tarjetas y superficies conservan glass/blur. Revisar una a una con screenshots por escena.
- Aplicar quality tiers: partículas/LOD/DPR por perfil (ULTRA→STATIC); runtime downgrade si FPS cae.
- Retirar definitivamente `ParticleCanvas.tsx` + su test (ADR-003 Fase C) una vez las partículas de la Escena 1 están en el canvas.
**Verificación:** typecheck + tests + build + dev server: draw calls < 50 (devtools/panel debug), FPS desktop 60 / mobile 45+, screenshots por escena (S1…S5), translucidez sin romper legibilidad ni contraste; radar del Hero sin conflicto visual.
**Gate:** presupuesto de draw calls y FPS cumplidos; contenido legible sobre el canvas.
**Escalamiento:** E4 solo si la translucidez obligara a tocar estructura (no: es solo CSS).
**Rollback:** revert del pass de translucidez si un gate falla.

### FASE 5 — HUD + i18n + fuentes
**Objetivo:** los HUD traducibles y la tipografía final.
**Acciones:**
- `HudLabel.tsx` (drei `Html transform` + `distanceFactor`) para labels de escena (SYSTEM INITIALIZING, etc.) y nodos — siempre con claves i18n; **cero texto hardcoded**.
- Agregar claves ES/EN en `src/context/translations/*` + test unitario de paridad (cada clave HUD existe en ambos idiomas).
- Fuentes: `next/font/google` (Space Grotesk + JetBrains Mono, self-hosted) en `layout.tsx`/CSS — sin dependencias nuevas (E5 no aplica). Aplicar tokens tipográficos. Verificar que no hay request externa en runtime.
- Re-layout del Hero (opcional, solo CSS/DOM): foto como tarjeta HUD con telemetría, texto sobre el canvas — **sin eliminar contenido** (R1).
**Verificación:** typecheck + tests (paridad incluida) + dev: cambiar idioma ES↔EN sin romper escena/cámara; fuentes servidas desde `/_next/static`; screenshots.
**Gate:** i18n dual OK, HUD sin texto hardcoded, fuentes self-hosted.
**Escalamiento:** E6 solo si se tocara `LanguageContext` (no: solo archivos de claves).
**Rollback:** revert.

### FASE 6 — GLB opcional (default: SKIP)
Solo si la calidad procedural no alcanza el estándar del SPEC §12. Requiere demostrar impacto visual antes de aceptar assets < 3 MB, self-hosted en `/public`, pipeline `gltf-transform` completo. **Default: no ejecutar.**

### FASE 7 — Copilot visual shell + event bus
**Objetivo:** integrar el Copilot al universo visual sin tocar su lógica.
**Acciones:**
- Restyle CSS/Tailwind del shell de AskAI (borde, glow, tipografía, "AI Node Console") — solo styling.
- Event bus visual: observar el estado del Copilot (IDLE/THINKING/STREAMING/ERROR/COMPLETE) vía el estado existente (sin modificarlo) → reacciones visuales 3D sutiles (pulso del nodo central, actividad de flujos).
**Verificación:** typecheck + tests + e2e del Copilot (streaming, apertura/cierre, mobile, z-index 50 por encima del canvas) + screenshots.
**Gate:** Copilot funcionalidad/streaming/API/z-index intactos (E2 no se cruza: solo styling + lectura de estado).
**Escalamiento:** E2 si cualquier cambio tocara lógica.
**Rollback:** revert.

### FASE 8 — QA final + Acceptance
**Acciones:**
- Ejecutar `npm run typecheck` · `npm run lint` · `npm test` · `npm run build` · `npm audit` · e2e (Playwright) · axe.
- Auditorías: CSP (sin violaciones), Network (sin assets externos), contextos WebGL (1/2/1, 0 en fallback), memoria (10 ciclos abrir/cerrar modal sin leak), mobile (tiers), Lighthouse (deltas vs baseline), recorrido completo del SPEC §36.
- Validar acceptance criteria del SPEC §35 (content, 3D, i18n, a11y, performance, security, copilot, fallback).
**Gate:** todos los criterios; si algún objetivo es aspiracional (Lighthouse ≥ 90), documentar deltas vs baseline y no bloquear.
**Escalamiento:** cualquier fallo que requiera violar invariantes.

## 5. Definition of Done

`SPEC.md §35` (Acceptance Criteria) + `SPEC.md §36` (Final System Test) + `SPEC.md §37` (reportes por fase archivados en `docs/datacenter/reports/`).

## 6. Riesgos conocidos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Fondos opacos de secciones tapan el canvas fijo | Pass de translucidez en Fase 4 (explicito, revisado por screenshots) |
| Next 16 con breaking changes | Fase 0: leer `node_modules/next/dist/docs/`; componentes cliente con `dynamic ssr:false` |
| WebGL flaky en headless/CI | QA visual manual vía dev server + preview; snapshots solo del StaticPoster en CI |
| Árbol de trabajo sucio (otro thread) | §1: branch propio, nunca stagear/commitear ajeno, E8 si colisiona |
| frameloop demand vs micro-animaciones | Invalidación híbrida (SPEC §10): invalidate en scroll + timer 30 Hz tier alto |
| `next/font/google` requiere red en build | Permitido en Vercel; si falla, alternativa `@fontsource` (escalar E5) |
| Degradación móvil | Tiers ULTRA→STATIC + runtime downgrade (SPEC §9); StaticPoster en LOW |
