# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`P4.1 (cierre del hallazgo P4) — Exposición del corredor en la sección siem (el tramo profundo del atravieso de racks)`

## STATUS

`PASS` — el fix se validó con comparación NORMALIZADA por estado de cámara (mismo scrollY y misma profundidad del atravieso, no por reflow de layout): la exposición del canvas en el frame completo sube **+23% de brillo y +28% de cian (streams/vents)** con el contenido del dashboard intacto (bandas centrales estables, legibilidad verificada en captura).

## IMPLEMENTED

- **Causa raíz (hallazgo P4):** el tramo más profundo del atravieso (cámara entre los racks, S3 exit) coincide con la sección `siem`, cuyo dashboard usa `.glass` con `backdrop-filter: blur(12px)` — el corredor detrás de la tarjeta queda **desenfocado** — más un scrim al 30%. El momento se leía solo en los gutters y las transiciones.
- **Fix (`src/components/SIEMDashboard.tsx`, 2 cambios de clase):**
  1. Contenedor `max-w-6xl` → `max-w-4xl`: gutters más anchos con el canvas NÍTIDO a los lados (el blur solo cubre la tarjeta, no toda la sección).
  2. Scrim de la sección `bg-[#04080f]/30` → `/20` (excepción deliberada y comentada: esta sección ES el tramo del atravieso; el resto del sitio mantiene el 30% unificado del P0). Las tarjetas glass conservan su propio fondo para el texto — la legibilidad no depende del scrim.

## FILES CREATED

```
- docs/datacenter/reports/report-p4-1-siem-corridor-exposure.md
- artwork/living-datacenter/capture-siem-fix.mjs   (probe normalizado por estado de cámara)
```

## FILES MODIFIED

```
- src/components/SIEMDashboard.tsx   (max-w-4xl + scrim /20, con comentario de trazabilidad)
- docs/datacenter/CREATIVE-AUDIT.md  (cierre de la recomendación P4 en el changelog)
```

## DEPENDENCIES

`Ninguna nueva`.

## ARCHITECTURAL IMPACT

`LOW` — solo clases del contenedor de la sección; cero cambio de lógica, cámara o canvas. El scrim /20 es una excepción documentada (la sección que hostea el atravieso), el resto del sitio mantiene el 30% del P0.

## PERFORMANCE (deltas vs baseline de Fase 0)

| Métrica | Baseline | Actual | Delta | Objetivo (SPEC §31) |
| --- | --- | --- | --- | --- |
| FPS desktop | 60 | 60 | 0 | 60 |
| Draw calls | ~37 | ~45 (P1) | 0 | < 50 |
| Bundle 3D | ~230 KB gz | ~230 KB gz | 0 | < 3 MB assets |
| Contextos WebGL | 1 | 1 | 0 | 1 |

## ACCESSIBILITY

`STATUS: PASS` — sin cambio de estructura ni interacción; el contraste del contenido se validó (bandas centrales del frame estables antes/después, captura con texto legible). Canvas sigue `aria-hidden`.

## SECURITY / CSP

`STATUS: PASS` — cero red, cero assets externos, cero deps nuevas (SPEC §17).

## I18N

`STATUS: PASS` — sin texto nuevo (SPEC §14).

## COPILOT

`UNCHANGED`.

## TESTS

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 381 passed, 0 failed
npm run build      → OK
```

## GATE

`PASS` — typecheck 0 · tests 381/381 · lint 0 · build OK · navegador real sin errores nuevos (solo CORS de telemetría legítimo).

## VALIDACIÓN EN NAVEGADOR REAL (comparación NORMALIZADA, 1440×900, siem centrado = misma cámara z≈−2.65)

| Métrica del frame completo | Before (max-w-6xl, /30) | After (max-w-4xl, /20) | Delta |
| --- | --- | --- | --- |
| bright% (>60) | 6.9 | 8.5 | **+1.6pp (+23%)** |
| cyan% (streams/vents) | 5.54 | 7.08 | **+1.54pp (+28%)** |
| Gutter izquierdo (banda 0) | 25 | 29 | +4 |
| Gutter derecho (banda 11) | 23 | 25 | +2 |
| Centro (bandas 3–8, tarjeta) | 26–29 | 28–31 | estable (legibilidad intacta) |

Nota de método: la primera comparación (before→after sin normalizar) fue inválida porque el ancho del contenedor refluye el layout y el scrollY cambia la profundidad de cámara; el probe se reescribió para capturar en el MISMO estado de cámara (mismo scrollY 7056 y `deep: true` = los 10 hud-label a opacidad 0). El tramo profundo absoluto (exit, z≈−4.7) ya quedaba expuesto en la frontera siem→audit-hub; el fix ataca el tramo CENTRAL de la sección, que es donde el dashboard tapaba el corredor.

Capturas en `artwork/living-datacenter/refcheck/siem-fix/` (gitignored, convención del proyecto).

## NEXT PHASE

Recomendación P4 cerrada. Pendientes del audit: P6 re-bake de assets (lever real del realismo, requiere trabajo de asset externo — plan listo) · QA en dispositivo real sobre el preview · el resto de recomendaciones editoriales menores.

---

## DECISION ENGINE (scrim de siem /20 — ARCHITECTURAL impact LOW, excepción documentada)

Per CONSTITUTION §7.

**PROBLEM:** el dashboard de `siem` (glass con backdrop-blur) + scrim 30% tapaba el corredor durante el atravieso; bajar el scrim global a /20 en todo el sitio rompería la unificación del P0.

| Alternativa | Performance | Mantenibilidad | A11y | Seguridad | SEO | Complejidad | Bundle | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: bajar scrim global a /20 | 0 | alta (consistencia) | ok | ok | ok | nula | 0 | ok |
| B: fix local en siem (max-w-4xl + /20) (elegida) | 0 | alta (excepción comentada) | ok | ok | ok | nula | 0 | ok |
| C: quitar backdrop-blur del glass | 0 | media (estética glass del P0) | ok | ok | ok | baja | 0 | ok |

**DECISION:** `B`
**REASON:** el scrim /20 solo tiene sentido donde el canvas es protagonista del momento (siem = tramo del atravieso); global rompería la cohesión del P0. El blur se conserva (es la estética glass); el estrechamiento limita su área. C en el futuro si el corredor necesita leerse también DETRÁS de la tarjeta.
**MEASURED RESULT:** +23% brillo / +28% cian en el frame, gutters +4/+2, centro estable (legibilidad intacta), consola sin errores nuevos.
