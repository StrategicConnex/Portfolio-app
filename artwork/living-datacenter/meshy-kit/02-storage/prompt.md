# Meshy.ai — Job 02 · Storage / Backup Unit 2U-4U

## Imágenes de referencia (subir a Meshy)

- **Principal:** `ref-netapp-a250-bezel.jpg` — NetApp AFF A250 con bezel plateado ventilado (frontal monolítico, sin drives expuestos)
  - ⚠️ El CDN de StorageReview sirve la rendition de 1000px (el original es 2000×1342 en la página). 1000px es aceptable para Image-to-3D; si se quiere máxima resolución, capturar la página del review en navegador.
- **Complementaria (trasera, la verá la cámara S4/S5):** `ref-me5-rear.jpg` — Dell PowerVault ME5, controllers duales + PSU
- **Alt:** `ref-me5-front-lcd.jpg` (frontal con LCD de estado) · `ref-netapp-a250-bezel-alt.jpg` (copia 1000px del principal)

## Modo Meshy

**Image to 3D** — asset único (frontal como driver; la trasera se referencia para el post-proceso).

## Prompt (pegar tal cual)

```text
2U rack-mount storage array, 445×88×558 mm, hard-surface modeling, low-poly optimized. Monolithic solid form with sealed silver vented bezel, no exposed drives; hot-swap handles as repeated instances; small status LCD recess; flat rear with dual controllers and PSU cutouts. PBR-ready topology: brushed aluminum metalness 0.9 roughness 0.35, dark plastic 0.0/0.8. Negative: no organic shapes, no cluttered wires, no debris, no people, no brand text, no logo, no open drive bays. Isolated on neutral background. Web optimization: 6-8K triangles, ventilation slots as normal map candidate. Premium enterprise industrial aesthetic, uniform diffuse lighting.
```

## Parámetros recomendados

- **Export:** GLB binary (glTF 2.0), sin cámaras/luces/animaciones
- **Bajo poligono:** sí (6-8K tris)
- **Si existe campo "negative prompt":** pegar la línea `Negative:` (opcional)

## Output esperado

- **Archivo:** `storage_unit_v01.glb` → `public/assets/3d/`
- **Tris:** 6-8K · **Footprint slot:** 1.8 × 1.0 × 1.2, base y=0
- **Meshes canónicos (bridge §4):** `chassis`, `bezel_slats`, `leds_lcd`, `leds_status`, `rear_controllers` (la trasera se modela aparte en Blender si Meshy no la saca limpia)
- **Escenas:** S3 (filas), S4 (protagonista 2N + trasera, luz ámbar), S5 (grid)

## Ver plan completo

`docs/datacenter/MESHY-OUTPUT-PLAN.md` → §2.2
