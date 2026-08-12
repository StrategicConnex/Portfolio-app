# AUDIT 3D — Especialista `agents/3d.md` del SC Platform (skill vendorizado)

**Fecha:** 2026-08-12 · **Contrato de salida:** COMMON_BRAIN (Findings, Evidence, Risks, Proposed changes, Validation plan, Confidence)
**Alcance:** escena actual del Living Datacenter (R3F + Three.js) — costo GPU/CPU, draw calls, assets, lazy loading, degradación móvil, fallback UX.
**Método:** revisión estática del código + conteo de draw calls por componente (ULTRA, peor caso S3). **No** se ejecutaron benchmarks GPU/GPU en navegador en esta pasada (el contrato del brain prohíbe afirmar mediciones no ejecutadas).

---

## FINDINGS

### F1. Draw calls: dentro del presupuesto SPEC §21, sobre el ideal <30 (solo en S3)
Conteo estático ULTRA, escena 3 activa (peor caso):

| Componente | Draw calls | Nota |
|---|---|---|
| ContactShadows (rack hero) | 1 | bake 1 frame (`frames={1}`), quad visible por frame |
| Rack hero GLB (S1) | 1 | 1 mesh / 1 material (clon) |
| Gabinetes corredor+fondo | 1 | `Instances` (hasta 64) |
| Unidades servidores | 1 | `Instances` (hasta 256) |
| Backup: GLB storage + Instances | 2 | protagonista GLB + 7 instancias |
| DustParticles | 1 | `Points` |
| Switch: GLB protagonista + Instances | 2 | v01 + pool instanciado |
| Displays SIEM | 2 | 2 × GLB (ULTRA/HIGH) |
| DataStreams | 1 | `Points` 144 |
| PurdueHologram | 2 | lineSegments + points |
| CopilotNode | 3 | core + halo + ring |
| FocusNodeLayer | 3 | core + halo + ring |
| DataRings (S3) | **16** | 8 métricas × 2 torus |
| DatacenterFloor | 1 | — |
| **TOTAL S3 ULTRA** | **≈37** | ✅ <50 máx · ⚠️ >30 ideal |

S4 = 2 rings (≈23) · S1/S2 ≈ 19–21. El costo dominante variable es **DataRings en S3 (16 de 37)**. HudLabels usan `<Html>` (DOM, no draw calls).

### F2. Instancing: bien aplicado (SPEC §20)
- Corredor/fondo/unidades/switches: `Instances` de 1 geometría + 1 material → 1 draw call sin importar el conteo por tier. ✅
- GLBs: 1 mesh/1 material (4.5K–7.2K tris, meshopt) — dentro del presupuesto <10K/asset. ✅

### F3. Materiales: budget sano, con 2 puntos de atención
- Pool procedural: `MeshStandardMaterial` con texturas procedurales **singleton** (chassis/unit bump, puerta AR2580, UI SIEM) — sin texturas por instancia. ✅
- Nodos/rings/flujos: `MeshBasicMaterial` (unlit) + `AdditiveBlending` solo en streams. ✅
- ⚠️ Clearcoat (G5): `chassis`/`bezel` de GLBs se **elevan a `MeshPhysicalMaterial`** en runtime — sombreador más caro, acotado a 2–3 meshes, pero se re-crea por clon de GLB.
- ⚠️ Transparencia: rings (16 transparentes en S3) + streams aditivos + puerta alphaTest → overdraw y costo de sorting moderado.

### F4. Costo por frame: cumplimiento SPEC §22/§33
- `frameloop="demand"` + `MicroAnimDriver` (8–15 Hz según tier, 0 en LOW/STATIC): GPU idle entre invalidaciones. ✅
- Los 5 suscriptores `useFrame` (SceneLighting, DataStreams, DataRings, CopilotNode, FocusNodeLayer) mutan **refs/atributos**, cero `setState` en el loop. ✅
- ⚠️ El sampler rAF de `useAdaptiveQuality` corre continuo a 60 Hz mientras el canvas está activo (costo CPU pequeño, no GPU) — aun en reposo del demand loop.

### F5. Assets: gate SPEC §12 superado con margen
`/public/assets/3d` = **1.33 MB** (GLBs 0.77 MB meshopt/quantized + texturas 0.57 MB WebP 2048²). Cero recursos externos en runtime (CSP intacta, puerta/UI procedurales). ✅

### F6. Lazy loading: correcto
- `next/dynamic` + `ssr:false`: el chunk three+R3F (~230 KB gz) **solo se descarga** si el perfil ≠ STATIC (reduce-motion / sin WebGL / tier LOW → nunca llega). ✅
- GLBs vía `useGLTF` (caché de drei) con HEAD pre-check + fallback procedural durante suspense. ✅

### F7. Degradación móvil y fallback UX: completos
- Clasificación (cores + `deviceMemory` + coarsePointer) → tier → perfil; DPR [1,2]→[1,1]; conteos por tier; LOW omite streams/holograma/switch/display/HUD. ✅
- Sampler rAF: <45 FPS → MEDIUM, <30 → LOW, ≥50 recupera el base. ✅
- reduce-motion o sin WebGL → STATIC (StaticPoster, Z-10 siempre en DOM). ✅
- Error boundaries: global (→ StaticPoster) + local de asset (→ fallback procedural); context manager consolida contextos WebGL (ADR-003). ✅

---

## RISKS
- **R1 (bajo):** DataRings en S3 ≈ 44% del presupuesto de draw calls; en móvil MEDIUM con el resto de la escena puede acercarse al techo <50.
- **R2 (bajo):** El sampler rAF continuo (60 Hz) en `useAdaptiveQuality` contradice parcialmente el "GPU/CPU idle" del demand loop (costo CPU constante mientras el canvas monta).
- **R3 (muy bajo):** `MeshPhysicalMaterial` runtime por clon de GLB — si un GLB futuro trae varios meshes de chasis (p. ej. storage real multi-parte), el clearcoat se aplica por mesh y crece el costo de sombreador.
- **R4 (muy bajo):** Sin medición runtime de draw calls en esta pasada (SPEC §21 exige "medir, no asumir"); el conteo es estático.

---

## PROPOSED CHANGES
1. **Instancing de los anillos base de DataRings (R1):** los 8 arcos de fondo (2π, mismo radio por métrica... radios distintos) — alternativa real: **`InstancedMesh` para los fondos** (1 draw call por los 8) y mantener los arcos de progreso por-mesh pero con `torusGeometry` de 32 segmentos (hoy 48). Estimación: 16 → ~9 draw calls en S3.
2. **Pausar el sampler rAF cuando no hay animación (R2):** gatear el loop del sampler con la visibilidad (`document.hidden`) y/o con el estado del MicroAnimDriver (hz=0 → no samplear), manteniendo la degradación por eventos de scroll/scroll-end. Impacto: recupera idle real.
3. **Cachear el material clearcoat por clon (R3):** memoizar el `MeshPhysicalMaterial` resultante por (path, meshName) para no re-crearlo en cada re-montaje.
4. **Dev-only `renderer.info` (R4):** exponer `gl.info.draw.calls` en `window.__DC_STATS__` bajo flag de desarrollo (SPEC §59 — desaparece en production) para medir en navegador real en la próxima pasada.

---

## VALIDATION PLAN
- Tras aplicar 1–3: typecheck + `vitest run src/components/datacenter` + build; probe Playwright en S3 (ULTRA desktop) leyendo `__DC_STATS__` (draw calls <50, target <30) y en S4/S1.
- Mobile: probe viewport 390×844 tier MEDIUM (draw calls + FPS estimado vía sampler) y LOW (omisiones activas).
- Comparar contra baseline: captura S3 antes/después con `refcheck/` (diff <umbral).

## CONFIDENCE
**Alta** en los hallazgos F2–F7 (verificados en código y gates previos). **Media** en F1 (conteo estático, sin medición runtime) y en las propuestas 1–2 (requieren validación visual de la estética de anillos). No se ejecutaron benchmarks de GPU en esta pasada.

---

## VEREDICTO vs ESTÁNDARES DEL SKILL
| Estándar del especialista | Estado |
|---|---|
| Draw calls / costo GPU | ✅ <50 (≈37 pico S3) · ⚠️ sobre ideal 30 por DataRings |
| Instancing donde aplica | ✅ |
| Materiales (complejidad acotada) | ✅ con 2 puntos de atención (clearcoat, transparencia) |
| Assets (payload, meshopt, self-hosted) | ✅ 1.33 MB total, cero externos |
| Lazy loading | ✅ chunk 3D condicional |
| Degradación móvil | ✅ tiers + DPR + sampler + omisiones LOW |
| Fallback UX | ✅ StaticPoster + boundaries + consolidación de contextos |
