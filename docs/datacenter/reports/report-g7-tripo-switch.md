# PHASE G7.2 — SWITCH CATALYST 4500 PROMOVIDO (network_switch_v02 · Tripo)

**PHASE:** G7.2 — promoción del switch Catalyst 4500 al slot networkSwitch (S3)
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12

## PROBLEMA / CONTEXTO
El usuario generó un switch en Tripo (mismo prompt base de rack, task
`58dfd382...`) y aclaró que el modelo es un **Cisco Catalyst 4500** (chasis
modular ~multi-U), NO un switch 1U. El slot `networkSwitch` estaba diseñado para
un slab 1U (0.82 × 0.07 × 0.5). Reencuadre: el chasis se monta en la cara frontal
del rack del corredor (S3, origen de data streams) con fit multi-U.

## IMPLEMENTED
1. **Descarga** (payload Nuxt → URLs firmadas CloudFront, sin sesión paga):
   - `network_switch_v02.glb` — 4.5K tris, 1 mesh/1 material, `KHR_mesh_quantization`
     + `EXT_meshopt_compression` (gltfpack 1.2).
   - `network_switch_v02_tex.jpg` — textura JPEG 4096² (5.2 MB separada).
   - preview/wireframe/input → `meshy-kit/01-switch/raw/`.
2. **Bridge CSP:** `scripts/glb-extract-texture.mjs` — GLB 5.4 MB → 73 KB,
   textura por `uri` relativo, refs válidos (0 inválidos).
3. **Bridge fit al slot (SPEC §52):** escala uniforme a alto 0.6 (chasis multi-U
   0.489 × 0.6 × 0.419) + base-origin (translation 0.3), horneado en el nodo.
4. **Wiring:** `GLB_ASSETS.networkSwitch` → v02; `SWITCH_PROTAGONIST_GLB_POS`
   base en `SWITCH_SLOT_Y − 0.3` (chasis centrado en el rack del corredor).
5. **Evidencia runtime:** HEAD 200 → GLB 200 → textura 200, canvas vivo,
   cero errores de consola 3D (solo CORS telemetry preexistente).

## IMPACTO VISUAL (evaluación)
- El slab 1U genérico pasa a ser un **chasis Catalyst 4500 con textura
  fotográfica real** montado en la cara del rack izquierdo (S3) — el detalle de
  puertos/chasis ahora se lee de cerca, coherente con la dirección de arte NRG.
- Los data streams siguen saliendo del rack (STREAM_PATHS intactos); el chasis
  no bloquea la lectura del corredor.
- Luminosidad zona switch 23.1 vs fondo 21.1 (textura más clara que el slab
  emisivo); el cambio visual es sutil a distancia de corredor — el mayor
  beneficio es de cerca (S3 protagonista).

## IMPACTO DE PAYLOAD
- GLB: 73 KB (vs 155 KB del v01) — **mejora**.
- Textura separada: 5.2 MB — **la más pesada del datacenter** (rack v03: 2.19 MB).
- Total `/public/assets/3d`: GLBs **0.77 MB** (budget §12 3 MB ✅) + texturas
  7.39 MB. La textura del switch domina; candidata #1 a optimización
  (KTX2/WebP/AVIF) antes de producción.

## ARCHITECTURAL IMPACT
LOW — solo manifest (`GLB_ASSETS`) + posición del slot. Cero toques a
secciones/Copilot/i18n/scroll/CSP.

## GATE
**PASS** — typecheck 0 · tests 147/147 · lint 0 · build OK · runtime verificado
(canvas vivo, GLB+textura 200, 0 errores 3D).

## NOTA ESPEC §52
Modelo promovido provisionalmente con evidencia. Revert: 1 línea
(`GLB_ASSETS.networkSwitch` → v01). El fit multi-U (0.6 alto) es la lectura
correcta de un Catalyst 4500 montado en rack; si dirección de arte prefiere el
chasis 1U estilizado, se revierte igual.

## NEXT PHASE
Optimizar `network_switch_v02_tex.jpg` (5.2 MB → target <1.5 MB) sin perder
calidad de cerca. Luego: storage (S4) y display (S3/S5) cuando lleguen sus outputs.
