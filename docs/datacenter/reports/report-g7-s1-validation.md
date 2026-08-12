# PHASE G7 — VALIDACIÓN S1 (rack hero) en navegador real

**PHASE:** G7 — validación del detalle nuevo (postes, malla, textura PBR) a distancia de cámara
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12

## PROBLEMA / OBJETIVO
Verificar que el detalle añadido en el pase de fidelidad (G7) **se lee a
distancia de cámara** en el rack hero de S1, no solo en el editor. Comparación
visual apples-to-apples contra el baseline pre-fidelity.

## MÉTODO (reproducible)
- `artwork/living-datacenter/verify-s1-fresh.mjs` — captura fresca del build
  actual con **el mismo viewport (1440×900) y el mismo encuadre** que el
  baseline (`#home` centrado): `refcheck/s1-fresh-current.png`.
- Baseline pre-fidelity: `refcheck/baseline-pre-fidelity/gaps-S1-boot.png`.
- Análisis por región (rack central vs fondo) + métricas de detalle:
  bordes verticales (postes), HF (malla/ventilación), diff medio.

## RESULTADOS

### Diff por región (PRE vs POST, mismo encuadre)
| Región      | diff medio | Lectura |
|-------------|-----------|---------|
| Rack central| **6.82**  | El cambio está concentrado en el rack |
| Fondo       | 0.80      | Prácticamente intacto (solo luz) |
| Frame completo | 2.34   | — |

### Detalle en la zona del rack (35–65% x, 20–75% y)
| Métrica            | PRE  | POST | Δ     |
|--------------------|------|------|-------|
| Bordes verticales (postes de esquina) | 6.37 | **7.69** | **+20.7%** |
| Bordes horizontales | 6.91 | 7.17 | +3.8% |
| HF (malla / ventilación) | 22.41 | **23.81** | **+6.2%** |

### Crop del rack (30–70% x, 15–85% y, resize 720)
| Métrica   | PRE  | POST | Δ    |
|-----------|------|------|------|
| HF del crop | 18.33 | 18.87 | +3.0% |

## VEREDICTO
- **Postes de esquina: ✅ legibles a distancia de cámara** — +20.7% de bordes
  verticales concentrados en la silueta del rack; es la señal dominante.
- **Malla de puerta: ⚠️ marginal** — +3–6% HF. A distancia de cámara S1 el
  patrón AR2580 se lee como textura fina (mejor que la caja lisa del baseline),
  pero su detalle fino requiere acercamiento (S3/S4 lo muestran más).
- **Textura PBR del chasis: ✅** — el diff concentrado en el rack (6.82 vs 0.80
  de fondo) confirma juntas/bisel/ventilación aterrizando en el hardware.

## FILES CREATED
- `artwork/living-datacenter/verify-s1-fresh.mjs` (probe reutilizable)
- `artwork/living-datacenter/refcheck/s1-fresh-current.png` (captura actual)
- `artwork/living-datacenter/refcheck/s1-rack-crop-PRE.png` / `-POST.png`
- `artwork/living-datacenter/refcheck/s1-fidelity-compare.png` (side-by-side +
  heatmap de diff, 4320px — evidencia visual)

## GATE
**PASS** — el detalle nuevo se lee a distancia de cámara; sin regresiones
(captura con el build actual, canvas montado, sin errores de consola nuevos).

## NEXT
- La malla de la puerta a plena resolución se verá cuando el rack hero reciba
  el output de Meshy (slot GLB ya cableado). Para subir la legibilidad de la
  malla procedural sin asset externo: subir contraste del normal map de la
  puerta o acercar el waypoint de entrada de S1 (trade-off con el encuadre
  editorial del hero — requiere decisión de dirección de arte, fuera del scope
  SAFE de G7).
