# Meshy.ai prompts + Guía Blender + Matriz de integración — Living Datacenter

> **Fecha:** 2026-08-11 · **Rol:** Technical Art Director (WebGL/R3F)
> **Doc raíz del pipeline:** [`ASSET-PIPELINE.md`](./ASSET-PIPELINE.md) — este doc es la capa *Meshy-facing + post-proceso accionable*; las referencias verificadas viven en [`REFERENCIAS-MESHY.md`](./REFERENCIAS-MESHY.md). **Hoja de contacto comparativa** (outputs vs referencias vs footprint): [`MESHY-CONTACT-SHEET.md`](./MESHY-CONTACT-SHEET.md) + hoja visual `artwork/living-datacenter/meshy-kit/CONTACT-SHEET.html`.
> **Restricciones de contexto:** R3F `frameloop="demand"`, draw calls < 50 totales, < 10K tris/asset, atlas 2K máximo (AVIF/KTX2), PBR Albedo+Normal+RMA, CSP estricta (cero assets externos en runtime, todo en `/public`), estética premium hard-surface, canvas decorativo `pointer-events:none`.
> **Convención crítica de integración (verificada en runtime):** cada GLB se autoriza al **footprint del slot en unidades de escena** (rack 1×2.4×0.9, storage 1.8×1×1.2, switch 0.82×0.07×0.5, display 1.62×0.9×0.12), **origen en base y=0**, y se posiciona con `position` SOLO (sin `scale`). Ver ASSET-PIPELINE §5.

---

## 1. Referencias reales verificadas (2-3 por elemento)

Fuente: `REFERENCIAS-MESHY.md` (verificadas con navegador real + muestreo de píxeles el 2026-08-11) + re-búsqueda de hoy para Juniper/Arista.

> **Kit listo para cargar en Meshy.ai:** las imágenes están descargadas localmente en [`artwork/living-datacenter/meshy-kit/`](../../artwork/living-datacenter/meshy-kit/) (incluida la de Cisco, bajada por navegador real el 2026-08-11) junto con los 4 prompts en `prompt.md` por carpeta. El plan de qué hacer con cada output está en [`MESHY-OUTPUT-PLAN.md`](./MESHY-OUTPUT-PLAN.md).

### 1.1 Network switch 1U

| # | URL directa | Fuente | Res | Advertencias |
|---|---|---|---|---|
| 1 | https://www.cisco.com/content/dam/cisco-cdc/site/images/heroes/products/networking/9300x-hero-overview-desktop-3200x1312.jpg | **Cisco** (página oficial 9300X) | 3200×1312 | ⚠️ Hotlink protection: descargar en navegador, subir el archivo (curl/Meshy server-side = 403). Silueta canónica del chasis 1U. |
| 2 | https://www.juniper.net/us/en/company/images/image-library-logos-and-product-photos/products/ex4400.html | **Juniper** (librería oficial) | 3000×750 (transparente) | 🔗 La mejor calidad (fondo transparente) pero el sitio bloquea este entorno (timeout/geo) — abrir manualmente y copiar el PNG. El snippet de hoy confirma 3000×750 transparente. |
| 3 | https://www.arista.com/assets/data/pdf/Datasheets/7050SX-128_64_Datasheet_S.pdf | **Arista** (datasheet) | foto en PDF | 🔗 El QSG (front-panel) responde *Client Challenge* (bot protection); extraer la página del PDF como PNG ≥1024. |

### 1.2 Storage array 2U-4U

| # | URL directa | Fuente | Res | Advertencias |
|---|---|---|---|---|
| 1 | https://www.storagereview.com/wp-content/uploads/2021/01/Netapp-AFF-250-with-bezel.jpg | **StorageReview** (review AFF A250) | 2000×1342 | ✅ Bezel plateado ventilado monolítico — el look SPEC. Fondo oscuro fácil de separar. |
| 2 | https://www.storagereview.com/wp-content/uploads/2022/02/StorageReview-Dell-PowerVault-ME5.jpg | **StorageReview** (review ME5) | 2000×740 | ⚠️ Lado corto 740px < 1024 (marginal); frontal puro con LCD. |
| 3 | https://www.storagereview.com/wp-content/uploads/2022/02/StorageReview-Dell-PowerVault-ME5-Connectivity.jpg | **StorageReview** (ME5 trasera) | 2000×780 | ✅ Imprescindible para la cara trasera (controllers duales + PSU) que la cámara ve en S4/S5. |

### 1.3 NOC wall / SIEM display

| # | URL directa | Fuente | Res | Advertencias |
|---|---|---|---|---|
| 1 | https://grafana.com/api/dashboards/14000/images/10001/image | **Grafana Labs** (dashboard público) | 1205×1034 | ✅ Tema oscuro verificado (96% píxeles oscuros). **Es textura de pantalla**, no geometría. |
| 2 | https://grafana.com/api/dashboards/1860/images/7994/image | **Grafana Labs** | 1918×947 | ⚠️ Lado corto 947px (marginal); oscuro 87%. |
| 3 | https://mlsyamblqynx.i.optimole.com/cb:_C0h.95b5/w:1600/h:700/q:mauto/f:best/https://vuwall.com/wp-content/uploads/Government-and-Defense.jpg | **VuWall** (aplicación SOC) | 1600×700 | ⚠️ Puede incluir operadores; recortar solo el videowall. Marco industrial delgado. |

### 1.4 Server rack 42U

| # | URL directa | Fuente | Res | Advertencias |
|---|---|---|---|---|
| 1 | https://download.schneider-electric.com/files?p_Doc_Ref=SPD_EWAR-97FTQF_A_V&p_File_Type=rendition_1500_jpg | **Schneider Electric** (APC NetShelter SV AR2580) | 1500×1500 | ✅ La mejor del lote: frontal, fondo blanco, casters, puerta de malla. |
| 2 | https://download.schneider-electric.com/files?p_Doc_Ref=SPD_STOS-7RSAZA_FR_V&p_File_Type=rendition_1500_jpg | **Schneider Electric** (SX AR3350) | 1500×1500 | ⚠️ 3/4; confirmar que es el SX 42U (doc-ref del carrusel). |
| 3 | https://www.storagereview.com/wp-content/uploads/2024/01/Storagereview-rakworx-1.jpg | **StorageReview** (RakworX) | 2000×3554 | ⚠️ Branding "RakworX" en la puerta + fondo de sala → recorte o prompt negativo. |

**Licencia (TAREA 1 + VALIDACIÓN):** todas son fotos de producto/documentación de fabricantes o reviews — legalmente seguras como **referencia e input de generación de geometría original**. El output de Meshy **no debe reproducir logos ni marcas distintivas** (silueta genérica hard-surface = safe). Ninguna se embebe en runtime: solo inspiran el modelado; las únicas texturas en `/public` son procedurales (canvas) o los screenshots de Grafana (si se aprueba su licencia, ASSET-SCENE-MAP §6).

---

## 2. Prompts optimizados para Meshy.ai (≤120 palabras cada uno)

Formato obligatorio aplicado: `[DESCRIPTOR] · [FORM FACTOR] · [DETALLE FRONTAL] · [PBR] · [NEGATIVOS] · [AISLAMIENTO] · [OPTIMIZACIÓN WEB] · [ESTÉTICA]`.

### 2.1 Network switch 1U

```
Enterprise 1U network switch, 44×485×483 mm rack-mount, hard-surface modeling, low-poly optimized. Front detail: 48-port RJ45 grid and dual SFP+ uplinks as port grid as normal map candidate, thin LED status row, brushed dark metal face, two rack ears. PBR-ready topology: metalness 0.85 chassis / 0.0 plastic, roughness 0.4, no emission. Negative: no organic shapes, no cluttered wires, no debris, no people, no brand text, no logo. Isolated on neutral background, single clean object. Web optimization: 4-6K triangles, no per-port inset geometry. Premium enterprise industrial aesthetic, matte charcoal, uniform diffuse lighting.
```
*(~100 palabras — incluye todas las frases obligatorias + "port grid as normal map candidate")*

### 2.2 Storage array 2U-4U

```
2U rack-mount storage array, 445×88×558 mm, hard-surface modeling, low-poly optimized. Monolithic solid form with sealed silver vented bezel, no exposed drives; hot-swap handles as repeated instances; small status LCD recess; flat rear with dual controllers and PSU cutouts. PBR-ready topology: brushed aluminum metalness 0.9 roughness 0.35, dark plastic 0.0/0.8. Negative: no organic shapes, no cluttered wires, no debris, no people, no brand text, no logo, no open drive bays. Isolated on neutral background. Web optimization: 6-8K triangles, ventilation slots as normal map candidate. Premium enterprise industrial aesthetic, uniform diffuse lighting.
```
*(~95 palabras — incluye "monolithic solid form" y "hot-swap handles as repeated instances")*

### 2.3 NOC monitoring wall / SIEM display

```
Wall-mounted NOC monitoring display, physical frame only, 16:9, hard-surface modeling, low-poly optimized. Thin industrial bezel frame, small bottom control cluster, flat emissive screen surface - the UI is a separate texture/DOM layer, never modeled in geometry. PBR-ready topology: matte black metalness 0.3 roughness 0.6 frame, dark glass screen. Negative: no organic shapes, no cluttered wires, no debris, no people, no dashboard graphics, no text, no logo. Isolated on neutral background. Web optimization: 3-4K triangles, screen as single flat quad, no per-tile bezel. Premium enterprise industrial aesthetic, subtle rounded corners, uniform diffuse lighting.
```
*(~95 palabras — deja explícito que solo se genera el MARCO FÍSICO)*

### 2.4 Server rack 42U

```
42U 19-inch server rack cabinet, 600×2000×1200 mm floor-standing, hard-surface modeling, low-poly optimized. Standardized 19-inch proportions, rectangular frame, perforated mesh front door pattern as alpha/normal map, base and top plinths, small casters, flat side panels. PBR-ready topology: powder-coated black steel metalness 0.7 roughness 0.5, door mesh alpha. Negative: no organic shapes, no cluttered wires, no debris, no people, no servers inside, no brand text, no logo. Isolated on neutral background, base origin at y=0. Web optimization: 6-8K triangles, no mesh geometry per vent. Premium enterprise industrial aesthetic, uniform diffuse lighting.
```
*(~100 palabras — incluye "perforated door pattern as alpha/normal map" y "standardized 19-inch proportions")*

---

## 3. Guía de post-proceso en Blender por elemento

Convenciones globales (heredadas de ASSET-PIPELINE §5): unidad de escena = metro del layout; **origen en base y=0**; **Principled BSDF únicamente**; **cero emission en el GLB** (los LEDs son meshes `leds_*` con emisivo asignado en runtime — bridge §4); texturas en **atlas único 2K** (Albedo + Normal + RMA: Roughness→G, Metalness→B, AO→R); padding de islas ≥ 8px; export GLB sin cámaras/luces/animaciones.

### 3.1 Network switch

**Target tris:** 4–6K · **Texturas críticas:** atlas 2K — Albedo frontal, Normal (grid de puertos), RMA.

**Pasos Blender:**
1. **Referencia:** plano de imagen frontal desde la foto (2.1); escala el chasis a **0.82 × 0.07 × 0.5** (footprint del slot, 1U).
2. **Low-poly base:** caja 6 caras; inseta la cara frontal 1mm; orejas de rack = 2 cajas laterales (0.02 × 0.07 × 0.06).
3. **High-poly de bake (NO es el mesh final):** duplicado de la cara frontal + Array 24×2 de un "port cell" (1 puerto RJ45) + 8 SFP + tira de 16 LEDs + Subdivision Surface 2 niveles. Esto va solo al bake.
4. **UV (mesh final):** cara frontal = isla grande (512 px/m), costados/superior compartidos en isla única; **sin overlaps** entre islas; padding 8px.
5. **Bake (cycles, 128 samples, 2048²):** Albedo, Normal (cage = Solidify 0.005, ray distance **0.02**), RMA (roughness→G, metalness→B, AO→R).
6. **Materiales:** Principled — chasis `Metalness 0.85 / Roughness 0.4`, plástico `0.0 / 0.8`, LEDs `0.3 / 0.6` (baseColor = color apagado; sin emission).
7. **Decimate:** Collapse planar, ratio dirigido a silueta frontal prioritaria; verifica tris con Statistics.
8. **Retopología manual** solo si el frontal perdió la fila de LEDs (una franja plana basta — es emisiva en runtime).

**Checklist export:**
- [ ] Apply All Transforms (escala 1.0, origen en base)
- [ ] Triangulate como modificador FINAL (tras el bake) — activo solo en export
- [ ] Export GLB (glTF 2.0 binary): solo "Mesh", sin cámaras/luces/animaciones; nombre `network_switch_v01.glb`

### 3.2 Storage array

**Target tris:** 6–8K · **Texturas críticas:** atlas 2K — Albedo bezel plateado, Normal (listones), RMA.

**Pasos Blender:**
1. **Referencia:** A250 bezel + ME5 trasera (1.2); escala el cuerpo a **1.8 × 1.0 × 1.2** (footprint del slot S4).
2. **Low-poly base:** cuerpo monolítico; bezel frontal rebajado 1mm; asas hot-swap = **1 objeto instanciado** (Array 2-4, duplicados de instancia, no geometría copiada); LCD = plano 0.35×0.2 con nombre **`leds_lcd`**; 8 LEDs con nombre **`leds_status`**; trasera = 2 controladores + 2 PSU (`rear_controllers`, plano contra la pared — visible solo S4/S5).
3. **High-poly de bake:** duplicado con listones de ventilación (Array 40) + Subdivision 2 — solo para bake.
4. **UV:** frontal/bezel = isla principal; trasera = segunda isla (S4/S5); sin overlaps; padding 8px.
5. **Bake:** Albedo, Normal (cage 0.005, ray distance **0.02**), RMA; 2048².
6. **Materiales:** Principled — chasis `0.85 / 0.4`, bezel `0.9 / 0.35` (metal cepillado), plástico trasera `0.0 / 0.8`. LED baseColor apagado (runtime asigna cyan/ámbar por escena).
7. **Decimate:** Collapse planar a 6–8K; preserva silueta frontal y la franja de LEDs.
8. **Validación de nombres:** meshes finales = `chassis`, `bezel_slats`, `leds_lcd`, `leds_status`, `rear_controllers` (contrato bridge §4).

**Checklist export:**
- [ ] Apply All Transforms; origen en base (el slot posiciona con `position.y − scale.y/2`)
- [ ] Triangulate final; sin subdiv activo en el mesh final
- [ ] Export GLB solo "Mesh"; `storage_unit_v01.glb`

### 3.3 NOC monitoring / SIEM display

**Target tris:** 3–4K · **Texturas críticas:** NO atlas de UI (la UI es canvas procedural en runtime); solo color de marco.

**Pasos Blender:**
1. **Referencia:** VuWall/Grafana (1.3) solo para proporción del marco; escala a **1.62 × 0.9 × 0.12** (footprint del slot).
2. **Low-poly base:** marco = 4 barras (2 verticales 0.06 + 2 horizontales 0.06) + pantalla = **un solo quad** `PlaneGeometry 1.5×0.84` con nombre **`screen`** (sin subdivisiones — la UI es textura emisiva en runtime) + panel trasero `back_panel`.
3. **UV:** quad de pantalla = isla única 1:1; marco = isla compartida; sin overlaps.
4. **Materiales:** Principled — marco `0.3 / 0.6` mate, `screen` baseColor 0x0b1220 (el runtime le asigna emisivo blanco-frío, bridge §4). **No se bakea UI** (cero texturas de dashboard en el GLB).
5. **Decimate:** Collapse a 3–4K (el quad de pantalla ya es 2 tris).
6. **Orientación:** cara frontal de la pantalla en **+z** (la cámara S3/S4 mira desde +z).

**Checklist export:**
- [ ] Apply All Transforms; pantalla alineada a +z
- [ ] Triangulate final
- [ ] Export GLB solo "Mesh"; `siem_display_v01.glb` — sin textura de UI embebida

### 3.4 Server rack 42U

**Target tris:** 6–8K · **Texturas críticas:** atlas 2K — Albedo gabinete, Normal/AO de puerta de malla (alpha opcional), RMA.

**Pasos Blender:**
1. **Referencia:** AR2580 (1.4); escala a **1.0 × 2.4 × 0.9** (footprint del slot S1 — coincide con el bloque procedural del corredor).
2. **Low-poly base:** gabinete 6 caras (`chassis`, centro y=1.2 → base 0); plinto 0.08 (`plinth`); **puerta de malla = plano con alpha/normal map** (`door`, sin geometría de rejilla); 8 unidades internas = 1 objeto con Array (`units`); LEDs `leds_status` (12) + `leds_power` (1) = planos, no cajas; 24 remaches = cubo instanciado (`fasteners`).
3. **High-poly de bake:** duplicado de la puerta con rejilla real (Array 24×8 barras + Subdivision 2) — solo para bake del mapa de malla.
4. **UV:** puerta = isla grande; gabinete = caras compartidas (lateral/trasera sin textura crítica); sin overlaps; padding 8px.
5. **Bake:** Albedo, Normal (cage 0.005, ray distance **0.03**), RMA; 2048².
6. **Materiales:** Principled — gabinete `0.7 / 0.5`, puerta `0.7 / 0.5` + alpha del patrón, plástico `0.0 / 0.8`.
7. **Decimate:** Collapse planar a 6–8K; **preserva la cara frontal** (puerta) y los LEDs.
8. **Variante `_wall`** (opcional, S2/S3/S4): duplicado sin cara trasera (−30% polys) generado en optimización, nunca a mano.

**Checklist export:**
- [ ] Apply All Transforms; origen en base (y=0 → el slot posiciona en `HERO_RACK_GLB_POS`)
- [ ] Triangulate final; puerta con alpha en el material (no transparencia de geometría)
- [ ] Export GLB solo "Mesh"; `server_rack_v03.glb` (bump: la v02 actual ya trae la puerta plana + textura de malla procedural en runtime — un Meshy nuevo = `_v03`, nunca sobrescribir)

**Validación pre-gltf-transform (los 4 assets):**
- [ ] `gltf-transform inspect`: meshes con nombres canónicos (`chassis`, `leds_*`, `screen`…), sin cámaras/luces/animaciones
- [ ] `gltf-validator`: 0 errores
- [ ] Re-parseo con `GLTFLoader` (gate de autoría de `scripts/gen-assets.mjs`): tris en rango, sin emission en materiales
- Luego `npm run assets:glb` (optimize → validate → inspect → payload < 3 MB), con `--join-named false` obligatorio (preserva `leds_*`) y `--simplify false` (el tris lo decide el authoring).

---

## 4. Matriz de integración web

| Elemento | Draw Calls Target | Instancing Strategy | LOD Levels | Escena Storyboard | Riesgo Performance | Mitigación |
|---|---|---|---|---|---|---|
| **Rack 42U** | 1 por geometría (pool instanciado) + 1 hero | `<Instances>` del gabinete × corredor/fondo; 1 slot GLB hero (S1) | LOD0 completo (S1/S5 grid) · LOD1 puerta simplificada (corredor S2-S4) · LOD2 billboard (fondo) | S1 rack hero emergiendo de la niebla · S2 corredor simétrico · S3 filas activas · S4 profundidad · S5 grid completo sincronizado | **ALTO** (dominante en frame, puerta con alpha) | Instancing + LOD por distancia + variante `_wall` sin trasera + alpha solo en LOD0 + tier LOW reduce filas |
| **Switch 1U** | 1 pool instanciado + 1 condicional (LEDs actividad) | `<Instances>` de cara de puertos (normal map) × racks; actividad de LEDs vía MicroAnimDriver solo S3 | LOD1 cara completa (cerca) · LOD2 sin cara (lejano) | S2 hileras 1U · S3 **origen de data streams** (parpadeo) · S4 standby ámbar · S5 presente en grid | **MEDIO** (actividad por frame en S3; 48 puertos si se modelaran) | Grid de puertos como normal map (cero geometría por puerto) + actividad solo S3 + tier LOW off |
| **Storage 2U-4U** | 1 pool instanciado + 1 slot GLB protagonista (S4) | `<Instances>` del cuerpo × 8; asas = instancias internas | LOD1 bezel completo · LOD2 sin trasera | S3 bezel plateado en filas · S4 **protagonista** (2N + trasera ME5 visible, luz ámbar) · S5 en grid | **BAJO** (geometría simple; trasera solo visible en S4/S5) | Instancing + trasera condicionada a escena + LCD/LEDs emisivos sin geometría extra |
| **SIEM display** | 1-2 instanciados + 1 pantalla emisiva | Marco × displays (1-4 según tier); pantalla = quad con textura procedural única | LOD1 marco completo (cerca) · LOD2 quad emisivo (lejano) | S1 consola de boot · S3 paneles SIEM (UI oscura) · S4 alertas ámbar · S5 pantalla del nodo central | **MEDIO** (textura de UI por tier; riesgo de abusar de texturas grandes) | UI procedural por canvas a resolución del tier (1024/512) + 1 textura compartida + `pointer-events:none` y `aria-hidden` en el canvas |

**Totales por escena (Σ):** S1 ~10 · S2 ~13 · S3 ~20 · S4 ~16 · S5 ~24 — todos bajo el presupuesto < 50 (§21) y con S1/S2 en zona ideal < 15. Las filas LOW desactivan switches y displays (ASSET-SCENE-MAP §4).

---

## 5. Validación final (autochequeo)

| Check | Resultado |
|---|---|
| ✅ ¿Los prompts evitan geometría densa en patrones repetitivos? | Sí — todos fuerzan el patrón repetitivo como **bakeable** ("port grid as normal map candidate", "ventilation slots as normal map", "perforated door pattern as alpha/normal map", "hot-swap handles as repeated instances") |
| ✅ ¿La guía Blender respeta < 10K tris/asset? | Sí — switch 4-6K, storage 6-8K, display 3-4K, rack 6-8K; Decimate con ratio y checks de Statistics por paso |
| ✅ ¿Las referencias son legalmente seguras? | Sí — fotos de producto/catálogos/docs; se usan como **input de generación de geometría original** y ninguna se embebe en runtime; prompts negativos eliminan logos/marcas |
| ✅ ¿La matriz considera canvas decorativo `pointer-events:none`? | Sí — el canvas es Z-20 decorativo, `aria-hidden`, y toda interacción vive en DOM (Z-40); los draw calls del §4 son solo de la capa visual |
| ✅ ¿Compatible con CSP estricta / zero external fetch? | Sí — cero texturas/GLB externos en runtime; todo self-hosted en `/public` (R5); screenshots de Grafana solo como textura procedural local si se aprueba licencia |

**Notas operativas finales:** (1) las URLs de Cisco devuelven 403 a curl/Meshy server-side pero **sí se descargan con navegador real** (Playwright, UA Chrome) — el hero 9300X ya está local en `meshy-kit/01-switch/` como JPEG normalizado (el CDN sirve AVIF, convertir antes de subir); (2) StorageReview degrada el asset directo a 1000px webp (el original 2000px solo llega en la página) — 1000px es aceptable para Image-to-3D; (3) `next start` mapea `/public` al arrancar — añadir un GLB exige reiniciar el servidor (verificado); (4) si Meshy genera el modelo con texto/marca, limpiarlo en Blender (step 8 de cada elemento) antes del bake — nunca dejar logos en albedo.
