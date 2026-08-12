# ASSET → SCENE MAP — Living Datacenter

> **Anexo de diseño de geometría procedural** (SPEC §9, §20, §21, §22, §29, §30).
> Guía visual: [`REFERENCIAS-MESHY.md`](./REFERENCIAS-MESHY.md).
> Regla rectora: geometría **procedural** (SPEC §5 — cero assets externos en runtime), instancing sobre cualquier detalle repetido (§20), presupuesto <50 draw calls / ideal <30 (§21).
> **Ruta GLB (solo si procedural no alcanza):** contrato de authoring en [`ASSET-PIPELINE.md`](./ASSET-PIPELINE.md) — este mapa define el *qué* (asset por escena), el pipeline define el *cómo* (geometría/UV/materiales/export) para la misma matriz.

---

## 1. Matriz Asset × Escena

| Asset | S1 · BOOT `#hero` | S2 · CORE `#perfil #arquitectura` | S3 · DATA `#experiencia #proyectos #certificaciones #siem` | S4 · RESILIENCE `#audithub #scaudit #blog` | S5 · CONNECTION `#contacto #footer` |
|---|---|---|---|---|---|
| **Server Rack** | ★ Hero — 1 rack emergiendo de la niebla, puerta de malla, barrido de boot | ★★ Corredor simétrico (2 filas instanciadas), puerta sólida | ★★ Filas con unidades encendidas (LEDs cyan/azul) | ★ Filas que se hunden en profundidad | ★★ Grid completo en LOD0, luces sincronizadas |
| **Network Switch** | · LEDs de estado encendiendo (1U en el hero rack) | ★ Hileras de 1U con cara de puertos en los racks del corredor | ★★ Caras de puertos con actividad (parpadeo), origen de los data streams | · Standby ámbar en los racks de backup | · Presente en el grid, sin protagonismo |
| **Storage / Backup** | — (ausente: aún no hay datos) | · 1-2 arrays de contexto en `#perfil` | ★★ Arrays con bezel plateado entre los racks (certificaciones/datos) | ★★★ **Protagonista** — unidades de backup con bezel, redundancia 2N, acento ámbar | · Parte del grid total |
| **SIEM Display** | ★ Consola de boot (1 pantalla oscura con barra de progreso) | · Pared de topología (Purdue) como "pantalla" holográfica | ★★★ Paneles SIEM (textura UI oscura) + HUDs de telemetría | ★★ Monitores con alertas ámbar + línea de escaneo | ★ Pantalla central del nodo con pulso de conexión |

**Leyenda:** ★ = presencia · ★★ = presencia activa · ★★★ = protagonista de escena · — = ausente (el 3D refuerza la narrativa del SPEC §66: cada escena prioriza su tema).

---

## 2. Especificación de geometría procedural por asset

### 2.1 Server Rack — referencia: AR2580 (malla) / SX (sólida)

| Aspecto | Decisión procedural | Draw calls |
|---|---|---|
| Gabinete | `boxGeometry` existente (1×2.4×0.9) como **Instances** — sin cambio | 1 (existente) |
| **Puerta** | Nueva Instances de planos frontales `[1, 2.4, 0.02]` con **textura procedural de canvas** (data texture, SPEC §5): variante *malla* = grilla de líneas con alpha (AR2580), variante *sólida* = 5-7 listones verticales hundidos (SX). Uv repeat por rack | +1 |
| Marcas 42U | Horquillas finas (líneas de 1px) horneadas en la misma textura de puerta — sin geometría extra | 0 |
| Casters | Caja baja en la Instances del gabinete (`scale.y=0.04` bajo la base) — 2 instancias por rack | 0 |
| LEDs de estado | Instances de quads emisivos `[0.03,0.01]` en el frontal superior; color por escena (S1: barrido azul → S3: cyan/verde → S4: ámbar) | +1 |
| LOD | Distancia: door-plane desactivado > 60u (S5 usa solo gabinete + LEDs) | — |

**Total por escena (racks):** 3 draw calls fijos (gabinete + puerta + LEDs) sin importar el número de racks (§20).

### 2.2 Network Switch — referencia: hero Cisco 9300X

| Aspecto | Decisión procedural | Draw calls |
|---|---|---|
| Chasis 1U | Instances de caja `[0.82, 0.07, 0.5]` posicionada en los U de los racks (layout lib) | +1 (comparte Instances) |
| **Cara frontal** | Textura procedural de canvas 512×256 horneada como mapa en el chasis: fondo metálico oscuro, fila de **48 puertos RJ45** (puntos oscuros con borde claro, densidad del hero 9300X), **8 uplinks SFP** a la derecha, **hilera de LEDs** de estado arriba (verde, con alpha para parpadeo) | 0 (misma Instances) |
| Parpadeo de actividad (S3) | El `MicroAnimDriver` alterna `emissiveIntensity` de una segunda Instances de "LEDs activos" (quads sobre la fila) — solo en S3 | +1 (solo S3) |
| Variante 24 puertos | Segunda textura (mitad densidad) para racks de borde — 2 texturas, 1 material | 0 |
| LOD | > 40u: se omite la Instances de switches (los racks lejanos no los muestran) | — |

**Total:** 1 draw call fijo + 1 condicional (S3).

### 2.3 Storage / Backup — referencia: AFF A250 bezel + ME5 (frontal/trasera)

| Aspecto | Decisión procedural | Draw calls |
|---|---|---|
| Caja 2U | `BackupUnits` existente (Instances ámbar) — base estructural, sin cambio | 1 (existente) |
| **Bezel plateado** | Nueva Instances de planos frontales `[0.95, 0.3, 0.02]` con textura procedural: marco rebajado + **listones de ventilación horizontales** (A250), material plateado `roughness 0.4` | +1 |
| **Display LCD** (ME5) | Quad emisivo `[0.18, 0.1]` en el bezel — "00" se sustituye por un pulso luminoso procedural (sin dígitos: no texto en geometría, §14) | 0 (en el mismo Instances) |
| **Trasera** (ME5 rear) | Textura procedural trasera: 2 módulos de controlador (bloques oscuros con 4-6 puertos) + 2 PSU con rejilla de ventilador. Aplicada solo en S4 (unidades giradas mostrando la trasera) | +1 (solo S4) |
| Redundancia 2N (S4) | Pares de unidades en `BACKUP_UNITS` (ya existe `i % 2`) — la semántica de HA se refuerza con el pulso ámbar alternado del MicroAnimDriver | 0 |
| LOD | > 50u: sin bezel, solo caja ámbar | — |

**Total:** 1 fijo + 1 condicional (S4 trasera).

### 2.4 SIEM Display — referencia: Grafana 14000/1860 (dark UI)

| Aspecto | Decisión procedural | Draw calls |
|---|---|---|
| Marco industrial | Instances de caja `[1.6, 0.95, 0.06]` negra con **borde delgado** (ref: monitores NOC) | +1 |
| **Pantalla** | Instances de plano emisivo `[1.5, 0.84]` con **textura procedural UI oscura**: fondo near-black, 4-6 paneles rectangulares, 2-3 gráficas de líneas/barras en cyan/verde/ámbar, fila de métricas — canvas 1024×576. (Alternativa: screenshots de Grafana como textura `/public` — **requiere revisión de licencia**, ver §6) | +1 |
| Glow | `emissiveIntensity` 0.9 + `AdditiveBlending` en los paneles de métricas (detección de "pantalla encendida") | 0 |
| Alertas (S4) | Segundo set de texturas con acento ámbar + borde rojo sutil en un panel (estado de alerta, §9 color semántico) | 0 |
| Posicionamiento | S1: 1 consola en el rack hero · S3: 2-3 paneles holográficos flotantes · S4: 2 monitores de pared · S5: 1 pantalla central del nodo | — |

**Total:** 2 draw calls por escena con displays (4-6 pantallas máx. → 2-4 draw calls).

---

## 3. Manifiesto por escena (data-driven, §30)

Estructura propuesta para `datacenter.layout`:

```ts
type AssetManifest = {
  racks: { hero: boolean; corridorRows: number; backgroundRows: number }
  switches: { enabled: boolean; portTexture: '48p' | '24p'; ledActivity: boolean }
  storage: { count: number; bezel: boolean; showRear: boolean }
  displays: { count: number; style: 'boot' | 'siem' | 'alerts' | 'core'; positions: [number, number, number][] }
}
```

| Escena | Racks | Switches | Storage | Displays | Draw calls (est.) |
|---|---|---|---|---|---|
| S1 · Boot | hero:1, corridor:0, bg:0 | enabled (1U hero, LEDs arrancando) | 0 | 1 × boot | **~10** |
| S2 · Core | hero:0, corridor:6, bg:4 | enabled (corredor, sin actividad) | 1-2 | 0 (Purdue hace de "pantalla") | **~13** |
| S3 · Data | corridor:6, bg:4 | enabled + LED activity | 4-6 (bezel) | 3 × siem | **~20** |
| S4 · Resilience | corridor:4 (profundidad) | standby (sin actividad) | 6-8 (bezel + trasera) | 2 × alerts | **~16** |
| S5 · Connection | grid completo (corridor:6 + bg:6) | enabled | 4 | 1 × core | **~26** (incluye +2 del slot hero) |

Todos los valores dentro del presupuesto §21 (<50 máx, S3/S5 en la zona ideal-alta). La activación por escena la resuelve `useSectionProgress` → `activeSceneIndex` (sin `if section ===` dispersos, §30).

---

## 4. Escala por tier de calidad (§35, `useAdaptiveQuality`)

| Perfil | Racks (filas) | Switches | Storage | Displays | Texturas | Extras |
|---|---|---|---|---|---|---|
| ULTRA | corridor 6 + bg 6 | 48p + actividad | 8 + bezel + trasera | 4 (1024px) | full-res | streams, holograma |
| HIGH | corridor 6 + bg 4 | 48p | 6 + bezel | 3 (1024px) | full-res | streams, holograma |
| MEDIUM | corridor 4 + bg 2 | 48p, sin actividad | 4 + bezel | 2 (512px) | media | streams, holograma |
| LOW | corridor 2 + bg 0 | **off** | 2 (sin bezel) | 1 (512px, solo S3) | baja | sin streams/holograma (comportamiento actual) |
| STATIC | — | — | — | — | — | StaticPoster (sin canvas) |

Los conteos se suman a `TIER_COUNTS` existente; las texturas se generan **una vez** a la resolución del tier (canvas procedural, §5).

---

## 5. Deltas de implementación (componentes, §29)

| Archivo | Cambio |
|---|---|
| `src/lib/datacenter.layout.ts` | Añadir `SWITCH_UNITS` (offsets U por rack), `DISPLAY_POSITIONS` por escena, `AssetManifest` por escena |
| `src/lib/datacenter.textures.ts` **(nuevo)** | Generadores de canvas → `DataTexture`: `rackDoor(style)`, `switchFace(48p\|24p)`, `storageBezel()`, `storageRear()`, `siemScreen(style)` — memoizados por tier |
| `src/components/datacenter/ServerRackPool.tsx` | Añadir Instances de puerta (textura según variante) + Instances de LEDs de estado |
| `src/components/datacenter/ServerSwitchPool.tsx` **(nuevo)** | Instances de switches 1U + actividad de LEDs en S3 (driver del MicroAnimDriver) |
| `src/components/datacenter/BackupUnits.tsx` | **✓ hecho (Fase 6):** la unidad protagonista es slot GLB (`storage_unit_v01.glb`, fallback procedural SPEC §37) — posicionado en la base (`position.y − scale.y/2`), sin `scale` (GLB autorado al footprint 1.8×1×1.2). Pendiente: Instances de bezel + display LCD + (S4) cara trasera para el resto del pool |
| `src/components/datacenter/SiemDisplayPanel.tsx` **(nuevo)** | Marco + pantalla emisiva, estilos `boot/siem/alerts/core`, LOD |
| `src/components/datacenter/DatacenterScene.tsx` | Montar los 3 pools nuevos según `AssetManifest[activeScene]` × tier |
| `docs/datacenter/REFERENCIAS-MESHY.md` | Los prompts de textura reutilizan los screenshots de Grafana como *referencia de estilo* (§6) |

Los HUD (Purdue, telemetría, títulos de escena) siguen siendo `HudLabel` con claves i18n (§13, §14) — nada de texto en geometría ni en las texturas procedurales.

---

## 6. Texturas de pantalla SIEM: procedural vs. screenshot de Grafana

- **Opción A (default, SPEC-fiel):** UI oscura procedural — cero riesgo de licencia, cero red externa, personalizable por tier. Pierde la "autenticidad" de un dashboard real.
- **Opción B:** los screenshots de Grafana 14000/1860 (`REFERENCIAS-MESHY.md` §4) como textura en `public/images/`. Más fiel, pero: (a) **revisar licencia** de los dashboards públicos de Grafana antes de embeker, (b) es contenido estático — no escala a las alertas ámbar de S4 (habría que generar 2 variantes de color).
- **Recomendación:** A como base, B solo para S3 si la revisión de licencia lo permite, con la variante ámbar generada por tintado procedural en S4.

---

## 7. Validación contra el SPEC

| Criterio | Estado |
|---|---|
| §21 draw calls | ≤ 26 en la escena más pesada (S5) — +2 por el slot del rack hero (`GlbAsset`) + el slot de storage en S4 (reemplaza 1 instancia del pool, coste neto +1-2) — dentro de <50 |
| §20 instancing | 100% de la geometría repetida instanciada; sin meshes individuales |
| §22 sin allocs en useFrame | Texturas generadas una vez (memo por tier); LEDs/streams mutan solo atributos/materiales |
| §5 zero external | Todas las texturas son canvas procedurales; sin GLB, sin CDN |
| §13/§14 i18n | Cero texto en geometría/texturas; labels vía `HudLabel` |
| §35 tiers | Conteos y resoluciones por perfil; LOW desactiva switches/displays |
| §9 paleta | Materiales metal oscuro + cyan datos + ámbar seguridad + dorado conexión (tokens existentes) |
