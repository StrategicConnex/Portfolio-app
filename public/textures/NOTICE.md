# Texturas del globo — procedencia y licencia

Estas texturas se sirven desde la propia aplicación (`/textures/…`). Antes se
cargaban desde `unpkg.com/three-globe@2.45.6/example/img/…` en tiempo de
ejecución;servirlas en local elimina una dependencia de un tercero en cada
visita, permite cerrar `img-src` en la CSP y evita filtrar la IP del visitante
a un CDN externo.

## Archivos

| Archivo | Uso en la escena | Origen |
|---|---|---|
| `earth-blue-marble.jpg` | `map` (color diurno) | NASA Visible Earth — *Blue Marble: Land Surface, Shallow Water, and Shaded Topography* |
| `earth-topology.jpg` | `bumpMap` (relieve) | NASA Visible Earth — relieve topográfico |
| `earth-water.jpg` | `specularMap` (máscara de océanos) | NASA Visible Earth — máscara de agua |

## Licencia

- **three-globe** (el paquete del que se copiaron los originales) es
  **MIT** — Copyright (c) 2019 Vasco Asturiano.
- **Las imágenes son de dominio público**: son producto de la NASA (Visible
  Earth / Goddard Space Flight Center), y el material de la NASA no está
  sujeto a derechos de autor en EE. UU. ([NASA Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)).

## Optimización aplicada

Los originales se descargaron sin modificar de `three-globe@2.45.6` y se
recodificaron con `sharp` (en la imagen ya servida por la app, no en el
repositorio):

| Archivo | Original | Servido |
|---|---|---|
| `earth-blue-marble.jpg` | 4096×2048 PNG/JPEG, 1,46 MB | 2048×1024 JPEG q80, 227 KB |
| `earth-topology.jpg` | 2048×1024 PNG, 369 KB | 2048×1024 JPEG q85 en escala de grises, 84 KB |
| `earth-water.jpg` | 1600×800 PNG, 420 KB | 1024×512 JPEG q82, 50 KB |

La proyección sigue siendo equirectangular 2:1, así que las UV de la malla
(`u = (lng + 180) / 360`, `v = (90 + lat) / 180`) no cambian: la geografía
sigue alineada con los marcadores de país.
