# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`P3 (audit de diseño) — Cinematografía: encuadre asimétrico (regla de tercios) y push-in de profundidad` + intentos medidos y rechazados (DoF postprocessing, pulido close-up)

## STATUS

`PASS` — composición validada en navegador real; los dos intentos extra (DoF real y pulido de luz) se **midieron y se rechazaron** por evidencia (no por fe); cero dependencias nuevas.

## IMPLEMENTED

- **Encuadre asimétrico por escena** (`scenes.ts`, SPEC §3 — la lección iyO/NRG "el sujeto no vive en el centro"):
  - **S2 architecture:** la cámara deriva a la derecha y el pasillo recede a la izquierda — el sujeto (corredor + Purdue) ocupa el tercio izquierdo, espacio negativo a la derecha para el copy del DOM.
  - **S3 data-in-motion:** push-in más profundo — la cámara avanza hasta z=1.6 (delante de la columna de anillos KPI en z=-1.6, que quedan en frame bajo) mirando a lo largo del pasillo: el "close-up con rack focus" del mapa narrativo §5 con más profundidad. **Sin** atravesar los racks (z<−2.5): los Html labels quedarían detrás de la cámara (proyección espejada) — diferido hasta resolver la oclusión de labels (documentado, no bloqueado).
  - **S5 connection:** reveal **diagonal** — la cámara sube desde x=0 y se desplaza a x≈1.6 mirando a x≈−0.8: ambas filas de racks en perspectiva cruzada (líneas de fuga), espacio negativo para el CTA.
  - **S1/S4 intactos a propósito:** S1 es el reveal simétrico (tesis del boot) y S4 tiene el fit del storage validado por el gate G4.
- **Intentos medidos y descartados (evidencia, no opinión):**
  - **DoF cinematográfico** (postprocessing 6.39 + @react-three/postprocessing 3.0.5, ULTRA-gated con dynamic import): el pipeline del composer **funciona** (verificado con Vignette: bordes 19→17.4 de luminancia) pero el pass de `DepthOfField` es un **no-op verificado** en este entorno — probado con `bokehScale=12`, `target` Vector3 y mutación directa de `focusDistance` (unidades de mundo): varianza de Laplaciano idéntica en 4 bandas (23.23 vs 23.71 / 11.32 vs 11.61 / 13.23 vs 13.30). El shader lee `focusDistance`/`focusRange` como uniforms con inicial `0` y el tipo no los expone en la clase (gap de types). Sin errores en consola: falla silenciosa de los passes dependientes de depth texture. **Se revirtió** (dependencia eliminada — el bundle 3D no carga ~50 KB gz muertos).
  - **Pulido "opción A" del P2** (tira cálida S4 0.55→0.75, vents 0.22→0.18): aplicado y **medido sin efecto** en los crops controlados — storage cálido 2.7%→2.7%, piso S1 sat 0.734→0.733. La lectura cálida del storage está limitada por el albedo/materialidad del GLB (no por intensidad de luz) y la saturación del piso la domina el tinte del Phase Gate. **Revertido.**

## FILES CREATED

```
Ninguno (el CinematicDoF.tsx de prueba se eliminó; ver DEPENDENCIES)
```

## FILES MODIFIED

```
- src/lib/scenes.ts   (waypoints asimétricos S2/S3/S5 — data-driven, SPEC §6)
```

## DEPENDENCIES

`Ninguna nueva` — se instaló `@react-three/postprocessing` + `postprocessing` para el intento DoF y se **desinstaló** al rechazarlo (package.json/lock restaurados a HEAD, verificado). CONSTITUTION §5 respetada.

## ARCHITECTURAL IMPACT

`LOW` — cambio data-driven en waypoints (SPEC §20: "la cámara interpola entry→mid→exit por escena; nada de if section === …"). Ningún invariante tocado (DOM-first, store, frame loop, Copilot).

## PERFORMANCE (deltas vs baseline de Fase 0)

| Métrica | Baseline | Actual | Delta | Objetivo (SPEC §31) |
| --- | --- | --- | --- | --- |
| FPS desktop | 60 | 60 | 0 | 60 |
| Draw calls | ~37 | ~45 | +8 (P1) | < 50 |
| Bundle 3D | ~230 KB gz | ~230 KB gz | **0 (sin postprocessing)** | < 3 MB assets |
| Contextos WebGL | 1 | 1 | 0 | 1 |

## ACCESSIBILITY

`STATUS: PASS` — composición 3D decorativa (canvas `aria-hidden`); sin cambios DOM; suite axe completa en `npm test` (378/378).

## SECURITY / CSP

`STATUS: PASS` — cero red, cero assets externos, cero deps nuevas (SPEC §17).

## I18N

`STATUS: PASS` — sin texto nuevo; cámara universal (SPEC §14).

## COPILOT

`UNCHANGED`.

## TESTS

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 378 passed, 0 failed
npm run build      → OK (compiled + static pages)
```

## GATE

`PASS` — typecheck 0 · tests 378/378 · lint 0 · build OK · navegador real sin errores nuevos (solo CORS de telemetría legítimo).

## VALIDACIÓN EN NAVEGADOR REAL (composición, p2 → p3 final)

| Escena | darkPct p2 → p3 | Lectura |
| --- | --- | --- |
| S1 boot | 84.7 → 84.7 | **intacta** (simetría de la tesis ✓) |
| S2 core | 94.9 → 94.6 | reencuadre asimétrico (tercios) ✓ |
| S3 data | 91.0 → 83.6 | **push-in**: más corredor iluminado en frame ✓ |
| S4 resilience | 73.6 → 71.0 | **intacta** (fit G4 ✓, varianza de run) |
| S5 connection | 97.2 → 97.2 | reveal diagonal con pull-back ✓ |

Capturas en `refcheck/p3-after/`.

## NEXT PHASE

P0 · P1 · P2 · P3 del audit completados. Recomendaciones pendientes (no bloquean): la materialidad del GLB del storage (roughness/metalness) es el lever real del "cálido S4"; el atravieso de racks (Hanwha) requiere resolver la oclusión de Html labels; el DoF real necesita una versión de postprocessing cuyo DepthOfField funcione con `frameloop="demand"` (o validación en hardware real con GPU). Commit del thread sin push en `feat/living-datacenter` (P0 `1440184`, P1 `15e6ec9`, P2 `08bac62`, P3 siguiente).

---

## DECISION ENGINE (DoF postprocessing — ARCHITECTURAL impact MEDIUM por dep)

Per CONSTITUTION §7.

**PROBLEM:** SPEC §3 pide "profundidad de campo cinematográfica", pero el DepthOfField de postprocessing 6.39 (con @react-three/postprocessing 3.0.5) es un no-op verificado en este entorno con `frameloop="demand"` — incluso con bokeh 12, target Vector3 y mutación directa de focusDistance. El composer funciona (Vignette probado), el efecto no.

| Alternativa | Performance | Mantenibilidad | A11y | Seguridad | SEO | Complejidad | Bundle | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: DoF postprocessing (dep ~50 KB gz ULTRA-only) | no-op medido → costo sin beneficio | media (gap de types) | ok | ok (local) | ok | media | +50 KB gz | no aplica (ULTRA) |
| B: profundidad con fog + vignette + rim existentes | 0 | alta | ok | ok | ok | nula | 0 | ok |
| C: TiltShift (blur por pantalla, sin profundidad real) | funciona (pass simple) | media | ok | ok | ok | baja | +50 KB gz | no aplica |

**DECISION:** `B` — no se shipea un efecto no validado (SPEC §37); la profundidad existente (fog por escena + vignette z-30 + rim light) ya da la lectura de distancia. 
**REASON:** el DoF real no se puede verificar en este entorno (sin errores, sin efecto — falla silenciosa de passes de depth texture); shipearlo violaría el gate. El lever honesto para el "cine" es la materialidad (PBR de los GLB), no un post-process dependiente de depth.
**MEASURED RESULT:** sin postprocessing, S3 gana −7.4pp de oscuridad por composición pura; bundle 3D sin peso muerto; el intento queda documentado con su evidencia para retomarlo si una versión del lib lo resuelve o se valida en hardware con GPU.
