# Referencias fotográficas para Meshy.ai — Living Datacenter

> **Fecha:** 2026-08-11 · **Método:** búsqueda web activa + verificación por navegador real (Playwright) y muestreo de píxeles.
> **Criterios aplicados:** fotografía real, iluminación difusa, fondo aislado, ≥1024px lado corto, frontal/3-4 limpio, sin logos prominentes, prioridad fabricante > docs > foto real de datacenter.
> **Estado de cada URL:** ✅ verificado (descarga/dimensiones/contenido comprobados) · ⚠️ verificado pero con advertencia · 🔗 fuente válida pero no extraíble como URL directa desde este entorno.
> **Uso:** los prompts Meshy estructurados y la guía Blender de post-proceso viven en [`MESHY-PROMPTS-BLENDER.md`](./MESHY-PROMPTS-BLENDER.md).
> **Kit local (2026-08-11):** las imágenes están descargadas y normalizadas en [`artwork/living-datacenter/meshy-kit/`](../../artwork/living-datacenter/meshy-kit/) — incluye el hero de Cisco 9300X (descargado por navegador real hoy; el doc decía hotlink 403 solo para curl/server-side) y el plan de outputs en [`MESHY-OUTPUT-PLAN.md`](./MESHY-OUTPUT-PLAN.md).

---

## 1. SERVER RACKS

| # | Imagen (URL directa) | Fuente | Resolución | Estado | Análisis para Meshy |
|---|---|---|---|---|---|
| 1 | [APC NetShelter SV 42U (AR2580)](https://download.schneider-electric.com/files?p_Doc_Ref=SPD_EWAR-97FTQF_A_V&p_File_Type=rendition_1500_jpg) | **Schneider Electric** — rendition oficial de producto (página AR2580) | 1500×1500 | ✅ | **La mejor referencia de rack del lote.** Foto de estudio sobre blanco, frontal limpio con puerta de malla abierta, casters visibles, iluminación uniforme. Ideal para Image-to-3D: fondo blanco = recorte trivial, proporciones 19" reales (42U), simetría completa. |
| 2 | [APC NetShelter SX (AR3350)](https://download.schneider-electric.com/files?p_Doc_Ref=SPD_STOS-7RSAZA_FR_V&p_File_Type=rendition_1500_jpg) | **Schneider Electric** — rendition oficial (primera imagen de la página AR3350) | 1500×1500 | ⚠️ | Rack negro NetShelter SX en 3/4 sobre fondo blanco, puerta cerrada con ventilación. Ideal como segunda variante (puerta sólida vs. malla). ⚠️ El doc-ref se extrajo del carrusel de la página AR3350: confirmar visualmente que es el SX 42U (no un accesorio) antes de usarla. |
| 3 | [RakworX RCS72107 42U — foto review](https://www.storagereview.com/wp-content/uploads/2024/01/Storagereview-rakworx-1.jpg) | **StorageReview** — review con fotografía real del producto | 2000×3554 | ⚠️ | Foto real a 2000px de ancho, frontal completo de rack 42U con puerta cerrada. Útil para el *look* general de la columna de racks. ⚠️ Tiene **branding "RakworX" en la puerta** y fondo de entorno (techo con rejilla, no estudio) → recorte manual o prompt negativo para eliminar el logo. |

### Prompts adaptados (Meshy.ai)

**Imagen 1 (AR2580):**
```
High-quality black 19-inch server rack enclosure (42U), front view, perforated mesh door open at left showing internal mounting rails, black steel, small casters at base, clean white studio background, uniform soft lighting, no text, no logo, no people. Photorealistic product photography. Generate a low-poly web-ready 3D model of the rack cabinet with correct 42U proportions, rectangular frame, mesh door texture, and base casters; no backface detail needed, no materials with transparency, single mesh preferred.
```

**Imagen 2 (SX 3/4):**
```
Black 19-inch server rack cabinet, three-quarter front view, solid front door with vertical vent slots, matte black steel, white studio background, soft diffuse light, no text, no logo, no people. Rebuild as a clean rectangular rack cabinet mesh with vented door panel; keep proportions of a 42U enclosure; PBR metal material, roughness 0.6; no interior detail required.
```

**Imagen 3 (RakworX):**
```
Tall black server rack cabinet in a real server room, front closed door, uniform lighting, floor-standing with wheels. Convert to a simple rack unit mesh; ignore the brand text on the door, ignore the ceiling and room background entirely; export a single low-poly cabinet with door panel and base.

Negative: logo, text, people, ceiling, background, reflections, camera lens flare.
```

---

## 2. NETWORK SWITCHES

| # | Imagen (URL directa) | Fuente | Resolución | Estado | Análisis para Meshy |
|---|---|---|---|---|---|
| 1 | [Cisco Catalyst 9300X — hero oficial](https://www.cisco.com/content/dam/cisco-cdc/site/images/heroes/products/networking/9300x-hero-overview-desktop-3200x1312.jpg) | **Cisco** — página oficial de producto | 3200×1312 | ⚠️ | Hero de marketing oficial del 9300X a 3200px. El chasis 1U con 48 puertos + uplinks es la silueta canónica del switch enterprise. ⚠️ **Hotlink protection de Cisco**: la URL falla con curl/descarga directa (403) y probablemente falle si Meshy la fetchea server-side → **descargar en navegador y subir el archivo**. Verificar visualmente el fondo (gradiente) antes de usarla. |
| 2 | [Cisco Catalyst 9300 — og-image](https://www.cisco.com/content/dam/cisco-cdc/site/images/open-graph/products/networking/9300-series-switches-laptop-og-image-1200x630.jpg) | **Cisco** — og-image oficial | 1200×630 | ⚠️ | Vista del switch (con laptop de contexto). ⚠️ Lado corto 630px < 1024px y fondo escénico → alternativa, no primera opción. Misma protección hotlink. |
| 3 | [Juniper EX4400 — librería oficial de imágenes](https://www.juniper.net/us/en/company/images/image-library-logos-and-product-photos/products/ex4400.html) | **Juniper Networks** | 3000×750 (transparente) y 3840×960 (front-top) | 🔗 | Juniper publica fotos de producto con **fondo transparente** (óptimas para Meshy). ⚠️ La página **no fue accesible desde este entorno** (timeout/geo-blocking) → no pude extraer las URLs directas de los assets. Abrir la página en un navegador, copiar la URL del PNG de 3000px y usarla. |
| 4 | [Arista 7050X — datasheet PDF](https://www.arista.com/assets/data/pdf/Datasheets/7050SX-128_64_Datasheet_S.pdf) | **Arista** | foto del panel dentro del PDF | 🔗 | El datasheet incluye la foto oficial del panel frontal 1U. No es una URL de imagen directa: extraer la página del PDF como PNG (≥1024) antes de usar. |

> **REJECT (verificado):** las imágenes del *Hardware Installation Guide* de Cisco (p. ej. `.../c/dam/en/us/td/i/.../468104.jpg`, 1501×664) son **diagramas técnicos con callouts numerados**, no fotografías — fallan el criterio "Fotografía REAL". Se comprobó visualmente en hoja de contacto.

### Prompts adaptados

**Imagen 1 (9300X hero):**
```
Enterprise 1U network switch, 48 front ports with RJ45 and SFP+ uplinks, dark metallic chassis, status LED row, front panel view, official product photography. Generate a low-poly 1U switch mesh with rectangular chassis, two rows of port recesses, small LED strip; export with PBR metal material, roughness 0.5; flat back panel, no cables, no rack ears detail required.

Negative: text, brand logo, cables, laptop, background scene, people, lens flare.
```

**Imagen 2 (og 9300):**
```
1U ethernet switch front panel with 24-48 ports and SFP uplink slots, matte dark metal, product photo. Rebuild chassis only, ignore surrounding laptop/desk objects; low-poly rectangular body with port details on the face; PBR material roughness 0.5.

Negative: laptop, desk, text, logo, background.
```

---

## 3. STORAGE / BACKUP UNITS

| # | Imagen (URL directa) | Fuente | Resolución | Estado | Análisis para Meshy |
|---|---|---|---|---|---|
| 1 | [NetApp AFF A250 con bezel](https://www.storagereview.com/wp-content/uploads/2021/01/Netapp-AFF-250-with-bezel.jpg) | **StorageReview** — review oficial del producto | 2000×1342 | ✅ | Frontal del array 2U con **bezel plateado ventilado** — el look monolítico que busca el SPEC (sin drives expuestos). 2000px, iluminación de datacenter uniforme, fondo oscuro fácil de separar. |
| 2 | [NetApp AFF A250 sin bezel](https://www.storagereview.com/wp-content/uploads/2021/01/Netapp-AFF-250-front.jpg) | **StorageReview** | 2000×1334 | ✅ | Frontal con trays azules numeradas 0-23 y rieles de montaje. Variante "drives visibles" para cuando se necesite textura de bahías. |
| 3 | [Dell PowerVault ME5 — frontal](https://www.storagereview.com/wp-content/uploads/2022/02/StorageReview-Dell-PowerVault-ME5.jpg) | **StorageReview** — review del ME5 | 2000×740 | ✅ | Frontal del controlador 2U: caddies plateados en grid 3×3 + display LCD de estado. ⚠️ Aspect ratio muy ancho (2000×740): el lado corto no llega a 1024, pero la resolución horizontal es alta y la vista es frontal pura — aceptable como input. |
| 4 | [Dell PowerVault ME5 — trasera](https://www.storagereview.com/wp-content/uploads/2022/02/StorageReview-Dell-PowerVault-ME5-Connectivity.jpg) | **StorageReview** | 2000×780 | ✅ | Vista trasera con **controllers duales + PSUs** — imprescindible para modelar la parte posterior del backup unit (la cámara del datacenter la verá). Mismo caveat de aspect ratio. |
| 5 | [Dell PowerVault ME5 — interior/servicio](https://www.storagereview.com/wp-content/uploads/2022/02/StorageReview-Dell-PowerVault-ME5-Service.jpg) | **StorageReview** | 2000×1122 | ✅ | Interior con drives y ventiladores — opcional, si se quiere detalle interno. |

### Prompts adaptados

**Imagen 1 (A250 bezel):**
```
2U rack-mount storage array with flat silver vented front bezel, monolithic enclosure, no exposed drives, dark server-room background, uniform lighting. Generate a low-poly 2U storage chassis with simple rectangular body and a slightly recessed bezel panel with vent texture; PBR metal, roughness 0.4, subtle brushed metal look; flat sides with two rack ears; no screen, no text, no logo.

Negative: text, logo, exposed drives, cables, rack background details, people.
```

**Imagen 4 (ME5 trasera):**
```
Rear view of a 2U storage array with two redundant controllers and dual power supplies, dark background, uniform light. Model the rear panel only: two controller modules with small port clusters and two PSU modules with fan grilles; keep it low-poly, rectangular, matte dark metal; no text, no logo, no cables.

Negative: text, logo, cables, rack background, people.
```

---

## 4. MONITORING PANELS / SIEM DISPLAYS

| # | Imagen (URL directa) | Fuente | Resolución | Estado | Análisis para Meshy |
|---|---|---|---|---|---|
| 1 | [Grafana dashboard 14000 (GitHub)](https://grafana.com/api/dashboards/14000/images/10001/image) | **Grafana Labs** — dashboard público oficial | 1205×1034 | ✅ | Screenshot **tema oscuro verificado por píxeles (96% píxeles oscuros, meanLum 23.8)**. UI densa de telemetría con paneles y gráficas — perfecta como **textura de pantalla** para monitores/HUD del datacenter. |
| 2 | [Grafana dashboard 1860 (Node Exporter Full)](https://grafana.com/api/dashboards/1860/images/7994/image) | **Grafana Labs** | 1918×947 | ✅ | Segundo dashboard oscuro (87% píxeles oscuros, meanLum 39.2). Más resolución (1918px). ⚠️ Lado corto 947px < 1024 (marginal). |
| 3 | [SOC video wall — instalación real](https://mlsyamblqynx.i.optimole.com/cb:_C0h.95b5/w:1600/h:700/q:mauto/f:best/https://vuwall.com/wp-content/uploads/Government-and-Defense.jpg) | **VuWall** — página de aplicación SOC | 1600×700 | ⚠️ | Foto real de un SOC con **video wall oscuro brillante en la pared** (zona superior luminosa, sala oscura — verificado por muestreo). Sirve para el contexto "pantalla montada en pared". ⚠️ Aspect ratio 16:7 muy ancho, puede incluir operadores y contenido clasificable → recortar solo el videowall y usar prompt negativo. |
| 4 | [Wazuh docs — dashboard (status)](https://documentation.wazuh.com/current/_images/status1.png) | **Wazuh** — documentación oficial | 1999×1017 | ⚠️ | Screenshot real de la UI del SIEM a 1999px. ⚠️ **Tema claro actual** (meanLum 250, 0% oscuro) — útil como referencia de UI de SIEM, pero para textura oscura hay que invertir o usar los de Grafana. Lado corto 1017px (marginal). |
| 5 | [Elastic Security — Overview dashboard](https://www.elastic.co/docs/solutions/images/security-overview-pg.png) | **Elastic** — docs oficiales | 2674×1922 | ⚠️ | Máxima resolución del lote (2674px). ⚠️ Tema claro en docs actuales (meanLum 243). Alternativa para textura SIEM clara. |
| 6 | [Planar SOC — foto de sala](https://www.planar.com/media/442722/control-rooms_security_706x530.jpg) | **Planar** — página Control Rooms | 706×530 | ⚠️ | Foto real de sala SOC con videowall. ⚠️ **No cumple ≥1024px** (706×530) — solo como referencia compositiva, no como input de textura. |

### Prompts adaptados

**Imágenes 1/2 (Grafana):**
```
Dark-theme IT monitoring dashboard screenshot with dense telemetry panels, graphs, gauges and status rows, high contrast UI on near-black background. Use this image exactly as a screen texture: create a flat emissive material with slight screen glow, apply to a thin monitor panel mesh; no 3D modeling of the UI itself; keep geometry as a simple rectangle frame with thin bezel, like a wall-mounted NOC display.

Negative: perspective distortion, reflections, people, cables, additional monitors, brand watermark.
```

**Imagen 3 (vuwall):**
```
Real photo of a security operations center with a large dark video wall on the wall showing data dashboards, dim room. Rebuild only the wall-mounted video wall: a flat panel made of 2x2 or 3x2 screen tiles with thin industrial bezels, dark frame, emissive screens; ignore operators, furniture and room lighting; low-poly, web-ready.

Negative: people, furniture, room, reflections, text overlays, logos.
```

---

## Resumen de cumplimiento vs. criterios

| Categoría | Cumple todos los criterios | Con advertencia (menor) | Fuera de criterio |
|---|---|---|---|
| Racks | AR2580, AR3350 | RakworX (branding + fondo) | — |
| Switches | — | Cisco 9300X hero (hotlink) · og-image (1200×630) | Diagramas del guide de Cisco (rechazados) |
| Storage | A250 bezel, A250 front, ME5 rear | ME5 front (aspect ancho) | — |
| SIEM/NOC | Grafana 14000 | Grafana 1860 · vuwall · Wazuh · Elastic (tema claro o <1024) | Planar (706px) |

### Notas operativas para Meshy.ai

1. **URLs de Cisco** (hero + og): descargar con navegador antes de subir — la protección hotlink devolverá 403 a descargas programáticas/server-side.
2. **Tema claro vs. oscuro:** Wazuh y Elastic docs migraron a tema claro; si el target es una pantalla oscura, usar Grafana 14000/1860 o aplicar inversión de color a las capturas claras.
3. **Texturas vs. geometría:** los screenshots de dashboard (Grafana) son para **textura de pantalla** (monitor mesh + material emissive), no para modelar la UI.
4. **Logos de terceros:** RakworX (rack) y vuwall (SOC) llevan marca visible → prompt negativo + recorte.
5. **Librería de imágenes de Juniper** (fondo transparente, 3000/3840px) es la mejor fuente de switches del mercado pero quedó bloqueada para este entorno — el enlace a la página es válido para abrirla manualmente.
