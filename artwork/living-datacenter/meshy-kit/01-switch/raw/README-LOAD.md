# Job 01 · Network Switch 1U — Carga del output de Meshy

**Slot:** `networkSwitch` · S3 (protagonista, origen de data streams) + corredor instanciado · **Baseline:** `network_switch_v01.glb` (4324 tris / 158 KB) — ya VIVO en `ServerSwitchPool.tsx` (`GlbAsset` con `GLB_ASSETS.networkSwitch`).

## Qué subir a Meshy
- **Imagen:** `ref-cisco-9300x.jpg` (hero oficial, frontal limpio)
- **Prompt:** `prompt.md` → bloque `Prompt (pegar tal cual)` + `Negative:` — incluye "port grid as normal map candidate"
- **Modo:** Image to 3D · Export GLB binary

## Qué descargar y dónde
```
raw/network_switch_v02.glb        ← output de Meshy (bump v02)
raw/network_switch_v02-preview.png
raw/network_switch_v02-runtime.png
```

## Qué hacer con el output (§2 + §3.1)
1. **Autoría gate:** tris 4-6K, meshes `chassis · leds_status` (+ cara de puertos), sin emission.
2. **Post-proceso (§3.1):** footprint 0.82×0.07×0.5 base y=0, cara de puertos **bakeada a normal map** (si Meshy modela cada puerto >6K, decimar y re-bake), sin texto/marca.
3. **Pipeline:** `npm run assets:glb -- --strict`.
4. **Wiring:** copiar a `public/assets/3d/network_switch_v02.glb` + `GLB_ASSETS.networkSwitch` → v02. Reiniciar servidor.
5. **Probe:** `verify-glb-assets.mjs` — slot networkSwitch descarga (HEAD+GET), los demás inertes, señal localizada en S3.
6. **Decisión:** debe verse mejor que el procedural **o** aportar la cara de puertos que hoy no existe (el procedural es cuerpo simple con LEDs).
7. **Hoja de contacto:** `node artwork/living-datacenter/meshy-contact-sheet.mjs`.

**Reversión:** `git checkout public/assets/3d/network_switch_v01.glb`.
