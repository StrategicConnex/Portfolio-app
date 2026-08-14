# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`P5 (audit de diseño) — Materialidad PBR de los GLBs Tripo (el lever del "cálido S4" documentado en P3)`

## STATUS

`PASS (con reversión documentada)` — la investigación respondió la pregunta del audit: el lever del look NO es parametrizable en runtime. Dos configuraciones medidas (dilución por metalness = negativa; sheen por roughness/env = no-op) y el código revertido. El entregable es el hallazgo + la verificación pre-promoción que faltaba.

## IMPLEMENTED

- **Investigación (chunk JSON del GLB, `artwork/living-datacenter/dump-glb-pbr.mjs`):** los outputs Tripo promovidos (`server_rack_v03` hero S1, `storage_unit_v02` S4) vienen como **UN mesh** (`tripo_node_<uuid>`) + **UNA textura horneada** con `metalness=0` y `roughness=0.9` (acabado mate sin respuesta especular). Consecuencia: **los bridges de runtime por nombre de mesh (clearcoat G5, LEDs emisivos, puerta de malla) JAMÁS disparan en estos assets** — el runtime solo ve `tripo_node_*`. El clearcoat G5 se validó sobre los procedurales (nombres canónicos), no sobre los Tripo.
- **Dos intentos de elevar la respuesta PBR en runtime (perfil por asset en el bridge, `PBR_PROFILE_BY_ASSET` + aplicación en `GlbMesh`), ambos MEDIDOS sobre crops idénticos a la baseline P2 (`capture-closeup-p5.mjs`):**
  - **v1 — metalness 0.35–0.4, roughness 0.45–0.5:** NEGATIVO — la textura Tripo tiene la iluminación **horneada** (no es albedo limpio); subir metalness diluye la lectura: cálido S4 0.66→0.16%, imagen más oscura (lum 43.7→39.2).
  - **v2 — metalness 0, roughness 0.45–0.5, envMapIntensity 1.4:** NO-OP — cálido 0.27–1.20% vs 0.66–0.81% baseline (dentro del ruido), sin ganancia de especular (S1 rack spec 3.37→3.32).
- **Reversión (criterio del gate, mismo precedente que el DoF de P3):** el perfil y su aplicación en `GlbMesh` se revirtieron — no se shipea un cambio no validado. El repositorio queda en el estado P4.
- **Verificación pre-promoción documentada en ASSET-PIPELINE §4:** correr `dump-glb-pbr.mjs <asset>.glb` antes de integrar cualquier output de Meshy/Tripo — (a) nombres de mesh contra el set canónico del bridge, (b) `metallicFactor`/`roughnessFactor` (0/0.9 = matte horneado), (c) nº de materiales/texturas. Si es single-mesh matte → decidir: aceptar el look horneado o planear re-bake; **no** intentar corregirlo en runtime.

## FILES CREATED

```
- artwork/living-datacenter/dump-glb-pbr.mjs      (parser del chunk JSON del GLB — herramienta de inspección pre-promoción)
- artwork/living-datacenter/capture-closeup-p5.mjs (probe close-up con métricas warmPct/specPct sobre crops de la baseline)
- docs/datacenter/reports/report-p5-glb-materiality.md
```

## FILES MODIFIED

```
- docs/datacenter/ASSET-PIPELINE.md   (constraint Tripo single-mesh + verificación pre-promoción obligatoria, §4)
- docs/datacenter/CREATIVE-AUDIT.md   (entrada P5 en el changelog)
```

## DEPENDENCIES

`Ninguna nueva` — el parser de GLB es node puro (sin deps), el probe reusa playwright+sharp ya presentes.

## ARCHITECTURAL IMPACT

`LOW` — el cambio de código (perfil PBR en el bridge) se **revirtió**; el impacto es documental (ASSET-PIPELINE §4 + CREATIVE-AUDIT). Ningún invariante tocado.

## PERFORMANCE (deltas vs baseline de Fase 0)

| Métrica | Baseline | Actual | Delta | Objetivo (SPEC §31) |
| --- | --- | --- | --- | --- |
| FPS desktop | 60 | 60 | 0 | 60 |
| Draw calls | ~37 | ~45 (P1) | 0 | < 50 |
| Bundle 3D | ~230 KB gz | ~230 KB gz | **0 (revertido)** | < 3 MB assets |
| Contextos WebGL | 1 | 1 | 0 | 1 |

## ACCESSIBILITY

`STATUS: PASS` — sin cambios en DOM ni en interacción; la fase es investigación + docs.

## SECURITY / CSP

`STATUS: PASS` — cero red, cero assets externos, cero deps nuevas (SPEC §17).

## I18N

`STATUS: PASS` — sin texto nuevo (SPEC §14).

## COPILOT

`UNCHANGED`.

## TESTS

```text
npm run typecheck  → exit 0 (estado P4, tras revert)
npm run lint       → exit 0
npm test           → 381 passed, 0 failed
npm run build      → OK
```

## GATE

`PASS` — el gate de la fase es la evidencia medida (dos configuraciones evaluadas sobre crops idénticos a la baseline, con veredicto y reversión). Repositorio en estado P4 verificado (typecheck 0 · 381/381 · lint 0 · build OK).

## VALIDACIÓN EN NAVEGADOR REAL (métricas sobre crops idénticos a la baseline P2)

| Crop | Métrica | P2 baseline | P5-v1 (metal↑) | P5-v2 (env↑) | Veredicto |
| --- | --- | --- | --- | --- | --- |
| S4-storage-4x | warmPct | 0.66 | 0.16 | 0.27 | v1 negativo · v2 ruido |
| S4-storage-4x | meanLum | 43.7 | 39.2 | 41.6 | v1 oscurece |
| S4-storage-2x | warmPct | 0.81 | 1.16 | 1.20 | ruido |
| S1-rack-4x | specPct | 3.37 | 3.37 | 3.32 | no-op |
| S1-rack-4x | meanLum | 31.4 | 31.2 | 31.3 | no-op |

Consola: solo el CORS de telemetría legítimo (pre-existente y documentado). Capturas en `refcheck/p5-materiality/`.

**Interpretación:** la lectura cálida S4 (presente pero sutil, 2.7–4.9% con el umbral del P2 — "puntual, on-direction" §3) está **acotada por el albedo horneado del GLB**, no por luz (P3 midió no-op) ni por parámetros de material (P5 midió negativo/no-op). El único lever real es el re-bake del asset en el pipeline (textura con canales PBR, o re-export con meshes nombrados que activen el bridge §4) — documentado como recomendación, no bloquea nada.

## NEXT PHASE

P0–P5 del audit completados. **Recomendación de asset (no runtime):** re-bake de las texturas Tripo (o re-export con meshes `chassis`/`bezel_slats`/`leds_*`) para que el bridge §4 (clearcoat G5, LEDs, puerta) dispare en los protagonistas S1/S4 — sería el P6 cuando exista un asset re-bakeado. El resto de recomendaciones pendientes siguen siendo editoriales (adelgazar el dashboard `siem` para exponer el corredor del P4).

---

## DECISION ENGINE (perfil PBR en runtime — ARCHITECTURAL impact LOW, documentado por trazabilidad)

Per CONSTITUTION §7.

**PROBLEM:** P3 documentó que "la materialidad del GLB del storage es el lever real del cálido S4". P5 intentó ese lever en runtime y falló mediblemente: el GLB Tripo es single-mesh con textura horneada (metalness 0 / roughness 0.9), y los parámetros de material no pueden elevar la respuesta PBR sin diluir el albedo horneado.

| Alternativa | Performance | Mantenibilidad | A11y | Seguridad | SEO | Complejidad | Bundle | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: perfil PBR runtime (metalness↑) | 0 | media | ok | ok | ok | baja | 0 | ok |
| B: perfil PBR runtime (roughness↓ + env↑) | 0 | media | ok | ok | ok | baja | 0 | ok |
| C: **revertir + documentar el hallazgo (elegida)** | 0 | alta | ok | ok | ok | nula | 0 | ok |
| D: re-bake del asset (pipeline) | — | — | — | — | — | alta (asset work) | — | — |

**DECISION:** `C` — revertir y documentar; `D` queda como recomendación cuando exista un asset re-bakeado.
**REASON:** A y B fueron medidas (no opinión): A diluye el albedo horneado (negativo), B es no-op dentro del ruido. Shipear un no-op viola el gate (precedente P3). El hallazgo (bridges por nombre no disparan en Tripo + verificación pre-promoción) es el valor real de la fase.
**MEASURED RESULT:** v1 cálido 0.66→0.16% (negativo), v2 0.27–1.20% (ruido), S1 sin cambio; código revertido a P4; verificación pre-promoción documentada en ASSET-PIPELINE §4.
