# Reporte de Fase — THE LIVING DATACENTER

## PHASE

`P1 (audit de diseño) — Materialidad: env por tier, Lightformers extra, raised floor y sombras de contacto`

## STATUS

`PASS`

## IMPLEMENTED

- **Env map por tier (P1):** `DatacenterEnvironment` recibe `profile` — resolución **1024 solo en ULTRA** (coste de memoria del cube target), 512 en HIGH/MEDIUM, 256 en LOW. STATIC no monta canvas. El look premium (reflejos de metal/cristal) se paga solo donde el hardware lo sostiene.
- **Lightformers adicionales (3):** tira cálida horizontal del nivel inferior (S4 — reflejo ámbar en los gabinetes de storage), tira vertical fría a la derecha del corredor (reflejos altos en chasis, dirección iyO/NRG) y ring cyan sobre el rack hero (S1, corona de reflexión del boot).
- **Losetas de raised floor instanciadas (P1):** `DatacenterFloor` gana 1024 losetas (32×32, **1 draw call**) sobre el piso elevado con damasco sutil (variación de tono por paridad) — restaura la escala humana del datacenter (NRG "like a model railway"). **Vent tiles:** 2 columnas de plenum bajo el corredor con emisión cyan `#22d3ee` @0.22 (el "aire frío" se lee como glow desde abajo, 1 DC). Ambos gated por `profile !== 'LOW'`.
- **Sombras de contacto (P1):** pool de storage (S4) con 2 `ContactShadows` (bake 1 frame, frameloop demand) que aterrizan las unidades sobre el piso técnico y=-2.9. Switch protagonista (S3): **sombra AO simulada** — cuelga de la cara frontal del rack (superficie vertical, un ContactShadows horizontal no aplica); un plano oscuro `depthWrite:false` detrás del chasis lo separa de la superficie.

## FILES CREATED

```
- artwork/living-datacenter/refcheck/p1-after/ (S1-S5-p1.png + result.json)
- docs/datacenter/reports/report-p1-materiality.md
```

## FILES MODIFIED

```
- src/components/datacenter/DatacenterEnvironment.tsx (resolution por tier + 3 Lightformers)
- src/components/datacenter/DatacenterCanvas.tsx       (pasa profile al Environment)
- src/components/datacenter/DatacenterFloor.tsx        (losetas raised floor + vent tiles instanciadas)
- src/components/datacenter/DatacenterScene.tsx        (pasa profile al Floor)
- src/components/datacenter/BackupUnits.tsx            (ContactShadows del pool, bake 1 frame)
- src/components/datacenter/ServerSwitchPool.tsx       (sombra AO simulada del switch protagonista)
```

## DEPENDENCIES

`Ninguna nueva` — solo drei ya en uso (Instances/Instance/ContactShadows/Environment/Lightformer).

## ARCHITECTURAL IMPACT

`LOW` — capa de dirección de arte aditiva: +3 draw calls estables (losetas, vents, AO plane; ContactShadows solo baken 1 frame), cero meshes por tier LOW.

## PERFORMANCE (deltas vs P0)

| Métrica | P0 | P1 | Delta | Objetivo (SPEC §31) |
| --- | --- | --- | --- | --- |
| Draw calls (estables, peor caso S3) | ~42 | **~45** | +3 | < 50 |
| Env resolution ULTRA | 512 | 1024 | +memoria (solo ULTRA) | — |
| Tris añadidos (ULTRA) | — | ~12.8K (1024 losetas + 42 vents) | +13K | < 250K mobile |
| Captura S1 (meanLum) | 24.9 | 24.9 | 0 | sin regresión |
| Captura S3 (meanLum) | 21.3 | 22.9 | +1.6 | vents cyan legibles |
| Captura S4 (dark%) | 77.4 | 79.4 | +2.0 (variance de cámara) | estable |

## ACCESSIBILITY

`STATUS: PASS` — canvas intacto (`aria-hidden`); losetas/vents son geometría 3D decorativa; sin cambios DOM. Suite axe completa en `npm test`.

## SECURITY / CSP

`STATUS: PASS` — cero assets externos; todo procedural (SPEC §17, R5).

## I18N

`STATUS: PASS` — sin claves ni textos nuevos.

## COPILOT

`UNCHANGED` — no se tocó nada del Copilot (R4).

## TESTS

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 372 passed, 0 failed (46 files)
npm run build      → OK
capture-p0.mjs     → 5 escenas en navegador real (WebGL), sin errores nuevos
```

## GATE

`PASS` — validación en navegador real: S1/S5 byte-iguales (sin regresión del hero ni del clímax), S3 gana luminosidad de los vents cyan, S4 estable. Consola sin errores nuevos (solo CORS de telemetría legítimo). Draw calls ~45 < 50 (SPEC §21). Capturas: `refcheck/p1-after/S{n}-p1.png`.

## NEXT PHASE

`P2 Phase Gate` (firma del sitio: overlay z-30 tintado por fase activa) o `G7.5` — swap del display SIEM real / switch 1U real cuando lleguen los outputs de Meshy/Tripo.

---

## DECISION ENGINE

No aplica — ARCHITECTURAL IMPACT LOW.

## ESCALATION

No aplica — STATUS PASS.
