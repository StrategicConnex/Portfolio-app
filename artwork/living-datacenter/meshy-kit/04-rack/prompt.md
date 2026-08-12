# Meshy.ai — Job 04 · Server Rack 42U

## Imagen de referencia (subir a Meshy)

- **Principal:** `ref-apc-netshelter-ar2580.jpg` — APC NetShelter SV 42U (AR2580), foto de estudio sobre blanco 1500×1500. **La mejor referencia del lote:** frontal limpio, puerta de malla, casters, proporciones 19″ reales.
- **Alt:** `ref-apc-netshelter-sx-alt.jpg` — NetShelter SX en 3/4 (puerta sólida con ventilación). ⚠️ Confirmar visualmente que es el 42U (doc-ref del carrusel).
- **Nota:** el slot S1 ya tiene `server_rack_v01.glb` procedural (6598 tris) vivo en el hero — Meshy solo gana si mejora la estética de la puerta de malla a ≤ presupuesto.

## Modo Meshy

**Image to 3D** — asset único (gabinete completo, puerta cerrada).

## Prompt (pegar tal cual)

```text
42U 19-inch server rack cabinet, 600×2000×1200 mm floor-standing, hard-surface modeling, low-poly optimized. Standardized 19-inch proportions, rectangular frame, perforated mesh front door pattern as alpha/normal map, base and top plinths, small casters, flat side panels. PBR-ready topology: powder-coated black steel metalness 0.7 roughness 0.5, door mesh alpha. Negative: no organic shapes, no cluttered wires, no debris, no people, no servers inside, no brand text, no logo. Isolated on neutral background, base origin at y=0. Web optimization: 6-8K triangles, no mesh geometry per vent. Premium enterprise industrial aesthetic, uniform diffuse lighting.
```

## Parámetros recomendados

- **Export:** GLB binary (glTF 2.0)
- **Bajo poligono:** sí (6-8K tris)
- **CRÍTICO:** la puerta debe ser **plano con alpha/normal map** (cero geometría de rejilla) — si Meshy genera malla de ventilación real, decimar y re-bake en Blender

## Output esperado

- **Archivo:** `server_rack_v01.glb` → `public/assets/3d/`
- **Tris:** 6-8K · **Footprint slot:** 1.0 × 2.4 × 0.9, base y=0
- **Meshes canónicos (bridge §4):** `chassis`, `plinth`, `door`, `units`, `leds_status`, `leds_power`, `fasteners`
- **Escenas:** S1 (hero emergiendo de la niebla), S2-S4 (corredor/filas), S5 (grid)

## Ver plan completo

`docs/datacenter/MESHY-OUTPUT-PLAN.md` → §2.4
