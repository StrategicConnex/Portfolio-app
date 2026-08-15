# Audit Creativo — Landing juanpalacios.vercel.app · "THE LIVING DATACENTER"

> **Fecha:** 2026-08-11 · **Rol:** Director Creativo Digital + Lead Creative Developer (nivel Awwwards/SOTD)
> **Estado:** el concepto central del brief **ya está implementado** (Fases 0→8 + Fase 6 GLB, 5 escenas, cámara sobre scroll, HUD, calidad adaptativa, Copilot). Este doc es el audit honesto contra las 5 referencias obligatorias: qué se cumple, qué falta y qué movería el sitio de "funcional" a "nominable".
> **Docs raíz:** [`SPEC.md`](./SPEC.md) (contrato de la experiencia) · [`CONSTITUTION.md`](./CONSTITUTION.md) (invariantes) · [`ASSET-PIPELINE.md`](./ASSET-PIPELINE.md) · [`ASSET-SCENE-MAP.md`](./ASSET-SCENE-MAP.md) · [`MESHY-CONTACT-SHEET.md`](./MESHY-CONTACT-SHEET.md)

---

## 1. Análisis crítico: sitio actual vs concepto (vs las 5 referencias)

### 1.1 Lo que ya existe (y cumple el brief)

| Requisito del brief | Estado real | Evidencia |
|---|---|---|
| Fondo estático → entorno 3D narrativo | ✅ **Ya hecho**: canvas fijo Z-20 detrás del DOM, 5 escenas conectadas al scroll | `DatacenterCanvas` + `SCENES` (5 waypoints entry/mid/exit c/u) |
| Scroll = cámara cinematográfica | ✅ **Ya hecho** (mecánica exacta de Hanwha) | `useScroll → useSpring → useSectionProgress → useDatacenterCamera` |
| Elementos clave (racks, streams, storage, holografías) | ✅ Racks instanciados + hero GLB, data streams, backup units S4, `PurdueHologram` S2, HUD labels | `ServerRackPool`, `DataStreams`, `BackupUnits`, `PurdueHologram`, `HudLabel` |
| Performance first + fallback elegante | ✅ Calidad adaptativa (ULTRA→STATIC), `frameloop="demand"`, StaticPoster, error boundary aislado | `useAdaptiveQuality`, `useWebGLContextManager` |
| Reduced motion + alternativa estática | ✅ `usePrefersReducedMotion` + StaticPoster + toggle manual | report-1..8 |
| DOM funcional sobre canvas (CTAs, nav, Copilot) | ✅ Arquitectura de capas Z-10/20/30/40/50; DOM es fuente de verdad | CONSTITUTION L0 |
| Anti-patrones (sin scroll-jacking, sin stock, sin neon excesivo) | ✅ Cumplido por contrato (SPEC §3, R3, R6) | — |

**Conclusión 1.1:** el brief pide, en esencia, lo que el proyecto ya construyó. El valor del audit no es "empezar de cero" — es identificar **dónde la implementación actual se queda a un paso del nivel Awwwards** comparando mecánica y dirección de arte con las 5 referencias.

### 1.2 Las 5 referencias → lecciones → gap real

| Referencia | Mecánica que enseña | Gap real en el sitio actual |
|---|---|---|
| **NRG · Build Your Data Center** (Rogue) | **Narrativa por fases** (Evaluation → Site Development → Construction → Power Ramp-Up → Fully Operational) + **agencia del usuario** ("hazlo simple complejo"). El visitante *construye* el datacenter. | El sitio es **paso de cámara pasivo** (modelo Hanwha), no *build lifecycle*. El único momento "fases" es el Purdue (L0-L5) en S2. **Oportunidad:** vestir la narrativa como ciclo de vida del sistema — cada sección = una fase del build (identidad→arquitectura→datos→resiliencia→conexión). |
| **Hanwha Ocean FPSO** | Scroll = cámara que **viaja a través de la infraestructura**, storytelling + responsive + inmersivo. | ✅ **Es el modelo actual** (S1→S5). Gap menor: la cámara viaja sobre el corredor pero no *atraviesa* espacios (sin "puertas" ni cambio de nivel perceptible más allá de S4). FPSO tiene momentos de *descenso/atravesar*. |
| **Noomo Showcase** | Portfolio tech **sin formato tradicional**: el contenido se convierte en vitrina inmersiva, balanceando inmersión con navegación usable y performance. | El DOM del sitio sigue siendo un **portfolio de tarjetas convencional** (13 secciones contractuales con cards). No es un problema de estructura (invariante), es de **tratamiento**: la capa DOM no "conversa" con el 3D (HUD sí, tarjetas no). |
| **Mastercard Business Outcomes** | Interactive 3D scroll + storytelling de **"hacer visible lo invisible"**: KPIs y outcomes encarnados en el 3D. | El HUD/telemetría existe (labels, streams) pero los **datos del portfolio no se encarnan** en la escena (no hay "outcomes" visuales por sección: x años, y certificaciones, z incidentes — números como geometría de luz). |
| **iyO** | High-fidelity 3D + **configurador bespoke** + elegancia por encima de efectos. | La geometría es **procedural low-poly** por contrato (§12 default SKIP). Los GLB hero (rack v02, storage) son el primer paso. **Oportunidad:** el "configurador" del portfolio ya existe y es intocable — el AI Copilot (S7). El 3D debe *observar* sus estados (event bus) como hace un configurador con el estado del producto. |

### 1.3 Juicio del Director Creativo

El sitio es **técnicamente superior a la media Awwwards** (arquitectura de capas, adaptative quality, DOM-first, zero external fetch — la mayoría de los nominados no tienen esto). Le falta **el último 15% de dirección de arte y narrativa**:

1. **Narrativa de fases (NRG)** — el recorrido no comunica "estoy construyendo el sistema"; comunica "estoy mirando un sistema". Es la diferencia entre *recorrer* y *construir*.
2. **El DOM no dialoga con el 3D** (Noomo) — tarjetas estándar sobre una escena cinematográfica.
3. **Los datos no se encarnan** (Mastercard) — los números del perfil deberían *ser* la escena, no solo labels.
4. **Fidelidad 3D limitada** (iyO) — resuelta parcialmente con los GLB hero; falta el pool de switch/display para llenar S2/S3.

Todo lo anterior es **capa de dirección de arte + data-driven scenes**, no re-arquitectura. Ningún invariante se toca.

---

## 2. Moodboard técnico (extraído de las 5 referencias)

### 2.1 Mecánica narrativa

| Fuente | Principio transferible | Traducción al proyecto |
|---|---|---|
| NRG | Fases con nombre + progreso visible ("Phase 3/5") | HUD de escena: `PHASE 02/05 · CORE ARCHITECTURE` (ya hay `HudLabel` + i18n — solo añadir la numeración de fase) |
| NRG | Complejidad simplificada ("like a model railway") | El corredor ya lo logra: geometría limpia, sin cables, sin caos (§3 del SPEC) |
| Hanhwa | Transiciones = viaje físico (atravesar, descender) | ✅ **Cumplido (P4):** la cámara de S3 atraviesa los racks hasta z=−4.7 entre las filas (waypoint x=1.1 para evitar display SIEM y columna de anillos); el HUD cede al pasar el plano de cámara (cull en `HudLabel`) — [report-p4-label-culling-passthrough](./reports/report-p4-label-culling-passthrough.md) |
| Mastercard | El dato es la escena ("making the invisible visible") | Encarnar KPIs: nº certificaciones = nodos de luz en S3; años de experiencia = anillos en el rack hero S1; incidentes mitigados = contadores en HUD con anclaje 3D |
| iyO | Configurador = estado visible | El event bus del Copilot ya reacciona a estados (IDLE/THINKING/STREAMING) — ampliar a secciones DOM (sección activa → nodo focal iluminado) |
| Noomo | Navegación usable sobre inmersión | Ya cumplido (Navbar Z-40 + anchors + skip nav). Mantener como es. |

### 2.2 Dirección de arte (luz, material, color)

| Eje | Referencias | Directriz aplicable | Estado actual |
|---|---|---|---|
| Iluminación | Hanhwa (volumétrica), iyO (estudio) | Luz "de sala limpia": key fría + bounce ambiental; **sin ray tracing real** — simular con fog + Lightformers + `MeshPhysicalMaterial` con `clearcoat` sutil en GLBs hero | ✅ Lightformers + fog por escena (S1 frío → S4 ámbar → S5 blanco). Gap: sin clearcoat en GLBs (se puede añadir en runtime, bridge §4 no lo prohíbe — solo prohíbe emission) |
| Materiales | iyO (high-fidelity), NRG (premium) | Cristal ahumado para HUD panels; metal cepillado en bezels (metalness 0.85-0.9 / roughness 0.3-0.5 — ya contratado) | ✅ contrato PBR existente |
| Partículas | Hanhwa (polvo en suspensión), iyO (precisión) | Partículas = polvo fino, baja densidad, siempre en segundo plano | ✅ `Particles` adaptativo por tier |
| Color | Todas | Base oscura premium + **acento neón SOLO para estado** (azul boot / cyan actividad / ámbar resiliencia / blanco conexión) | ✅ paleta por escena ya definida (datacenter.tokens) |
| Tipografía | iyO/Noomo (editorial) | El brief pide Suisse Int'l + Monument Extended (comerciales). **Decisión:** mantener Space Grotesk + JetBrains Mono (self-hosted, R5/§4). Monument Extended ≈ Space Grotesk en peso 700 con tracking tight; Suisse ≈ Inter actual. El gap real no es la familia, es el **tratamiento**: tamaños display + tracking + integración con el HUD | ⚠️ tipografía correcta por contrato; tratamiento DOM mejorable |

### 2.3 Performance (la parte que casi nadie tiene)

| Práctica de referencia | Proyecto |
|---|---|
| WebGL con calidad adaptativa | ✅ ULTRA→STATIC por hardware + `frameloop="demand"` |
| Fallback estático elegante | ✅ StaticPoster (modo "low power") |
| Cero dependencias externas runtime | ✅ R5: todo self-hosted/procedural |
| Bundle controlado | ✅ 0.62 MB de GLB < 3 MB (§12); 3D lazy en reduce-motion |

---

## 3. Stack tecnológico recomendado (Vercel)

**Decisión honesta: NO añadir GSAP.** El stack actual ya cubre la mecánica con menos deps y sin conflicto con el SPEC:

| Capa | En uso | Veredicto |
|---|---|---|
| Next.js 16 (App Router, Turbopack) | ✅ | Mantener |
| React 19.2 + TS strict | ✅ | Mantener |
| three 0.185 + R3F 9 + drei 10 | ✅ | Mantener (drei solo lo imprescindible: `Html`, `Lightformer` — no `Environment`) |
| Framer Motion 12 | ✅ | Mantener — cubre `useScroll`/`useSpring` (cámara) **y** DOM reveals sin otra dep |
| **GSAP + ScrollTrigger** | ❌ no instalado | **NO agregar** (§44, anti-overengineering): duplicaría `useScroll`/`useSpring` ya existentes; ScrollTrigger sobre el scroll nativo chocaría con el patrón de cámara actual; +~60 KB gz sin ganancia medible. Si algún día se quiere scrub de video, se hace con `useScroll` nativo (ya probado en el thread). |
| i18n (es/en) | ✅ | Mantener — los HUD de fase salen de las mismas keys |
| Fuentes | ✅ `next/font` self-hosted | Mantener Space Grotesk/JetBrains Mono (§4 + R5). Suisse/Monument Extended = decisión de licencia aparte (ARCHITECTURAL) — no bloquea el nivel visual |
| AI Copilot | ✅ intocable (L0) | Mantener; el 3D solo observa vía event bus |

**Única dependencia que se justificaría (y solo si se decide):** ninguna nueva. Todo el plan de §4-§6 se hace con el stack actual.

---

## 4. Storyboard detallado (5 escenas → 5 fases del build)

Recorrido propuesto como **ciclo de vida del sistema** (lección NRG), sobre los waypoints existentes — solo cambios de *mensaje, luz y datos*, cero cambios de cámara/estructura:

### SCENE 01 · BOOT — *Phase 01/05 · IDENTIDAD*
- **Qué se ve:** rack hero emergiendo de la niebla (GLB v02, puerta de malla), polvo fino, LEDs azules de boot. DOM: hero con foto + título (intocable).
- **Movimiento cámara:** lento acercamiento 20→9 (ya existe).
- **Mensaje:** `SYSTEM INITIALIZING · Juan Felipe Palacios · IT/OT + Cybersecurity + Cloud + AI`.
- **Acento de datos (Mastercard):** anillos de experiencia alrededor del rack (1 anillo ≈ 5 años) como geometría de luz; contador de proyectos en HUD con anclaje 3D.
- **Cambio para el nivel Awwwards:** pulso de *boot* sincronizado en el DOM del hero (borde glow sutil, teletipo JetBrains Mono sobre la foto) — SAFE (CSS).

### SCENE 02 · CORE ARCHITECTURE — *Phase 02/05 · DISEÑO*
- **Qué se ve:** corredor simétrico, Purdue holográfico (L0-L5), topología.
- **Movimiento:** avance por el eje; **nuevo**: un waypoint intermedio que *atraviese* entre dos filas de racks (sutil, sin mareo — lerp ya contratado).
- **Mensaje:** `ARCHITECTURE · IT/OT · Purdue Model · Zero-Trust`.
- **Cambio:** numeración de fase en HUD (`PHASE 02/05`) + nodo Purdue del perfil iluminado cuando la sección activa es #perfil.

### SCENE 03 · DATA IN MOTION — *Phase 03/05 · DATOS*
- **Qué se ve:** streams cyan, SIEM, certificaciones como nodos de luz, switch pool (cuando exista) con actividad de puertos.
- **Mensaje:** `DATA IN MOTION · Proyectos · Certificaciones · SIEM/SOC`.
- **Acento (Mastercard):** cada certificación = nodo que se enciende en la red; KPIs del dashboard SIEM encarnados en HUD con anclaje al panel.
- **Cambio:** el slot del switch cerca de cámara (gap de fit detectado en MESHY-CONTACT-SHEET §1b) — el grid de puertos debe ser legible aquí.

### SCENE 04 · RESILIENCE & DEPTH — *Phase 04/05 · HARDENING*
- **Qué se ve:** nivel inferior, storage protagonista (GLB) con luz ámbar, redundancia.
- **Mensaje:** `RESILIENCE · Audit · Backup · Governance`.
- **Acento:** latidos ámbar sincronizados con el estado de los audit cards del DOM (event bus de sección).
- **Cambio:** arreglar el fit de cámara (storage fuera de frame en entry — §1b): waypoint entry un poco más cerca de la unidad.

### SCENE 05 · CONNECTION — *Phase 05/05 · LIVE*
- **Qué se ve:** pull-back alto del datacenter completo, nodo central pulsando, grid sincronizado.
- **Mensaje:** `CONTACT · CONNECT · COLLABORATE`.
- **Acento:** el formulario de contacto (DOM, Z-40) se enciende con el pulso del nodo — conexión literal entre el 3D y el CTA.
- **Cambio:** nada estructural; el pulso ya existe (`pulseCentralNode`).

**Regla transversal:** cada cambio de fase = transición de **temperatura de color** (azul frío → cyan → ámbar → blanco) ya definida; añadir **fog por fase** con el mismo near/far por escena (ya existe).

---

## 5. Estructura de componentes / base code (vinculado a scroll)

La arquitectura ya está montada y verificada — esta es la base sobre la que se aplica el plan:

```
src/
├── lib/
│   ├── scenes.ts              # 5 escenas data-driven: sections + entry/mid/exit + fog + visualEvents
│   ├── datacenter.layout.ts   # rack/storage/streams/particles + GLB_ASSETS (manifiesto)
│   └── datacenter.tokens.ts   # paleta por escena (temperatura de color)
├── hooks/
│   ├── useSectionProgress.ts  # geometría DOM real → progress normalizado
│   ├── useDatacenterCamera.ts # spring + lerp de waypoints (sin setState en frame)
│   ├── useAdaptiveQuality.ts  # tier ULTRA→STATIC
│   └── useWebGLContextManager.ts
└── components/datacenter/
    ├── DatacenterExperience.tsx   # mount: reduced-motion → poster | canvas
    ├── DatacenterCanvas.tsx       # Canvas R3F, frameloop=demand, dpr adaptativo
    ├── DatacenterScene.tsx        # escena activa → eventos visuales declarados
    ├── DatacenterCamera.tsx       # interpola waypoints → useFrame (refs)
    ├── ServerRackPool.tsx         # racks instanciados + slot GLB hero (v02)
    ├── BackupUnits.tsx            # storage instanciado + slot GLB S4
    ├── DataStreams.tsx / Particles.tsx / PurdueHologram.tsx
    ├── HudLabel.tsx               # Html transform + i18n (labels de escena/fase)
    ├── GlbAsset.tsx / GlbMesh.tsx # GLB con fallback procedural (SPEC §37) + bridge §4
    └── StaticPoster.tsx           # fallback "low power" (reduce-motion / WebGL off)
```

**El cableado scroll→cámara (la pieza que el brief pide "vincular al scroll") ya está así:**

```ts
// scenes.ts — config pura (ej. S3): el scroll nunca se toca aquí
{ id: 'data-in-motion', sections: ['experiencia','proyecto','certificaciones','siem'],
  camera: { entry: [1.5,1.8,6], mid: [2.5,1.6,3.5], exit: [1,0.8,3] /* + lookAt + fov */ },
  fog: { near: 9, far: 26 }, visualEvents: ['activateDataStreams','activateTelemetry','focusSecurityNode'] }

// useSectionProgress → progress 0..1 por sección real del DOM (sin alturas hardcoded)
// useDatacenterCamera → interpolateWaypoints(entry→mid→exit, progress) → refs (lerp en useFrame)
// DatacenterScene → visualEvents[activos] → MicroAnimDriver (LEDs/streams por escena)
```

**Gaps de código para el plan (todos L2, ninguno toca invariantes):**

| # | Cambio | Clase | Coste |
|---|---|---|---|
| G1 | `PHASE 0n/05` en HudLabel (i18n es/en) | SAFE — **✅ implementado + validado en navegador real** ([report-g1-phase-hud](./reports/report-g1-phase-hud.md) · [validación](./reports/report-g1g5g6-browser-validate.md)) | bajo |
| G2 | Nodo focal por sección (sección activa → nodo 3D iluminado) | ARCHITECTURAL — **✅ implementado 2026-08-11** (`focusNode` store + `FocusNodeLayer`, reporte [`report-g2-focus-node`](./reports/report-g2-focus-node.md)) | medio |
| G3 | Datos encarnados (anillos/contadores desde datos reales de `src/data/`) | ARCHITECTURAL — **✅ implementado 2026-08-12** (`datacenterData.ts` + `DataRings.tsx`, reporte [`report-g3-data-embodiment`](./reports/report-g3-data-embodiment.md)) | medio |
| G4 | Pool switch + display (slots ya declarados en `GLB_ASSETS`) + waypoint S4 de storage | ARCHITECTURAL (con gate §1b) | ✅ **implementado** — `reports/report-g4-switch-display-pools.md` |
| G5 | Clearcoat sutil en GLBs hero (runtime, bridge §4) | SAFE — **✅ implementado + validado en navegador real** ([report-g5-clearcoat](./reports/report-g5-clearcoat.md) · [validación](./reports/report-g1g5g6-browser-validate.md)) | bajo |
| G6 | Tratamiento editorial del DOM (tamaños display, tracking, teletipo) | SAFE (CSS) — **✅ implementado + validado en navegador real** ([report-g6-editorial-dom](./reports/report-g6-editorial-dom.md) · [validación](./reports/report-g1g5g6-browser-validate.md)) | bajo-medio |

---

## 6. Verificación anti-patrones (autochequeo del brief)

| Anti-patrón | Estado | Nota |
|---|---|---|
| ❌ Apariencia SaaS/Bootstrap | ⚠️ El DOM es la parte más convencional (cards) — G6 ataca esto | No es estructural (las 13 secciones son invariante) |
| ❌ Bloques densos/tarjetas repetitivas | ⚠️ Idem G6 — tratamiento, no estructura | — |
| ❌ Stock photos/renders estáticos | ✅ Cero; foto del hero es propia; poster es procedural | — |
| ❌ Efectos chillones/parallax excesivo | ✅ Contrato §3 (restraint) + frameloop demand | — |
| ❌ Colores saturados sin justificación | ✅ Temperatura de color por fase | — |
| ❌ Sacrificar legibilidad/velocidad | ✅ DOM-first + a11y + Lighthouse en gate | — |

---

## 7. Decisión de Dirección Creativa (resumen ejecutivo)

1. **No re-hacer nada estructural.** El concepto THE LIVING DATACENTER está implementado con un nivel de ingeniería por encima del promedio Awwwards.
2. **Invertir en el último 15%:** (a) narrativa de fases tipo NRG (**G1 ✅** — `PHASE 0n/05` en HUD), (b) datos encarnados tipo Mastercard (**G3 ✅** — anillos/contadores holográficos desde `src/data/` reales: 99.9% uptime, −30% incidentes, −10h/sem, 131/142 controles, marcos de cumplimiento y severidades de amenaza), (c) diálogo DOM↔3D tipo Noomo (**G2 ✅** — baliza de sección activa; **G6 ✅** — tratamiento editorial DOM), (d) fidelidad con los GLB/pools (**G4 ✅** — `ServerSwitchPool` + `SiemDisplayPanel` con GLBs declarados + fit S4 corregido), (e) pulido de materiales (**G5 ✅** — clearcoat en GLBs hero).
3. **No añadir GSAP** (duplicación; §44).
4. **No cambiar tipografía** por defecto (Space Grotesk/Mono cumplen; Suisse/Monument = decisión de licencia aparte).
5. **Estado (2026-08-12):** **G1 · G2 · G3 · G4 · G5 · G6 · G7 implementados** — audit COMPLETO. Reportes: [`report-g1-phase-hud`](./reports/report-g1-phase-hud.md) · [`report-g2-focus-node`](./reports/report-g2-focus-node.md) · [`report-g3-data-embodiment`](./reports/report-g3-data-embodiment.md) · [`report-g3-1-countup`](./reports/report-g3-1-countup.md) · [`report-g4-switch-display-pools`](./reports/report-g4-switch-display-pools.md) · [`report-g5-clearcoat`](./reports/report-g5-clearcoat.md) · [`report-g6-editorial-dom`](./reports/report-g6-editorial-dom.md) · [`report-g7-fidelity`](./reports/report-g7-fidelity.md). **G1 · G5 · G6 validados en navegador real** ([report-g1g5g6-browser-validate](./reports/report-g1g5g6-browser-validate.md)) y **G7 validado en S1** ([report-g7-s1-validation](./reports/report-g7-s1-validation.md)). **G3 validado en runtime** (anillos por escena S2/S3/S4 con los datos reales de `src/data/`, 0 errores de consola — ver reporte G3) y **G3.1 count-up validado en runtime** (S2 `8%→94%`, S4 `11/142→131/142`, easing visible — ver reporte G3.1). **Fix de bug raíz:** `usePrefersReducedMotion()` se usaba como booleano (devuelve `{reduced, toggle}`) en `DataRings`/`HudLabel`/`FocusNodeLayer` — objeto siempre truthy → count-up y pulso G2 congelados; corregido con destructuring. **P1 (2026-08-14) — materialidad:** env map 1024 solo en ULTRA, 3 Lightformers extra (tira cálida S4, tira vertical fría, ring cyan S1), losetas de raised floor instanciadas (1024, 1 DC) con vent tiles cyan bajo el corredor, y sombras de contacto para el storage (ContactShadows reales, bake 1 frame) y el switch (AO simulado por superficie vertical) — [`report-p1-materiality`](./reports/report-p1-materiality.md). Draw calls ~45 < 50, sin regresión en capturas reales (S1/S5 byte-iguales).

**P0 (2026-08-14) — audit de diseño ejecutado:** paleta unificada DOM↔3D (`#04080F`), azul instrumental `#4DA3FF` (reemplaza el dodger plantilla), champagne `#E8D5AC`, rim light por escena (recorta racks del fondo — ataca el look "cuadrados"), vignette cinematográfica z-30 y editorial DOM (`.eyebrow`/`.hairline`, escala display, acentos `var(--blue)`) — [`report-p0-visual-design`](./reports/report-p0-visual-design.md). Validado en navegador real: S4 pasa de 90%→77% de oscuridad (el storage ámbar ahora se lee), saturación en reposo baja, consola sin errores nuevos.

**P2 (2026-08-14) — Phase Gate, la firma del sitio:** overlay DOM fijo z-30 (bajo contenido, sobre canvas) sin pointer-events que tiñe el frame con la temperatura de la fase activa — azul `#4DA3FF` → cian `#22d3ee` → ámbar `#f59e0b` → champagne `#E8D5AC` — sincronizado con el store `activeScene` (useSyncExternalStore, re-render solo al cruzar), crossfade de 700 ms por capas, anulado bajo reduced-motion y en tier STATIC. Validado en navegador real: fase estable por sección (boot→architecture→data-in-motion→resilience→connection) y arco de temperatura medido por canal (S4 ΔR +10.6 cálido; S1 ΔB +8.6 frío) — [`report-p2-phase-gate`](./reports/report-p2-phase-gate.md). **Validación de materialidad de cerca (zoom, distancia de cámara real):** losetas leen como grid (S4 12-155 bordes estructurales), vent tiles del plenum leen como dos bandas cian (S1 b−r 46-54; S4 21-44) y los reflejos del env map se ven sobre rack y storage (specular blanco + tira fría `128/157/192` en S1; specular + teal `162/217/200` en S4; ámbar puntual sutil 2.7-4.9%). Capturas en `refcheck/p2-closeup/`.

**P3 (2026-08-14) — cinematografía: encuadre asimétrico y push-in.** Waypoints data-driven de S2/S3/S5 recompuestos a la regla de tercios (el sujeto no vive en el centro — lección iyO/NRG): S2 deriva a la derecha con el pasillo recediendo a la izquierda (negativo para el copy), S3 hace push-in profundo hasta z=1.6 mirando a lo largo del pasillo (el close-up con rack focus del §5 con más profundidad; sin atravesar los racks — los Html labels quedarían detrás de cámara, diferido), S5 es un reveal diagonal con líneas de fuga. S1 (simetría de la tesis) y S4 (fit G4) intactos. Validado: S3 −7.4pp de oscuridad (más corredor iluminado en frame), S2/S5 reencuadrados, S1/S4 byte-cercanos. **Dos intentos medidos y rechazados por evidencia:** DoF real (postprocessing 6.39 — el composer funciona pero el DepthOfField es no-op verificado con bokeh 12 + target + focusDistance: varianza de Laplaciano idéntica; dep eliminada, bundle 3D sin peso muerto) y pulido "opción A" del P2 (storage 2.7%→2.7% cálido, piso sat 0.734→0.733 — el lever real del storage cálido es la materialidad del GLB, no la intensidad de luz) — [`report-p3-cinematography`](./reports/report-p3-cinematography.md).

**P4 (2026-08-14) — atravieso de racks (lección Hanwha, cierre del diferido de P3):** el push-in de S3 ahora CONTINÚA dentro del corredor hasta z=−4.7 (entre las filas 1 y 2 de racks, x=±2.6) mirando a lo largo del pasillo; la cámara va a x=1.1 para no atravesar el slot del display SIEM (x=0, half-width 0.81, z=−2.0) ni la columna de anillos KPI (x=0, z=−1.6). **Cull de Html labels tras la cámara en `HudLabel`:** el drei `Html transform` proyecta espejado detrás del plano de cámara — ahora el label se desvanece por coseno del ángulo (fade angular hasta el plano, snap con reduced-motion, escritura directa a style sin setState, SPEC §32) y el artefacto nunca aparece. Validado en navegador real con dump de opacidades del DOM: S3-mid los 10 labels visibles → S3-pass el título queda a opacidad 0 al pasar el plano (anillos aún delante) → S3-deep los 10 a 0 (corredor puro, sin espejado); canvas del tramo profundo con 3.46% cian (streams/vents) y rack iluminado a la izquierda. Regresión: S1/S2/S5 byte-cercanos, S3 más oscuro solo porque el punto de captura quedó más profundo (esperado). **Hallazgo honesto:** el tramo más profundo coincide con la sección `siem` (dashboard max-w-6xl translúcido) — el momento se lee en los gutters/transiciones y en la frontera a S4 (verificado: beacon dorado + HudLabel AUDIT HUB visible); adelgazar el dashboard para exponer más corredor queda como recomendación, no bloquea — [`report-p4-label-culling-passthrough`](./reports/report-p4-label-culling-passthrough.md).

**P4.1 (2026-08-14) — cierre del hallazgo P4 (exposición del corredor):** la sección `siem` (dashboard glass con `backdrop-blur` 12px + scrim 30%) desenfocaba el tramo profundo del atravieso. Fix local en `SIEMDashboard`: contenedor `max-w-6xl` → `max-w-4xl` (gutters nítidos a los lados — el blur solo cubre la tarjeta) + scrim de la sección a `/20` (excepción deliberada y comentada: esta sección ES el tramo del atravieso; el resto del sitio mantiene el 30% del P0). Validado con comparación NORMALIZADA por estado de cámara (mismo scrollY 7056, deep: true): bright +23%, cyan +28%, gutters +4/+2, centro estable (legibilidad intacta, verificada en captura) — [`report-p4-1-siem-corridor-exposure`](./reports/report-p4-1-siem-corridor-exposure.md).

**P5 (2026-08-14) — materialidad PBR de GLBs (el lever del "cálido S4" documentado en P3): investigación con veredicto y reversión.** Se verificó en el chunk JSON de los GLBs que los outputs Tripo promovidos (`server_rack_v03`, `storage_unit_v02`) son **single-mesh** (`tripo_node_*`) + **una textura horneada** con `metalness=0`/`roughness=0.9` — los bridges de runtime por nombre de mesh (clearcoat G5, LEDs, puerta) **jamás disparan** en ellos. Dos configuraciones de perfil PBR medidas sobre crops idénticos a la baseline: (a) subir `metalness` 0.35–0.4 = **negativo** (diluye el albedo horneado: cálido S4 0.66→0.16%, imagen más oscura); (b) `roughness`↓ + `envMapIntensity` 1.4 = **no-op** (cálido 0.27–1.20% vs 0.66–0.81%, sin ganancia de especular). **Código revertido** (gate, precedente P3) y el valor queda en el hallazgo: el look del GLB Tripo está acotado por su textura horneada, no por luz (P3) ni por parámetros de material (P5); el lever real es el **re-bake del asset** (textura con canales PBR o re-export con meshes nombrados). Se documentó la **verificación pre-promoción obligatoria** (`artwork/living-datacenter/dump-glb-pbr.mjs` — nombres de mesh vs set canónico del bridge + factores PBR) en ASSET-PIPELINE §4 — [`report-p5-glb-materiality`](./reports/report-p5-glb-materiality.md). **Plan P6 listo:** [REBAKE-PLAN-P6](./REBAKE-PLAN-P6.md) — P6a split canónico (divide el mesh único en `chassis`/`door`/`bezel_slats`/`leds_*`, activa TODOS los bridges, ~20-30 min/asset en Blender) y P6b albedo limpio + normal (el premium lit look, solo si P6a no alcanza) — con pipeline §5, verificación pre-promoción y tabla de expectativas.

**P7 (2026-08-14) — storyline: failover visible (P7a) + eje Purdue IEC 62443 (P7c).** El diagnóstico de director creativo + arquitecto de red: la resiliencia no se VEÍA (S4 era tint, no evento) y el sitio de un arquitecto IT/OT no hablaba la semántica de red (2N, rutas gemelas, Purdue). **P7c:** `PURDUE_BY_SCENE` declara el nivel de cada escena (S1 EMPRESA 04 → S2 OPERACIONES 03 → S3 DMZ 03.5 → S4 CONTROL 01 → S5 INTERNET 05) y el HUD lo muestra como `NIVEL 0X · NOMBRE` bajo el `FASE 0n/05` en los labels de escena (claves i18n es/en; S1 no lleva línea por diseño — sus labels son status, decisión G1). **P7a:** `FailoverStreams` — dos rutas gemelas de 40 puntos sobre la fila de storage de S4 con `failoverEvent(progress)` pura y determinística (normal → fault → dead → recover → restored en 0.30/0.48/0.62/0.80): A degrada a ámbar, muere (rojo oscuro), B transporta todo a cian pleno, A se recupera y B vuelve a standby. El tráfico fluye siempre; el material narra el corte y el reroute (sin setState, suavizado exponencial SPEC §16, reversible por scroll, defensivo reduced-motion). **Validado en navegador real** (`validate-p7.mjs`, muestreo de progreso real): la degradación ámbar aparece EXACTAMENTE al cruzar 30% (ámbar 0→0.26 en la fila de storage, normal p<30%); los 4 labels de escena muestran su NIVEL correcto. **Lección de método:** la primera versión del probe scrolleaba en la dirección equivocada (nunca cruzaba la ventana del evento) — los probes de eventos determinísticos deben muestrear la variable de entrada (progreso), no solo el output — [`report-p7-storyline`](./reports/report-p7-storyline.md).

**P7d (2026-08-14) — EL FOTÓN, hilo de continuidad del storyline.** La firma del audit de narrativa: una partícula de luz que nace en el boot, cabalga los streams de data, SOBREVIVE al failover de resilience (recorre la ruta B — la misma geometría de FailoverStreams — y en la ventana dead es EL portador: pulso de intensidad vía `photonFailoverTint`) y llega al nodo central en connection (bloom + respiración del clímax vía `photonArrival`). Un único path continuo (`PHOTON_SEGMENTS`, 5 tramos conectados extremo-a-extremo, testeados) parametrizado por progreso GLOBAL — el fotón nunca salta en las fronteras de escena. Su color ES el arco de temperatura del Phase Gate en una partícula: azul → cian → ámbar → champagne (`PHOTON_COLOR_BY_SCENE`). Componente de 2 draw calls (~45→47, presupuesto <50): cabeza + estela de 7 puntos con glow radial procedural (singleton CanvasTexture — se lee como luz, no como cuadrado), escritura directa en useFrame sin setState, reduced-motion → estático en el nodo de llegada. **Validación con método A/B** (`ab-photon.mjs`, ON vs OFF + diff de píxeles): S1 553 px, S4 **32,589 px** (glow ámbar sobre la fila de storage), S5 21 px — el fotón renderiza y sigue el arco. **Dos lecciones de método documentadas:** (1) el blob de S1 en la proyección exacta era estático (idéntico entre tamaños 0.16 y 0.55) — los histogramas por umbral mienten cuando el escenario tiene luces estáticas (rims, vent tiles, tira cálida, beacon); la validación de un objeto pequeño debe ser un diff contra su ausencia. (2) Bug real corregido: el tramo S1 original pasaba a z<0.45 — DETRÁS de la cara frontal opaca del GLB hero — el fotón quedaba oculto; movido delante (z≥0.62) — [`report-p7d-photon`](./reports/report-p7d-photon.md).

**P7a.1 (2026-08-15) — el corte del failover se hace FÍSICO, no solo de color.** `failoverMotion(state)` parametriza el MOVIMIENTO de la ruta A además del color: en `fault` el tráfico de A se LENTIFICA (speed 0.35) y deriva visiblemente hacia B (`reroute` 0.35 — la fila trasera gana partículas mientras la frontal se vacía); en `dead` A se DETIENE (speed 0, `reroute` 1) — la fila frontal queda vacía y B transporta todo; en `recover` el ámbar se lee EN TRÁNSITO entre las filas (`reroute` 0.65) y en `restored` ambas rutas vuelven a standby. Misma geometría y presupuesto (sin draw calls nuevos — los puntos se re-encaminan, no se crean), mutación vía refs en `useFrame`, reversible por scroll, reduced-motion defensivo. **Validación con método A/B** (`ab-failover-motion.mjs`, motion ON vs P7 color-only, mismo scroll → misma cámara y materiales): el diff de **fault** es el decisivo — **489 px ámbar + 680 px cian** = el tráfico de A está en posiciones DISTINTAS (derivando a B) vs P7; `dead` no difiere porque A es oscuro en ambas (el corte físico es invisible con material dark — consistente). **Lección de método:** la captura "recover" cayó en `restored` (la altura de `blog` empuja el progreso) — el anclaje por bandas de sección miente cuando la cámara se mueve por el estado; la comparación justa es el A/B contra el commit anterior con el mismo scroll — [`report-p7a1-failover-motion`](./reports/report-p7a1-failover-motion.md).

**P7e (2026-08-14) — CONEXIÓN COMO WAN: el haz hacia el clúster distante (cierre semántico del storyline).** El datacenter es UN nodo, no el mundo: el reveal diagonal de S5 ahora muestra un haz champagne (`BEAM_ORIGIN` = nodo central `[0,2,-1.85]` → `BEAM_TARGET` = `[-5,3,-24]`, al borde de la niebla — la red emergiendo de lo desconocido) con la granja distante (`beamClusterPoints`, 12 puntos) y paquetes fluyendo origen→target. El FOTÓN cierra su arco PARTIENDO por el haz: el tramo S5 se extendió con 2 puntos **colineales** con el haz (dot > 0.999, testeado), `photonArrival` ahora hace el bloom exactamente en el nodo y se desvanece con `photonDeparture` (el fotón se encoge al receder hacia la niebla). Componente de **3 draw calls** (2 planos cruzados del shaft con glow radial — el streak volumétrico clásico sin shaders — + 1 Points de clúster/paquetes); **draw calls reales medidos en runtime: S3 45 → 48 < 50** (SPEC §21). `glowTexture.ts` extraído como módulo compartido (StoryPhoton + ConnectionBeam). **Validación en navegador real:** a fuerza plena (fondo de página) el clúster lee como 4 blobs champagne en la mitad superior con color EXACTO `#E8D5AC`, paquetes a lo largo de la línea, 566 px cálidos. **Lección de método:** el diff crudo ON−OFF de un objeto sutil se contamina con la varianza de las partículas de polvo (diff gris difuso sin sesgo de hue) — el filtrado por HUE (el haz es cálido, el polvo es neutro) lo aísla. **Limitación editorial documentada:** el DOM de `contacto` cubre el clímax en pantalla completa (lección P4.1); el haz se lee en el canvas puro y los gutters — [`report-p7e-connection-beam`](./reports/report-p7e-connection-beam.md).

**P6a (2026-08-15) — el re-bake sale de la GUI: split canónico automatizado y verificado.** El único lever de realismo real para los GLBs Tripo (lección P5) queda ejecutable con `artwork/living-datacenter/blender-p6a-split.py`: script Blender **headless** que importa el GLB, corrige el anclaje (base y=0 sin re-escalar), carga el albedo full-res del provenance como Base Color compartido y separa el mesh único `tripo_node_*` en los meshes canónicos del contrato (`chassis`/`door`/`plinth`/`leds_*` rack · `chassis`/`bezel_slats`/`leds_lcd`/`leds_status`/`rear_controllers` storage) con filtros por banda espacial y rango de islas UV. **Regla de seguridad clave:** si una región no se aísla (típico de los LEDs horneados en el mismo UV del chassis), se reporta y queda en `chassis` — NUNCA corta a ciegas. PBR del contrato por región (Principled únicamente; `leds_*` con baseColor apagado — el runtime les da el emisivo), export ASSET-PIPELINE §5 verbatim (Triangulate AL FINAL, Apply Transforms, sin extras, nombre versionado v04/v03). **Verificación pre-promoción validada en este entorno:** baseline del dump confirma P5 (1 mesh, metal 0 / rough 0.9) y el harness `test-p6a-logic.mjs` valida la lógica del split sin Blender (islas UV + filtros + regla de no-corte a ciegas; lección del harness: UVs sintéticos con esquinas reales de quad, los degenerados fusionan islas). **Pendiente operativo documentado:** la ejecución del export requiere Blender ≥ 3.6 en la máquina (comandos exactos en REBAKE-PLAN-P6 §3.0) — el resto del pipeline (§5) corre acá — [`report-p6a-rebake-split`](./reports/report-p6a-rebake-split.md).

**Outputs de IA promovidos (SPEC §52):** rack `server_rack_v03` (Tripo, textura fotográfica real, hero S1) y **storage** `storage_unit_v02` (Tripo, S4 protagonista — el modelo que se descargó como "switch" resultó ser un gabinete de storage; reasignado a S4 con fit 1.8×1×1.2 base-origen, textura optimizada 5.2 MB JPEG 4096² → 477 KB WebP 2048²; el slot switch volvió al v01 1U procedural). Ambos con bridge CSP (textura extraída a `uri` externo, CSP sin relajar) y fit horneado al slot ([report-g7-tripo-rack](./reports/report-g7-tripo-rack.md) · [report-g7-tripo-switch](./reports/report-g7-tripo-switch.md) · [report-g7-tripo-storage](./reports/report-g7-tripo-storage.md)). Payload GLBs 0.77 MB ✅; **texturas optimizadas (7.39 → 0.57 MB):** rack v03 2.29 MB JPEG → 103 KB WebP (G7.4, render idéntico diff 0.5/255) y storage v02 5.2 MB → 477 KB WebP. **Total `/public/assets/3d`: 1.33 MB.** Restan pasos operativos, no gaps: deploy preview a Vercel para QA en dispositivo real + display SIEM (S3/S5) y switch 1U real cuando lleguen sus outputs.
