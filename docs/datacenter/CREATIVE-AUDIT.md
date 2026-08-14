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
| Hanhwa | Transiciones = viaje físico (atravesar, descender) | S4 ya desciende (cámara a y=-1.5); añadir *momento de atravesar*: paso entre racks en S2→S3 (waypoint con z negativa entre filas) |
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

**Outputs de IA promovidos (SPEC §52):** rack `server_rack_v03` (Tripo, textura fotográfica real, hero S1) y **storage** `storage_unit_v02` (Tripo, S4 protagonista — el modelo que se descargó como "switch" resultó ser un gabinete de storage; reasignado a S4 con fit 1.8×1×1.2 base-origen, textura optimizada 5.2 MB JPEG 4096² → 477 KB WebP 2048²; el slot switch volvió al v01 1U procedural). Ambos con bridge CSP (textura extraída a `uri` externo, CSP sin relajar) y fit horneado al slot ([report-g7-tripo-rack](./reports/report-g7-tripo-rack.md) · [report-g7-tripo-switch](./reports/report-g7-tripo-switch.md) · [report-g7-tripo-storage](./reports/report-g7-tripo-storage.md)). Payload GLBs 0.77 MB ✅; **texturas optimizadas (7.39 → 0.57 MB):** rack v03 2.29 MB JPEG → 103 KB WebP (G7.4, render idéntico diff 0.5/255) y storage v02 5.2 MB → 477 KB WebP. **Total `/public/assets/3d`: 1.33 MB.** Restan pasos operativos, no gaps: deploy preview a Vercel para QA en dispositivo real + display SIEM (S3/S5) y switch 1U real cuando lleguen sus outputs.
