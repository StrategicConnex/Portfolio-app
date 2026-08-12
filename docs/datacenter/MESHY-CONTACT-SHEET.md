# Meshy.ai — Hoja de contacto comparativa (outputs vs referencias vs footprint de slots)

> **Fecha:** 2026-08-11 · **Rol:** Technical Art Director (WebGL/R3F)
> **Estado:** outputs de Meshy **pendientes** — esta hoja es la plantilla de comparación lista para recibirlos (la parte visual se genera con `artwork/living-datacenter/meshy-contact-sheet.mjs`).
> **Cadena de docs:** [`MESHY-OUTPUT-PLAN.md`](./MESHY-OUTPUT-PLAN.md) (runbook de 6 pasos) · [`MESHY-PROMPTS-BLENDER.md`](./MESHY-PROMPTS-BLENDER.md) (prompts + Blender) · [`REFERENCIAS-MESHY.md`](./REFERENCIAS-MESHY.md) · [`ASSET-PIPELINE.md`](./ASSET-PIPELINE.md) (contrato de authoring) · Kit: [`artwork/living-datacenter/meshy-kit/`](../../artwork/living-datacenter/meshy-kit/)

---

## 0. Propósito y regla rectora

Una hoja de contacto compara **en un vistazo** tres ejes por asset:

```
REFERENCIA (foto real del kit)  ↔  FOOTPRINT DEL SLOT (caja de la escena)  ↔  OUTPUT MESHY (GLB raw)
       silueta / detalle                proporción / anclaje / meshes            ¿cumple ambos?
```

La decisión final es de **SPEC §52**: *"Si procedural alcanza calidad suficiente: NO usar GLB."* Un output de Meshy se integra solo si **supera** al procedural actual (rack `v02` / storage `v01` ya vivos en runtime) a costo igual o menor. Si no convence: se archiva en `meshy-kit/<carpeta>/raw/` y el procedural mantiene. **Nada de esta hoja degrada lo que ya está verificado.**

El baseline procedural actual (0.62 MB total, todos GATE PASS — `scripts/gen-assets.mjs`, bump fidelidad 2026-08-11):

| Slot | GLB procedural | Tris | Meshes | KB | Runtime |
|---|---|---|---|---|---|
| `heroRack` | `server_rack_v02.glb` | 6468 | 9 | 181.2 | ✅ VIVO (S1, `HERO_RACK_GLB_POS`) — puerta de malla AR2580 procedural en runtime (bridge §4) + postes/tray |
| `networkSwitch` | `network_switch_v01.glb` | 4324 | 7 | 155.1 | ✅ VIVO en `ServerSwitchPool` (S3 protagonista + corredor) — vents + aletas |
| `storageUnit` | `storage_unit_v01.glb` | 7330 | 5 | 201.3 | ✅ VIVO (S4, `BackupUnits`) |
| `siemDisplay` | `siem_display_v01.glb` | 3728 | 3 | 103.6 | ⚠️ declarado, sin pool |

---

## 1. La hoja — matriz maestra (comparación de un vistazo)

| Asset | Referencia (kit) | Silueta que busca el ojo | Footprint del slot (w×h×d) | Aspecto frontal | Anclaje / posición | Meshes canónicos (contrato §4) | Budget tris | Output Meshy (por llenar) | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| **Rack 42U** | `04-rack/ref-apc-netshelter-ar2580.jpg` (1500²) | gabinete alto, puerta de malla perforada, plinto + casters | `1 × 2.4 × 0.9` | **0.417** (alto; 1/2.4 — no 0.9/2.4) | base y=0 → `[0,0,0]` (S1 hero) | `chassis, plinth, door, units, leds_status, leds_power, fasteners` | 6–8K | `—` | `—` |
| **Switch 1U** | `01-switch/ref-cisco-9300x.jpg` (3200×1312) | chasis 1U achatado, cara de puertos RJ45/SFP, orejas | `0.82 × 0.07 × 0.5` | **11.7** (muy plano) | base y=0 → racks del corredor S2/S3 | `chassis, leds_status` (+ cara de puertos) | 4–6K | `—` | `—` |
| **Storage 2U-4U** | `02-storage/ref-netapp-a250-bezel.jpg` (1000×671) + `ref-me5-rear.jpg` | bezel monolítico plateado, LCD, trasera con controllers | `1.8 × 1.0 × 1.2` | **1.8** | base y=0 → `[0,−2.9,−4]` (S4 protagonista) | `chassis, bezel_slats, leds_lcd, leds_status, rear_controllers` | 6–8K | `—` | `—` |
| **Display SIEM** | `03-display/ref-soc-videowall.jpg` (1600×700) + texturas Grafana | marco industrial delgado, **UI NO en geometría** | `1.62 × 0.9 × 0.12` | **1.8** | base y=0, pantalla a +z (cámara S3/S4) | `frame, screen, back_panel` | 3–4K | `—` | `—` |

**Lectura rápida del aspecto frontal:** el rectángulo del footprint (SVG en la hoja visual) debe poder contener la silueta del output de Meshy sin deformarla — si el output llega con proporciones de la *foto* (p. ej. el rack AR2580 es cuadrado 1500²) y no del *slot* (0.375), falla el gate de footprint y se reescala en Blender (§5), no en runtime.

---

## 1b. Verificación cámara ↔ footprint (2026-08-11)

Proyección de los 4 footprints por los waypoints entry/mid/exit de su escena (`src/lib/scenes.ts`) con frustum de perspectiva real (fov vertical + lookAt basis), en viewport desktop 16:9 y móvil 9:16. Script reproducible: `node artwork/living-datacenter/verify-camera-fit.mjs`. Rack y storage usan la posición **real** en runtime; switch y display usan la **planificada** en los docs (pools sin crear) — re-correr el script cuando existan los pools.

| Asset | Escena | Estado slot | % alto desktop (entry→mid→exit) | % ancho móvil | Veredicto |
|---|---|---|---|---|---|
| **Rack 42U** | S1 Boot | REAL (GLB v02 vivo) | 19.5 → 25.0 → **31.7** | 14.5–23.6 | ✅ **COINCIDE** — silueta dominante correcta, en frame todo el recorrido |
| **Storage 2U-4U** | S4 Resilience | REAL (GLB v01 vivo) | **FUERA en entry** · 13.4 → 9.6 | 28–40 | ⚠️ **DESVÍO MODERADO** — el protagonista no se ve en la 1ª mitad de la escena y queda chico en desktop |
| **Switch 1U** | S3 Data | PLANIFICADO | 1.4 → 1.9 → 2.7 | **FUERA en entry/mid** | ❌ **DESVÍO MAYOR** — 1U sub-legible a distancia de corredor; detalle de puertos invisible |
| **Display SIEM** | S5 Connection (+S3) | PLANIFICADO | S5: 8.7 → 5.9 → 4.4 · **S3: 11.7 → 20.0 → 30.3** | S5 ok · **S3 fuera en mid/exit** | ⚠️ **DESVÍO MENOR** — en S5 es nodo pulsante (no lectura); la UI se lee bien en S3 |

### Hallazgos por asset

**Rack (S1) — sin desvío.** El footprint 1×2.4×0.9 proyecta 20-32% del alto de pantalla en desktop y 14-24% del ancho en móvil, centrado con la base apoyando en el tercio inferior. El GLB v02 (puerta de malla procedural) queda en la zona de legibilidad correcta. Único matiz ya documentado: el DOM del hero (Z-40) cubre el rack en scroll 0.

**Storage (S4) — desvío moderado: la cámara deja chico al protagonista.** El waypoint de **entry** no encuadra la unidad (queda fuera del frustum por abajo, bbox y[-1.49,-0.71]); entra al frame recién hacia mid (13.4% de alto desktop, abajo del centro) y se encoge a 9.6% en exit. **Impacto para Meshy:** el detalle que justifica un output (bezel plateado, LCD, slats — PROMPTS-BLENDER §3.2) es sub-legible por debajo de ~10% de alto; en móvil el fit es bueno (28-40% de ancho). Si el bezel debe lucirse en desktop, hace falta un waypoint más cercano o aceptarlo como unidad de contexto con el protagonismo puesto por la luz ámbar.

**Switch (S3) — desvío mayor: la colocación planificada hace invisible el detalle.** El 1U (0.07 de alto) en la cara del rack del corredor (x=-2.6, z=-2.5) proyecta **1.4-2.7% del alto** en desktop — un sliver; el grid de puertos (el valor del GLB según Meshy §2.1) jamás se lee a esa distancia. En móvil queda **fuera de frame** durante entry/mid (frustum 9:16 estrecho) y solo entra en exit (36% ancho, 2.7% alto). **Implicancia:** o se crea un slot protagonista cercano a cámara en S3 (z ≤ 1.5, tipo el rack hero de S1) — y entonces el footprint 1U sí rinde — o el switch queda como elemento decorativo de contexto y el detalle de puertos no se justifica en el presupuesto. El footprint en sí (0.82×0.07×0.5, aspecto 11.7:1) es correcto; el problema es el encuadre.

**Display (S5) — desvío menor, con hallazgo positivo en S3.** En S5 (pull-back) el display en el nodo central proyecta 4.4-8.7% de alto — consistente con un nodo que *pulsa* (visualEvent `pulseCentralNode`), no con UI legible. La sorpresa es **S3**: a la cámara de data-in-motion el mismo display proyecta 11.7→20.0→30.3% de alto en desktop — ahí la textura de pantalla (Grafana/procedural) SÍ es legible. **Implicancia:** la escena de lectura de la UI SIEM es S3, no S5; en móvil el display en S3 queda fuera de frame en mid/exit (desplazado a la derecha del frustum estrecho).

### Efecto en la aceptación de outputs de Meshy

| Output | Consecuencia del fit | Decisión sugerida |
|---|---|---|
| Rack | El fit actual ya lo muestra bien — sin impacto | Gate normal (§5) |
| Storage | El detalle solo rinde en mid+móvil; si Meshy gana en luz ámbar más que en detalle, sirve igual | Aceptar si mejora S4 visualmente (desvío no bloquea) |
| Switch | El grid de puertos no se verá sin slot cercano — **decidir el slot ANTES de invertir en Meshy** | Crear slot protagonista S3 o dejar el switch procedural decorativo |
| Display | La UI se lee en S3 (12-30%); en S5 es pulso | SKIP Meshy (marco trivial); priorizar la textura de pantalla para S3 |

---

## 2. Hoja visual — cómo se genera y se lee

La comparación visual es la parte accionable cuando lleguen los outputs:

```bash
node artwork/living-datacenter/meshy-contact-sheet.mjs
# → artwork/living-datacenter/meshy-kit/CONTACT-SHEET.html  (abrir en navegador)
# → artwork/living-datacenter/meshy-kit/contact-sheet-state.json  (máquina-legible)
```

Qué espera el generador de cada carpeta del kit:

| Archivo | Rol en la hoja | Quién lo produce |
|---|---|---|
| `ref-*.jpg/png` (ya en el kit) | Panel **Referencia** | descarga verificada (thread anterior) |
| `raw/<asset>-preview.png` | Panel **Output Meshy** (render del GLB) | screenshot en Blender viewport / vista previa de Meshy, tras el post-proceso |
| `raw/<asset>-runtime.png` | Panel **Runtime en el sitio** (con el GLB montado) | captura del probe de runtime en scroll fijo (metodología §7 ASSET-PIPELINE) |
| `raw/<asset>-*.glb` | Señal "output presente" (nombre + KB + fecha) | descarga directa de Meshy |

El SVG del footprint dibuja la caja a **escala de aspecto exacta** con las dimensiones anotadas — es la referencia objetiva de proporción; los paneles de referencia y output se leen contra ella.

**Modo comparación (overlay):** el panel "Comparación (overlay)" superpone el render del output (`raw/<asset>-preview.png`) sobre el SVG del footprint, alineado a la caja del slot sin deformar (`object-fit: contain`), con **slider de opacidad** (0-100%, default 50%) para juzgar si la silueta encaja en el slot. Solo se activa cuando existe el preview; si falta, muestra la instrucción. Es QA-only (inline script local, nunca en el bundle del sitio).

**Workflow por output (resumen):** `raw/*.glb` descargado → autoría gate (§2 OUTPUT-PLAN) → post-proceso Blender al footprint (PROMPTS-BLENDER §3.x) → `npm run assets:glb -- --strict` → wiring (`GLB_ASSETS.<slot>`) → probe de runtime → copiar capturas a `raw/` → re-correr el generador → **registrar veredicto en §3**.

---

## 3. Registro de veredictos (por llenar por cada output evaluado)

| Fecha | Asset | Output (archivo en `raw/`) | Tris | KB | Meshes | Autoría gate | Footprint ✓ | Visual vs ref | Visual vs procedural | Decisión | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `—` | Rack | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` |
| `—` | Switch | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` |
| `—` | Storage | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` |
| `—` | Display | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `—` |

**Código de decisión (SPEC §52):** `PROMOVIDO` = supera al procedural a costo igual o menor · `DESCARTADO` = se archiva en `raw/`, el procedural mantiene · `PENDIENTE LICENCIA` = solo aplica a texturas de pantalla (Grafana), nunca a geometría.

---

## 4. Checklist de comparación por asset (qué mirar al lado de la foto)

### 4.1 Rack 42U — vs `ref-apc-netshelter-ar2580.jpg`
- [ ] Silueta del gabinete dentro del footprint 0.9×2.4 (aspecto 0.375) con base en y=0
- [ ] **Puerta de malla sin geometría de rejilla** — plano con alpha/normal map; el runtime ya inyecta el patrón AR2580 (24×8 barras, `meshDoorTexture`) — un output con malla real rompe el presupuesto de tris (contrato §3.4)
- [ ] Plinto y casters presentes (silueta de piso)
- [ ] LEDs como meshes `leds_*` planos (emisivo runtime), cero emission en el GLB
- [ ] Sin texto/marca (prompt negativo + limpieza Blender)
- **Bar para superar al procedural:** el procedural `v02` ya tiene la puerta de malla correcta; Meshy gana solo con detalle de chasis/casters que el procedural no tiene (costuras, handles, textura de pintura).

### 4.2 Switch 1U — vs `ref-cisco-9300x.jpg`
- [ ] Chasis 1U achatado (aspecto frontal ~11.7:1) — la deformación más común de Meshy es engordar el 1U
- [ ] Cara de puertos: **grid bakeado a normal map** (cero geometría por puerto, ≤6K tris) + tira de LEDs
- [ ] Orejas de rack laterales presentes (silueta de montaje)
- **Bar para superar al procedural:** el procedural actual es un cuerpo simple sin cara de puertos — Meshy gana aportando el grid frontal sin explotar el presupuesto.

### 4.3 Storage 2U-4U — vs `ref-netapp-a250-bezel.jpg` + `ref-me5-rear.jpg`
- [ ] Bezel monolítico plateado ventilado (listones como normal map, no geometría)
- [ ] LCD `leds_lcd` + LEDs `leds_status` planos; trasera `rear_controllers` presente (visible en S4/S5)
- [ ] Proporción 1.8×1.0 (aspecto 1.8) — NO 2U reales (0.3 de alto): bug de footprint ya corregido en el procedural, no reintroducir (§5)
- **Bar para superar al procedural:** el `v01` ya pasa todo; Meshy gana con acabado de bezel (metal cepillado, rebajes) perceptible en la luz ámbar de S4.

### 4.4 Display SIEM — vs `ref-soc-videowall.jpg` + texturas Grafana
- [ ] Solo **marco físico**: 4 barras + quad `screen` a +z; cero UI en geometría
- [ ] Si trae UI modelada/texto → descartar para este slot (la UI es textura procedural o Grafana con licencia, §6 ASSET-SCENE-MAP)
- **Recomendación vigente:** SKIP Meshy para este asset (marco trivial) — ver OUTPUT-PLAN §3.3; el valor está en la textura de pantalla, no en la geometría.

---

## 5. Gate de footprint (repetible en cada output)

1. **Re-parse GLTFLoader** (patrón `scripts/gen-assets.mjs`): tris en rango, meshes con nombres canónicos, cero emission, sin cámaras/luces/animaciones.
2. **Medir bbox del output** en Blender (o `gltf-transform inspect`): debe coincidir con el footprint del §1 dentro de ±2% por eje. Si no: reescalar en **Blender** (Apply All Transforms, origen en base) — **nunca** `scale` en runtime (convención §5 ASSET-PIPELINE).
3. **Aspecto frontal** del §1: superponer la silueta del output al SVG del footprint en la hoja visual.
4. Probar en runtime (probe, scroll fijo) y comparar la captura contra la del procedural actual en el mismo punto.

---

## 6. Referencias cruzadas

| Necesito… | Voy a… |
|---|---|
| los prompts de carga y parámetros | `MESHY-PROMPTS-BLENDER.md` §2 + `meshy-kit/<carpeta>/prompt.md` |
| el post-proceso en Blender | `MESHY-PROMPTS-BLENDER.md` §3.x |
| el runbook de 6 pasos por output | `MESHY-OUTPUT-PLAN.md` §2-§3 |
| el contrato de authoring (UV/materiales/export) | `ASSET-PIPELINE.md` §2-§6 |
| el bridge de texturas/LEDs runtime | `ASSET-PIPELINE.md` §4 |
| la metodología de probes (scroll fijo, piso de ruido) | `ASSET-PIPELINE.md` §7 |
| las URLs verificadas de las referencias | `REFERENCIAS-MESHY.md` |
| generar la hoja visual | `node artwork/living-datacenter/meshy-contact-sheet.mjs` |
