# Report — G5: Clearcoat sutil en GLBs hero (runtime)

**Fecha:** 2026-08-11 · **GATE: ✅ PASS** · **Origen:** CREATIVE-AUDIT §5 (gap G5, dirección iyO: acabado de superficie premium) · **Clase:** SAFE (bridge runtime, §4)

## IMPLEMENTED

- **`src/lib/datacenter.materials.ts`**: mapa data-driven `CLEARCOAT_BY_MESH` (`chassis` 0.25/0.35 · `frame` 0.3/0.3 · `bezel_slats` 0.35/0.25) + `NO_CLEARCOAT_MESHES` (emisivos/alpha del bridge: `leds_*`, `screen`, `door`, `units`, `fasteners`, `plinth`, `rear_controllers`, `back_panel`) + `clearcoatForMesh(name)`.
- **`GlbMesh`** (bridge §4): el chasis/bezel/frame se eleva a `MeshPhysicalMaterial().copy(mat)` con clearcoat — el GLB sigue **100% PBR-neutral** (cero re-export por acabado), albedo y emisivos intactos.
- Regla de diseño: NUNCA clearcoat en meshes con cutout/emisivo (despilfarro de shader + look sucio).

## FILES CREATED

- `src/lib/datacenter.materials.ts` + `datacenter.materials.test.ts`

## FILES MODIFIED

- `src/components/datacenter/GlbMesh.tsx` (rama `else if (cc)` en `applyRuntimeMaterials`)

## ARCHITECTURAL IMPACT / PERFORMANCE

**LOW** · +0 draw calls; 3 materiales por GLB pasan a `MeshPhysicalMaterial` (coste de shader despreciable vs escena) · sin nuevos requests (R5) · Copilot **UNCHANGED**.

## TESTS / GATE

4 tests (resolución case-insensitive, meshes desconocidos → null, exclusión de emisivos/alpha, valores conservadores 0 < clearcoat < 0.5) · typecheck 0 · lint 0 → **PASS** (look final en navegador pendiente).
