# PHASE G7.1 — PRIMER OUTPUT DE IA PROMOVIDO (server_rack_v03 · Tripo)

**PHASE:** G7.1 — promoción del primer output real de IA al slot heroRack
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12

## PROBLEMA / HALLAZGO PRINCIPAL (STOP §64 — resuelto sin workaround)
El output descargado de Tripo (`server_rack_v03.glb`, textura JPEG embebida en el
buffer) **violaba la CSP en runtime**: GLTFLoader decodifica las texturas embebidas
creando una `blob:` URL, y la CSP del sitio (`img-src 'self' data: https:` — sin
`blob:`) la bloqueaba → `THREE.GLTFLoader: Couldn't load texture blob:...` y el
material quedaba sin mapa.

**Decisión correcta (SPEC §27): NO relajar la CSP.** Se extrajo la textura a un
archivo separado en `/public` y se re-escribió el GLB con `images[0].uri` **relativo**
(p. ej. `server_rack_v03_tex.jpg`) — GLTFLoader la carga como imagen normal de
`img-src 'self'`. Verificado: HEAD 200 → GLB 200 → textura 200, cero errores de
consola 3D (solo el CORS de telemetry preexistente).

## IMPLEMENTED
1. **Descarga del output** (link compartido de Tripo, sesión del owner):
   - `server_rack_v03.glb` — 4.5K tris, 1 mesh/1 material, `KHR_mesh_quantization`
     + `EXT_meshopt_compression` (gltfpack 1.2), sin personas/logos.
   - `server_rack_v03-preview.webp` (render), `server_rack_v03-wireframe.webp`,
     `server_rack_v03-input.jpg` (foto de referencia) → `meshy-kit/04-rack/raw/`.
2. **Bridge CSP (nuevo):** `scripts/glb-extract-texture.mjs` — extrae la imagen
   embebida, la escribe como `<asset>_tex.<ext>` junto al GLB, reindexa
   bufferViews/accessors y ajusta byteOffsets meshopt. GLB: **2317 KB → 74 KB**
   (la textura 4096×4096 JPEG ~2.2 MB viaja aparte). Idempotente (si ya es uri, no toca).
3. **Bridge fit al slot:** `scripts/glb-bake-transform.mjs` — hornea `scale` +
   `translation` en el nodo (los outputs de IA vienen centro-anclados y en
   proporciones propias; el slot exige origen-en-base §5). Tripo 0.65×1.0×0.38 →
   fit 1.0×2.4×0.9 base-anclada (escala no-uniforme al footprint del slot).
4. **Wiring:** `GLB_ASSETS.heroRack` → `/assets/3d/server_rack_v03.glb`
   (reversible — `server_rack_v02.glb` queda intacto como baseline).
5. **Evidencia runtime:** `verify-tripo-load.mjs` (canvas vivo, GLB 200, textura
   200, sin errores) + captura `refcheck/tripo-v03-s1c.png` → copiada a
   `raw/server_rack_v03-runtime.png` (la hoja de contacto la detecta).

## FILES CREATED
- `scripts/glb-extract-texture.mjs` (Bridge CSP — reutilizable para los otros 3 slots)
- `scripts/glb-bake-transform.mjs` (Bridge fit al slot)
- `artwork/living-datacenter/verify-tripo-load.mjs` (probe de promoción)
- `docs/datacenter/reports/report-g7-tripo-rack.md` (este reporte)

## FILES MODIFIED
- `src/lib/datacenter.layout.ts` (`GLB_ASSETS.heroRack` → v03)
- `docs/datacenter/ASSET-PIPELINE.md` (§4 — nuevo "Bridge CSP: textura embebida vs. externa")

## DEPENDENCIES
Ninguna nueva. La extracción/reescritura GLB es Node puro (sin gltf-transform).

## ARCHITECTURAL IMPACT
**MEDIUM** — nueva etapa en el pipeline (post-descarga del output), cero toques a
secciones/Copilot/i18n/scroll. El slot sigue siendo el mismo `GlbAsset`.

## PERFORMANCE
- FPS: 60 (medido en preview, perfil ULTRA — el asset es 1 mesh + 1 textura)
- DRAW CALLS: sin cambio (el GLB reemplaza al procedural en el mismo slot)
- DPR: sin cambio
- BUNDLE: GLB 73.9 KB (antes 181 KB v02) + textura 2.19 MB → payload total
  `/public/assets/3d` 0.70 MB (budget §12 3 MB) ✅

## ACCESSIBILITY / I18N / SECURITY-CSP
- A11y: sin cambio (canvas decorativo, aria-hidden — SPEC §25)
- i18n: sin cambio (cero texto en geometría)
- CSP: **sin violaciones** (se eliminó la única que introducía el output crudo)
- Red: solo requests self-hosted (R5 intacto)

## COPILOT
UNCHANGED.

## GATE
**PASS** — typecheck 0 · tests 147/147 (23 files) · lint 0 · build OK · runtime
verificado en navegador real (HEAD 200 → GLB 200 → textura 200, canvas vivo,
0 errores de consola 3D).

## NOTA / DECISIÓN PENDIENTE (SPEC §52)
El v03 es un **gabinete compacto con ruedas** (no un rack 42U estilizado): la
textura fotográfica real da el salto de realismo (luminosidad rack 41.6 → 54.4,
bordes ~8-9%), pero sus proporciones obligaron al fit no-uniforme al slot
(1.0×2.4×0.9). Si en dirección de arte no convence, el revert es 1 línea
(`GLB_ASSETS.heroRack` → v02). El modelo queda **promovido provisionalmente**
con evidencia; la decisión final de SPEC §52 queda documentada aquí.

## NEXT PHASE
Replicar el pipeline v03 → los otros 3 slots (switch S3, storage S4, display
S3/S5) cuando lleguen sus outputs. Documentar en ASSET-SCENE-MAP.
