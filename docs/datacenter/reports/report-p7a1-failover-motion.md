# Reporte P7a.1 — El corte se hace físico: la ruta A se detiene y re-encamina a B

**Fase:** P7a.1 (extensión del failover del audit de narrativa)
**Fecha:** 2026-08-15
**Gate:** typecheck 0 · tests **399/399** (3 nuevos) · lint 0 · build OK
**Estado:** ✅ implementado y validado con A/B en navegador real

---

## 1. Objetivo

El failover de S4 (P7a) narraba el corte con COLOR (A degrada ámbar, muere
oscura, B transporta todo) pero el tráfico de ambas rutas fluía siempre igual.
La extensión pedida: **el corte debe ser físico** — durante la ventana dead,
los puntos de la ruta A se DETIENEN y se RE-ENCAMINAN visiblemente hacia la
ruta B, sin romper el presupuesto de draw calls.

## 2. Qué se construyó (2 draw calls intactos)

### `datacenter.storyline.ts` — `failoverMotion(state)`

Una máquina de estados pura que parametriza el MOVIMIENTO (además del color):

| Estado | `speedA` | `reroute` | Lectura visual |
|---|---|---|---|
| normal | 1 | 0 | A fluye normal en su fila |
| fault | 0.35 | 0.35 | A se **lentifica** y su tráfico ámbar **deriva visiblemente** hacia B |
| dead | **0** | **1** | A se **detiene**; su tráfico quedó re-encaminado en B — la fila frontal queda VACÍA |
| recover | 0.6 | 0.5 | A reanuda; el tráfico **cruza de regreso** a su fila |
| restored | 1 | 0 | estado normal |

B fluye SIEMPRE (es el respaldo que toma el control).

### `FailoverStreams.tsx`

- `curSpeedA` / `curReroute` suavizados con el mismo lerp exponencial del
  material (SPEC §16 — nunca cortes bruscos), sin setState (SPEC §32).
- En el bucle de posiciones: `offsetA = offset * speedA` (A se lentifica hasta
  detenerse) y la posición de cada punto de A se interpola hacia el punto
  equivalente de B a la misma `t` (`pos = lerp(A, B, reroute)`) — los puntos
  cruzan lateralmente entre las filas. **Los mismos 2 Points** → 0 draw calls
  extra (S3 peor caso 45 → 45; el S4 del failover no cambia).

## 3. Validación — A/B contra el P7 committeado (color-only)

**Método (lección de P7d):** mismo scroll en S4 → misma cámara y MISMOS
materiales; la única diferencia entre la build motion-ON y la P7 (FailoverStreams
revertido vía stash) es la POSICIÓN del tráfico de A. El diff filtrado por hue
ámbar aísla el re-ruteo de la varianza del polvo (neutra).

| Estado | Diff ámbar (ON vs P7) | Diff cian | Lectura |
|---|---|---|---|
| **fault** (sp≈0.33) | **489 px** | 680 px | El tráfico de A está en POSICIONES DISTINTAS (derivando a B) — **el re-ruteo es visible** ✓ |
| dead (sp≈0.5) | 13 px | 34 px | A es oscuro en ambas builds → sus puntos son invisibles estéticamente (el "fila vacía" lo da el material + la posición coincide) — esperado |
| blog-start (sp≈0.83) | 6 px | 23 px | Resultó ser **restored** (la altura de blog empuja sp>0.8) → sin diferencia — no es un sample de recover |

**Lección de método:** `scrollIntoView(block:'start')` sobre una sección ALTA
no da el progreso de escena esperado (el centro de la sección queda debajo del
centro del viewport → sp>0.8). El muestreo por pasos (`validate-failover-motion`)
es el que alcanza la ventana real de recover; para el A/B, el sample de fault
fue el decisivo.

**Totales consistentes (on vs off):** fault ámbar 1567 vs 1633 (mismo
volumen, distinta distribución = el drift); dead 852/853 y recover 346/353
(idénticos — la posición de A solo difiere donde su material es visible).

**Draw calls:** sin cambio (2 Points de siempre — la verificación de P7e los
midió en 45 S3). **Consola:** limpia (solo el CORS de telemetría legítimo).

## 4. Decision Engine

| Alternativa | Veredicto |
|---|---|
| Reroute por ola (los puntos del frente derivan primero, `reroute * tt`) | Rechazada — el drift uniforme por estado es más reversible y legible; la ola añade complejidad sin ganancia narrativa medible |
| A se detiene pero NO re-encamina (solo se congela) | Rechazada — sin el cruce visible a B, el corte no se distingue del color-only |
| Parar también B en dead | Rechazada — B es el respaldo que toma el control; debe fluir SIEMPRE |
| Nuevo Points para el tráfico derivado | Rechazada — 0 draw calls extra es parte del requisito; el lerp en el mismo geometry lo logra |

## 5. Archivos

- `src/lib/datacenter.storyline.ts` — `FailoverMotion` + `failoverMotion`
- `src/lib/datacenter.storyline.test.ts` — 3 tests nuevos (normal/restored, dead, progresión)
- `src/components/datacenter/FailoverStreams.tsx` — movimiento físico
- `artwork/living-datacenter/validate-failover-motion.mjs` + `ab-failover-motion.mjs` + `refcheck/p7a1*/` (probes y capturas)
