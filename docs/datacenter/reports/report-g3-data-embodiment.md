# PHASE G3 — DATOS ENCARNADOS (anillos/contadores holográficos tipo Mastercard)

**PHASE:** G3 — datos encarnados (último gap ARCHITECTURAL del audit)
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12

## PROBLEMA
El DOM muestra métricas reales (uptime 99.9%, −30% incidentes, −10h/sem, 131/142
controles) como texto, pero el 3D no las encarnaba. La referencia Mastercard
"Business Outcomes" conecta números → anillos/contadores holográficos. El 3D
debe OBSERVAR los datos reales de `src/data/` sin duplicarlos ni tocarlos.

## IMPLEMENTED
1. **`src/lib/datacenterData.ts`** — puente de LECTURA puro (cero estado, cero
   fetch) que deriva métricas encarnadas de `src/data/`:
   - `kpiToValue()` parsea KPIs reales ('99.9%' → 99.9, '−30%' → 30,
     '< 15 min' → 15, '−10h/sem' → 10).
   - `passedControlsPct()` — 131/142 → 92.2.
   - `buildEmbodiedMetrics()` → 13 métricas: 4 marcos de cumplimiento (S2),
     4 KPIs operacionales + 4 severidades de amenaza (S3), 1 anillo de
     controles validados (S4). Cada una con `labelKey` i18n (nunca texto crudo,
     SPEC §13), valor 0-100 para el arco, `display` (texto real del dato) y
     posición.
2. **`src/components/datacenter/DataRings.tsx`** — capa de anillos holográficos:
   - Cada métrica = arco de toro proporcional al valor (0→2π) + fondo tenue
     (2 meshes) + HudLabel con contador (`value`) y label i18n.
   - Solo monta los anillos de la escena activa (`useActiveScene`, store
     pub/sub — S2=4, S3=8, S4=1 → máx. 8 visibles, ~16 draw calls extra).
   - Pulso de opacidad suave invalidado por `MicroAnimDriver`; estático con
     reduced-motion (SPEC §17).
3. **`HudLabel`** — prop aditiva `value?: string` (contador grande sobre el
   label); no rompe los usos existentes.
4. **i18n** — 8 claves nuevas `dc.data.*` es/en (marcos + severidades), cubiertas
   por el test de paridad existente.

## FILES CREATED
- `src/lib/datacenterData.ts` (+ `datacenterData.test.ts`, 5 tests)
- `src/components/datacenter/DataRings.tsx` (+ `DataRings.test.tsx`, 5 tests)

## FILES MODIFIED
- `src/components/datacenter/HudLabel.tsx` (prop `value`)
- `src/context/translations/datacenter.ts` (claves `dc.data.*` es/en)
- `src/components/datacenter/DatacenterScene.tsx` (monta `<DataRings />`)
- `artwork/.../refcheck/diff-fidelity.mjs`, `verify-s1-fresh.mjs` (warnings lint)

## ARCHITECTURAL IMPACT
**MEDIUM** — capa nueva de visualización de datos, pero de solo lectura: el 3D
observa `src/data/` (fuente de verdad); sin tocar secciones, DOM ni Copilot.
Patrón idéntico a `FocusNodeLayer`/`activeScene` (store pub/sub de módulo).

## VALIDACIÓN RUNTIME (navegador real, build actual en 3100)
| Escena | Anillos esperados | Verificado en DOM |
|--------|-------------------|-------------------|
| S2 architecture | 4 marcos | `94% ISO 27001 · 88% IEC 62443 · 91% NIST CSF · 100% GDPR · LGPD` ✅ |
| S3 data-in-motion | 8 (4 KPI + 4 severidad) | `99.9% Uptime · −30% Bloqueados · −10h/sem Alertas · 4 CRÍTICO · 8 ALTO · 15 MEDIO · 27 BAJO` ✅ |
| S4 resilience | 1 (controles) | `131/142 Controles Validados` ✅ |

Console errors reales: **0** (solo CORS del telemetry legítimo existente).

## PERFORMANCE
- +2 meshes por anillo, máximo 8 anillos visibles por escena (~16 draw calls
  extra, dentro del presupuesto <50; las instancias del corredor no se tocan).
- `frameloop="demand"` + invalidación a Hz reducido por `MicroAnimDriver`.
- Sin requests nuevos (R5), sin dependencias nuevas.

## ACCESSIBILITY
Los anillos son 100% decorativos dentro del canvas `aria-hidden`; los contadores
son DOM del `Html transform` (no anunciado, `pointer-events: none`). El DOM de
las secciones sigue siendo la fuente de verdad de los datos. Reduced-motion →
anillos estáticos (sin pulso).

## I18N
8 claves nuevas es/en con paridad verificada por `datacenter.test.ts`
(esKeys = enKeys). Los labels usan claves existentes de `siem.*`/`audit.*`
cuando aplica (uptime, controles).

## COPILOT
**UNCHANGED** — sin tocar lógica, estado, API ni z-index.

## GATE
**PASS** — typecheck 0 · tests 139/139 (22 files) · lint 0 · build OK ·
validación runtime 3/3 escenas con 0 errores de consola.

## NEXT
Audit completo: G1-G7 implementados y validados. Restan pasos operativos:
deploy preview a Vercel para QA en dispositivo real, y carga de outputs de
Meshy en los slots GLB (pipeline listo).
