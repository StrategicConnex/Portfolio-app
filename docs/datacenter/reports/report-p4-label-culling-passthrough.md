# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`P4 (audit de diseño) — Atravieso de racks (lección Hanwha) + cull de Html labels tras la cámara`

## STATUS

`PASS` — el cull se valida con dump de opacidades del DOM real (labels detrás del plano de cámara a opacidad 0, sin proyección espejada) y el atravieso llega hasta z=−4.7 entre las filas de racks. Cero dependencias nuevas, cero invariantes tocados.

## IMPLEMENTED

- **Cull de labels tras la cámara (`HudLabel.tsx`, SPEC §13/§32):** el `Html transform` de drei proyecta el DOM con transform espejada cuando el ancla queda DETRÁS del plano de cámara. Cada `HudLabel` ahora monta su ancla en un `<group ref>` (mundo real vía `updateWorldMatrix` + `getWorldPosition`) y en el `useFrame` existente calcula el coseno entre la dirección de la cámara y el vector hacia el ancla: opacidad plena hasta `LABEL_FADE_COS = 0.18` (~80° del eje de visión), fade lineal hasta 0 en el plano (nunca se pinta la proyección espejada), snap con `prefers-reduced-motion` (defensivo). Escritura directa a `style.opacity` sin setState (mismo patrón que el count-up, SPEC §32), vectores temporales compartidos sin allocations por frame.
- **Atravieso de racks en S3 (`scenes.ts`, SPEC §6/§20):** el push-in de P3 ahora CONTINÚA dentro del corredor — el exit pasa de `[0.8, 1.2, 1.6]` a `[1.1, 1.3, −4.7]` mirando `[0.3, 1.2, −8.5]` (fov 46): la cámara queda entre las filas 1 y 2 de racks (x=±2.6) con el pasillo recediendo en perspectiva. La cámara va a **x=1.1 (no x=0)** para no atravesar el slot del display SIEM (x=0, half-width 0.81, z=−2.0) ni la columna de anillos KPI (x=0, z=−1.6); los racks quedan a 1.0u de clearance. Durante el paso, los labels del HUD ceden al entorno (el dato se desvanece al pasar el plano — el copy del DOM lleva el mensaje en el tramo profundo).

## FILES CREATED

```
- docs/datacenter/reports/report-p4-label-culling-passthrough.md
- artwork/living-datacenter/capture-p4.mjs   (probe: regresión + dump de opacidades + capturas)
```

## FILES MODIFIED

```
- src/components/datacenter/HudLabel.tsx   (cull tras cámara: anchor group + facing opacity; helper puro exportado)
- src/components/datacenter/HudLabel.test.ts   (tests de labelFacingOpacity: fade angular + snap reduced-motion)
- src/lib/scenes.ts   (waypoint S3 exit con atravieso del corredor — data-driven, SPEC §6)
- docs/datacenter/CREATIVE-AUDIT.md   (fila Hanhwa §2.1 cumplida + entrada P4 en el changelog)
```

## DEPENDENCIES

`Ninguna nueva` — solo `THREE.Vector3` del three ya existente (SPEC §32, CONSTITUTION §5).

## ARCHITECTURAL IMPACT

`LOW` — cambio local en `HudLabel` (mecanismo de visibilidad) + waypoint data-driven en `scenes.ts`. Ningún invariante tocado: DOM-first, store `activeScene`, frame loop, Copilot, i18n. El `Html` conserva `zIndexRange={[30, 20]}` y `pointer-events: none`.

## PERFORMANCE (deltas vs baseline de Fase 0)

| Métrica | Baseline | Actual | Delta | Objetivo (SPEC §31) |
| --- | --- | --- | --- | --- |
| FPS desktop | 60 | 60 | 0 | 60 |
| Draw calls | ~37 | ~45 (P1) | 0 | < 50 |
| Bundle 3D | ~230 KB gz | ~230 KB gz | **0** | < 3 MB assets |
| Contextos WebGL | 1 | 1 | 0 | 1 |
| Alocaciones/frame | 0 | 0 | 0 (vectores compartidos) | sin growth |

## ACCESSIBILITY

`STATUS: PASS` — el cull es funcional (correctitud de proyección), no movimiento narrativo: el fade angular usa una ventana corta y con `prefers-reduced-motion` pasa a snap. Canvas sigue `aria-hidden`; los labels son DOM decorativo sin anuncio. Suite completa 381/381 (3 tests nuevos del cull).

## SECURITY / CSP

`STATUS: PASS` — cero red, cero assets externos, cero deps nuevas (SPEC §17). Sin cambios en CSP.

## I18N

`STATUS: PASS` — sin texto nuevo; el cull es mecanismo de visibilidad, no contenido (SPEC §14).

## COPILOT

`UNCHANGED`.

## TESTS

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 381 passed, 0 failed (3 nuevos: labelFacingOpacity)
npm run build      → OK (compiled successfully)
```

## GATE

`PASS` — typecheck 0 · tests 381/381 · lint 0 · build OK · navegador real sin errores nuevos (solo CORS de telemetría legítimo, pre-existente y documentado).

## VALIDACIÓN EN NAVEGADOR REAL (probe `capture-p4.mjs`, 1440×900)

**Cull — dump de opacidades de `[data-testid=hud-label]` en el tramo S3:**

| Posición | Estado | Lectura |
| --- | --- | --- |
| S3-mid (frente a la columna de anillos) | 10 labels a opacidad plena (0.78/0.92) | HUD completo antes del paso ✓ |
| S3-pass (cruzando el plano del título) | título `FASE 03/05 · DATOS EN MOVIMIENTO` a **0**, anillos y SIEM·SOC aún 0.78 | fade angular mid-flight: el label cede al pasar ✓ |
| S3-deep (fondo del corredor, z=−4.7) | **10/10 labels a opacidad 0** | corredor puro, cero proyección espejada ✓ |

**Atravieso — canvas puro del tramo profundo (1440×900):** 3.46% píxeles cian (streams + vent tiles), rack de la fila izquierda iluminado en el tercio superior (perfil 43-40-34-35-39 vs 21-25 a la derecha), glow del plenum en el centro-bajo (40-41) — la composición "dentro del pasillo entre las filas" se lee a distancia de cámara.

**Frontera S4 (evidencia visual):** en la transición siem→audit-hub el canvas queda expuesto con el beacon dorado + HudLabel `AUDIT HUB` sobre el storage — el pull-back del corredor aterriza limpio en la escena de resiliencia.

**Regresión por escena (darkPct p3 → p4):** S1 84.7 → 84.7 (idéntico) · S2 94.6 → 94.5 (byte-cercano) · S4 71.0 → 72.2 (varianza de run) · S5 97.2 → 97.3 (byte-cercano) · S3 83.6 → 91.0 — más oscuro porque el punto de captura representativo (`siem` centrado) ahora cae más profundo en el corredor (el tramo de cámara se extendió), cambio esperado, no regresión.

Capturas y dumps en `artwork/living-datacenter/refcheck/p4-passthrough/` (gitignored, convención del proyecto).

## NEXT PHASE

P0–P4 del audit completados. **Recomendación (no bloquea):** el tramo más profundo del atravieso coincide con la sección `siem` cuyo dashboard (max-w-6xl translúcido) cubre el centro del viewport — el momento se lee en los gutters, en las transiciones de sección y en la frontera a S4; adelgazar la tarjeta del dashboard (o mover el dive a un tramo con contenido más liviano) expondría más corredor. Queda como decisión editorial, siguiendo el patrón de hallazgos honestos de P3.

---

## DECISION ENGINE (ruta del atravieso — ARCHITECTURAL impact LOW, documentada por trazabilidad)

Per CONSTITUTION §7.

**PROBLEM:** el atravieso de racks pedía cámara con z < −2.5 (dentro del corredor), pero el corredor no es un tubo vacío: el display SIEM cuelga en x=0 (z=−2.0, half-width 0.81) y la columna de anillos KPI está en x=0 (z=−1.6). Una ruta por el eje x=0 atravesaría el display (clip visible) y los anillos.

| Alternativa | Performance | Mantenibilidad | A11y | Seguridad | SEO | Complejidad | Bundle | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: ruta por x=0 (eje del corredor) | 0 | alta | ok | ok | ok | nula | 0 | ok |
| B: ruta por x=1.1 con cull de labels (elegida) | 0 (sin alocaciones) | alta (helper puro + waypoint data-driven) | ok (snap con reduce) | ok | ok | baja | 0 | ok |
| C: reubicar display/anillos para dejar el eje libre | 0 | media (tocar layout validado G4/ASSET-SCENE-MAP) | ok | ok | ok | media | 0 | ok |

**DECISION:** `B`
**REASON:** x=1.1 deja clearance ≥0.35u del display (0.81 half-width) y 1.0u de los racks, mantiene la asimetría de tercios del P3 (el pasillo recede en tres cuartos, lección Hanwha) y no toca el layout validado de los slots. El cull de labels es además el fix del bug de proyección espejada que P3 había diferido — cierra el pendiente documentado.
**MEASURED RESULT:** dump de opacidades prueba que los labels detrás del plano quedan a 0 (S3-deep 10/10); canvas del tramo profundo con streams cian y rack iluminado (3.46% cian); S1/S2/S5 sin regresión; consola sin errores nuevos.
