# Reporte P7 — Storyline: failover visible (P7a) + eje Purdue IEC 62443 (P7c)

**Fase:** P7 (audit de narrativa — el datacenter como personaje)
**Fecha:** 2026-08-14
**Gate:** typecheck 0 · tests **386/386** (5 nuevos) · lint 0 · build OK
**Estado:** ✅ implementado y validado en navegador real

---

## 1. Objetivo (del audit de narrativa)

El diagnóstico de director creativo + arquitecto de red encontró dos agujeros:

- **P7a — la resiliencia no se ve.** S4 se diferenciaba por tint ámbar (P2), pero no contaba el EVENTO: un corte, un reroute, una recuperación. La semántica de red real (2N, rutas gemelas, failover) no existía en el 3D.
- **P7c — el sitio es de un arquitecto IT/OT y no lo decía.** El recorrido no mapeaba el modelo Purdue (IEC 62443) — el lenguaje profesional del dueño — a las 5 fases.

## 2. Qué se construyó (todo data-driven, SPEC §20)

### P7c — Eje Purdue en el HUD (`src/lib/datacenter.storyline.ts` + `HudLabel.tsx`)

Cada escena declara su nivel del modelo Purdue en `PURDUE_BY_SCENE`; el HUD lo muestra bajo el `FASE 0n/05` (audit G1) en los labels de escena:

| Escena | Nivel Purdue | Dominio |
|---|---|---|
| S1 boot | NIVEL 04 · EMPRESA | el sitio que nace |
| S2 core | NIVEL 03 · OPERACIONES | el piso de operaciones |
| S3 data | NIVEL 03.5 · DMZ | la frontera donde se vigila el tráfico |
| S4 resilience | NIVEL 01 · CONTROL | el descenso al nivel protegido |
| S5 connection | NIVEL 05 · INTERNET | el nodo hacia el mundo |

- Claves i18n nuevas `dc.purdue.*` en es **y** en (la suite de paridad cubre la simetría).
- **S1 no lleva línea NIVEL por diseño:** los labels del boot son `variant="status"` (boot.status/network/ai) y la línea FASE/NIVEL solo se renderiza en `variant="scene"` (decisión G1). El recorrido Purdue se declara completo; el HUD la muestra donde hay label de escena.

### P7a — Failover determinístico (`datacenter.storyline.failoverEvent` + `FailoverStreams.tsx`)

- Dos rutas gemelas sobre la fila de storage de S4 (A primaria frontal y B respaldo trasera), cada una con **40 puntos** fluyendo siempre (mismo patrón que `DataStreams` — el tráfico nunca se detiene; lo que narra el corte es el **material**).
- `failoverEvent(sceneProgress)` es una máquina de estados pura, determinística por progreso de scroll (reversible al scrollear atrás): `normal → fault → dead → recover → restored` en `0.30 / 0.48 / 0.62 / 0.80`.
- Targets de material por ruta y estado: A degrada a **ámbar** (fault), se apaga a **rojo oscuro** (dead) mientras B sube a cian pleno transportando todo, A se recupera (ámbar) y B vuelve a standby (restored).
- Suavizado exponencial (SPEC §16 — nunca cortes bruscos), escritura directa al material en `useFrame` (sin setState, SPEC §32), vectores/colores compartidos sin allocations por frame, solo se monta en S4 (`activeScene === 3`), defensivo con `prefers-reduced-motion` (estado normal estático).

## 3. Validación en navegador real (`artwork/living-datacenter/validate-p7.mjs`)

**P7c:** S2→S5 verifican la línea en el DOM (`NIVEL 03 · OPERACIONES` … `NIVEL 05 · INTERNET`) — los 4 labels de escena correctos.

**P7a:** muestreo de progreso real (misma lógica de midpoint de `useSectionProgress`) scrolleando S4 de `audit-hub` hacia `blog`, con capturas y conteo de ámbar en la fila de storage:

| Tramo | Progreso | Estado esperado | Ámbar medido |
|---|---|---|---|
| steps 0–5 | 15–29% | `normal` | 0.00–0.01 |
| step 6 | 32% | `fault` | 0.00 → arranca |
| steps 9–13 | 38–45% | `fault` | **0.18–0.26** |

El evento se lee en el navegador real **exactamente** donde la función pura lo declara (cruce de 30%): la degradación ámbar de la ruta A aparece en la fila de storage. La máquina de estados runtime = función pura (testeada en 5 casos).

**Consola:** solo el CORS de telemetría legítimo (pre-existente, documentado).

## 4. Método de prueba honesto (lección del turno)

La primera versión del probe scrolleaba **hacia arriba** desde el centro de `audit-hub` (progreso ≈0.17→0) — nunca cruzó la ventana del evento (fault@0.30) y el failover "no se leía". El diagnóstico fue del probe, no del código: se reescribió muestreando el progreso real y scrolleando hacia abajo. La lección queda: **los probes de eventos determinísticos deben muestrear la variable de entrada (progreso), no solo el output visual.**

## 5. Decision Engine

| Alternativa | Veredicto |
|---|---|
| Animar el corte de A (puntos se detienen) | Rechazada — el tráfico parado contradice la física del flujo; el material narra mejor y es más barato (0 re-renders) |
| Evento por tiempo (setTimeout) | Rechazada — no reversible por scroll; determinístico por progreso es la mecánica del sitio |
| Failover en DataStreams existente | Rechazada — S3 usa los streams; el failover es propio de S4 y la separación mantiene los perfiles de tier intactos |

## 6. Archivos

- `src/lib/datacenter.storyline.ts` + `datacenter.storyline.test.ts` (nuevos — 5 tests)
- `src/components/datacenter/FailoverStreams.tsx` (nuevo)
- `src/components/datacenter/HudLabel.tsx` (línea Purdue en labels de escena)
- `src/context/translations/datacenter.ts` (claves `dc.purdue.*` es/en)
- `src/components/datacenter/DatacenterScene.tsx` (mount de `FailoverStreams`)
- `artwork/living-datacenter/validate-p7.mjs` + `refcheck/p7-storyline/` (probe + capturas)
