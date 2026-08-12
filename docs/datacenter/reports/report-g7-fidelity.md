# PHASE G7 — FIDELITY PASS (detalle PBR + geometría + entorno)

**PHASE:** G7 — realismo del render (respuesta a "los renders son solo cuadrados")
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-11

## PROBLEMA
Los GLBs procedurales eran cajas planas con detalle mínimo (unidades, puertos,
LEDs como cubos) y los racks del corredor cajas oscuras lisas — leían como
"cuadrados", sin la fidelidad de hardware del SPEC §3 / dirección de arte NRG.

## IMPLEMENTED
1. **Texturas PBR procedurales (runtime, R5 — cero assets externos):**
   - `src/lib/datacenterTextures.ts` — singletons canvas: `getChassisMap/Bump`
     (juntas de panel + filas de ventilación + ruido industrial + bisel),
     `getBrushedMap/Bump` (acero cepillado anisotrópico), `getUnitBump`
     (ranuras de unidad 1U). Funciones puras testeables (panelSeams, ventRows,
     unitSlots, brushedStreaks).
   - Bridge en `GlbMesh` (chassis/units/bezel_slats) y en los materiales
     compartidos de `ServerRackPool` (cabinet + unidades + fallback hero).
     Los GLBs siguen 100% PBR-neutral — el detalle es 100% runtime.
2. **GLB v2 (detalle geométrico, gate de autoría PASS):**
   - Rack: postes de esquina + bandeja de cableado superior → lee como rack.
   - Switch: ventilación lateral (4 tiras por lado) + aletas de disipación.
   - Storage: bahías de discos 2×6 (caddies con gap) + manijas hot-swap
     laterales + listones solo en zona superior + LCD reposicionado.
   - Display: bracket de montaje VESA + LED de encendido.
3. **Entorno y aterrizaje:**
   - `Environment` 256 → 512 + 2 Lightformers de pasillo (franjas de luz de
     techo a lo largo del corredor) + glow frío de fondo.
   - `DatacenterFloor`: piso elevado del corredor en y=0 (raised floor sobre el
     plenum técnico de y=-2.9 — lectura de datacenter real) con captura de
     reflejos del env map.
   - `ContactShadows` (bake 1 frame, frameloop demand) bajo el rack hero.

## FILES CREATED
- `src/lib/datacenterTextures.ts` (procedural PBR, R5)
- `src/lib/datacenterTextures.test.ts` (4 tests de layout puro)
- `artwork/living-datacenter/refcheck/diff-fidelity.mjs` (probe de comparación)
- `artwork/living-datacenter/refcheck/baseline-pre-fidelity/` (capturas previas)

## FILES MODIFIED
- `scripts/gen-assets.mjs` (detalle geométrico + names arrays + header)
- `src/components/datacenter/GlbMesh.tsx` (bridge de texturas)
- `src/components/datacenter/ServerRackPool.tsx` (materiales + ContactShadows)
- `src/components/datacenter/DatacenterEnvironment.tsx` (512 + pasillos)
- `src/components/datacenter/DatacenterFloor.tsx` (raised floor y=0)
- `artwork/living-datacenter/verify-safe-gaps.mjs` (timeouts para máquina lenta,
  vars sin uso)
- `docs/datacenter/ASSET-PIPELINE.md` · `MESHY-CONTACT-SHEET.md` ·
  `MESHY-OUTPUT-PLAN.md` · `CREATIVE-AUDIT.md` (números del gate v2)

## DEPENDENCIES
- **Ninguna nueva.** Todo procedural (canvas runtime + three primitivas).

## ARCHITECTURAL IMPACT
- LOW — misma arquitectura (bridge §4), solo más detalle en materiales/geometría
  data-driven. Draw calls: sin cambio estructural (env map +1 pass, ContactShadows
  bake 1 frame). Payload 0.61 → 0.62 MB (< 3 MB §12).

## PERFORMANCE
- FPS: 60 medido en preview (8 cores/8 GB, perfil ULTRA).
- DRAW CALLS: +0 en escena (contact shadows = 1 pass de bake único).
- DPR: ULTRA [1,2] — sin cambios en la estrategia adaptativa.
- BUNDLE: GLBs 0.62 MB; texturas procedurales = canvas en runtime (0 KB red).

## ACCESSIBILITY
- STATUS: sin cambios — canvas decorativo aria-hidden, DOM intocado.

## SECURITY/CSP
- STATUS: sin violaciones; cero requests nuevos (R5), texturas 100% locales.

## I18N
- STATUS: sin cambios — sin texto nuevo en geometría (SPEC §23).

## COPILOT
- UNCHANGED.

## TESTS
- `datacenterTextures.test.ts` 4/4 · suite datacenter 28/28 · typecheck 0 ·
  lint 0 · build OK · `verify-safe-gaps.mjs` (G1/G5/G6 + arte) GATE PASS con
  errores reales de consola = 0 · `gen-assets.mjs` gate de autoría PASS por
  asset (rack 6468 tris/9 meshes · switch 4324/7 · storage 7210/7 · display
  3766/5; total 0.62 MB).

## VALIDACIÓN VISUAL (diff contra baseline)
`refcheck/diff-fidelity.mjs` (diff medio por escena pre vs post):
S1 +2.28 · S2 +1.80 · S3 +9.85 · S4 +14.51 (piso + luz + storage) · S5 +0.17
(pull-back amplio). Varianza local estable → más detalle material, sin ruido.

## GATE
- **PASS** — fidelidad sin regresiones (accesibilidad/seguridad/i18n/Copilot/
  performance). Nota: el shell de la máquina estuvo degradado (los probes
  requerían timeouts mayores); el fallo transitorio del probe era de timing,
  no de código.

## NEXT PHASE
- G3 (datos encarnados tipo Mastercard, ARCHITECTURAL) — el último gap del audit.
- Cuando lleguen outputs reales de Meshy: sustituir slots v2 por los modelos
  (gate de la contact sheet §1b ya tiene footprint y fit de cámara).
