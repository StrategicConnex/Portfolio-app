# Job 03 · NOC / SIEM Display — Carga del output de Meshy

**Slot:** `siemDisplay` · S3 (lectura de UI) + S5 (nodo central) · **Baseline:** `siem_display_v01.glb` (3766 tris / 110 KB) — ya VIVO en `SiemDisplayPanel.tsx` (`GlbAsset` con `GLB_ASSETS.siemDisplay`).

## ⚠️ RECOMENDACIÓN (MESHY-OUTPUT-PLAN §3.3): SKIP Meshy
El marco es 4 barras + 1 quad (geometría trivial); el procedural ya lo resuelve.
**El valor real está en la textura de pantalla** — el kit ya tiene
`screen-texture-grafana-14000.png` (tema oscuro) y la UI procedural de runtime
(`screenUiTexture`) ya está activa. **Check de licencia pendiente** antes de
embeker cualquier captura de Grafana en `/public`.

## Si aun así se ejecuta Meshy
- **Imagen:** `ref-soc-videowall.jpg` (recortar operadores antes de subir — cero personas)
- **Prompt:** `prompt.md` — CLARIFICAR que solo se genera el **MARCO FÍSICO**; `screen` como quad plano a +z SIN textura de UI embebida
- **Modo:** Image to 3D · Export GLB binary

## Qué descargar y dónde
```
raw/siem_display_v02.glb          ← output de Meshy (bump v02)
raw/siem_display_v02-preview.png
raw/siem_display_v02-runtime.png
```

## Qué hacer con el output (§2 + §3.3)
1. **Autoría gate:** tris 3-4K, meshes `frame · screen · back_panel`, screen sin textura de UI.
2. **Post-proceso (§3.3):** footprint 1.62×0.9×0.12 base y=0, marco industrial delgado, pantalla orientada a +z (cámara S3/S4 mira desde +z).
3. **Pipeline + wiring + probe + decisión:** idéntico al resto (ver 04-rack/raw/README-LOAD.md pasos 3-6).
4. **Decisión esperada:** documentar el output en `raw/` sin promover si no supera al procedural; integrar la textura de pantalla (licencia) + pool procedural en su lugar.

**Reversión:** `git checkout public/assets/3d/siem_display_v01.glb`.
