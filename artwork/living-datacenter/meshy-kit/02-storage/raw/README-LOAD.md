# Job 02 · Storage 2U-4U — Carga del output de Meshy

**Slot:** `storageUnit` · S4 (unidad protagonista de BackupUnits) · **Baseline:** `storage_unit_v01.glb` (7210 tris / 199 KB) — ya VIVO en `BackupUnits.tsx` (`GlbAsset` con `GLB_ASSETS.storageUnit`). **Cero cambios de código** si footprint y nombres se respetan.

## Qué subir a Meshy
- **Imagen:** `ref-netapp-a250-bezel.jpg` (bezel frontal) + `ref-me5-rear.jpg` (trasera controllers/PSU — necesaria para S4/S5)
- **Prompt:** `prompt.md` → bloque `Prompt (pegar tal cual)` + `Negative:`
- **Modo:** Image to 3D · Export GLB binary

## Qué descargar y dónde
```
raw/storage_unit_v02.glb          ← output de Meshy (bump v02)
raw/storage_unit_v02-preview.png  ← render post-proceso
raw/storage_unit_v02-runtime.png  ← captura del probe en S4
```

## Qué hacer con el output (§2 + §3.2)
1. **Autoría gate:** tris 6-8K, meshes `chassis · bezel_slats · leds_lcd · leds_status · rear_controllers`, sin emission, sin extras.
2. **Post-proceso (§3.2):** footprint 1.8×1.0×1.2 base y=0, bezel plateado monolítico, **trasera conservada** (si Meshy no la genera limpia, modelar en Blender), bake atlas 2K.
3. **Pipeline:** `npm run assets:glb -- --strict`.
4. **Wiring:** copiar a `public/assets/3d/storage_unit_v02.glb` + `GLB_ASSETS.storageUnit` → v02 en `src/lib/datacenter.layout.ts`. Reiniciar servidor.
5. **Probe:** `verify-glb-assets.mjs` — señal en la región de la unidad S4, piso de ruido 0. Captura → `raw/storage_unit_v02-runtime.png`.
6. **Decisión:** criterio estético a costo igual (7210 tris / ~200 KB). El procedural ya pasa todos los gates — Meshy debe ganar visualmente.
7. **Hoja de contacto:** `node artwork/living-datacenter/meshy-contact-sheet.mjs`.

**Reversión:** `git checkout public/assets/3d/storage_unit_v01.glb`.
