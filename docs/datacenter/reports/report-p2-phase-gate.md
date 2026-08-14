# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`P2 (audit de diseño) — Phase Gate: temperatura de color por fase como firma del sitio` + validación de materialidad de cerca (losetas / vent tiles / reflejos env)

## STATUS

`PASS` — arco de temperatura verificado en navegador real (azul → cian → ámbar → champagne) y detalle de materialidad P1 legible a distancia de cámara real.

## IMPLEMENTED

- **Phase Gate (firma del sitio):** overlay DOM fijo en `z-index: 30` (bajo el contenido Z-40, sobre el canvas Z-20), `pointer-events: none`, `aria-hidden`, que tiñe el frame con la temperatura de color de la fase activa. 5 capas full-bleed (una por fase) con gradiente radial de fase (centro casi limpio `0.02`, borde `edgeAlpha` 0.16→0.26) que cruzan por opacidad (`transition: opacity 700ms`) → el cambio de fase es un crossfade con temperatura intermedia (SPEC §3).
- **Sincronización con el store `activeScene`** (SPEC §13): `useActiveScene()` vía `useSyncExternalStore` → re-render solo al cruzar de escena; el frame loop y el DOM no se tocan. `PHASE_TINTS` en `datacenter.tokens.ts` (data-driven, orden = índice del store 0-4): boot `#4DA3FF` → architecture `#38bdf8` → data-in-motion `#22d3ee` → resilience `#f59e0b` → connection `#E8D5AC`.
- **Reduced-motion:** transición anulada por `@media (prefers-reduced-motion: reduce)` y por la prop `reduced` del toggle manual; en tier STATIC el gate no se monta (el poster conserva su temperatura estática).
- **Montaje:** `PhaseGate` en `DatacenterExperience`, solo cuando el canvas está vivo (`canvasActive`) — nunca hay tinte sobre el poster.
- **Validación de materialidad de cerca (este turno):** `capture-closeup.mjs` — capturas full-frame a `deviceScaleFactor 2` (2880×1800) en S1 y S4 + crops zoom 2×/4× con métricas de legibilidad (bordes de loseta por scanline, perfil de exceso cian por bucket para los vents, spot especular del env map).

## FILES CREATED

```
- src/components/datacenter/PhaseGate.tsx        (overlay z-30, crossfade por capas)
- src/components/datacenter/PhaseGate.test.tsx   (6 tests: helper, capas, store, a11y, reduced)
- artwork/living-datacenter/capture-closeup.mjs  (capturas zoom + métricas de legibilidad)
```

## FILES MODIFIED

```
- src/lib/datacenter.tokens.ts   (PHASE_TINTS: temperatura y edgeAlpha por fase)
- src/app/globals.css            (.phase-gate / .phase-gate-layer + media query reduce)
- src/components/datacenter/DatacenterExperience.tsx  (montaje del gate con canvas activo)
- docs/datacenter/CREATIVE-AUDIT.md  (estado P2 + validación de cerca)
```

## DEPENDENCIES

`Ninguna nueva` — overlay DOM puro + tokens existentes; cero deps runtime (CSP §17 intacta).

## ARCHITECTURAL IMPACT

`LOW` — capa de dirección de arte aditiva sobre la arquitectura Z-10/20/30/40 existente (la vignette `body::after` ya vivía en Z-30 y compone con el tinte). Ningún invariante tocado (DOM-first, store `activeScene`, frame loop, Copilot).

## PERFORMANCE (deltas vs baseline de Fase 0)

| Métrica | Baseline | Actual | Delta | Objetivo (SPEC §31) |
| --- | --- | --- | --- | --- |
| FPS desktop | 60 | 60 | 0 | 60 |
| Draw calls | ~37 | ~45 | +8 (P1) | < 50 |
| Re-renders DOM | — | solo al cruzar de escena | 0 por frame | — |
| Capas extra | — | 5 divs estáticos (GPU compose) | +1 compositing layer | — |
| Contextos WebGL | 1 | 1 | 0 | 1 |

## ACCESSIBILITY

`STATUS: PASS` — `aria-hidden` + `pointer-events: none` (puramente decorativo); transición desactivada con `prefers-reduced-motion: reduce` y con el toggle manual; sin cambios de contraste sobre el DOM (Z-40); suite axe completa en `npm test` (378/378).

## SECURITY / CSP

`STATUS: PASS` — cero red, cero assets externos; overlay DOM con colores de tokens; sin `unsafe-eval` nuevo (SPEC §17).

## I18N

`STATUS: PASS` — el gate es visual (sin texto); el arco de temperatura es universal (SPEC §14).

## COPILOT

`UNCHANGED` — ninguna interacción con la lógica ni la capa visual del Copilot (z-50 intacto).

## TESTS

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 378 passed, 0 failed (6 nuevos: PhaseGate.test.tsx)
npm run build      → OK (compiled + static pages)
```

## GATE

`PASS` — gate de la fase (IMPLEMENTATION_PLAN §4): typecheck 0 · tests 378/378 · lint 0 · build OK · navegador real sin errores nuevos (solo el CORS de telemetría legítimo ya documentado).

## VALIDACIÓN EN NAVEGADOR REAL

### Fase estable por sección (Phase Gate)

| Sección | Fase activa | Estado |
| --- | --- | --- |
| #home | boot | estable ✓ |
| #arquitectura | architecture | estable ✓ |
| #siem | data-in-motion | estable ✓ |
| #audit-hub | resilience | estable ✓ |
| #contacto | connection | estable ✓ |

(Z-30, `pointer-events: none`, 5 capas presentes; probado con Playwright tras pase de calentamiento para layout estable.)

### Arco de temperatura (delta de canal por escena, capturas p1→p2 full-frame)

| Escena | ΔR | ΔG | ΔB | Lectura |
| --- | --- | --- | --- | --- |
| S1 boot | +2.2 | +5.4 | **+8.6** | frío azul ✓ |
| S2 core | +0.5 | +2.7 | +3.3 | azul-cian ✓ |
| S3 data | +0.2 | +4.8 | +4.3 | cian ✓ |
| S4 resilience | **+10.6** | +6.5 | −0.6 | cálido ámbar ✓ |
| S5 connection | +1.4 | +1.3 | +0.9 | champagne suave ✓ |

### Materialidad a distancia de cámara real (capturas zoom, SPEC §3)

| Aspecto | Evidencia medida | Veredicto |
| --- | --- | --- |
| Losetas raised floor | S4: grid estructural limpio (12–155 bordes por scanline que sobreviven umbral 6; 134 px/borde a 2×); S1: piso denso (reflejos del env en el piso + damasco + grid comprimido por perspectiva) | ✅ se leen a distancia real |
| Vent tiles (plenum) | S1: dos bandas laterales con exceso cian (b−r) 46–54 flanqueando el corredor brillante; S4: bandas cian 21–44 más brillantes (plenum más presente en el nivel inferior) | ✅ el glow frío del plenum se lee |
| Reflejos env map | Rack S1: specular blanco (centroide 31/81) + reflejo azul-gris frío en el rostro `rgb 128/157/192` (tira vertical fría); Storage S4: specular blanco + reflejo teal `rgb 162/217/200` en el rostro (mezcla tira fría + acento cian) | ✅ PBR vivo; el metal captura el entorno |
| Acento cálido (S4) | Storage: 2.7–4.9% del rostro cálido-dominante (`r > b+12`), `rgb 82/65/30` — la tira ámbar horizontal se refleja pero queda **sutil** | ✅ presente, puntual (dirección §3: "acentos cálidos puntuales") |

Capturas en `refcheck/p2-after/` (fases) y `refcheck/p2-closeup/` (zoom S1/S4).

## NEXT PHASE

P0 · P1 · P2 del audit de diseño completados. Los 3 hallazgos de pulido del close-up (ver DECISION ENGINE) quedan como recomendaciones; el commit del thread sigue sin push en `feat/living-datacenter` (coordinación de push pendiente, como siempre).

---

## DECISION ENGINE (opcional — hallazgos de pulido, LOW impact)

**PROBLEM:** en el close-up, (1) la tira ámbar S4 se refleja débil en el storage (2.7–4.9% cálido), (2) el piso S1 es saturado (meanSat 0.726 — vents cian + reflejos compiten con el rack hero), (3) el grid de losetas en S1 se diluye en la densidad (losetas + reflejos).

| Alternativa | Performance | Impacto visual | Complejidad |
| --- | --- | --- | --- |
| A: subir intensidad de la tira cálida S4 (+~40%) y bajar emisión de vents 0.22→0.18 | 0 | alto en S4/S1 | baja (1 token cada uno) |
| B: dejar como está (la sutilidad es la dirección §3) | 0 | medio | nula |
| C: doble ajuste (A) + guiño de reflejo cálido extra en el rostro del storage | +1 light | alto | media |

**DECISION:** no aplicada en esta fase — el close-up valida que el detalle **se lee** a distancia real; los ajustes son pulido de dirección de arte menor y quedan propuestos (opción A) para una pasada futura si el cliente pide más calidez en S4. Restraint contratado en SPEC §3.
