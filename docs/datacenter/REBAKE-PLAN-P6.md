# REBAKE PLAN — P6 (activar los bridges de runtime en los GLBs Tripo)

> Estado: **PLAN** (2026-08-14) — pendiente de ejecución con Blender. El lever
> del realismo del audit P5 **no es runtime** (medido: metalness diluye la
> textura horneada, roughness/env = no-op) — es este re-bake. Referencias:
> ASSET-PIPELINE §4 (constraint Tripo), §5 (export), MESHY-PROMPTS-BLENDER §3.2/§3.4
> (valores PBR por asset), MESHY-OUTPUT-PLAN §3.2/§3.4 (gates por output).

---

## 1. Diagnóstico (evidencia P5, `artwork/living-datacenter/dump-glb-pbr.mjs`)

Los dos outputs Tripo promovidos vienen como **UN mesh + UNA textura horneada**:

| Asset | Meshes | Materiales | Texturas | `metallicFactor` | `roughnessFactor` |
| --- | --- | --- | --- | --- | --- |
| `server_rack_v03.glb` | 1 (`tripo_node_<uuid>`) | 1 | 1 (baked) | **0** | **0.9** |
| `storage_unit_v02.glb` | 1 (`tripo_node_<uuid>`) | 1 | 1 (baked) | **0** | **0.9** |

**Consecuencia:** los bridges de runtime por nombre de mesh (`GlbMesh.tsx`)
JAMÁS disparan — ni clearcoat (G5), ni LEDs emisivos, ni la puerta de malla
AR2580, ni el detalle de chasis/bezel procedural. El modelo se ve "mate
horneado" sin vida (medido: el reflejo cálido S4 y el sheen del hero no
responden).

**Objetivo del re-bake:** restaurar el CONTRATO de mallas/materiales que los
bridges esperan, **sin re-modelar** — la geometría y el albedo fotográfico de
Tripo son lo bueno. Se divide el mesh único en los meshes canónicos y se
asignan factores PBR por región.

---

## 2. Estrategia en dos niveles

| Nivel | Qué hace | Esfuerzo | Ganancia | Cuándo |
| --- | --- | --- | --- | --- |
| **P6a — Split canónico** (recomendado primero) | Divide el mesh único en meshes nombrados (`chassis`, `door`, `bezel_slats`, `leds_*`…) + factores PBR por región, **conservando el albedo horneado** como baseColor | ~20–30 min/asset | Activa TODOS los bridges: LEDs encendidos, clearcoat, puerta AR2580, detalle de chasis/bezel | Inmediato — es el fix directo del hallazgo P5 |
| **P6b — Albedo limpio + normal** | Re-bakea en Blender un albedo SIN iluminación + normal map (cage) → los factores PBR del contrato funcionan 100% con el env del runtime (iluminación real por Lightformers) | ~1–2 h/asset | El "premium lit look" completo (el storage cálido S4, el sheen del hero) | Solo si tras P6a la lectura cálida/sheen sigue corta |

> **No intentar en runtime** (medido en P5, ASSET-PIPELINE §4): subir
> `metalness` diluye el albedo horneado (negativo) y bajar `roughness` + subir
> `envMapIntensity` es no-op.

---

## 3. Workflow Blender genérico (aplica a ambos assets)

### 3.1 Preparación

1. **Fuente:** usar el GLB de PROVENANCE (textura full-res del `meshy-kit/`), NO el optimizado de `/public/assets/3d/` (que ya fue extraído y convertido a WebP 2048²).
2. `File → Import → glTF 2.0` el `.glb`.
3. **Origen y escala:** verificar que la malla queda con origen en **base y=0** y el footprint del slot (rack 1.0×2.4×0.9 · storage 1.8×1.0×1.2). Si el GLB fuente viene centro-anclado, mover el objeto hasta base y=0 (NO escalar — el fit se preserva del v03/v02 ya horneado).

### 3.2 Separación del mesh único (la parte clave)

El mesh de Tripo suele ser una pieza. Estrategia por orden de eficacia:

1. Edit mode → `A` (todo) → `P → By Loose Parts`. Si el modelo tiene piezas físicamente separadas (puerta con bisagras, plinto, paneles), las separa solo. **Nota:** si todo queda como una pieza (malla watertight), pasar a 2.
2. Selección por región (edit mode, vista ortho frontal/lateral): box-select la región de la puerta (cara frontal), `P → Selection`. Repetir para chasis, bezel, paneles.
3. Selección por UV island (si las partes tienen islas de UV distintas): `UV Sync Selection` → seleccionar isla → `P → Selection`. (Verificar en el UV editor que las regiones estén separadas.)

Resultado esperado por asset → ver §4 (lista exacta de meshes).

### 3.3 Materiales (Principled BSDF únicamente — ASSET-PIPELINE §4)

- **P6a:** a cada región asignar el MISMO albedo horneado como `Base Color` (cada región muestrea su isla de UV — no hace falta re-bake de color) + los factores PBR del contrato por región (§4).
- **P6b:** re-bake de albedo limpio — nuevo material con shader `Emission` ← textura albedo, bake `Emission` a atlas 2048² (da el color SIN iluminación) + `Normal` (cage `Solidify 0.005`, ray distance **0.02–0.03**). Luego factores PBR del contrato.
- **Cero emission en el GLB** (los `leds_*` viajan con baseColor apagado — el runtime les asigna el emisivo por escena, bridge §4).
- Atlas único 2048², padding de islas ≥ 8px, texel density ~512 px/m (contrato §3).

### 3.4 Export (ASSET-PIPELINE §5 — checklist verbatim)

- [ ] `Apply All Transforms`
- [ ] Modifier `Triangulate` AL FINAL (después de los bakes)
- [ ] Export GLB: **sin cámaras, sin luces, sin animaciones, sin empties**
- [ ] Nombre versionado: `server_rack_v04.glb` · `storage_unit_v03.glb`
- [ ] Footprint del slot + origen en base y=0 (posicionado con `position` SOLO en runtime, sin `scale`)

---

## 4. Por asset — meshes canónicos, PBR y qué hace el runtime con cada uno

> Bridge runtime (`GlbMesh.tsx` + `datacenter.materials.ts`): al encontrar el
> nombre canónico, el runtime aplica lo indicado. **La tabla es el contrato de
> salida del re-bake.**

### 4.1 Rack — `server_rack_v04.glb` (reemplaza a v03, hero S1)

| Mesh (nombre canónico) | Geometría | PBR (Principled) | Runtime (bridge) |
| --- | --- | --- | --- |
| `chassis` | gabinete (sin la puerta) | metal **0.7** / rough **0.5** | clearcoat 0.25/0.35 + textura de chasis procedural (juntas + ventilación) |
| `door` | **plano** (cero rejilla geométrica) | metal 0.7 / rough 0.5 | patrón AR2580 procedural (alpha cutout + bump, DoubleSide) |
| `plinth` | plinto base 0.08 | metal 0.7 / rough 0.5 | sin clearcoat (excluido) |
| `leds_status` / `leds_power` | planos (no cajas) | baseColor apagado, metal 0.3 / rough 0.6 | emisivo `#4DA3FF` @ 0.8 (azul boot) |
| `fasteners` *(opcional)* | cubo instanciado (remaches) | metal 0.7 / rough 0.4 | sin clearcoat |
| `units` *(solo si la puerta se abre/queda abierta)* | 1 objeto con Array | metal 0.5 / rough 0.5 | emisivo sutil `#4DA3FF` @ 0.32 + bump |

**Nota puerta:** el v03 trae el patrón de malla HORNEADO en la textura; el
re-bake lo simplifica a plano `door` — el runtime re-inyecta el AR2580
(consistente con el resto del corredor, §3.4 del contrato).

### 4.2 Storage — `storage_unit_v03.glb` (reemplaza a v02, protagonista S4)

| Mesh (nombre canónico) | Geometría | PBR (Principled) | Runtime (bridge) |
| --- | --- | --- | --- |
| `chassis` | cuerpo monolítico | metal **0.85** / rough **0.4** | clearcoat 0.25/0.35 + textura de chasis procedural |
| `bezel_slats` | bezel frontal rebajado | metal **0.9** / rough **0.35** (cepillado) | clearcoat 0.35/0.25 + mapa cepillado procedural (anisotrópico) |
| `leds_lcd` | plano 0.35×0.2 (la pantallita del storage) | baseColor apagado | emisivo **`#22d3ee` (cyan)** @ 0.6 — el LCD de datos |
| `leds_status` | 8 LEDs planos | baseColor apagado | emisivo `#4DA3FF` @ 0.8 |
| `rear_controllers` | trasera (2 controladores + 2 PSU) | plástico 0.0 / rough 0.8 | sin clearcoat (visible S4/S5) |

> **El `leds_lcd` es la ganancia más visible de P6a:** hoy el LCD viaja horneado
> en la textura (apagado); separado y nombrado, el runtime lo enciende en cyan
> — el storage pasa a ser un objeto "vivo" en S4.

---

## 5. Pipeline post-re-bake (los pasos que hago yo, cero Blender)

Una vez exportado el GLB del nivel elegido:

1. **Gate de payload:** `npm run assets:glb -- --strict` — < 3 MB (el v04/v03 re-bakeado no debería pasar de ~300 KB con el albedo 2048² WebP).
2. **Bridge CSP:** extraer la textura a `/public/assets/3d/<asset>_tex.webp` (proceso `scripts/glb-extract-texture.mjs` + re-encode sharp a WebP 2048² q82 — convención G7.3) si el GLB la lleva embebida.
3. **Manifiesto:** `GLB_ASSETS.heroRack` → `/assets/3d/server_rack_v04.glb` · `GLB_ASSETS.storageUnit` → `/assets/3d/storage_unit_v03.glb` (los slots ya están cableados — cero cambios de estructura).
4. **Verificación pre-promoción** (obligatoria, ASSET-PIPELINE §4):
   ```
   node artwork/living-datacenter/dump-glb-pbr.mjs public/assets/3d/server_rack_v04.glb public/assets/3d/storage_unit_v03.glb
   ```
   Criterio PASS (comparado con el §1 de este plan):
   - [ ] Meshes con nombres canónicos (§4) — **cero `tripo_node_*`**
   - [ ] `metallicFactor`/`roughnessFactor` por contrato (chassis 0.7-0.85 / 0.4-0.5, bezel 0.9/0.35…)
   - [ ] Nº de materiales > 1 (chassis vs door vs leds separados)
   - [ ] Sin `Emission`, sin cámaras/luces/animaciones en el JSON
5. **Verificación runtime (bridges disparando):**
   - LEDs emisivos: señal cyan/azul localizada en el LCD del storage y los LEDs del rack (probe close-up, `capture-closeup-p5.mjs` — `specPct`/`cyanPct` deben subir en los crops del storage/rack).
   - Puerta AR2580: patrón de rejilla lee en la puerta del rack (probe visual S1).
   - Clearcoat/chasis: sheen del env en el chassis (S1 rack, S4 storage).
   - Regresión por escena (`capture-p4.mjs`): S1/S4 sin cambios bruscos, consola sin errores nuevos.
6. **Reporte SPEC §37** (`report-p6-rebake-*.md`) + `CREATIVE-AUDIT.md` (cierra la recomendación P5) + commit.
7. **Rollback:** el v03/v02 actuales quedan en git — revertir es un checkout + re-deploy. El GLB viejo se conserva en `meshy-kit/<carpeta>/raw/`.

---

## 6. Tabla de expectativas (before → after P6a)

| Métrica | Antes (v03/v02) | Después (v04/v03) |
| --- | --- | --- |
| Meshes | 1 (`tripo_node_*`) | 5–7 canónicos |
| `metallicFactor` | 0 | 0.7–0.9 (chasis/bezel) |
| `roughnessFactor` | 0.9 | 0.35–0.5 |
| LEDs | horneados (apagados) | meshes `leds_*` → emisivos en runtime |
| Puerta rack | patrón horneado | plano `door` → AR2580 procedural |
| Clearcoat G5 | **no disparaba** | dispara (chassis/frame/bezel) |
| Cálido S4 / sheen hero | no responde (P5) | responde vía env (P6b = pleno) |
| Payload | 0.77 MB | < ~0.5 MB (albedo 2048² WebP) |

---

## 7. Orden de ejecución recomendado

1. **P6a storage** primero (la ganancia `leds_lcd` es la más visible y el mesh es más simple) → pipeline §5 → probe.
2. **P6a rack** (puerta + LEDs) → pipeline §5 → probe.
3. **P6b** (albedo limpio + normal) SOLO si tras P6a la lectura cálida S4 / el sheen del hero siguen cortos — decidir con evidencia de los probes, no por opinión.

> Cada paso es reversible y pasa por el gate completo (typecheck · tests ·
> lint · build · probe runtime) antes de promoverse.
