# Reporte P7d — El fotón: hilo de continuidad del storyline

**Fase:** P7d (audit de narrativa — el datacenter como personaje)
**Fecha:** 2026-08-14
**Gate:** typecheck 0 · tests **391/391** (5 nuevos) · lint 0 · build OK
**Estado:** ✅ implementado y validado con A/B en navegador real

---

## 1. Objetivo (del audit de narrativa)

El diagnóstico dejó un hueco: el storyline viajaba (fases, cámara, tintes) pero no tenía **sujeto**. El fotón es la firma de continuidad — una partícula de luz que nace en el boot, viaja con los streams de data, SOBREVIVE al failover de resilience y llega al nodo central en connection. Un "personaje" recurrente al estilo iyO/NRG: cuesta casi nada (2 draw calls) y le da al recorrido algo que recordar.

## 2. Qué se construyó (data-driven, SPEC §20)

### `datacenter.storyline.ts` — config pura del viaje

- **`PHOTON_SEGMENTS`**: 5 tramos (uno por escena), **conectados extremo-a-extremo** — el contrato de continuidad: el fotón nunca salta en las fronteras de escena. Cada tramo anclado a la geometría real:
  - S1: nace en la cara frontal del rack hero (y 0.35) y asciende. **z ≥ 0.62** — el GLB hero es opaco (cara frontal z≈0.45) y un tramo a z<0.45 quedaría oculto detrás de la cara (bug encontrado y corregido durante la validación).
  - S2: viaja por el pasillo sobre los anillos KPI.
  - S3: cabalga el stream izquierdo (misma geometría que `STREAM_PATHS`), cruza el pasillo (hop este-oeste) y desciende.
  - S4: desciende al nivel de storage y recorre **la ruta B del failover** (la misma de `FailoverStreams`) — el fotón sobrevive porque va en la ruta que transporta todo en la ventana dead.
  - S5: asciende y llega al nodo central (display SIEM de S5, frente a la pantalla).
- **`PHOTON_COLOR_BY_SCENE`**: el arco de temperatura del Phase Gate en una partícula — azul (nacimiento) → cian (los streams) → ámbar (nivel protegido) → champagne (la llegada).
- **`photonGlobalProgress(sceneIndex, sp)`**: (escena + progreso)/5 — un único parámetro para el viaje completo.
- **`photonFailoverTint(state)`**: el fotón es **EL portador** en la ventana dead — pulso de intensidad/tamaño (dead > recover > fault > normal).
- **`photonArrival(global)`**: ventana de llegada (último 10%) para el bloom del clímax.

### `StoryPhoton.tsx` — componente (2 draw calls, sin setState)

- Cabeza (1 punto) + estela (7 puntos) con **glow radial procedural** (singleton CanvasTexture, patrón de `meshDoorTexture`) — se lee como LUZ, no como cuadrado (ataca el defecto del audit "solo cuadrados").
- `useFrame`: escribe posiciones directo al BufferAttribute (SPEC §32), colores pre-computados sin allocations por frame, lerp exponencial (SPEC §16), estela por progreso atrás de la cabeza, pulso de llegada con respiración, tint failover solo en S4.
- `prefers-reduced-motion` → el fotón espera **estático en el nodo de llegada** (defensivo).

## 3. Validación — el método A/B (la lección del turno)

La validación pixel-por-proyección falló dos veces por razones distintas que la hicieron NO fiable:

1. **Proyección con cámara asentada**: el blob de S1 en la proyección exacta (720,573) resultó ser **estático** (idéntico entre builds de tamaño 0.16 y 0.55) — no era el fotón. Y la proyección de S4 quedó ~190px desviada por el easing de cámara (la cámara real no está exactamente en `interpolateWaypoints` con 6.5s de settle).
2. **Bug del probe**: las 3 capturas se tomaban después de scrollear a S5 (el loop de screenshots iba al final) — "S1" era la escena S5.

**La prueba decisiva fue el A/B limpio** (`ab-photon.mjs`): mismo build con `<StoryPhoton/>` ON vs OFF (tamaño de validación 0.55, revertido después), diff de píxeles:

| Escena | Píxeles ON−OFF (Δ>12) | Máx Δ | Lectura |
|---|---|---|---|
| S1 | **553** | 147.7 | blob azul delante del rack hero ✓ |
| S4 | **32,589** | 217.7 | glow ámbar sobre la fila de storage (la ruta B) ✓ |
| S5 | **21** | 25.7 | ascenso lejano hacia el nodo ✓ |

Más la evidencia de componente (logs temporales, eliminados): useFrame escribía la posición determinística correcta `[0.01, 0.37, 0.62]` (nacimiento en S1) con material size/opacity/color correctos, consola limpia.

**Lección documentada (misma familia que la del P7a):** la validación visual de un objeto pequeño debe ser un **diff A/B contra su ausencia**, no un umbral de color sobre el frame completo — el escenario tiene demasiadas luces estáticas (rims, vent tiles, tira cálida, beacon) que confunden cualquier histograma.

## 4. Decision Engine

| Alternativa | Veredicto |
|---|---|
| Renderizar solo en ULTRA/HIGH | Rechazada — 2 draw calls (~45→47, presupuesto <50); la firma del storyline va en todos los tiers no-LOW |
| Ruta por tiempo (setInterval) | Rechazada — determinística por scroll como todo el sitio (reversible) |
| Trail por instancing de sprites | Rechazada — 2 Points con mapa radial es suficiente y más simple |
| Photon detrás del rack (z<0.45) | **Bug real corregido** — tramo S1 movido delante de la cara frontal opaca |

## 5. Archivos

- `src/lib/datacenter.storyline.ts` — `PHOTON_SEGMENTS`, `PHOTON_COLOR_BY_SCENE`, `buildPhotonPath`, `photonGlobalProgress`, `photonFailoverTint`, `photonArrival`
- `src/lib/datacenter.storyline.test.ts` — 5 tests nuevos (continuidad del path, progreso global, arco de color, tint failover, llegada)
- `src/components/datacenter/StoryPhoton.tsx` (nuevo)
- `src/components/datacenter/DatacenterScene.tsx` — mount en el bloque no-LOW
- `artwork/living-datacenter/validate-p7d.mjs` + `probe-photon.mjs` + `ab-photon.mjs` + `refcheck/p7d-*/` (probes y capturas)
