# Reporte P6a — Split canónico de los GLBs Tripo (re-bake)

> **Fase:** P6a (REBAKE-PLAN-P6 §3-§4) · **Estado:** ✅ Entregable listo — split
> automatizado + verificación pre-promoción validada. **Pendiente operativo:** la
> ejecución del export requiere Blender (no está instalado en este entorno).
> **Reporte:** SPEC §37 · **Audit:** [CREATIVE-AUDIT](./../CREATIVE-AUDIT.md)

---

## 1. Objetivo

Restaurar el CONTRATO de mallas/materiales que los bridges runtime
(`GlbMesh.tsx` + `datacenter.materials.ts`) esperan en los GLBs Tripo, **sin
re-modelar**: dividir el mesh único `tripo_node_*` en los meshes canónicos
(`chassis`, `door`, `plinth`, `leds_*`, `bezel_slats`, `rear_controllers`…) y
asignar los factores PBR del contrato por región, conservando el albedo
horneado como Base Color (lección P5: el lever del realismo NO es runtime — es
este re-bake).

## 2. Estado del baseline (verificación pre-ejecución)

`node artwork/living-datacenter/dump-glb-pbr.mjs` sobre los GLBs actuales
confirma el diagnóstico P5:

| Asset | Meshes | Materiales | `metallicFactor` | `roughnessFactor` |
| --- | --- | --- | --- | --- |
| `server_rack_v03.glb` | 1 (`tripo_node_9b53…`) | 1 | **0** | **0.9** |
| `storage_unit_v02.glb` | 1 (`tripo_node_b753…`) | 1 | **0** | **0.9** |

→ Criterio PASS actual: **0/4** (cero meshes canónicos, metal 0, un solo
material, sin nombres de bridge).

## 3. Entregables de la fase

### 3.1 `artwork/living-datacenter/blender-p6a-split.py` (NUEVO)

Script Blender **headless** que automatiza el split canónico de P6a (hasta hoy
proceso GUI):

- **Import** del GLB + corrección de anclaje (base y=0, sin re-escalar — el fit
  se preserva del v03/v02 horneado).
- **Albedo compartido**: carga el full-res del provenance
  (`meshy-kit/<asset>/raw/*_tex-src.jpg`) como Base Color de cada material.
- **Split por región** con filtros configurables por asset: `axis`/`axis_range`
  (banda espacial del centroide, p.ej. plinth en y 0-0.15) y `uv_bounds` (rango
  de islas UV). Orden de estrategia: islas UV → bandas de eje → manual.
- **Regla de seguridad**: si una región no se aísla con los filtros (típico de
  los LEDs horneados en el mismo UV del chassis), el script lo **reporta y deja
  esa geometría en `chassis`** — nunca corta a ciegas.
- **PBR del contrato por región** (Principled únicamente): chassis 0.7-0.85 /
  0.4-0.5, bezel 0.9/0.35, plinth 0.7/0.5, `leds_*` con baseColor apagado (el
  runtime les asigna el emisivo por escena), `rear_controllers` plástico 0/0.8.
- **Export** ASSET-PIPELINE §5 verbatim: `Triangulate` AL FINAL (modifier),
  `Apply Transforms` (`export_apply=True`), sin cámaras/luces/animaciones/
  empties, nombre versionado (`server_rack_v04.glb` · `storage_unit_v03.glb`).
- **`--dry-run`**: imprime las islas UV detectadas + qué regiones se separarían,
  sin modificar nada — para inspeccionar el GLB antes de cortar.

### 3.2 Harness de lógica `test-p6a-logic.mjs` (NUEVO)

Valida la lógica pura del split **sin Blender** (el entorno no lo tiene): la
colección de islas UV por conectividad de borde y los filtros de región sobre
un mesh sintético de 2 islas separadas.

**Resultado:** `P6A-LOGIC-OK` — 2 islas aisladas correctamente · filtro door →
isla A (z∈0.15-2.4) · filtro plinth → isla B (y∈0-0.15) · LEDs sin isla UV
dedicada → **no se corta a ciegas** (regla de seguridad verificada).
*Lección del harness:* el primer intento usaba UVs de quad degenerados (dos
vértices con la misma u → el borde se colapsa y las islas se fusionan) — los
UVs sintéticos deben ser esquinas reales de quad.

### 3.3 Documentación

`REBAKE-PLAN-P6.md` §3.0 — workflow automatizado headless (inspección → split →
verificación), con la regla de seguridad y la referencia al script.

## 4. Gate de la fase

| Check | Resultado |
| --- | --- |
| `python -c "import ast"` (sintaxis del script Blender) | ✅ SYNTAX-OK |
| Harness de lógica del split | ✅ P6A-LOGIC-OK |
| Typecheck | ✅ 0 errores |
| Tests | ✅ 399/399 |
| Lint | ✅ 0 |
| Build | ✅ Compiled successfully |

Sin cambios de runtime (cero código de la app tocado — solo tooling + docs).

## 5. Pasos operativos restantes (en la máquina con Blender ≥ 3.6)

```bash
# Inspección (obligatoria antes de cortar):
blender --background --factory-startup --python artwork/living-datacenter/blender-p6a-split.py -- \
  --asset storage --input public/assets/3d/storage_unit_v02.glb \
  --tex artwork/living-datacenter/meshy-kit/02-storage/raw/storage_unit_v02_tex-src.jpg \
  --out public/assets/3d/storage_unit_v03.glb --dry-run

# Split real (sin --dry-run) → exporta storage_unit_v03.glb
# Ídem rack → server_rack_v04.glb

# Verificación pre-promoción (REBAKE-PLAN-P6 §5.4):
node artwork/living-datacenter/dump-glb-pbr.mjs public/assets/3d/server_rack_v04.glb public/assets/3d/storage_unit_v03.glb
```

**Criterio PASS post-export:** cero `tripo_node_*` · metal/rough por contrato
(chassis 0.7-0.85 / 0.4-0.5, bezel 0.9/0.35…) · nº de materiales > 1 · sin
`Emission` ni cámaras/luces/animaciones en el JSON. Luego: payload gate
(`npm run assets:glb -- --strict`), bridge CSP (extraer textura a WebP 2048²),
manifiesto (`GLB_ASSETS.heroRack` → v04, `storageUnit` → v03) y probes runtime
(LEDs emisivos, puerta AR2580, clearcoat).

**Recomendación de orden (plan §7):** storage primero (el `leds_lcd` es la
ganancia más visible — hoy el LCD viaja horneado y apagado; separado, el
runtime lo enciende en cyan en S4).

## 6. Rollback

Los v03/v02 actuales quedan en git — revertir es `git checkout`. El GLB viejo
se conserva en `meshy-kit/<asset>/raw/`. El bump de versión (§5
ASSET-PIPELINE) es obligatorio al promover el v04/v03.
