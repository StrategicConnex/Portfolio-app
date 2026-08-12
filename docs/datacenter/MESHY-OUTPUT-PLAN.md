# Meshy.ai — Plan de outputs (runbook)

> **Fecha:** 2026-08-11 · **Rol:** Technical Art Director (WebGL/R3F)
> **Kit de inputs:** [`artwork/living-datacenter/meshy-kit/`](../../artwork/living-datacenter/meshy-kit/) (imágenes locales + prompts listos para pegar)
> **Docs raíz:** [`MESHY-PROMPTS-BLENDER.md`](./MESHY-PROMPTS-BLENDER.md) (prompts §2 + guía Blender §3 + matriz §4) · [`ASSET-PIPELINE.md`](./ASSET-PIPELINE.md) (pipeline + convención footprint §5) · [`ASSET-SCENE-MAP.md`](./ASSET-SCENE-MAP.md) · **Hoja de contacto comparativa:** [`MESHY-CONTACT-SHEET.md`](./MESHY-CONTACT-SHEET.md) (referencia ↔ footprint ↔ output, registro de veredictos) + hoja visual `artwork/living-datacenter/meshy-kit/CONTACT-SHEET.html`

---

## 1. Estado actual (referencia para el gate de aceptación)

| Slot | Asset procedural | Tris | KB | Slot runtime | Escenas |
|---|---|---|---|---|---|
| `heroRack` | `server_rack_v02.glb` | 6468 | 181.2 | ✅ **VIVO** — `ServerRackPool.tsx` S1 (hero); puerta de malla procedural en runtime (bridge §4) + postes/tray (fidelidad G7) | S1, y racks de corredor instanciados S2-S5 |
| `networkSwitch` | `network_switch_v01.glb` | 4324 | 155.1 | ✅ **VIVO** — `ServerSwitchPool.tsx` (S3 protagonista + corredor) | S2/S3/S4/S5 |
| `storageUnit` | `storage_unit_v01.glb` | 7330 | 201.3 | ✅ **VIVO** — `BackupUnits.tsx` S4 (unidad protagonista) | S3/S4/S5 |
| `siemDisplay` | `siem_display_v01.glb` | 3728 | 103.6 | ⚠️ Path en `GLB_ASSETS` pero **sin pool** | S1/S3/S4/S5 (declarado) |

**Total:** 0.62 MB (< 3 MB §12) · draw calls actuales por escena S1~10 / S2~13 / S3~20 / S4~16 / S5~24 (< 50 §21).

**Regla rectora (SPEC §52):** *"Si procedural alcanza calidad suficiente: NO usar GLB."* Meshy solo se integra si **supera** al procedural actual en estética a costo igual o menor. Un output que no pasa el gate se descarta — el procedural nunca se degrada.

---

## 2. Gate común para TODO output (los 6 pasos)

Todo output de Meshy pasa exactamente este flujo antes de tocar runtime:

```
raw-<asset>.glb (descargado de Meshy → meshy-kit/<carpeta>/raw/)
   ↓ 1. AUTORÍA GATE  — re-parse con GLTFLoader (patrón scripts/gen-assets.mjs)
   │      · tris dentro del rango del contrato
   │      · meshes con nombres canónicos (chassis / leds_* / screen …)
   │      · cero emission en materiales (los LEDs los asigna el runtime, bridge §4)
   │      · sin cámaras/luces/animaciones/empties
   ↓ 2. POST-PROCESO Blender (MESHY-PROMPTS-BLENDER §3.x del asset)
   │      · escala al footprint del slot (base y=0, sin scale en runtime)
   │      · renombrar meshes canónicos · bake atlas 2K (Albedo+Normal+RMA)
   │      · Principled BSDF únicamente · Triangulate al final · export GLB solo "Mesh"
   ↓ 3. PIPELINE  — npm run assets:glb -- --strict
   │      · optimize --join-named false (preserva leds_*) --simplify false
   │      · validate + inspect + payload < 3 MB
   ↓ 4. WIRING  — src/lib/datacenter.layout.ts → GLB_ASSETS.<slot> = '/assets/3d/<asset>_v01.glb'
   ↓ 5. PROBE de runtime (verify-glb-assets.mjs o verify-glb-load.mjs)
   │      · 200 del GLB · requests por slot exactos · diff de píxeles con piso de ruido
   │      · scroll FIJO (no #id.offsetTop — varía entre cargas y mueve la cámara)
   │      · boundary global nunca disparado
   ↓ 6. DECISIÓN  — ¿supera al procedural? → promover a producción / NO → mantener procedural
```

**Nota operativa:** `next start` mapea `/public` al arrancar — añadir/reemplazar un GLB exige **reiniciar el servidor** antes del probe (verificado).

---

## 3. Plan por output

### 3.1 Output del Job 01 — Network Switch 1U

**Objetivo:** reemplazar `network_switch_v01.glb` procedural (4192 tris) por el modelo de Meshy.

- **Gate de aceptación:** chasis 1U limpio, cara de puertos con grid **bakeado** (no geometría por puerto), sin texto/marca. Debe verse mejor que el procedural **o** aportar la cara de puertos que hoy no existe (el procedural actual es un cuerpo simple con LEDs).
- **Post-proceso:** MESHY-PROMPTS-BLENDER §3.1 — footprint 0.82×0.07×0.5, meshes `chassis` + `leds_status` (plana). Si Meshy modela cada puerto (>6K tris), decimar y re-bake la cara como normal map.
- **Wiring runtime (2 pasos):**
  1. `src/lib/datacenter.layout.ts` → `GLB_ASSETS.networkSwitch` ya apunta al path (reemplazar archivo en `/public/assets/3d/`).
  2. **Crear el pool** de switches: `<Instances>` de la cara de puertos en los racks de S2/S3 (patrón `ServerRackPool`) + slot `GlbAsset` para el switch protagonista cerca de cámara en S3 (origen de data streams, LEDs activos solo en S3 — MicroAnimDriver).
- **Verificación:** `verify-glb-assets.mjs` extendido — el slot `networkSwitch` debe descargarse (HEAD+GET), los demás quedan inertes; señal localizada en S3 (scroll fijo).
- **Decisión:** si el pool de switches no se crea en esta pasada, el output queda listo en `/public` pero el slot sigue inerte (path declarado, cero requests) — **no** forzar un pool solo para "usar" el GLB.

### 3.2 Output del Job 02 — Storage / Backup Unit

**Objetivo:** reemplazar `storage_unit_v01.glb` procedural (7330 tris) en la unidad protagonista de S4 (`BackupUnits`).

- **Gate de aceptación:** bezel plateado monolítico que se vea **mejor** que el actual (el procedural es una caja con slats). La trasera (controllers + PSU, visible en S4/S5) debe conservarse — si Meshy no la genera limpia, modelarla en Blender (la referencia `ref-me5-rear.jpg` está en el kit).
- **Post-proceso:** MESHY-PROMPTS-BLENDER §3.2 — footprint 1.8×1.0×1.2 base-origen, meshes `chassis`, `bezel_slats`, `leds_lcd`, `leds_status`, `rear_controllers`.
- **Wiring runtime:** reemplazar `public/assets/3d/storage_unit_v01.glb` (el slot `GLB_ASSETS.storageUnit` ya está cableado en `BackupUnits.tsx` — **cero cambios de código** si el footprint y los nombres se respetan).
- **Verificación:** re-correr `verify-glb-assets.mjs` — señal localizada en la región de la unidad en S4 (scroll fijo ~6000), piso de ruido 0, bbox estrecho.
- **Decisión:** criterio puramente estético a costo igual (7330 tris / ~200 KB). El actual ya pasa todos los gates — Meshy debe ganar visualmente.

### 3.3 Output del Job 03 — NOC / SIEM Display

**Objetivo (recomendado: NO ejecutar Meshy).** El marco son 4 barras + 1 quad (geometría trivial); el procedural `siem_display_v01` (3728 tris) ya la resuelve. El valor real está en la **textura de pantalla**:

- **Textura de pantalla:** `meshy-kit/03-display/screen-texture-grafana-14000.png` (1205×1034, tema oscuro verificado 96%) → copiar a `/public/assets/3d/textures/grafana-14000.png` (o generar UI procedural por canvas según tier — ASSET-SCENE-MAP §6). **Check de licencia pendiente** antes de embeker la captura de Grafana en runtime.
- **Si aun así se ejecuta Meshy:** gate = marco industrial delgado que supere al procedural; `screen` como quad plano sin textura de UI embebida; pantalla orientada a +z (cámara S3/S4 mira desde +z).
- **Wiring runtime:** reemplazar el GLB + crear el pool de displays (1-4 según tier, instanciados) — el path `GLB_ASSETS.siemDisplay` ya existe.
- **Decisión esperada:** SKIP Meshy; integrar la textura de pantalla + pool procedural. Documentar el output de Meshy como `raw/` sin promover si no mejora.

### 3.4 Output del Job 04 — Server Rack 42U

**Objetivo:** reemplazar `server_rack_v02.glb` procedural (6408 tris) en el hero de S1.

- **Gate de aceptación:** la **puerta de malla** debe verse real (alpha/normal map de rejilla) **sin geometría de rejilla** (cero malla por vent — presupuesto y draw calls). Silueta del gabinete idéntica al footprint (1×2.4×0.9).
- **Post-proceso:** MESHY-PROMPTS-BLENDER §3.4 — meshes `chassis`, `plinth`, `door` (alpha), `units`, `leds_status`, `leds_power`, `fasteners`. Variante `_wall` (sin trasera, −30% polys) opcional para S2-S4.
- **Wiring runtime:** reemplazar `public/assets/3d/server_rack_v02.glb` — el slot `GLB_ASSETS.heroRack` ya está cableado en `ServerRackPool.tsx` (`HERO_RACK_GLB_POS`, base en y=0). **Cero cambios de código.** (El bump a `_v03` es obligatorio si el nuevo rack entra: versionado §5 ASSET-PIPELINE.)
- **Verificación:** re-correr `verify-glb-load.mjs` — señal en la proyección del rack hero post-scroll, piso de ruido 0.
- **Decisión:** el hero es la cara del sitio — aquí sí vale aceptar un output de Meshy si la puerta de malla mejora la dirección de arte (SPEC §3) manteniendo ≤8K tris y ≤ ~250 KB. Si no convence: mantener procedural (ya verificado).

---

## 4. Orden de ejecución recomendado

| Orden | Job | Razón |
|---|---|---|
| 1 | **04 · Rack** | Slot ya vivo; swap = 1 archivo + probe; define la dirección de arte del corredor |
| 2 | **02 · Storage** | Slot ya vivo; swap = 1 archivo + probe; refuerza S4 |
| 3 | **01 · Switch** | Requiere crear el pool — más trabajo; solo después de validar el patrón con rack/storage |
| 4 | **03 · Display** | SKIP Meshy recomendado; integrar textura de pantalla (licencia) + pool procedural |

Cada paso es reversible (el GLB anterior se guarda en `meshy-kit/<carpeta>/raw/` o se restaura del git history — los 4 GLBs están commiteados en el thread).

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Meshy genera malla de rejilla/ports (rompe presupuesto) | Decimate + re-bake a normal/alpha map (guía §3); gate tris en paso 1 |
| Output con logos/marca de la foto | Limpieza en Blender (step 8 de cada §3) antes del bake; prompt negativo ya incluido |
| CDN de referencias degrada resolución (SR → 1000px) | 1000px es aceptable para Image-to-3D; si se exige más, capturar la página en navegador |
| Textura de Grafana sin licencia aprobada | No embeker hasta aprobar (ASSET-SCENE-MAP §6); alternativa: UI procedural por canvas |
| `next start` no ve el GLB nuevo | Reiniciar servidor antes del probe (mapeo de `/public` al arranque) |
| Swap rompe un slot vivo | Los 4 GLBs están en git; revertir es un checkout. Los probes verifican antes/después |
| Draw calls suben por pool nuevo (switch/display) | Instancing + LOD por distancia + tier LOW apaga pools (matriz §4) |

## 6. Checklist final (por output promovido)

- [ ] Autoría gate PASS (tris, nombres canónicos, sin emission, sin cámaras/luces)
- [ ] Footprint del slot + base y=0 + sin scale en runtime (ASSET-PIPELINE §5)
- [ ] `npm run assets:glb -- --strict` PASS (payload < 3 MB, `--join-named false`)
- [ ] Reemplazado en `/public/assets/3d/` + servidor reiniciado
- [ ] Probe de runtime PASS (200, requests por slot, diff con piso de ruido, scroll fijo)
- [ ] Typecheck + tests + lint verdes
- [ ] Captura comparativa archivada en `artwork/living-datacenter/refcheck/`
- [ ] Reporte de fase (plantilla SPEC §37) archivado en `docs/datacenter/reports/`
- [ ] Decisión documentada: **PROMOVIDO** / **DESCARTADO (procedural mantiene)**
