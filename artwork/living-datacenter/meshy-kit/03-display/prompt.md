# Meshy.ai — Job 03 · NOC / SIEM Display (solo marco físico)

## Imágenes de referencia

- **Principal (marco):** `ref-soc-videowall.jpg` — foto real de videowall SOC (VuWall). ⚠️ Puede incluir operadores: recortar solo el videowall antes de subir (o usar el prompt negativo).
- **NO es input de Meshy (es textura de pantalla en runtime):**
  - `screen-texture-grafana-14000.png` (1205×1034, tema oscuro verificado) — candidata a textura de pantalla en `/public`
  - `screen-texture-grafana-1860-alt.png` (1918×947) — alternativa

## ⚠️ Decisión de dirección (importante)

**Este asset probablemente NO necesita Meshy.** El marco son 4 barras + 1 quad de pantalla (geometría trivial, ya modelada procedural: `siem_display_v01`, 3728 tris). El valor real está en la **textura de la pantalla** (Grafana), no en la geometría del marco. Ejecutar este job solo si se quiere un bezel industrial más detallado; caso contrario: **SKIP Meshy** y usar el procedural + textura.

## Prompt (pegar tal cual, si se ejecuta)

```text
Wall-mounted NOC monitoring display, physical frame only, 16:9, hard-surface modeling, low-poly optimized. Thin industrial bezel frame, small bottom control cluster, flat emissive screen surface - the UI is a separate texture/DOM layer, never modeled in geometry. PBR-ready topology: matte black metalness 0.3 roughness 0.6 frame, dark glass screen. Negative: no organic shapes, no cluttered wires, no debris, no people, no dashboard graphics, no text, no logo. Isolated on neutral background. Web optimization: 3-4K triangles, screen as single flat quad, no per-tile bezel. Premium enterprise industrial aesthetic, subtle rounded corners, uniform diffuse lighting.
```

## Parámetros recomendados

- **Export:** GLB binary (glTF 2.0)
- **Bajo poligono:** sí (3-4K tris)
- **CRÍTICO:** el output debe traer `screen` como quad plano sin subdivisión y **sin textura de UI embebida** (la UI es capa separada)

## Output esperado

- **Archivo:** `siem_display_v01.glb` → `public/assets/3d/`
- **Tris:** 3-4K · **Footprint slot:** 1.62 × 0.9 × 0.12, pantalla alineada a +z
- **Meshes canónicos (bridge §4):** `frame`, `screen`, `back_panel`
- **Escenas:** S1 (consola de boot), S3 (paneles SIEM), S4 (alertas ámbar), S5 (nodo central)

## Ver plan completo

`docs/datacenter/MESHY-OUTPUT-PLAN.md` → §2.3
