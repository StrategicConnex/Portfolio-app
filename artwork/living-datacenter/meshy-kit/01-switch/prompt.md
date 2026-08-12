# Meshy.ai — Job 01 · Network Switch 1U

## Imagen de referencia (subir a Meshy)

- **Archivo:** `ref-cisco-9300x.jpg` — Cisco Catalyst 9300X, hero oficial de producto (3200×1312, normalizado a JPEG)
- **Alt (si Cisco no convence):** Juniper EX4400 (fondo transparente) — descargar manualmente desde la librería oficial (bloqueada para este entorno)
- **Nota:** silueta canónica del chasis 1U con 48 puertos + uplinks. Si Meshy genera texto/marca, limpiar en Blender antes del bake (nunca dejar logos en albedo).

## Modo Meshy

**Image to 3D** — asset único, sin fondo/escena.

## Prompt (pegar tal cual)

```text
Enterprise 1U network switch, 44×485×483 mm rack-mount, hard-surface modeling, low-poly optimized. Front detail: 48-port RJ45 grid and dual SFP+ uplinks as port grid as normal map candidate, thin LED status row, brushed dark metal face, two rack ears. PBR-ready topology: metalness 0.85 chassis / 0.0 plastic, roughness 0.4, no emission. Negative: no organic shapes, no cluttered wires, no debris, no people, no brand text, no logo. Isolated on neutral background, single clean object. Web optimization: 4-6K triangles, no per-port inset geometry. Premium enterprise industrial aesthetic, matte charcoal, uniform diffuse lighting.
```

## Parámetros recomendados

- **Export:** GLB binary (glTF 2.0), sin cámaras/luces/animaciones
- **Bajo poligono:** sí (4-6K tris; si Meshy no deja fijar presupuesto, decimar en Blender)
- **Si existe campo "negative prompt":** pegar la línea `Negative:` del prompt (opcional, refuerza el filtro)

## Output esperado

- **Archivo:** `network_switch_v01.glb` → `public/assets/3d/`
- **Tris:** 4-6K · **Footprint slot:** 0.82 × 0.07 × 0.5, base y=0 (convención §5)
- **Meshes canónicos (bridge §4):** `chassis` (cuerpo), `leds_status` (tira de LEDs, plana)
- **Escenas:** S2 (hileras), S3 (origen de data streams), S4 (standby), S5 (grid)

## Ver plan completo

`docs/datacenter/MESHY-OUTPUT-PLAN.md` → §2.1
