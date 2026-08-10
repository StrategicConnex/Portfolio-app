# Reports de fase — THE LIVING DATACENTER

Carpeta para archivar el reporte de **cada gate** del [`IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md), según el formato del `SPEC.md §37`.

## Convención de nombres

```
report-<fase>-<slug>.md
```

| Fase | Archivo sugerido |
| --- | --- |
| Fase 0 | `report-0-discovery.md` |
| Fase A | `report-a-cleanup.md` |
| Fase 1 | `report-1-canvas-shell.md` |
| Fase 2 | `report-2-camera-system.md` |
| Fase 3 | `report-3-environment.md` |
| Fase 4 | `report-4-geometry.md` |
| Fase 5 | `report-5-hud-i18n-fonts.md` |
| Fase 6 | `report-6-glb.md` (solo si se ejecuta) |
| Fase 7 | `report-7-copilot-shell.md` |
| Fase 8 | `report-8-final-qa.md` |

## Reglas

1. **Un reporte por fase**, escrito al cerrar la fase (gate ejecutado), **antes** del commit de esa fase.
2. El reporte se commitea junto con el código de la fase (`feat(datacenter): …`).
3. **Gate PASS y FAIL** se reportan por igual; un FAIL documenta el problema y la corrección (o el STOP + escalamiento).
4. Si la fase se detiene por una condición de STOP (CONSTITUTION §12), el reporte incluye el bloque **ESCALATION** con PROBLEMA / CAUSA / IMPACTO / OPCIONES / RECOMENDACIÓN.
5. Las métricas de performance se registran **como deltas vs baseline** (Fase 0) — no absolutos sueltos.
6. Copiar [`TEMPLATE.md`](./TEMPLATE.md) como punto de partida y rellenar todas las secciones; ninguna debe quedar vacía (si no aplica, escribir `N/A` con una línea de por qué).

## Índice de reports

| Fase | Status | Archivo | Fecha |
| --- | --- | --- | --- |
| 0 | ✅ PASS | `report-0-discovery.md` | 2026-08-10 |
| A | ✅ PASS | `report-a-cleanup.md` | 2026-08-10 |
| 1 | ✅ PASS | `report-1-canvas-shell.md` | 2026-08-10 |
| 2 | ✅ PASS | `report-2-camera-system.md` | 2026-08-10 |
| 3 | ✅ PASS | `report-3-environment.md` | 2026-08-10 |
| 4 | ✅ PASS | `report-4-geometry.md` | 2026-08-10 |
| 5 | ✅ PASS | `report-5-hud-i18n-fonts.md` | 2026-08-10 |
| 6 | SKIP (default) | — | — |
| 7 | ✅ PASS | `report-7-copilot-shell.md` | 2026-08-10 |
| 8 | ✅ PASS | `report-8-final-qa.md` | 2026-08-10 |
