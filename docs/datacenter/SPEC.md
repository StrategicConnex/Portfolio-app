# SPEC — THE LIVING DATACENTER

**Status:** Active (referenced from `AGENTS.md`)
**Date:** 2026-08-10
**Stack verificado en el repo:** Next.js 16 (App Router) · React 19 · TypeScript 6 · Tailwind v4 · `@react-three/fiber` 9.6 · `@react-three/drei` 10.7 · `three` 0.185 · framer-motion 12 · i18n es/en (17 archivos en `src/context/translations`) · CSP estricta en `next.config.ts`.
**Gobernanza:** [`CONSTITUTION.md`](./CONSTITUTION.md). **Consolidación:** [`ADR-003`](../adr/ADR-003-visualization-consolidation-datacenter.md).

> Antes de escribir código de Next.js, leer `node_modules/next/dist/docs/` (ver `AGENTS.md`): Next 16 tiene breaking changes.

---

## 1. Concepto: Digital Twin

El datacenter 3D es el **gemelo narrativo** del perfil profesional: arquitectura IT/OT + ciberseguridad industrial + cloud + AI. No es decoración: cada elemento 3D representa una dimensión real del perfil (racks = competencias, flujos = experiencia, nodos = certificaciones, almacenamiento = resiliencia, nodo central = contacto). Estética: **premium enterprise futurista** (Mission Control + Hyperscale Datacenter + SOC + AI Ops + sala de control industrial). Evitar: gamer, cyberpunk exagerado, neon excesivo, sci-fi infantil, crypto.

## 2. Arquitectura de render (capas Z)

```
Z 50  AI Copilot (AskAI — sagrado, ver CONSTITUTION R4)
Z 40  DOM content (secciones, modal CaseStudyDetail)
Z 30  HUD overlays (RadarSweep repurposado, HudLabel via drei Html)
Z 20  DatacenterCanvas (fijo, contextos WebGL — único activo en reposo)
Z 10  StaticPoster (fallback / reduced-motion / tier LOW / sin WebGL)
```

El Canvas: `aria-hidden="true"`, `pointer-events="none"`, `position: fixed; inset: 0`. Nunca bloquea pointer events, teclado, enlaces, botones, formularios ni el Copilot.

**Capa base (Z-10):** `StaticPoster` se renderiza **siempre en el HTML inicial** (server-side, desde `page.tsx`) — progressive enhancement Nivel 1 (pinta sin JS). En modo normal el canvas opaco (Z-20) la cubre sin cambio visual; en reduce-motion / tier LOW / sin WebGL / error / context lost es la capa visible y el **LCP** (ver §25).

## 3. Sistema visual

**Tokens** (no hardcodear valores): centralizar en `src/lib/datacenter.tokens.ts` — colores, luz, fog, cámara, motion, partículas, materiales, calidad.

**Semántica de color** (consistencia entre escenas):
- `BLUE` = infraestructura / datos · `AMBER` = resiliencia / auditoría · `RED` = incidente / warning · `WHITE` = información de sistema · acentos neón SOLO para indicar estado/actividad.

**Consistencia visual:** mismo lenguaje de materiales, luz, tipografía, HUD y lógica espacial en las 5 escenas. Las escenas deben pertenecer al mismo universo.

**Dirección de arte:** luz volumétrica fría con acentos cálidos puntuales, metal cepillado + cristal ahumado, partículas ligeras en suspensión, profundidad de campo cinematográfica. Materialidad correcta (PBR + `<Environment>`/Lightformer) antes que post-procesado; sin bloom inicial.

## 4. Tipografía

- `next/font` **self-hosted** (CSP: `font-src 'self' data:`): **Inter** (body) + **Space Grotesk** (headings/narrativa) + **JetBrains Mono** (telemetría, HUD, labels, status).
- Estado actual (Fase 5): `src/app/fonts.ts` define las 3 familias vía `next/font/google` (descarga en build, sirve desde `/_next/static/media/` — same-origin). Verificado: cero requests de fuentes externas en runtime.
- Nunca cargar fuentes de Google Fonts CDN en runtime.

## 5. Narrative Map (mapeo verificado a secciones reales)

| Escena | Progreso aprox. | Secciones reales | Visual | Cámara | Emoción |
| --- | --- | --- | --- | --- | --- |
| **01 Boot Sequence** | 0–10% | `#home` | Rack emerge del fog, partículas, LEDs de status. La foto y el texto del Hero se conservan sobre el canvas (re-layout permitido) | Dolly forward lento, FOV estrecho | Anticipación / Identidad |
| **02 Core Architecture** | 10–35% | `#perfil`, `#arquitectura`, `#stack`, `#confianza` | Pasillo simétrico de racks; Purdue = pared holográfica decorativa; skills = módulos de rack; topología desde `src/data/mindmap.ts` | Orbit lateral + push-in | Orden / Competencia |
| **03 Data in Motion** | 35–65% | `#experiencia`, `#proyecto`, `#certificaciones`, `#siem` | Flujos de datos, telemetría, nodos de certificación, SIEM diegético | Close-up con rack focus | Complejidad dominada |
| **04 Resilience & Depth** | 65–85% | `#audit-hub`, `#scaudit`, `#blog` | Nivel inferior, backup/almacenamiento, luz ámbar, partículas densas | Tilt-down lento | Solidez / Madurez |
| **05 Connection Point** | 85–100% | `#contacto`, Footer | Pull-back total, luces sincronizadas, nodo central pulsante | Pull-back + rotate | Conexión / Conversión |

Narrativa textual de sistema por escena (vía i18n): S1 `SYSTEM INITIALIZING / NETWORK ONLINE / AI CORE READY` … S5 `CONTACT / CONNECT / COLLABORATE`.

**Nota de contenido (directiva del propietario):** la foto de perfil y el texto del Hero (`#home`) **no se eliminan ni se reemplazan** — el datacenter es fondo. El re-layout (foto como tarjeta HUD, tipografía sobre el canvas, reposicionar CTAs `Historial Crítico` / `Arquitectura OT`) está permitido siempre que el contenido DOM permanezca íntegro, indexable y accesible. Aplica el mismo criterio a cualquier otra sección: reacomodar, nunca eliminar.

## 6. Camera System

```
useScroll() → scrollYProgress → useSpring() → useSectionProgress() → activeSceneIndex
→ interpolateWaypoints() → camera target → useFrame()
```

```ts
type CameraWaypoint = {
  position: THREE.Vector3
  lookAt: THREE.Vector3
  fov: number
  fogNear: number
  fogFar: number
}
```

Cada escena: entry + mid + exit waypoint. Movimiento con lerp/smoothstep/spring/damped interpolation. **Nunca**: cortes bruscos, snapping, saltos grandes de FOV, rotación rápida. `useFrame()` solo actualiza `ref.current.position.lerp(...)` — nunca `setState` ni allocation dentro del loop.

## 7. Scene State Machine

Cada escena es una máquina de estados: `ENTERING → ACTIVE → TRANSITIONING → EXITING → IDLE`. Sincroniza cámara, iluminación, fog, partículas, HUD y micro-interacciones. Ej. S3: ENTERING activa topología holográfica → ACTIVE flujos de datos + telemetría SIEM → EXITING atenúa topología y prepara S4.

## 8. Motion Safety

- Hook `usePrefersReducedMotion()` (matchMedia + listener) y toggle manual "Reduce Motion" persistido en localStorage.
- `reduce` → StaticPoster o escena congelada (sin cámara, sin partículas continuas, sin transiciones).
- `RadarSweep`: anillos estáticos sin sweep. Modal case study: `autoRotate` pausado.
- Pausar render con `document.hidden` (visibilitychange) en todos los contextos.

## 9. Hardware Adaptation + Adaptive Quality

`useHardwareDetection()` clasifica `HIGH | MEDIUM | LOW` (hardwareConcurrency, deviceMemory, viewport, GPU proxy). Perfiles:

| Perfil | DPR | Partículas | Geometría | Efectos | Contextos WebGL |
| --- | --- | --- | --- | --- | --- |
| ULTRA | 2 | full | alta | fog completo | 1 (+modal) |
| HIGH | 1.5 | media | instanciada | — | 1 (+modal) |
| MEDIUM | 1 | baja | reducida | sombras reducidas | 1 |
| LOW | 1 | mínima | mínima | efectos estáticos | 1 (o 0) |
| STATIC | — | — | — | — | **0 → StaticPoster** |

**Runtime adaptive:** medir FPS/frame time; si cae (60→55→48), degradar en orden: partículas → DPR → efectos secundarios → sombras → geometría. Nunca degradar DOM, navegación ni Copilot.

## 10. Render Performance

- `frameloop="demand"` + invalidación. **Tensión resuelta:** micro-animaciones continuas (LEDs, flujos, partículas) usan **invalidación híbrida** — `invalidate()` en scroll/escena + timer de baja frecuencia (30 Hz, solo tier HIGH/MEDIUM) para micro-anims; en LOW se congelan o reducen.
- `dpr={[1, 2]}` (adaptativo por tier). Sin objetos nuevos dentro de `useFrame`, sin recrear geometría dinámica, sin materiales/luces excesivos, sin post-procesado abusivo.
- Objetivos: Desktop 60 FPS, Mobile 45–60. GPU idle en reposo (sin invalidaciones → 0 trabajo). Medir, no asumir.

## 11. Geometría y draw calls

Prioridad: **Instancing → Merged geometry → Procedural → GLB optimizado**. 100 racks = 1 geometría + 1 material + muchas instancias (drei `Instances`), jamás 100 meshes. Presupuesto: **< 30 draw calls ideal, < 50 máximo** en escenas principales. Si se excede: instance/merge/reducir materiales/luces/geometría/LOD.

## 12. Asset Policy

Primera opción: **procedural** (Lightformer, luces, fog, partículas — sin assets). Segunda: GLB optimizado con pipeline `gltf-transform` (flags verificados 4.4.2: `--compress draco --texture-compress ktx2 --texture-size 2048 --instance --flatten --join --join-named false --simplify false` — ver [`ASSET-PIPELINE.md §6`](./ASSET-PIPELINE.md#6-optimización-post-authoring-spec-12--comando-concreto)), validado con `gltf-transform inspect` y gltf.report. Todo self-hosted en `/public` (CSP). Payload 3D total **< 3 MB**; excepciones requieren demostrar impacto. Detalle: racks 5–10K tris (máx 20K con LOD), texturas 1–2K (KTX2/AVIF), atlas. **Contrato de authoring (Blender → gltf-transform → R3F): [`ASSET-PIPELINE.md`](./ASSET-PIPELINE.md)** — decimate 6–8K tris, atlas 2K con RMA, Principled BSDF sin emission (LEDs como meshes `leds_*` con material emisivo asignado en runtime), export limpio, naming `{asset}_vNN.glb`.

## 13. HUD System

`<HudLabel />` basado en `drei <Html transform distanceFactor>`. Requisitos: traducible (claves i18n), responsive, sin bloquear interacción, sigue posiciones 3D, desaparece cuando corresponde, contraste suficiente, sin layout shift. **Nunca texto hardcoded (EN/ES) dentro de geometría.**

## 14. Contrato i18n

El sistema i18n existente (`LanguageContext` + `src/context/translations/*`) es fuente de verdad. Cambiar idioma **no** reconstruye el mundo 3D: las claves se resuelven en `HudLabel`/overlays DOM. Cada clave HUD nueva debe existir en `es` y `en` — validar con test unitario de paridad.

## 15. SEO

Contenido SEO permanece en DOM: h1/h2/h3/p/a/nav/section/article/footer según corresponda. Canvas `aria-hidden="true"`. Google no debe depender del Canvas para comprender quién es, qué hace, experiencia, proyectos, certificaciones, servicios ni contacto (metadata/JSON-LD existentes intactos).

## 16. Accesibilidad

WCAG 2.2 AA. Validar: navegación por teclado, focus states, HTML semántico, contraste, reduced motion, screen readers, anclas, formularios, botones, labels, skip navigation. El 3D nunca es anunciado por el screen reader. Objetivo Lighthouse Accessibility ≥ 95. Suite existente: axe-core + tests en `src/components/*.test.tsx` — mantenerlos verdes.

## 17. CSP y Threat Model

CSP estricta vigente (`next.config.ts`): no ampliar dominios ni `unsafe-eval` por el 3D. Threat model obligatorio al evaluar cambios: XSS, CSP bypass, inyección de assets de terceros, supply chain, vulnerabilidades de dependencias, secretos expuestos en cliente, superficie de ataque del Copilot, prompt injection, manipulación DOM, HTML inseguro, carga remota de assets, abuso de recursos WebGL (DoS por render). **Nunca** API keys/secrets/credentials en el cliente.

## 18. Network Policy

Tras implementar, inspeccionar Network: **sin** HDR/texturas/GLB/fuentes externos ni CDN inesperados. El tráfico legítimo existente (AI Copilot `/api/ask-ai`, PostHog, SCAudit RUM, contacto) se mantiene — no confundir tráfico de la app con dependencia de assets 3D.

## 19. Component Architecture

```
src/components/datacenter/
  DatacenterCanvas.tsx · DatacenterEnvironment.tsx · DatacenterCamera.tsx
  ServerRack.tsx · ServerRackPool.tsx · DataStreams.tsx · Particles.tsx
  BackupUnits.tsx · PurdueHologram.tsx · HudLabel.tsx · StaticPoster.tsx
  scenes/ BootSequence.tsx · CoreArchitecture.tsx · DataInMotion.tsx
          ResilienceDepth.tsx · ConnectionPoint.tsx
src/hooks/
  useHardwareDetection.ts · usePrefersReducedMotion.ts · useSectionProgress.ts
  useDatacenterCamera.ts · useAdaptiveQuality.ts · useWebGLContextManager.ts
src/lib/ datacenter.tokens.ts · scenes.ts (config data-driven)
```

La estructura real del repo tiene prioridad; no reorganizar archivos innecesariamente.

## 20. Escenas data-driven + sincronización contenido–visual

Las escenas se configuran con datos (no `if section === …` dispersos):

```ts
const scenes = [{
  id: "boot", sections: ["home"], camera: {...}, fog: {...},
  visualEvents: ["activateParticles", "emergeRack"],
}, /* … */]
```

Cada sección declara qué eventos visuales activa (ej. `siem` → `activateTelemetry`, `focusSecurityNode`, `increaseDataStreams`). El motor de narración traduce sección → evento → estado de escena → cámara → luz → HUD.

## 21. Scroll Progress

`useSectionProgress(sectionIds)` calcula: sección activa, progreso de sección, progreso global y progreso de escena. Usar **geometría real del DOM** (bounding rects) para los límites; nunca alturas hardcoded tipo `innerHeight * 4`. Un solo observer rAF-throttled alimentando motion values (sin listeners por sección).

## 22. Frame Loop

`useFrame()` solo para operaciones visuales necesarias. Prohibido dentro: actualizaciones de estado React, manipulación DOM, cálculos caros, network, allocation de objetos. Preferir mutación de refs (`ref.current.position.lerp`) sobre `setState`.

## 23. Micro-interacciones

Permitidas: parpadeo de LEDs, partículas sutiles, pulse de status, flujo de datos, "respiración" de luz ambiental. Regla: **micro-animación ≠ animación cara constante** — escalan con el tier de calidad (§9).

## 24. Responsive

Desktop: experiencia completa. Tablet: geometría/DPR/partículas reducidos. Mobile: escena simplificada, recorrido de cámara reducido, partículas mínimas. Low-end mobile: StaticPoster. Nunca sacrificar contenido, navegación, SEO, accesibilidad ni Copilot.

## 25. StaticPoster

**Medición LCP (Lighthouse móvil emulado, reduce-motion, Chromium 1228):** baseline 13.62 s → **6.04 s** (−56%, consistente en 2 corridas); elemento LCP = el póster (`body > div > img`) con las 3 checks de discovery en verde (`fetchpriority=high applied`, `requestDiscoverable`, `eagerlyLoaded`). Reports: `docs/datacenter/reports/lcp-lighthouse/`. Restricción de Chromium documentada en el código: una imagen con borde inferior ≥ viewport no entra al conjunto de candidatos LCP → la altura del `<img>` es `calc(100vh - 1px)` (full-bleed visual, candidato LCP real).

El fallback no parece "modo error": parece "modo operational / low power". Mantiene marca, identidad, concepto datacenter, jerarquía visual y navegación: rack oscuro, nodo central, luces de estado, telemetría estática (CSS/DOM, sin animación bajo reduced-motion).

**Visual actual:** el póster "Cold Cathedral" (`public/images/cold-cathedral-poster.webp`, exportado de `artwork/living-datacenter/canvas.png`, 42 KB). Es la **capa base Z-10 siempre presente en el HTML inicial** (server-side desde `page.tsx`); el canvas opaco Z-20 la cubre en modo normal. Se renderiza como `<img>` (no background-image) con `fetchpriority="high"` y dimensiones explícitas (1400×1867) para ser el **LCP correcto en modo estático** (pinta sin esperar hidratación); el `<head>` (layout) inyecta un `<link rel="preload" as="image">` condicional cuando aplica reduce-motion (OS o toggle manual). Scrim radial sutil para legibilidad del DOM (Z-40). `aria-hidden`, `pointer-events: none`.

## 26. Failure Strategy + Error Boundary

- WebGL no disponible / Three.js falla / GLB falla → fallback procedural o StaticPoster.
- GPU débil → tier LOW/STATIC. Reduced motion → estático. JS pesado sin cargar → sitio DOM usable.
- `webglcontextlost` en el canvas → desmontar el canvas; el póster base Z-10 queda visible (nunca excepción no capturada).
- `<DatacenterErrorBoundary><DatacenterCanvas /></DatacenterErrorBoundary>` — un error de Three.js nunca tumba el portfolio; el fallback del boundary desmonta el canvas (el póster base ya está en el DOM, sin duplicarlo).
- Consolidación de contextos y ciclo de vida del modal: ver `ADR-003`.

## 27. Copilot Visual Event Bus

El 3D **observa** el estado del Copilot sin controlar su lógica: `IDLE → estado ambiental normal`, `THINKING → pulso del nodo central`, `STREAMING → actividad de flujos de datos`, `ERROR → indicador ámbar/rojo sutil`, `COMPLETE → pulso de sincronización`. Arquitectura: estado del Copilot → visual event bus → respuesta visual 3D. Nunca modificar la lógica del Copilot (CONSTITUTION R4).

## 28. Observabilidad

Dev-only: `DatacenterDebugPanel` (FPS, draw calls, triángulos, DPR, tier, escena activa, progreso de scroll, memoria) — **desaparece en producción**. Producción (opcional): web vitals, tier de dispositivo, disponibilidad WebGL, reduced motion, activación de fallback — sin recolectar información innecesaria.

## 29. Testing

- Unit/integration: Vitest + Testing Library (existente) — mantener y extender: i18n parity, `useSectionProgress`, `useAdaptiveQuality`, HUD.
- E2E: Playwright (existente en `e2e/`) — anchors, navegación, Copilot, modal, fallback.
- Accesibilidad: axe-core (existente).
- Visual: snapshots **solo del StaticPoster** y composiciones DOM (WebGL en CI es flaky); QA visual manual por escena con checklist.
- Commands del repo: `npm run typecheck` · `npm test` · `npm run lint` · `npm run build` · `npx playwright test`.

## 30. Browser Matrix

Chrome/Firefox/Safari/Edge desktop; Chrome Android; Safari iOS. Prioridad crítica: iPhone, Android mid-range, Android low-end.

**QA de dispositivo:** el gate de performance en mobile se valida con el checklist [`QA-DEVICE-CHECKLIST.md`](./QA-DEVICE-CHECKLIST.md) (FPS del canvas, TBT, batería, bundle 3D y CWV en dispositivo real, con baseline local de referencia).

## 31. Performance Contract (relativo al baseline)

**Medir primero, fijar números después.** En la Fase 0 se registra el baseline real (bundle, CWV, draw calls actuales). Los contratos se expresan como **deltas de la capa 3D**, no como absolutos de página (la app base ya supera 200 KB de JS; un absoluto < 200 KB es irreal):

- Capa 3D: assets < 3 MB (ideal: 0 si procedural puro) · draw calls < 50 · triángulos < 250K mobile / < 500K desktop · +1 contexto WebGL (o 0 en STATIC).
- Página: LCP, CLS < 0.1, INP — sin regresión respecto al baseline medido.
- Objetivos Lighthouse (aspiracionales, no gate): Performance ≥ 90, A11y ≥ 95, Best Practices = 100, SEO ≥ 95. Gate real = deltas del baseline + CWV de campo (field data).

## 31b. Auditoría de performance local (medida, 2026-08-10)

**Lighthouse móvil emulado (build de producción local, Chromium 1228):** Performance 50, Accessibility 95 ✓, Best Practices 96 (fails: `errors-in-console` = CORS de SCAudit RUM en localhost — solo entorno local; `valid-source-maps` = build prod sin sourcemaps, estándar), SEO 100 ✓. LCP 4.8–6.5 s, FCP 1.2–1.7 s, TBT 1.2–1.6 s, CLS 0. Reports: `docs/datacenter/reports/perf-audit/`.

**Bundle:** ~1.28 MB JS gz + 793 KB imágenes (content, `sizes` correctos) + 112 KB fonts ≈ 2.3 MB total (presupuesto soft §43: 1.5 MB). **Hallazgo estructural de Next 16/Turbopack:** el HTML inicial emite `<script async>` para TODOS los chunks dinámicos del grafo RSC (incluidas las secciones `next/dynamic` y el bundle 3D) — `next/dynamic` NO evita la descarga, solo la ejecución diferida. En reduce-motion el bundle 3D (~231 KB gz) igual se descarga y ejecuta. Cambios aplicados en esta auditoría: (1) `DatacenterCanvas` como chunk lazy dentro de `DatacenterExperience` (reduce-motion: TBT 1610→1450 ms, unused JS 724→712 KiB; normal: neutro, TBT 1150–1490 ms); (2) rAF-throttle del scroll del `Navbar`. Para eliminar la descarga del bundle 3D en reduce-motion haría falta sacar el canvas del grafo RSC de la página (cambio arquitectónico, fuera del alcance seguro).

## 32. Dependency Governance

Antes de instalar: ¿ya existe? ¿compatible React 19? ¿Next 16? ¿impacto de bundle? ¿mantenimiento? ¿SSR/client? ¿CSP? No instalar automáticamente. GSAP no está instalado y **no es necesario**: framer-motion 12 (`useScroll`/`useSpring`/`useTransform`) cubre el scrubbing. `drei ScrollControls` prohibido (secuestra scroll y rompe anclas).

## 33. Implementation Phases (con gates)

| Fase | Contenido | Gate |
| --- | --- | --- |
| **0 Discovery** | Architecture Discovery Report versionado en `docs/datacenter/discovery.md`: IDs, deps, fuentes, CSP, baseline bundle/CWV/draw calls. Leer `node_modules/next/dist/docs/` (Next 16). | Report completo |
| **1 Empty Canvas** | `DatacenterCanvas` + `StaticPoster` + hardware detection + reduced motion + `useWebGLContextManager` (ADR-003 Fase B). Canvas vacío. | DOM, scroll, anchors, Copilot, screen readers OK |
| **2 Camera** | `useScroll`→`useSpring`→`useSectionProgress`→`useDatacenterCamera` + waypoints. | Movimiento estable, sin jitter ni CPU excesiva |
| **3 Environment** | Lightformers, luces, fog procedural. | CSP y Network limpios |
| **4 Geometry** | Racks/cables/servidores/partículas/backup/PurdueHologram/topología (mindmap.ts) con instancing + LOD. | Draw calls, FPS, memoria, mobile medidos |
| **5 HUD + i18n** | `HudLabel`, overlays, claves ES/EN. | Cambio de idioma sin romper escena/cámara |
| **6 GLB opcional** | Solo si procedural no alcanza; pipeline gltf-transform. | Impacto visual demostrado, < 3 MB |
| **7 Copilot restyle** | Solo shell visual (CSS/Tailwind) + visual event bus. | Streaming/interacción/z-index intactos |
| **8 Final QA** | typecheck, lint, tests, e2e, build, Lighthouse, CSP/network audit, a11y, mobile, `npm audit`. | Ver §35 Acceptance Criteria |

Si algo falla en un gate: STOP, reportar (CONSTITUTION §12) y no avanzar.

## 34. Git Strategy

Branch `feat/living-datacenter` (desde un árbol limpio o sin tocar archivos sucios de otros threads). Commits pequeños y reversibles: `feat(datacenter): add canvas shell`, `feat(datacenter): add camera scrubbing`, `feat(datacenter): add HUD system`, `feat(copilot): apply datacenter visual shell`, `chore(datacenter): remove MindMap3D dead code`. Nunca un commit monolítico. Antes de operaciones git: revisar `git status` (otros agentes pueden trabajar en paralelo).

## 35. Acceptance Criteria

**Content:** 13+ secciones originales existen, indexables, anchors funcionan, navegación OK. **3D:** exactamente 5 escenas conectadas al scroll DOM, cámara suave, sin hijacking, canvas decorativo. **i18n:** ES y EN funcionan, HUDs traducibles, sin texto hardcoded en geometría. **A11y:** canvas aria-hidden, teclado, screen readers, reduced motion, contraste, focus. **Performance:** sin regresión vs baseline, draw calls en presupuesto, FPS estable, GPU idle en reposo, mobile validado. **Security:** CSP sin violaciones, sin assets 3D externos, sin CDN innecesario, sin unsafe-eval. **Copilot:** funcionalidad/streaming/API/z-index intactos. **Fallback:** WebGL failure, reduced motion, low-end, poster.

## 36. Final System Test

Recorrido completo: `#home → #perfil → #arquitectura → #experiencia → #confianza → #siem → #audit-hub → #scaudit → #blog → #stack → #certificaciones → #proyecto → #contacto → Footer`, verificando que DOM + cámara + luz + HUD + i18n + Copilot + performance + accesibilidad funcionan simultáneamente.

## 37. Phase Report Format

Al terminar cada fase: `PHASE / STATUS / IMPLEMENTED / FILES CREATED / FILES MODIFIED / DEPENDENCIES / ARCHITECTURAL IMPACT (LOW-MED-HIGH) / PERFORMANCE (FPS, draw calls, DPR, bundle) / ACCESSIBILITY / SECURITY-CSP / I18N / COPILOT (UNCHANGED|MODIFIED VISUALLY) / TESTS / GATE (PASS|FAIL) / NEXT PHASE`. Decisiones MEDIUM/HIGH incluyen el Decision Engine (CONSTITUTION §7).
