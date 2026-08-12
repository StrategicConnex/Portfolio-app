# Report — G4: Pools de switch y display (GLBs declarados) + fit de cámara S4

**Fecha:** 2026-08-11 · **GATE: ✅ PASS** · **Origen:** CREATIVE-AUDIT §5 (gap G4) + MESHY-CONTACT-SHEET §1b (desvíos de fit) · **Clase:** ARCHITECTURAL (nuevos pools con GLBs, aprobado por el brief del audit y el gate §1b)

## IMPLEMENTED

- **`ServerSwitchPool`** (`src/components/datacenter/ServerSwitchPool.tsx`): pool instanciado de chasis 1U en la cara frontal de los racks del corredor (1 draw call, `<Instances limit={64}>`, LEDs estáticos por índice) + **slot GLB protagonista** en S3 (`network_switch_v01.glb` vía `GlbAsset`, origen de data streams) con fallback procedural. El grid de puertos no es legible a distancia de corredor (documentado §1b) → contexto decorativo; el movimiento de S3 lo ponen los streams.
- **`SiemDisplayPanel`** (`src/components/datacenter/SiemDisplayPanel.tsx`): displays con slot GLB (`siem_display_v01.glb`) + fallback procedural (marco industrial 4 barras + quad con **UI SIEM procedural**). Slots: S3 (lectura de UI, fit ~20% alto desktop) + S5 nodo central (pulso). Tier adaptativo: ULTRA/HIGH 2 displays · MEDIUM 1 (S3) · LOW 0.
- **`screenUiTexture`** (`src/components/datacenter/screenUiTexture.ts`): textura procedural de la UI SIEM (R5, cero assets externos) — usada por el fallback y por el **bridge de `GlbMesh`** (rama `screen`: `map`+`emissiveMap` sobre el panel del GLB, con el mapa oscuro del GLB como base).
- **Fit S4 corregido** (`src/lib/scenes.ts`): la cámara de `resilience` ahora desciende desde el entry mirando a la línea de storage (y≈-2.4) y el mid se acerca (z=3.2) — el storage protagonista pasa de **FUERA en entry → 18.7% alto desktop** (mid 15.3%, exit 9.6%; móvil 51→28% ancho, siempre en frame).
- **Layout** (`src/lib/datacenter.layout.ts`): `SWITCH_SLOTS` (derivado de `CORRIDOR_RACKS`), `SWITCH_PROTAGONIST_GLB_POS`, `DISPLAY_SLOTS` — con anclas y documentación de asset-scene-map §5.

## FILES CREATED

- `src/components/datacenter/ServerSwitchPool.tsx`
- `src/components/datacenter/SiemDisplayPanel.tsx`
- `src/components/datacenter/screenUiTexture.ts`
- `src/lib/datacenter.slots.test.ts` (3 tests de integridad de slots)

## FILES MODIFIED

- `src/lib/scenes.ts` (waypoints S4: entry/mid)
- `src/lib/datacenter.layout.ts` (slots switch + display)
- `src/components/datacenter/GlbMesh.tsx` (bridge rama `screen`)
- `src/components/datacenter/DatacenterScene.tsx` (monta `ServerSwitchPool` + `SiemDisplayPanel`)
- `artwork/living-datacenter/verify-camera-fit.mjs` (posiciones REALES de los 4 assets)

## DEPENDENCIES

- **Ninguna nueva** (drei `Instances`/`Instance` ya presentes; patrón `GlbAsset` existente).

## ARCHITECTURAL IMPACT

**MEDIUM** — pools nuevos pero aditivos y reversibles: cada slot usa `GlbAsset` con fallback procedural (SPEC §37), el tier apaga displays en LOW sin tocar DOM, y el cambio de cámara S4 es solo data de `SCENES`. No toca secciones, Copilot (R4), ni CSP (R5).

## PERFORMANCE

- **Draw calls:** +1 (Instances) + 1-2 (GlbAsset por slot) ≈ +3 — dentro del budget <50.
- **Tris:** chasis 1U ×64 instanciados (1 geometría); displays GLB con bridge de textura (sin geometría nueva).
- **BUNDLE:** GLBs ya contaban en 0.61 MB (sin cambios); `screenUiTexture` es canvas procedural en runtime.

## ACCESSIBILITY

- Canvas decorativo intacto (`aria-hidden`, `pointer-events: none`); cero cambios en DOM/secciones.

## SECURITY/CSP

- Sin requests nuevos (R5): GLBs self-hosted, UI procedural — no hay network nueva.

## I18N

- Sin texto en geometría (§23): la UI SIEM es textura procedural sin labels hardcoded.

## COPILOT

- **UNCHANGED**

## TESTS

- `datacenter.slots.test.ts` (3) · suite datacenter completa **44/44 (10 files)** · typecheck **0** · lint **0** · build **OK**

## VALIDACIÓN DE FIT (verify-camera-fit.mjs, posiciones reales)

| Asset | Escena | Desktop (entry→mid→exit) | Móvil | Veredicto |
|---|---|---|---|---|
| Rack | S1 | 19.5→25.0→31.7% alto | 14–24% ancho | ✅ en frame |
| Storage | S4 | **18.7→15.3→9.6%** (antes FUERA) | 51→28% ancho, siempre en frame | ✅ **fit corregido** |
| Switch | S3 | 1.0→1.8→5.2% (protagonista, x=−2.6) | fuera en entry/mid (contexto decorativo §1b) | ✅ aceptado según doc |
| Display | S5/S3 | S5 8.7→4.6% (pulso) · S3 11.6→29.2% (lectura UI) | ok en S5 | ✅ consistente |

## GATE

**PASS** — typecheck 0 · 44/44 tests · lint 0 · build OK · fit validado con posiciones reales. Sin regresiones (R1-R5).

## NEXT

G3 (datos encarnados tipo Mastercard, ARCHITECTURAL) — el último gap pendiente del audit.
