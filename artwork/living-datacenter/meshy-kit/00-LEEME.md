# Meshy.ai Input Kit — Living Datacenter

> **Fecha:** 2026-08-11 · **Origen:** `docs/datacenter/MESHY-PROMPTS-BLENDER.md` §1-§2 y `REFERENCIAS-MESHY.md`
> **Plan de outputs:** [`docs/datacenter/MESHY-OUTPUT-PLAN.md`](../../../docs/datacenter/MESHY-OUTPUT-PLAN.md) — leer ANTES de ejecutar cada job.

## Qué hay aquí

| Job | Carpeta | Imagen principal | Estado ref |
|---|---|---|---|
| 01 · Switch 1U | `01-switch/` | `ref-cisco-9300x.jpg` (3200×1312, descargada hoy por navegador) | ✅ local |
| 02 · Storage 2U-4U | `02-storage/` | `ref-netapp-a250-bezel.jpg` (1000×671 — CDN degrada; aceptable) + `ref-me5-rear.jpg` | ✅ local |
| 03 · Display SIEM (marco) | `03-display/` | `ref-soc-videowall.jpg` (1600×700, recortar operadores) | ⚠️ local |
| 04 · Rack 42U | `04-rack/` | `ref-apc-netshelter-ar2580.jpg` (1500×1500, la mejor del lote) | ✅ local |

Cada carpeta tiene su `prompt.md` con: prompt exacto para pegar, parámetros Meshy, naming del output y los meshes canónicos esperados.

## Cómo cargar cada job en Meshy.ai

1. Meshy → **Image to 3D** → subir la imagen principal de la carpeta (drag & drop).
2. Pegar el prompt del `prompt.md` **tal cual** (≤120 palabras, ya validado).
3. Opcional: pegar la línea `Negative:` en el campo de negative prompt.
4. Export: **GLB binary (glTF 2.0)**.
5. Descargar el resultado como `raw-<asset>-v01.glb` y guardarlo en `meshy-kit/<carpeta>/raw/` (crear si no existe).

## Reglas que no se negocian (SPEC)

- **Footprint del slot:** el GLB se autoriza a las dimensiones del slot en unidades de escena (rack 1×2.4×0.9 · storage 1.8×1×1.2 · switch 0.82×0.07×0.5 · display 1.62×0.9×0.12), **origen en base y=0**, y se posiciona con `position` SOLO (sin `scale`). Ver ASSET-PIPELINE §5.
- **Meshes canónicos:** renombrar a `chassis`, `leds_*`, `screen`, etc. — el runtime asigna emisivos por nombre (bridge §4). Cero emission en el GLB.
- **Cero logos/marcas:** si el output trae texto de la foto de referencia, limpiar en Blender antes del bake.
- **Texturas:** atlas único 2K (Albedo+Normal+RMA), sin UDIM, padding ≥8px.
- **Licencia:** las fotos son referencia/input de geometría original; ninguna se embebe en runtime (todo lo que va a `/public` es procedural o textura de pantalla con licencia aprobada).

## Flujo después de descargar cada output

```
raw-<asset>.glb (de Meshy)
   ↓ 1. Autoría gate (re-parse GLTFLoader: tris, meshes, sin emission)
   ↓ 2. Post-proceso Blender (MESHY-PROMPTS-BLENDER §3.x: footprint, nombres, bake, export)
   ↓ 3. npm run assets:glb  (optimize --join-named false → validate → inspect → payload < 3MB)
   ↓ 4. Wiring: src/lib/datacenter.layout.ts → GLB_ASSETS.<slot>
   ↓ 5. Probe de runtime (verify-glb-assets.mjs: 200s, requests, diff de píxeles con piso de ruido)
   ↓ 6. Hoja de contacto: copiar render a raw/<asset>-preview.png + captura del probe a raw/<asset>-runtime.png
      y regenerar la hoja visual → node meshy-contact-sheet.mjs (docs/datacenter/MESHY-CONTACT-SHEET.md)
   ↓ 7. DECISIÓN: ¿supera al procedural actual? → sí: promover / no: descartar y mantener procedural
```

Detalle paso a paso por asset en `MESHY-OUTPUT-PLAN.md`.

## 📥 Carga del output — README-LOAD.md por job

Cada job tiene `raw/README-LOAD.md` con el runbook exacto de carga
(qué subir a Meshy, qué descargar y con qué nombre, los 6 pasos del gate y
la reversión):

| Job | README | Slot (verificado vivo) |
|---|---|---|
| 04 · Rack | [`04-rack/raw/README-LOAD.md`](./04-rack/raw/README-LOAD.md) | `heroRack` · S1 (`ServerRackPool.tsx`) |
| 02 · Storage | [`02-storage/raw/README-LOAD.md`](./02-storage/raw/README-LOAD.md) | `storageUnit` · S4 (`BackupUnits.tsx`) |
| 01 · Switch | [`01-switch/raw/README-LOAD.md`](./01-switch/raw/README-LOAD.md) | `networkSwitch` · S3 (`ServerSwitchPool.tsx`) |
| 03 · Display | [`03-display/raw/README-LOAD.md`](./03-display/raw/README-LOAD.md) | `siemDisplay` · S3/S5 (`SiemDisplayPanel.tsx`) — **SKIP Meshy recomendado** |

**Estado verificado (2026-08-12):** los 4 slots GLB están **cableados y vivos**
(paths en `GLB_ASSETS` + slot `GlbAsset` montado + GLB procedural en
`/public/assets/3d/`). Un output de Meshy solo reemplaza el archivo en
`/public` (bump de versión) y pasa el gate — no hay que crear infraestructura.
