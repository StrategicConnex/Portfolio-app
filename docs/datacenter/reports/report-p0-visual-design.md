# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`P0 (post-audit CREATIVE-AUDIT) — Cohesión visual, paleta unificada y rim light`

## STATUS

`PASS`

## IMPLEMENTED

- **Fondo unificado DOM↔3D (P1 del diagnóstico):** `--bg: #04080F` en `globals.css` = `DATACENTER_TOKENS.colors.bg` del canvas; `--bg2: #070D18`; `StaticPoster` y `screenUiTexture` al mismo base. Los scrims de secciones bajan de 45–50% a 30% (`rgba(4,8,15,0.30)` / `bg-[#04080f]/30`) en Perfil, Stack, Arquitectura, Certificaciones, TrustBadges, Experiencia, Blog y SIEMDashboard → el canvas 3D respira detrás del contenido en todo el recorrido (lección Noomo del audit). Blur-en-cards diferido: backdrop-filter full-screen en móvil viola el Performance Contract — el scrim 30% logra la lectura sin costo.
- **Paleta instrumental (P2):** azul dodger `#1E90FF` → `#4DA3FF` (mismo hue, menos chroma) y dorado `#C5A46D` → champagne `#E8D5AC`. Barrido de literales: 3D (emissives de ServerRackPool/ServerSwitchPool/GlbMesh, grid del floor), DOM (Hero, Navbar, SectionHeader, ask-ai launcher/header/panel, Perfil, Stack, Experiencia, TrustBadges, Certificaciones, Contacto, Proyecto, Blog, SCAudit, RadarSweep), datos (experiencia, mindmap) y template del email de contacto. Texto: `--text #F4F7FB`, `--muted-foreground #8FA6C2` (azulado, no slate genérico).
- **Rim light por escena (P3):** directional `[6, 4, -12]` en `SceneLighting` con intensidad por escena (S1 0.55 · S2 0.4 · S3 0.3 · S4 0.7 · S5 0.95), lerp con el mismo driver λ=3.0. Recorta los racks/chasis del fondo oscuro — ataca el look de "cuadrados" sin tocar geometría.
- **Vignette cinematográfica (P0.3):** `body::after` fijo z-30 (sobre canvas z-20, bajo contenido z-40), `pointer-events: none`, radial `rgba(1,4,8,0.55)` al 52%+. Estática — segura para `prefers-reduced-motion`.
- **Editorial DOM (P0.4):** utilities `.eyebrow` (mono teletipo 0.28em) y `.hairline`; `SectionHeader` compartido (eyebrow mono + título `clamp(1.9rem,3.8vw,3rem)` con `-0.03em`); Hero (título a `clamp(2.6rem,5vw,4.4rem)` en lg, acentos vía `var(--blue)`); Navbar (progress bar, links activos, language switcher con `var(--blue)`).

## FILES CREATED

```
- artwork/living-datacenter/capture-p0.mjs      (probe playwright+sharp: capturas por escena)
- artwork/living-datacenter/refcheck/p0-before/ (S1-S5-before.png + result.json)
- artwork/living-datacenter/refcheck/p0-after/  (S1-S5-after.png + result.json)
- docs/datacenter/reports/report-p0-visual-design.md
```

## FILES MODIFIED

```
- src/lib/datacenter.tokens.ts        (bg #04080f, primaryCold #4DA3FF, gold #E8D5AC)
- src/app/globals.css                 (vars de paleta, vignette, .eyebrow/.hairline, editorial base)
- src/components/datacenter/SceneLighting.tsx  (rim light por escena)
- src/components/datacenter/StaticPoster.tsx   (bg al base unificado)
- src/components/datacenter/screenUiTexture.ts (bg al base unificado)
- src/components/datacenter/ServerRackPool.tsx / ServerSwitchPool.tsx / GlbMesh.tsx / DatacenterFloor.tsx (emissive/grid → #4DA3FF)
- src/components/ui/SectionHeader.tsx (eyebrow .eyebrow + escala display)
- src/components/Hero.tsx / Navbar.tsx (escala display, acentos var(--blue))
- src/components/{Perfil,Stack,Experiencia,TrustBadges,Certificaciones,Contacto,Proyecto,Blog,SIEMDashboard,Arquitectura}.tsx (scrims 30% + paleta)
- src/components/ask-ai/{AskAILauncher,AskAIHeader,AskAIPanel}.tsx (dorado → champagne)
- src/components/RadarSweep.tsx / SCAudit.tsx / DatacenterExperience.tsx (paleta)
- src/data/experiencia.ts / src/data/mindmap.ts (paleta)
- src/app/api/contact/route.ts (template email → paleta)
- src/lib/utils.test.ts (expect actualizado al nuevo azul)
```

## DEPENDENCIES

`Ninguna nueva` — cero deps; solo CSS, data y tokens (CONSTITUTION §5).

## ARCHITECTURAL IMPACT

`LOW` — solo capa de dirección de arte (tokens/CSS/data + 1 luz). No toca invariantes: DOM-first, capas Z, Copilot (solo colores), CSP (sin assets), frameloop demand.

## PERFORMANCE (deltas vs baseline de Fase 0)

| Métrica | Baseline | Actual | Delta | Objetivo (SPEC §31) |
| --- | --- | --- | --- | --- |
| FPS desktop | 60 | 60 (sin cambio de carga) | 0 | 60 |
| Draw calls | ~37 | ~38 (rim = 1 directional, 0 meshes) | +1 | < 50 |
| DPR | 1–2 adaptativo | 1–2 | 0 | 1–2 |
| Bundle (JS 3D) | sin cambio | sin cambio | 0 | < 3 MB assets |
| Contextos WebGL | 1 | 1 | 0 | 1 (0 en STATIC) |
| Captura S1 (meanLum) | 22.4 | 24.9 | +2.5 | — |
| Captura S4 (dark%) | 90.4 | 77.4 | −13.0 pp | — |

## ACCESSIBILITY

`STATUS: PASS` — suite axe completa en `npm test` (incl. `accessibility.test.tsx`); vignette es `::after` no-accesible con `pointer-events: none` y estática (reduced-motion OK); contraste mejorado (texto `#F4F7FB` sobre `#04080F`, champagne/azul más claros que los anteriores). Canvas intacto (`aria-hidden`).

## SECURITY / CSP

`STATUS: PASS` — sin violaciones; cero assets externos nuevos; solo colores locales/data (SPEC §17, R5).

## I18N

`STATUS: PASS` — sin claves nuevas ni cambios de texto visible (el texto del hero y secciones queda intacto).

## COPILOT

`MODIFIED VISUALLY` — solo colores CSS (gold→champagne en launcher/header/panel); lógica, streaming, z-index 50 y estado intactos (R4). Probado en browser real en el thread (a261632) y sin cambios aquí.

## TESTS

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 372 passed, 0 failed (46 files) — 1 expect actualizado al nuevo azul
npm run build      → OK (prerendered static + dynamic)
npx playwright     → capture-p0.mjs (navegador real, WebGL, 5 escenas antes/después)
```

## GATE

`PASS` — evidencia de comparación por escena (real browser, 1440×900):

| Escena | meanLum before→after | dark% before→after | meanSat before→after |
| --- | --- | --- | --- |
| S1 boot | 22.4→24.9 | 91.1→86.4 | 0.750→0.705 |
| S2 core | 13.7→12.8 | 96.8→95.2 | 0.615→0.660 |
| S3 data | 20.9→21.3 | 92.8→92.5 | 0.726→0.672 |
| S4 resilience | 23.8→28.3 | **90.4→77.4** | 0.702→0.647 |
| S5 connection | 25.0→16.9 | 96.9→97.3 | 0.588→0.695 |

Lectura: S4 (el storage ámbar) pasa de 90% oscuridad a 77% — el rim + scrim bajo hacen legible el nivel inferior; saturación general baja (menos neón en reposo, SPEC §3) y S5 gana croma champagne. Consola sin errores nuevos (solo CORS de telemetría legítimo, ya documentado).

## NEXT PHASE

`P1 materialidad` — env map 1024 en ULTRA + Lightformers extra, losetas de raised floor instanciadas, ContactShadows para storage/switch. Opcional luego: `P2 Phase Gate` (overlay z-30 tintado por fase activa).

---

## DECISION ENGINE

No aplica — ARCHITECTURAL IMPACT LOW.

## ESCALATION

No aplica — STATUS PASS.
