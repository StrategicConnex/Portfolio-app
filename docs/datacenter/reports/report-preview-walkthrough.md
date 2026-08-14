# Reporte — Recorrido visual del preview (comparación P0→P4.1)

## PHASE

`Validación de paridad — los 7 commits del audit de diseño (P0→P4.1) contra el estado del preview deployado`

## STATUS

`PASS (con limitación de acceso documentada)` — el preview deployado es **exactamente** los 7 commits (deployment `success` para el SHA `afa5aff`, el HEAD de la serie) y el recorrido visual por escena verifica **cada artefacto por fase** sobre el build idéntico. El preview está protegido por SSO de Vercel (verificado: 302 → `vercel.com/sso-api`) — no es capturable sin login; el recorrido se ejecutó sobre el build local (git-clean, mismo código).

## PARIDAD (los 7 commits → deploy)

| SHA | Commit | En preview |
| --- | --- | --- |
| `1440184` | P0 — paleta unificada + rim light + vignette + editorial DOM | ✅ (deployment `success` para `afa5aff` = serie completa) |
| `15e6ec9` | P1 — materialidad: env por tier, lightformers, losetas, vent tiles, contact shadows | ✅ |
| `08bac62` | P2 — Phase Gate (firma del sitio, tint por fase) | ✅ |
| `f96da25` | P3 — cinematografía: encuadre asimétrico + push-in | ✅ |
| `6bda867` | P4 — atravieso de racks + cull de labels | ✅ |
| `deadd78` | P5 — materialidad GLB (investigación, código revertido) | ✅ (sin cambio visual, docs) |
| `afa5aff` | P4.1 — exposición del corredor en siem | ✅ HEAD del preview |

Verificado vía API: `GET /commits/afa5aff/status` → `state: success` (Vercel). El deploy `AR1AVADxuczUskKVcRYicsLQGwDc` se construyó del HEAD exacto de la serie.

## ACCESO AL PREVIEW

- URL branch-style: `https://juanpalacios-git-feat-living-datacenter-strategicconnex.vercel.app` → **302 a `vercel.com/sso-api`** (autenticación de Vercel activada en previews). No capturable sin sesión; el usuario logueado la ve desde el dashboard de deployments (`vercel.com/strategicconnex/juanpalacios/AR1AVADxuczUskKVcRYicsLQGwDc` → "Visit").
- **Producción** (`juanpalacios.vercel.app`, 200 público) NO tiene los 7 commits (son de la feature branch) — el recorrido visual acá documenta el delta que el preview añade cuando se fusione.

## RECORRIDO VISUAL POR ESCENA (build local idéntico — `walkthrough-preview.mjs`, 1440×900)

| Escena | Fase (Phase Gate) | Tint del gate | Artefacto del commit verificado | dark% | cian% |
| --- | --- | --- | --- | --- | --- |
| S1 boot | `boot` | `rgb(77,163,255)` = **#4DA3FF** (P0 paleta) | simetría de la tesis + rim light + tint azul | 84.7 | 4.54 |
| S2 core | `architecture` | `rgb(56,189,248)` sky | encuadre asimétrico (tercios, P3) — 16 labels HUD | 94.5 | 2.63 |
| S3 data | `data-in-motion` | `rgb(34,211,238)` = **cian** | push-in + atravieso (P4) — 10 labels, corredor | 79.7 | 8.25 |
| S4 resilience | `resilience` | `rgb(245,158,11)` = **ámbar** | fit G4 storage + tint ámbar (P1/P3) | 71.4 | 8.72 |
| S5 connection | `connection` | `rgb(232,213,172)` = **champagne** | reveal diagonal (P3) — clímax | 97.2 | 0.84 |

**Checks específicos:**
- **P4 atravieso:** en el fondo del corredor los **10/10 labels a opacidad 0** (convergencia en 3 pasos de scroll) — cull sin proyección espejada ✓
- **P4.1 corredor en siem:** frame con el dashboard centrado: cian 4.21% en pantalla completa, gutters 18/24 (el canvas se lee a los lados del glass) ✓
- **Consola:** solo el CORS de telemetría legítimo (5 errores, pre-existente y documentado) — cero errores de React/WebGL ✓

Capturas en `artwork/living-datacenter/refcheck/preview-walkthrough/` (gitignored).

## GATE

`PASS` — paridad confirmada (deployment success del SHA exacto), todos los artefactos de las 7 fases verificados en el build idéntico, consola limpia.

## NOTA

Para verlo con tus propios ojos en el deploy real: abrí el dashboard de deployments y "Visit" (estás logueado en Vercel). Si querés que automatice las capturas del preview real, `npx vercel login` una vez en tu terminal y resuelvo la URL pública de cada deploy sin fricción (y si preferís abrir el preview al mundo, Vercel → Project Settings → Deployment Protection → desactivar la autenticación para previews).
