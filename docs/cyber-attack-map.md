# Mapa global de ciberataques — documento técnico

> **Estado:** vigente · **Ruta:** `/cyber-attack-map` · **API:** `GET /api/threat-intel`
> **Componente principal:** `src/features/portfolio/CyberAttackMap3D.tsx`
> **Verificado:** 22 de octubre de 2026 (624 tests en verde, lint y typecheck limpios)

Este documento explica cómo funciona el mapa 3D de ciberataques: de dónde vienen los
datos, qué reglas se garantizan en cada capa, dónde está cada seam y cómo se verifica todo
ello. La regla que gobierna el diseño completo está en [La regla de honestidad](#la-regla-de-honestidad-del-mapa).

---

## 1. Qué es y qué no es

**Es** una visualización 3D sobre la web con datos reales de inteligencia de amenazas
pública: las IPs que más reportes generan contra los sensores de DShield (SANS ISC) y las
vulnerabilidades con explotación confirmada que publica CISA KEV.

**No es** un panel de monitoring de una red real. El mapa no observa ninguna
infraestructura del autor: muestra actividad pública reportada por terceros, geo-localizada
y dibujada sobre un globo. Los KPIs, el stream de eventos y las zonas Purdue del panel SIEM
que lo rodea siguen siendo **simulación en el navegador** — el badge del panel lo dice
(`MAPA EN VIVO · PANEL SIMULADO`) precisamente para que la distinción no se pierda.

---

## 2. Fuentes de datos

| Fuente | Endpoint | Qué aporta | TTL |
|---|---|---|---|
| DShield (SANS ISC) | `isc.sans.edu/api/topips/records/8?json` | IPs con mayor volumen de reportes | 300 s |
| DShield (SANS ISC) | `isc.sans.edu/api/ip/<ip>?json` | ASN, país del ASN, listas de bloqueo | 3600 s |
| CISA KEV | `cisa.gov/…/known_exploited_vulnerabilities.json` | CVEs con explotación confirmada | 3600 s |
| ipwho.is | `ipwho.is/<ip>` | Geolocalización de respaldo | 3600 s |

Dos decisiones de diseño que no son obvias:

**El respaldo de geolocalización es `ipwho.is`, no `ip-api.com`.** `ip-api.com` solo admite
HTTP en su plan gratuito, así que falla en peticiones server-side con HTTPS (que es lo que
hace Vercel). `ipwho.is` responde por HTTPS sin clave.

**El país se resuelve siempre por código ISO.** `ipwho.is` devuelve `country_code`; el
nombre del país se busca contra `COUNTRY_BY_ISO` y solo entonces se usa como clave de
`COUNTRY_COORDS`. Así `originCountry` es siempre una clave que el mapa sabe colocar, y no
un texto libre que se cuela en la escena.

---

## 3. La regla de honestidad del mapa

Es la restricción central de la funcionalidad. Un mapa de amenazas es propenso a
convertir datos reales en afirmaciones falsas (atribuir un ataque a un país que el
proveedor no señaló, presentar una víctima inventada como real, rellenar un hueco con un
cero). Estas son las cinco reglas, y cada una tiene test que la fija:

1. **El origen del arco es un dato del proveedor.** Solo los eventos con `originIp` **y**
   `originCountry` reales pueden originar un arco. Los eventos de CISA KEV (sin atribución
   de origen) y la muestra de respaldo se dibujan atenuados y marcados `illustrative`.

2. **El destino no es un dato del proveedor.** DShield no publica a quién ataca. El
   extremo derecho del arco es la infraestructura que el autor dice proteger (Argentina /
   Neuquén) o un país global elegido al azar, y el mapa distingue visualmente `hub` de
   `illustrative`.

3. **CISA KEV no tiene país de origen.** Publicarlo sin atribución es correcto; inventar un
   país convertiría un dato real en una afirmación falsa.

4. **El pie dice en qué modo está el feed.** «✓ Datos de inteligencia de amenazas reales» o
   «⚠ Feed sin datos: origen de los arcos ilustrativo» — nunca ambos a la vez. La etiqueta
   anterior «Origen: IP real (DShield/SANS ISC)» se eliminó por eso.

5. **El tooltip distingue lo real de lo hueco.** Los campos que el proveedor no publicó se
   muestran como «—», no como un cero ni como un valor inventado, y las filas que no
   proceden del proveedor quedan marcadas como no reales.

**Verificación:** `src/features/portfolio/cyberAttackMap3D.guard.test.ts` (15 tests) y
`src/features/portfolio/arcTooltip.test.ts` (5 tests).

---

## 4. Arquitectura

```
GET /api/threat-intel
  ├─ collectDshieldEvents()   topips → describeAttacker() por IP (en paralelo)
  │    └─ describeAttacker()  ip/<ip> → ASN + país; si no hay país → ipwho.is
  ├─ collectKevEvents()       feed KEV → 3 eventos sin atribución de origen
  └─ coalesce()               ráfagas concurrentes → una sola consulta por fuente

  ↓ (caché de datos de Next + caché en memoria de KEV)

CyberAttackMap3D  (client)
  ├─ useEffect → fetch /api/threat-intel (poll cada 60 s)
  ├─ attributableEvents = eventos con originIp + originCountry  ← regla 1
  ├─ buildAttackArc()  →  arcos (attackArc.ts)
  ├─ RotatingEarth     →  Globe + CountryLabel + ProtectedPin + Arc + ImpactBurst
  └─ ArcTooltipPanel   →  detalle del arco en hover (arcTooltip.ts)
```

### 4.1 Seams

| Seam | Módulo | Responsabilidad |
|---|---|---|
| **Agregación de feeds** | `src/app/api/threat-intel/route.ts` | Normaliza DShield + KEV + geolocalización en una respuesta con `sourceStatus` por fuente y `cacheTtlSeconds` |
| **Caché de datos** | `src/lib/next-cache.ts` | `cachedData()` envuelve `unstable_cache` y degrada a cálculo directo cuando no hay contexto de Next |
| **Geometría del arco** | `src/features/portfolio/attackArc.ts` | Tipo de ataque por palabras clave, destino por pesos, flags `illustrative` / `destinationKind` |
| **Geocodificación** | `src/data/countryCoords.ts` | Coordenadas de ~110 países + tabla ISO→nombre |
| **Rotación** | `src/features/portfolio/globeRotation.ts` | Velocidad en rad/s con delta real del frame (clamp a 100 ms) |
| **Tooltip** | `src/features/portfolio/arcTooltip.ts` | Lógica pura (sin React) del contenido del tooltip |
| **Copy** | `src/context/translations/threatmap.ts` | Todo el texto visible del mapa, en ES y EN |

### 4.2 `cachedData()` — por qué existe

`unstable_cache` de Next solo funciona dentro de un contexto de petición de Next. Fuera de
él —tests de vitest, scripts, utilidades— lanza:

```
Invariant: incrementalCache missing in unstable_cache ...
```

`cachedData()` envuelve la llamada y, si detecta ese invariante, ejecuta el cálculo
directamente y devuelve el resultado sin caché. El invariante se comprueba **antes** de
invocar la función envuelta, así que nunca se repite el trabajo caro.

---

## 5. Detalles de implementación que importan

### 5.1 Rotación unificada (el defecto que se corrigió)

El defecto original era invisible en los tests: el globo rotaba sobre su propia malla
mientras los marcadores y los arcos se quedaban quietos en el espacio. El resultado visual
era que los puntos acababan flotando sobre países que no les correspondían.

La corrección: globo, etiquetas de país, pin protegido, arcos y explosiones viven dentro
del **mismo grupo** que gira (`RotatingEarth`), y el globo por sí solo no rota.

```
<RotatingEarth>          ← el único que rota
  ├─ <Globe />            ← sin rotation.y propio
  ├─ <CountryLabel />     ← ancladas al surface
  ├─ <ProtectedPin />
  ├─ <Arc />              ← todos
  └─ <ImpactBurst />
```

Como la escena no se puede montar en jsdom (WebGL), la guarda comprueba el invariante
**directamente sobre el árbol de JSX** del archivo fuente.

### 5.2 Velocidad independiente del framerate

La rotación se aplica con el delta real del frame, no con `rotation.y += 0.002`:

```ts
export const EARTH_ROTATION_RAD_PER_SEC = 0.06   // ~105 s por vuelta
export const MAX_FRAME_DELTA_SEC = 0.1            // clamp: una pestaña en segundo plano
                                                        no teletransporta el globo
```

A 0.06 rad/s se sigue percebiendo como una Tierra viva, pero los marcadores ya se leen
anclados a su país en vez de «volando» sobre la superficie. El clamp del delta evita el
salto brusco al volver a una pestaña que estaba en segundo plano.

### 5.3 Fuente local de las etiquetas

Las etiquetas 3D usan `/fonts/DMMono-Regular.ttf`, servida por la propia app. La CSP del
proyecto solo permite `font-src 'self' data:`; la fuente por defecto de troika
(`fonts.gstatic.com`) quedaría bloqueada y el texto no se vería. La licencia OFL de la
fuente está en `public/fonts/OFL.txt`.

### 5.4 Texturas del globo servidas en local

Las texturas del globo (`/textures/earth-blue-marble.jpg`, `earth-topology.jpg`,
`earth-water.jpg`) las sirve la propia app. La primera versión las pedía a
`unpkg.com/three-globe@2.45.6/example/img/…` en tiempo de ejecución, lo que contradecía
ADR-001 (que quitó `unpkg.com` de la CSP precisamente para no depender de un CDN) y
obligaba a mantener `img-src https:` abierto.

Con las texturas en local:

- la escena no depende de que `unpkg.com` esté accesible ni de que el visitante no lo
  bloquee;
- cada visita deja de filtrar su IP a un tercero;
- `img-src` de la CSP baja a `'self' data:` — y `src/lib/csp.test.ts` fija esa directiva
  para que nadie la vuelva a abrir sin una revisión explícita.

Los originales se recodificaron con `sharp` (2,2 MB → 368 KB) sin cambiar la proyección:
siguen siendo equirectangulares 2:1, así que las UV de la malla no cambian y la geografía
no se mueve. La procedencia y la licencia (three-globe MIT; imágenes de la NASA, de dominio
público) están en `public/textures/NOTICE.md`.

### 5.5 `blob:` en `script-src` de la CSP

Troika (el texto 3D de `@react-three/drei`) genera el SDF de las fuentes en un worker creado
con `new Worker(URL.createObjectURL(blob))`. Sin la directiva `blob:` en `script-src`, el
worker sí se crea (`worker-src 'self' blob:`) pero el **módulo que importa dentro** queda
bloqueado, el worker no inicializa y la excepción tumba el `<Canvas>` entero.

### 5.6 Tooltip con objetivo de puntero

El arco visible tiene radio `0.008` — una línea de un píxel. Sin un tubo de captura más
ancho (`ARC_HIT_RADIUS`) el hover no se dispararía nunca. Los handlers `onPointerOver` /
`onPointerMove` / `onPointerOut` van sobre ese tubo, no sobre la línea visible.

El panel (`ArcTooltipPanel`) muestra IP real, ASN, número de reportes y país de origen. Las
**etiquetas** salen del diccionario y la **lógica** vive en `arcTooltip.ts` (función pura,
sin dependencias de React) — por eso el mismo mapa se lee igual en español y en inglés.

### 5.7 Bilingüismo

El mapa se dibuja en un canvas de WebGL: no hay DOM que traducir. Por eso **todo** su texto
visible sale de `src/context/translations/threatmap.ts`:

- La página `/cyber-attack-map` es un Server Component que resuelve el idioma con el seam
  de servidor (`cookie → Accept-Language → default`): el primer paint y el metadata ya
  salen en el idioma correcto.
- El mapa embebido en el panel SIEM usa el `useLanguage()` del cliente.
- `cyberAttackMap3D.guard.test.ts` incluye una guarda que falla si alguien vuelve a
  escribir una cadena literal en el componente.

Los únicos textos que quedan en inglés son los que publica el proveedor (el tipo de
ataque de DShield, el nombre de un ASN) o la nomenclatura técnica (DDoS, Botnet C2, SQL
Injection, APT).

---

## 6. Elección de destino

`pickDestination()` reparte los arcos con pesos fijos:

| Destino | Peso | Tipo |
|---|---|---|
| Neuquén (infraestructura del autor) | 5 % | `hub` |
| Argentina (infraestructura del autor) | 20 % | `hub` |
| País global elegido al azar | 75 % | `illustrative` |

El país de origen se excluye del pool global para no dibujar un arco de un país a sí
mismo. La función de aleatoriedad se **inyecta** (`random: () => number = Math.random`),
lo que permite testear los pesos de forma determinista.

---

## 7. Verificación

```bash
npm test          # 624 tests · 60 archivos
npm run lint
npm run typecheck
npm run build
```

Tests específicos de esta funcionalidad:

| Archivo | Tests | Qué fija |
|---|---|---|
| `cyberAttackMap3D.guard.test.ts` | 16 | Escena unificada, fuente local, texturas locales, Suspense, radio del marcador, a11y de la barra, atribución de origen, tooltip |
| `arcTooltip.test.ts` | 5 | Contenido del tooltip: datos reales, huecos, rótulos traducidos |
| `ArcTooltipPanel.test.tsx` | 3 | Render del panel en ES y EN |
| `attackArc.test.ts` | 16 | Pesos de destino, tipo de ataque, flags `illustrative` / `hub` |
| `globeGeometry.test.ts` | 9 | Geometría de arcos y coordenadas |
| `countryCoords.test.ts` | 5 | Integridad de la tabla de coordenadas |
| `app/api/threat-intel/route.test.ts` | 11 | Agregación de feeds, degradación declarada, TTLs |
| `app/cyber-attack-map/page.test.tsx` | 4 | Copy por idioma, metadata, montaje del mapa |
| `next-cache.test.ts` | 3 | Degradación de `unstable_cache` fuera de contexto Next |
| `lib/csp.test.ts` | 7 | `img-src` sin host remoto, sin CDN, `blob:` de troika, fuentes locales, texturas servidas y sin inflar |
| `globeRotation.test.ts` (en `globeGeometry.test.ts`) | — | Velocidad, clamp del delta, independence del framerate |

---

## 8. Deuda abierta

| # | Sev | Ubicación | Problema |
|---|---|---|---|
| 1 | P2 | `src/features/portfolio/CyberAttackMap3D.tsx` | El bundle de Three.js + `@react-three/drei` se carga en la home por el mapa embebido en el panel SIEM; no hay code-splitting del chunk WebGL |
| 2 | P3 | `src/app/api/threat-intel/route.ts` | La caché en memoria del bloque KEV es **por instancia**: en Vercel (serverless) cada instancia tiene la suya, así que el TTL real puede ser menor que el declarado (la respuesta publica `cacheTtlSeconds` para que sea auditable) |
| 3 | P3 | `src/features/portfolio/CyberAttackMap3D.tsx` | El mapa no tiene equivalente de la actualización por visibilidad: el poll sigue corriendo con la pestaña en segundo plano (el navegador lo throttlea, pero la lógica no lo contempla) |

---

## 9. Referencias

- `README.md` — sección «Mapa global de ciberataques» (resumen) y tabla de API Routes
- `CONTEXT.md` — glosario de seams
- `docs/adr/ADR-001-production-hardening.md` — CSP, headers y budget de Lighthouse
- `src/app/api/threat-intel/route.ts` — la ruta y sus comentarios
- `src/features/portfolio/attackArc.ts` — la geometría
- `src/features/portfolio/cyberAttackMap3D.guard.test.ts` — las guardas
