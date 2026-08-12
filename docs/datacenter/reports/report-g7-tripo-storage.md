# PHASE G7.3 — STORAGE PROMOVIDO (storage_unit_v02 · Tripo) + SWITCH REVERTIDO A v01

**PHASE:** G7.3 — reasignación del modelo Tripo del switch → storage (S4) y revert del slot switch
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12

## PROBLEMA / CONTEXTO
El usuario aclaró que el modelo descargado del link del "switch" es en realidad
**un gabinete de storage** (no un switch Catalyst ni un rack), y pidió reemplazar
el switch por storage. El modelo (bbox nativo 0.814 × 0.998 × 0.697, centro-anclado)
estaba promovido como `network_switch_v02` en el slot protagonista de S3 con fit de
chasis (0.489 × 0.6 × 0.419). Reasignación: pasa al slot `storageUnit` (S4, footprint
1.8 × 1 × 1.2 base-origen) y el slot switch vuelve a su GLB procedural v01 (1U).

## IMPLEMENTED
1. **Re-fit al slot storage (SPEC §52):** `scripts/glb-bake-transform.mjs`
   (generalizado con args: `<glb> <slotW> <slotH> <slotD> <nativeW> <nativeH> <nativeD> [minY]`)
   → `storage_unit_v02.glb`, node scale `[2.211, 1.002, 1.722]` + translation
   `[0, 0.5, 0]` → 1.8 × 1 × 1.2 **base-origin** (0.73 MB → 73 KB, meshopt intacto).
2. **Optimización de textura (puerta abierta del audit):** la JPEG 4096² pesaba
   5.2 MB (97% del peso del asset). Re-encode con `sharp` a **WebP 2048² q82 →
   477 KB** (91% menos). `uri` del GLB parcheado a `storage_unit_v02_tex.webp`
   (sin `mimeType` — el loader resuelve por extensión). Se conserva la JPEG
   original como provenance (`storage_unit_v02_tex-src.jpg` en el kit).
3. **Wiring:**
   - `GLB_ASSETS.storageUnit` → `/assets/3d/storage_unit_v02.glb`.
   - `GLB_ASSETS.networkSwitch` → `/assets/3d/network_switch_v01.glb` (revert).
   - `SWITCH_PROTAGONIST_GLB_POS` → base en `SWITCH_SLOT_Y − 0.035` (media 1U).
   - `BackupUnits` sin cambios: la convención del slot ya era base-origin sin
     scale runtime (el fit se hornea, ASSET-PIPELINE §5).
4. **Kit:** archivos movidos de `01-switch/raw/` a `02-storage/raw/` como
   `storage_unit_v02.*` (glb · preview · wireframe · input · runtime · tex-src ·
   tex.webp). `01-switch/raw/` queda solo con `README-LOAD.md` (esperando output
   real de switch 1U). `/public` sin duplicados (se retiró `network_switch_v02.*`).
5. **Evidencia runtime:** HEAD 200 → GLB 200 → textura webp 200, canvas vivo,
   cero errores de consola 3D (solo CORS telemetry preexistente). Captura:
   `refcheck/storage-v02-s4.png` → kit como `storage_unit_v02-runtime.png`.

## STOP RESUELTO (§64) — build roto por artefacto temporal
El build fallaba en `globals.css` con `Module not found: Can't resolve
'/images/invite-float-bg.webp'`. Causa raíz: **Tailwind v4 escanea TODO el
repo** (no solo `src/`, también `.md`) y `tripo-check.html` (artefacto temporal
de la descarga Tripo en el root) contenía clases arbitrarias de la página de
Tripo (una clase de Tailwind arbitraria tipo *background-image* apuntando a una
imagen inexistente) → Tailwind
generaba esas clases → Turbopack fallaba al resolver las URLs. Solución:
eliminar el HTML temporal (no tocar código ni config). **Lección de higiene:** los
artefactos de descarga/inspección externa no deben quedar en el root del repo
mientras Tailwind escanee contenido del proyecto.

## IMPACTO VISUAL (evaluación)
- El slab procedural 1.8×1×1.2 del storage protagonista (S4) pasa a un gabinete
  con **textura fotográfica real** a la distancia de cámara de S4 (fit
  base-origen, sentado en el piso del nivel inferior, sin flotar).
- El switch de S3 vuelve al chasis 1U procedural v01 (contexto decorativo
  coherente con el pool instanciado) — honesto: el modelo no era un switch.

## IMPACTO DE PAYLOAD
| Asset | Antes (este thread) | Después |
|---|---|---|
| storage GLB | — (v01 procedural 195 KB) | v02 73 KB + tex webp 477 KB |
| textura storage | 5.2 MB (JPEG 4096²) | 477 KB (WebP 2048²) |
| switch | v02 73 KB + tex 5.2 MB | v01 155 KB (sin textura) |
| **GLBs /public/assets/3d** | 0.77 MB | **0.77 MB ✅ (< 3 MB)** |
| **Texturas /public/assets/3d** | 7.39 MB | **2.77 MB** (2.29 MB rack + 0.48 MB storage) |

## ARCHITECTURAL IMPACT: LOW
- SAFE: reasignación de slots + revert (1 línea cada uno).
- ARCHITECTURAL: ninguno. El manifiesto `GLB_ASSETS` ya contemplaba storage.

## PERFORMANCE
- FPS/DRAW CALLS: sin cambio de pipeline (mismo slot GlbAsset, 1 mesh/1 material,
  4.5K tris dentro del budget <10K).
- PAYLOAD: GLB 0.77 MB ✅ · texturas 2.77 MB (pendiente: rack v03 tex 2.29 MB →
  mismo tratamiento 2048 WebP, abierto del audit).

## ACCESSIBILITY: SIN CAMBIO — el canvas sigue aria-hidden, el DOM es fuente de verdad.
## SECURITY/CSP: SIN CAMBIO — textura externa por `uri` (`img-src 'self'`), sin `blob:`.
## I18N: SIN CAMBIO — cero texto en geometría.
## COPILOT: UNCHANGED.
## TESTS
- `npm run typecheck` — 0 errores.
- `npx vitest run src/components/datacenter` — 36/36 PASS.
- `npm run lint` — 0.
- `npm run build` — OK (tras purgar `.next` + quitar el HTML temporal).
- Runtime probe `verify-storage-v02.mjs` — GATE PASS (200/200/200).
- `node meshy-contact-sheet.mjs` — detecta storage output + preview + runtime.

## GATE: PASS ✅
## NEXT PHASE
- Optimizar textura del rack hero v03 (2.29 MB JPEG → 2048 WebP, mismo método).
- Display SIEM (S3/S5) cuando llegue su output; switch 1U real cuando se genere.
- Deploy preview a Vercel para QA en dispositivo real (QA-DEVICE-CHECKLIST.md).
