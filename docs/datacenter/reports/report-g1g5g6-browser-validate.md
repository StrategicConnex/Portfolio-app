# Report — Validación en navegador real de G1 · G5 · G6 (gaps SAFE)

**Fecha:** 2026-08-11 · **GATE: ✅ PASS** · **Origen:** CREATIVE-AUDIT §5 (gaps SAFE G1/G5/G6) · **Clase:** VALIDACIÓN (probe `artwork/living-datacenter/verify-safe-gaps.mjs`, reproducible, sin dependencias nuevas)

## IMPLEMENTED (verificación)

Probe de navegador real (Playwright + sharp, Chrome, viewport 1440×900, build `next start` en 3100) que por cada una de las 5 escenas: scrollea a la sección DOM ancla, espera el asentamiento del spring de cámara (3.5s), captura `refcheck/gaps-S{n}.png` y verifica:

- **G1 — Fase en HUD:** texto `FASE 0n/05` (es) / `PHASE 0n/05` (en) presente en el DOM del HUD de escena (`[data-testid="hud-label"]`). S1-boot se valida por status labels (boot no lleva fase por diseño — son status, no scene).
- **G5 — Clearcoat en GLB hero:** análisis de píxeles de la captura del rack hero (S1, scroll 600): pico especular (luminancia >185) en zona central sobre base oscura.
- **G6 — Editorial DOM:** computed styles del DOM real: h1 presente, h2 con `clamp()`, eyebrow mono + tracking 0.3em + uppercase, pill del hero font-mono.
- **Dirección de arte (SPEC §3):** histograma por escena — % oscuro, % neón fuera del token (alienígena: magenta/rojo/verde puro = anti-patrón gamer) y presencia de acentos del sistema (cian/dorado).

## RESULTADOS

**G1 ✅ (es y en):**
| Escena | Esperado | En HUD |
|---|---|---|
| S1-boot | (status, sin fase) | ✅ INICIALIZANDO SISTEMA / RED EN LÍNEA / NÚCLEO IA LISTO |
| S2-core | FASE 02/05 | ✅ |
| S3-data | FASE 03/05 | ✅ |
| S4-resilience | FASE 04/05 | ✅ |
| S5-connection | FASE 05/05 | ✅ |

Cambio de idioma es→en en runtime (toggle del Navbar, sin recargar): HUD S3 muestra **`PHASE 03/05` + `DATA IN MOTION`** — i18n en vivo sin reconstruir el mundo 3D (SPEC §13).

**G5 ✅:** highPct 0.07 (píxeles >185 lum en zona rack) · meanLum 22.5 (base oscura) — highlight especular del clearcoat 0.25/0.35 presente sobre chasis oscuro. Consistente con el acabado industrial (dirección iyO/NRG, no plástico).

**G6 ✅:** h1 ✅ · h2 "Perfil Profesional" fontSize **41.6px** (clamp 1.75→2.6rem activo) · eyebrow "Sobre mí" **JetBrains Mono**, letterSpacing **3.264px** (= 0.3em), **uppercase** · pill hero "Protocolo IT/OT · Ciberseguridad" **JetBrains Mono** (10px, tracking 4px).

**Dirección de arte ✅ (por escena):**
| Escena | Dark% | Neon token% | Alien% | Acentos |
|---|---|---|---|---|
| S1-boot | 88.3 | 4.1 | 0.003 | cian 2074 · dorado 4946 |
| S2-core | 97.1 | 0.29 | 0 | cian 2307 · dorado 5355 |
| S3-data | 82.9 | 1.36 | 0.002 | cian 376 · dorado 11548 |
| S4-resilience | 75.8 | 7.3 | 0 | cian 800 · dorado 15723 |
| S5-connection | 97.3 | 0.07 | 0 | cian 869 · dorado 717 |

Base oscura premium (76-97% píxeles <40 lum) · neón alienígena ~0 (anti-patrón gamer ausente) · acentos SOLO del token. El neón alto en S3/S4 es dorado/ámbar de estado (streams + storage + DOM), legítimo según SPEC §3. Nota: el detector cuenta el verde-cian de los LEDs de estado del hardware real (rgb ~16,162,119) como token (hue 150-245) — decisión documentada en el probe.

**Consola:** 5 errores CORS del telemetry legítimo existente (`scaudit.vercel.app/api/telemetry/vitals`, ObservabilityProvider — tráfico de la app, no del 3D; R5). Errores reales (3D/React): **0**.

## FILES CREATED

- `artwork/living-datacenter/verify-safe-gaps.mjs` (probe reproducible; `node verify-safe-gaps.mjs [base] [es|en]`)
- Capturas `refcheck/gaps-S1..S5.png`, `gaps-hero-rack.png`, `gaps-hero-top.png`, `gaps-en-S3.png`
- Resultado JSON `refcheck/gaps-result.json`

## FILES MODIFIED

- Ninguno en `src/` — validación pura, sin cambios de código.

## DEPENDENCIES

- Ninguna nueva (playwright + sharp ya usados por los probes del repo).

## ARCHITECTURAL IMPACT

**LOW** — probe de QA standalone, no toca runtime ni bundle.

## PERFORMANCE

- Sin impacto en el sitio (probe externo). Build previo validado.

## ACCESSIBILITY

- Canvas decorativo intacto; el HUD (DOM del Html transform) se verifica con su contenido real en runtime.

## SECURITY/CSP

- Sin requests nuevos: el probe solo navega al sitio local; los únicos errores son el CORS de telemetry ya existente.

## I18N

- Verificado en vivo: es → en cambia el HUD sin reconstruir el 3D (SPEC §13).

## COPILOT

- **UNCHANGED**

## TESTS

- Probe e2e en navegador real: 5 escenas × (G1 + captura + arte) + G5 + G6 + i18n EN.

## GATE

**PASS** — G1 ✅ · G5 ✅ · G6 ✅ · dirección de arte ✅ · consola sin errores reales ✅.

## NEXT

G3 (datos encarnados tipo Mastercard) sigue siendo el único gap ARCHITECTURAL pendiente del audit.
