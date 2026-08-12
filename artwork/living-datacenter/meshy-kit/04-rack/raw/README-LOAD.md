# Job 04 · Rack 42U — Carga del output de Meshy

**Slot:** `heroRack` · S1 (y corredor S2-S5) · **Baseline:** `server_rack_v02.glb` (6468 tris / 181 KB) — ya VIVO en `ServerRackPool.tsx` (`HERO_RACK_GLB_POS`, base y=0).

## Qué subir a Meshy
- **Imagen:** `ref-apc-netshelter-ar2580.jpg` (frontal limpio sobre blanco, la mejor del lote)
- **Prompt:** `prompt.md` → bloquear de texto `Prompt (pegar tal cual)` + línea `Negative:` en negative prompt
- **Modo:** Image to 3D · Export GLB binary (glTF 2.0)

## Qué descargar y dónde (convención de la hoja de contacto)
```
raw/server_rack_v03.glb          ← output de Meshy (renombrar: v03, el bump es obligatorio)
raw/server_rack_v03-preview.png  ← render del output post-proceso (para el overlay vs footprint)
raw/server_rack_v03-runtime.png  ← captura del probe en el sitio (verify-glb-load.mjs)
```
> El generador `meshy-contact-sheet.mjs` detecta automáticamente `raw/*.glb`, `raw/*-preview.*` y `raw/*-runtime.*`.

## Qué hacer con el output (gate MESHY-OUTPUT-PLAN §2 + §3.4)
1. **Autoría gate:** re-parse GLTFLoader — tris 6-8K, meshes `chassis · plinth · door · units · leds_status · leds_power · fasteners`, cero emission, sin cámaras/luces/animaciones.
2. **Post-proceso Blender (MESHY-PROMPTS-BLENDER §3.4):** footprint 1.0×2.4×0.9 base y=0, puerta de malla = plano con alpha/normal map (cero geometría de rejilla), bake atlas 2K, renombrar canónicos, Triangulate al final.
3. **Pipeline:** `npm run assets:glb -- --strict` (validate + inspect + payload < 3 MB).
4. **Wiring:** copiar a `public/assets/3d/server_rack_v03.glb` + `GLB_ASSETS.heroRack` → `'/assets/3d/server_rack_v03.glb'` en `src/lib/datacenter.layout.ts`. **Reiniciar servidor** (`next start` mapea /public al arrancar).
5. **Probe:** `artwork/living-datacenter/verify-glb-load.mjs` — señal localizada en el rack hero, piso de ruido 0, boundary nunca disparado. Copiar captura a `raw/server_rack_v03-runtime.png`.
6. **Decisión (SPEC §52):** ¿la puerta de malla supera al procedural actual? → sí: promover / no: revertir (`git checkout public/assets/3d/server_rack_v02.glb`) y mantener procedural.
7. **Hoja de contacto:** `node artwork/living-datacenter/meshy-contact-sheet.mjs` → regenera CONTACT-SHEET.html + estado JSON (verdict/notes a mano en `contact-sheet-state.json`).

**Reversión:** el GLB anterior está en git (`git checkout`). El bump de versión (§5 ASSET-PIPELINE) es obligatorio al entrar el nuevo rack.
