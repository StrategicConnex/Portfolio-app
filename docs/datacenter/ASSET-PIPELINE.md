# ASSET PIPELINE — Contrato de authoring GLB (Blender → gltf-transform → R3F)

> **Anexo de SPEC §12 (Asset Policy)** — lado *authoring* (Blender/asset) que alimenta la etapa de optimización `gltf-transform`.
> Guía de referencia visual: [`REFERENCIAS-MESHY.md`](./REFERENCIAS-MESHY.md) · Mapeo a escenas: [`ASSET-SCENE-MAP.md`](./ASSET-SCENE-MAP.md).
> **Default: NO ejecutar.** La geometría procedural ya cubre el SPEC (Fase 6 = SKIP, report-5 §Fase 6). Este pipeline se activa solo si procedural **no** alcanza la calidad objetivo (§12) o para un héroe autorizado — y siempre con demo de impacto visual + gate.

---

## 0. Gobernanza

| Regla | Valor |
|---|---|
| CONSTITUTION nivel | **L2** (decisión de implementación) — activar = gate de fase; no toca invariantes L0/L1 |
| R5 — runtime | GLB **self-hosted** en `/public` (nunca remoto) — CSP sin cambios, cero dominios nuevos |
| SPEC §12 | Payload 3D total **< 3 MB**; excepción requiere demostrar impacto visual |
| SPEC §11 | Presupuesto draw calls < 50 (ideal < 30); un GLB importado = 1-2 draw calls por asset |
| SPEC §10 | `frameloop="demand"` + tier adaptativo: un GLB no puede forzar renders continuos |

**Fallo del asset ≠ fallo del sitio:** si el GLB no carga, el fallback es la geometría procedural existente (ya integrada en `ServerRackPool`/`BackupUnits`) — nunca un error (SPEC §37).

---

## 1. Pipeline completo (2 etapas)

```
AUTHORING (Blender — este contrato)      OPTIMIZACIÓN (gltf-transform CLI)      RUNTIME (R3F)
high-poly → bake → decimate → atlas   →  draco + ktx2/avif + dedup + instance  →  /public/assets/3d/
→ GLB limpio (server_rack_v02.glb)       → inspect + gltf.report (gate)            → <LOD + fallback procedural
```

Este documento define la **etapa 1**. La etapa 2 ya está contratada en §12; se completa aquí con el comando exacto y la matemática de payload (§6).

---

## 2. GEOMETRÍA — contrato (verbatim) + anotaciones por escena

| Regla (Blender) | Valor | Anotación del proyecto |
|---|---|---|
| **Decimate** | 6K–8K tris (silueta frontal prioritaria) | Coincide con §12 (racks 5–10K, máx 20K con LOD). Presupuesto por escena §20: < 250K tris mobile / < 500K desktop — 8K × N racks **instanciados** = 1 geometría, sin impacto. |
| **Cara trasera** | Eliminar si va contra pared → **ahorrar ~30% polys** | ⚠️ **No aplicar en S5 (Connection).** La cámara hace pull-back del datacenter completo: los racks del grid se ven por detrás. Matriz: |
| **Ventilación** | NO modelar rejillas → **bake a normal map** desde high-poly | Alineado: las rejillas de puerta/bezel ya son textura procedural (ASSET-SCENE-MAP §2.1). En GLB, normal map horneado. |
| **Puertas laterales** | Fusionar en un solo plano si no se abren | OK — las puertas no abren en ninguna escena (sin interacción aprobada, R9). |
| **Rails internos** | Eliminar completamente (invisibles en web) | OK — invisibles con puerta cerrada; cero valor de silueta. |

### Matriz cara trasera por escena

| Escena | ¿Cara trasera? | Razón |
|---|---|---|
| S1 · Boot | Sí (rack hero aislado en niebla, cámara frontal) | Poco coste, silueta libre |
| S2 · Core | **No** — corredor simétrico, filas contra pared, backs invisibles | −30% polys |
| S3 · Data | No (filas contra pared) / Sí (arrays flotantes de contexto) | Según layout |
| S4 · Resilience | No (profundidad, filas contra pared) | −30% polys |
| S5 · Connection | **Sí** — pull-back total, backs visibles | Sin LOD trasero = artefactos |

**Convención:** el GLB del rack se exporta **con** cara trasera (variante *standalone*); en S2/S3/S4 se usa la variante recortada (`_wall`) generada en la etapa de optimización (gltf-transform `--slice`/script) — nunca dos GLBs manuales si se evita.

---

## 3. UVs / TEXTURAS — contrato (verbatim) + packing

| Regla (Blender) | Valor | Anotación del proyecto |
|---|---|---|
| **Atlas único 2K** | Albedo + Normal + Roughness + Metalness | Un atlas por **categoría de asset** (rack / switch / storage / display). |
| **RMA packing** | ⚠️ Recomendado: empaquetar **Roughness (G) + Metalness (B) + AO (R)** en 1 mapa | El spec pide 4 mapas × 2K por asset → ~1–1.6 MB/asset KTX2 → **4 assets ≈ 4–6 MB > presupuesto §12 (3 MB)**. Con RMA: 3 mapas/asset y el metalness se queda como está (0.8–0.9 chasis / 0.0 plásticos) sin degradar nada. |
| **UDIMs** | Solo si > 3 racks distintos comparten atlas | Adaptado por categoría: > 3 variantes del mismo asset (p. ej. rack mesh/solid/wall = 3 → OK sin UDIM; una 4ª variante → UDIM o atlas propio). |
| **Padding** | Mínimo **8px** entre islas (evitar bleeding en mipmaps) | Verbatim — crítico con KTX2 (mipmaps generados). |
| **Texel density** | Uniforme **512 px/m** en caras visibles | Verbatim — priorizar caras visibles; caras ocultas pueden bajar a 256 px/m. |
| **Tier matrix** | HIGH 2K · MEDIUM 1K · LOW 512 (o fallback procedural) | §35: la resolución se decide por `useAdaptiveQuality` al cargar; 3 mip levels del mismo atlas o redimensionado en build. |

---

## 4. MATERIALES — contrato (verbatim) + token a runtime

| Regla (Blender) | Valor |
|---|---|
| **Shader** | Principled BSDF únicamente → exporta a `MeshStandardMaterial` (three) |
| **Metalness** | 0.8–0.9 (chasis metálico) · 0.0 (plásticos/pintura) |
| **Roughness** | 0.3–0.5 (metal cepillado) · 0.7–0.9 (pintura mate) |
| **Cero nodos custom** | Sin `Emission`, sin `Clearcoat` exótico, sin mix manuales |
| **Cero emission** | Ver bridge LEDs abajo — **el GLB nunca emite** |

### Bridge LEDs: GLB limpio → runtime emisivo (la clave de integración)

El spec exige **cero emission en el GLB** con **LEDs como meshes separados**. Eso encaja perfecto con la arquitectura actual:

1. **Authoring:** cada LED se modela como mesh propio con nombre canónico `leds_<grupo>` (p. ej. `leds_status`, `leds_ports`) y un material PBR neutro (baseColor = color apagado).
2. **Optimización:** los meshes `leds_*` se preservan (exclusión del `--flatten`/`--join` de materiales si hiciera falta).
3. **Runtime (R3F):** al importar, se les asigna un `MeshStandardMaterial` con `emissive` + `emissiveIntensity` controlado por el **`MicroAnimDriver` existente** — parpadeo, color por escena (S1 azul boot → S3 cyan actividad → S4 ámbar standby) y estado del event bus del Copilot (S7).

Resultado: el GLB queda 100% PBR-neutral (reutilizable, sin variantes de color) y la vida/luz la pone el runtime — igual que los quads de LEDs procedurales actuales. **El GLB nunca se re-exporta por un cambio de color de escena.**

### Bridge CSP: textura embebida vs. externa (hallazgo verificado en runtime)

Los outputs de Meshy/Tripo traen la textura **embebida en el buffer del GLB** (bufferView + mimeType). GLTFLoader la decodifica creando una **`blob:` URL**, y la CSP del sitio (`img-src 'self' data: https:`) la **bloquea** — error `THREE.GLTFLoader: Couldn't load texture blob:...` y material sin mapa. **No se relaja la CSP** (SPEC §27): se **extrae la textura a un archivo separado** en `/public/assets/3d/<asset>_tex.jpg` y se re-escribe el GLB con `images[0].uri = '<asset>_tex.jpg'` (**relativa** — un path absoluto se duplica contra el resourcePath del loader: `/assets/3d/assets/3d/...`). Verificado en runtime: HEAD 200 → GLB 200 → textura 200, sin errores de consola (solo el CORS de telemetry preexistente). Bonus: el GLB pasa de ~2.3 MB a **74 KB** (la textura 4096×4096 JPEG ~2.2 MB viaja aparte). Proceso: `scripts/glb-extract-texture.mjs` (extrae, reindexa bufferViews/accessors y ajusta byteOffsets meshopt).

**Optimización de textura extraída (convención verificada en G7.3):** la JPEG
4096² de Tripo pesa 2.2–5.4 MB (97% del peso del asset) y rompería el budget de
imágenes de la página aunque el gate de GLBs no la cuente. Re-encode con `sharp`
a **WebP 2048² q82 → ~0.48 MB** (91% menos, imperceptible a distancia de cámara;
reserva 4096² solo si la cámara del slot encuadra el asset muy de cerca) y se
parchea `images[0].uri` al `.webp` (borrando `mimeType` — el loader resuelve por
extensión). La JPEG original se conserva como provenance en el kit
(`<asset>_tex-src.jpg`), nunca en `/public`. **Aplicado a los 2 outputs Tripo
promovidos:** rack hero v03 (2.29 MB JPEG → 103 KB WebP, G7.4) y storage v02
(5.2 MB JPEG → 477 KB WebP, G7.3) — ambos validados en runtime (200/200/200) y
con render visualmente idéntico al JPEG (diff 0.5/255 en S1).

**Fit al slot (SPEC §52):** los outputs de IA vienen centro-anclados y en proporciones propias. Se hornea el transform en el nodo del GLB (`scale` + `translation` — el slot pide origen-en-base §5): `scripts/glb-bake-transform.mjs`. Ejemplo real: `server_rack_v03` (Tripo, gabinete compacto 0.65×1.0×0.38) → fit 1.0×2.4×0.9 base-anclada, y el slot `GLB_ASSETS.heroRack` quedó cableado a v03 con evidencia runtime archivada en `report-g7-tripo-rack.md`.

### Bridge de texturas (canvas procedural — puerta de malla AR2580)

El contrato §3.4 exige la puerta como **plano con alpha/normal map** (cero geometría de rejilla). Implementado en runtime para `server_rack_v02` (`src/components/datacenter/meshDoorTexture.ts`): la puerta viaja PBR-neutral en el GLB y `GlbMesh` le inyecta un `CanvasTexture` procedural — patrón **24×8 barras** (el mismo high-poly de bake del §3.4) — como `alphaMap` (cutout) + `bumpMap`, con el chasis hueco por delante para que las unidades con glow se vean a través de los huecos (look AR2580; verificado: 47 transiciones barra/hueco en el probe visual). Cero assets externos (R5), singleton por app. **Un output de Meshy con rejilla geométrica real viola el presupuesto** — se decima y se re-bakea (§4.1 de [`MESHY-CONTACT-SHEET.md`](./MESHY-CONTACT-SHEET.md)).

### Constraint verificada: outputs Tripo = single-mesh + textura horneada (P5)

Los outputs Tripo promovidos (`server_rack_v03`, `storage_unit_v02`) vienen como **UN mesh** (`tripo_node_<uuid>`) + **UNA textura horneada** con `metalness=0` y `roughness=0.9` (verificado en el chunk JSON del GLB con `artwork/living-datacenter/dump-glb-pbr.mjs`). Consecuencias verificadas en runtime (P5, métricas sobre crops idénticos a la baseline):

1. **Los bridges por nombre de mesh JAMÁS disparan** en estos outputs (ni clearcoat G5, ni LEDs emisivos, ni puerta) — los nombres canónicos (`chassis`, `leds_*`, `door`…) no existen; el runtime ve `tripo_node_*`.
2. **Subir la respuesta PBR en runtime NO es el lever del look:** (a) `metalness` 0.35–0.4 **diluye el albedo horneado** (la textura lleva la iluminación de Tripo, no es albedo limpio) — medido: cálido S4 0.66→0.16%, imagen más oscura; (b) `roughness` 0.45–0.5 + `envMapIntensity` 1.4 = **no-op** (cálido 0.27–1.20% vs 0.66–0.81% baseline, dentro del ruido; sin ganancia de especular).
3. **El lever real es re-bake del asset** (pipeline, no runtime): textura con canales PBR separados (o re-export con meshes nombrados `chassis`/`bezel_slats`/`leds_*` que permitan el bridge §4) — plan completo en [REBAKE-PLAN-P6](./REBAKE-PLAN-P6.md) (split canónico P6a + albedo limpio P6b, con verificación pre-promoción).

**Verificación pre-promoción (obligatoria al integrar cualquier output de Meshy/Tripo):** correr `artwork/living-datacenter/dump-glb-pbr.mjs <asset>.glb` y revisar: (a) nombres de mesh contra el set canónico del bridge, (b) `metallicFactor`/`roughnessFactor` (si 0/0.9 → matte horneado), (c) nº de materiales/texturas (1+1 = texto horneado). Si el output es single-mesh matte, decidir antes de promover: aceptar el look horneado o planear re-bake — **no** intentar corregirlo en runtime.

---

## 5. EXPORT — contrato (verbatim) + convención de nombres

| Regla | Valor |
|---|---|
| **Transforms** | Apply All Transforms |
| **Triangulate** | Modifier AL **FINAL** (después del bake) |
| **GLB limpio** | Sin cámaras, luces, animaciones, empties |
| **Origen** | Centrado en base (0,0,0) para instanciar racks a nivel de piso |
| **Escala** | **Footprint del slot en unidades de escena** (ver convención abajo) — NO metros reales sueltos |

**Prompts Meshy + guía Blender accionable:** [`MESHY-PROMPTS-BLENDER.md`](./MESHY-PROMPTS-BLENDER.md) — prompts ≤120 palabras por las 4 categorías, pasos numerados de post-proceso (bake/nodos/UV/export) y matriz de integración WebGL.

**Convención de footprint (verificada en runtime, Fase 6):** cada GLB se autoriza a las **dimensiones exactas del slot** que va a reemplazar, en las unidades del layout de la escena (`datacenter.layout`). El rack (1×2.4×0.9, base en y=0) y el storage (1.8×1×1.2, base en y=0) replican el footprint del bloque procedural que sustituyen, de modo que el slot se posiciona con `position` SOLO (sin `scale`). El runtime asigna la base: `HERO_RACK_GLB_POS = [0,0,0]` (rack) y `position.y − scale.y/2` (storage, porque el bloque procedural es centro-anclado). No autorizar a metros reales sueltos (p. ej. storage 2U = 0.3 de alto) — el GLB queda ⅓ del tamaño del slot y flota (bug verificado y corregido).

### Naming (extiende `server_rack_v02.glb` a las 4 categorías)

| Asset | Nombre | Path |
|---|---|---|
| Server Rack | `server_rack_v02.glb` (+ `server_rack_v02_wall.glb` si se usa la variante recortada) | `/public/assets/3d/` |
| Network Switch | `network_switch_v01.glb` | `/public/assets/3d/` |
| Storage / Backup | `storage_unit_v01.glb` | `/public/assets/3d/` |
| SIEM Display | `siem_display_v01.glb` | `/public/assets/3d/` |

Versionado `_vNN` estrictamente: un cambio visual **incrementa** la versión, nunca sobrescribe (cache busting de Vercel + reversibilidad SPEC §58). Todo en `/public/assets/3d/` (R5).

---

## 6. Optimización post-authoring (SPEC §12 — comando concreto)

**Script oficial:** `npm run assets:glb` → `scripts/glb-pipeline.mjs` (optimize → validate → inspect → payload gate < 3 MB; `--verify` sin optimize, `--promote` copia a `/public`, `--strict` para CI; SKIP con instrucciones si las herramientas no están instaladas — Fase 6 opcional).

```bash
# Perfil verificado contra gltf-transform CLI 4.4.2 (fuente: packages/cli/src/cli.ts)
gltf-transform optimize server_rack_v02.glb out/server_rack_v02.glb \
  --compress draco --texture-compress ktx2 --texture-size 2048 \
  --instance --flatten --join --join-named false --simplify false
gltf-transform inspect out/server_rack_v02.glb    # gate: tris, materiales, texturas
gltf-validator out/server_rack_v02.glb            # gate: 0 errores (o: gltf-transform validate)
```

**Correcciones de flags (verificadas, no asumidas):** `--resize` no existe en `optimize` (el flag es `--texture-size`); no existe `--dedup` (dedup/prune/weld/palette/sparse son default-on). **`--join-named false` es obligatorio** para el contrato §4: el default (`keepNamed: false`) fusiona los meshes nombrados, destruyendo los `leds_*`. `--simplify false` respeta el presupuesto de tris del authoring (§2: 6–8K).

### Matemática de payload (objetivo §12: < 3 MB total)

| Asset | Tris (draco) | Mapas (KTX2 2K) | Est. gz |
|---|---|---|---|
| rack | 8K ≈ 60–100 KB | Albedo + Normal + RMA ≈ 3 × 250–350 KB | ~1 MB |
| switch | 6K ≈ 40–80 KB | 3 × 250–350 KB | ~0.9 MB |
| storage | 8K ≈ 60–100 KB | 3 × 250–350 KB | ~1 MB |
| display | 4K ≈ 30–60 KB | 3 × 250–350 KB | ~0.9 MB |

**Total ≈ 3.8 MB > presupuesto.** Para cerrar en < 3 MB (opciones, en orden de preferencia): (1) MEDIUM 1K para switch/display (≈ −1.2 MB), (2) RMA + 3 mapas en vez de 4 (ya incluido arriba), (3) AVIF en vez de KTX2 donde no haga falta mipmaps. Si aun así se supera: **excepción §12 con demo de impacto visual** antes de aceptar.

---

## 7. Validación / gate de integración

| Check | Criterio | Herramienta |
|---|---|---|
| Validez GLB | 0 errores | `gltf-validator` |
| Estructura | 1 mesh por asset + `leds_*` separados; sin cámaras/luces/animaciones | `gltf-transform inspect` |
| Payload | < 3 MB total; si no, excepción documentada | `du -sh /public/assets/3d` |
| Draw calls | +1-2 por asset importado, dentro del §11 (< 50 por escena) | DevTools / `renderer.info.render.calls` |
| Red (SPEC §18) | Solo `/_next/*` + `/public/assets/3d/*` — cero dominios externos | Network panel / probe |
| Tiers (§35) | 2K/1K/512 por perfil; LOW usa fallback procedural | `useAdaptiveQuality` |
| Fallback (SPEC §37) | GLB ausente/fallido → procedural existente, sin error boundary disparado | Force 404 del GLB |

> **Estado: ✓ implementado y verificado en runtime** (`GlbAsset` en `src/components/datacenter/`).
> Mecanismo: pre-check HEAD → Suspense → boundary local (`AssetFallbackBoundary`) — el GLB jamás llega al `DatacenterErrorBoundary` global. Verificación con `artwork/living-datacenter/verify-glb-fallback.mjs` (4 escenarios: control, 404, red abortada, GLB corrupto con parse fallido → todos GATE PASS, canvas vivo, boundary global nunca disparado).
> QA: `?dc-glb=<nombre>` fuerza `/assets/3d/<nombre>.glb` en runtime (integración actual: slot del rack hero S1; `GLB_ASSETS.heroRack` en `datacenter.layout.ts`). Coste del slot: **+2 draw calls** por los pools procedurales del hero aislados.
> ⚠️ Hallazgo verificado: `next start` devuelve **404 a archivos nuevos en `/public`** (mapea el directorio al arrancar) — añadir un GLB a `/public/assets/3d/` requiere **reiniciar el servidor**.
>
> **Primer GLB vivo (Fase 6 — demo):** `public/assets/3d/server_rack_v01.glb` (generado por `scripts/gen-rack-glb.mjs`, 6598 tris, 7 meshes canónicos `chassis/plinth/door/units/leds_status/leds_power/fasteners`, 197.5 KB, gate de autoría PASS con auto-re-parseo GLTFLoader). Verificado con `artwork/living-datacenter/verify-glb-load.mjs` (GATE PASS): el slot del rack hero lo descarga (HEAD+GET) y **reemplaza al procedural** — señal visual A-vs-B mean 1.02 vs piso de ruido 0.00.
> Dos hallazgos de runtime (verificados): (1) en **scroll 0 el DOM del hero (Z-40) cubre el rack** — el reemplazo es visible al scrollear, comportamiento correcto por arquitectura de capas; (2) `frameloop="demand"` + suspense: al resolver, R3F **no invalida el frame** — `GlbMesh` llama `invalidate()` al montar (SPEC §10) o el GLB queda invisible hasta el primer scroll.
>
> **4 GLBs vivos (Fase 6 — `scripts/gen-assets.mjs`, sustituye a `gen-rack-glb.mjs`):** `server_rack_v02` (6468 tris/181.2 KB — **bump v02**: puerta plana + textura de malla procedural en runtime, bridge §4; **bump v02.1 fidelidad**: postes de esquina + bandeja de cableado), `network_switch_v01` (4324/155.1 KB — v02: ventilación lateral + aletas superiores), `storage_unit_v01` (7210/195.1 KB — v02: bahías de discos + manijas laterales), `siem_display_v01` (3766/108.1 KB — v02: bracket + LED) — **0.62 MB total** (< 3 MB §12), gates de autoría PASS por asset. Slots: rack hero S1 (`GLB_ASSETS.heroRack`) + unidad protagonista de storage S4 (`GLB_ASSETS.storageUnit` en `BackupUnits`); switch/display en `ServerSwitchPool`/`SiemDisplayPanel` (G4). Verificado con `artwork/living-datacenter/verify-glb-assets.mjs` (GATE PASS): 4×200, requests exactos por slot, canvas vivo, boundary global nunca disparado, señal visual localizada (bbox 10% de ancho).
> **⚠️ Metodología de probes (hallazgo importante):** el scroll objetivo de un probe DEBE ser **fijo** (`window.scrollTo(0, N)`), no `#seccion.offsetTop` — el offsetTop varía entre cargas (fonts/layout), mueve la cámara y produce diff de frame completo (B-vs-B ruido 6.5–7.5 con offsetTop vs 0.4 con scroll fijo). Y en S4 profundo (scroll 8200) la escena está animada activamente (unidades ámbar parpadeando: ruido A-vs-A 5.0) — usar el punto del recorrido donde la escena está quieta y medir señal vs ruido por región.
> **Bug corregido (footprint/anchors):** el storage GLB original se autorizó a proporciones 2U reales (0.3 de alto) → renderizaba ⅓ del tamaño del slot y flotaba; re-autorado al footprint del slot (1.8×1×1.2, base-origin) y el slot lo posiciona en la base (`position.y − scale.y/2`). Igual el rack hero: se posicionaba en `HERO_RACK_POS` (centro, y=1.2) → base en 1.2 flotando; ahora `HERO_RACK_GLB_POS = [0,0,0]` alinea la base con el piso. |
| Reduced motion (R7) | GLB no bloquea StaticPoster (ya resuelto: canvas lazy en reduce) | Modo reduce + probe de red |
| Name/version | `_vNN` incrementado; sin sobrescritura | diff de `/public` |

### Estado de la ejecución del gate (2026-08-11)

| Comando | Resultado |
|---|---|
| `npm run assets:glb -- --strict` | **FAIL por tooling** (no por payload): `@gltf-transform/cli` + `gltf-validator` no instalados — el pipeline aborta a propósito en `--strict` (Fase 6 = default SKIP, §0). Para completar optimize → validate → inspect → payload: `npm i -D @gltf-transform/cli gltf-validator` |
| Payload gate (SPEC §12) | **PASS — 0.62 MB < 3 MB** (misma aritmética del pipeline: suma de `.glb` en `/public/assets/3d`). Desglose (2026-08-11, bump fidelidad): `network_switch_v01` 0.15 MB · `server_rack_v02` 0.18 MB · `siem_display_v01` 0.11 MB · `storage_unit_v01` 0.19 MB |

> El eje de payload está **verificado hoy**; el pipeline completo queda **pendiente de tooling**. Instalar las herramientas es una decisión ARCHITECTURAL (SPEC §56) bajo Dependency Governance (§44): revisar compatibilidad con React 19/Next 16 (devDeps CLI — no aplica a runtime) e impacto en `npm audit` antes de `npm i -D`. Hasta entonces, el gate de payload se puede re-validar con la misma aritmética sin instalar nada.

---

## 8. Matriz por asset → escena (4 categorías)

| Asset | Ref. Meshy | Tris | Atlas | Notas de escena (ASSET-SCENE-MAP) |
|---|---|---|---|---|
| **Rack** | AR2580 (malla) / SX (sólida) | 6–8K | 2K × 1 | **✓ vivo**: `server_rack_v02.glb` en el slot hero S1 (6468 tris, puerta de malla AR2580 procedural en runtime — bridge §4; postes de esquina + tray de cableado). Corredor S2/S3/S4 sigue procedural (variante `_wall`, con textura de chasis procedural — G7) · grid S5 (con trasera) |
| **Switch** | Hero Cisco 9300X | 4–6K | 2K × 1 | Cara de puertos con actividad en S3; standby ámbar S4 |
| **Storage** | AFF A250 bezel / ME5 trasera | 6–8K | 2K × 1 | **✓ vivo**: `storage_unit_v01.glb` en el slot protagonista de `BackupUnits` (S4) — 7330 tris, 5 meshes (`chassis/bezel_slats/leds_lcd/leds_status/rear_controllers`), 201.3 KB, footprint 1.8×1×1.2 (base-origin). Bezel plateado S3; **protagonista** S4 (2N + trasera visible) |
| **SIEM display** | Grafana 14000/1860 | 3–4K | 2K × 1 | Boot S1 · SIEM S3 · alertas ámbar S4 · nodo central S5 (pantalla = quad emisivo con textura UI, no geometry) |

> **Recordatorio §14:** la pantalla SIEM muestra **textura de UI procedural** (o screenshot de Grafana solo si la revisión de licencia lo permite, ASSET-SCENE-MAP §6) — nunca texto/modelado en geometría, nunca texto hardcoded.
