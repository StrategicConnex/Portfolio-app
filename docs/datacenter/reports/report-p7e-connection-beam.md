# Reporte P7e — Conexión como WAN: el haz hacia el clúster distante

**Fase:** P7e (audit de narrativa — el cierre semántico del storyline)
**Fecha:** 2026-08-14
**Gate:** typecheck 0 · tests **396/396** (5 nuevos) · lint 0 · build OK
**Estado:** ✅ implementado y validado en navegador real

---

## 1. Objetivo (del audit de narrativa)

El clímax de S5 era un pull-back estático. El cierre semántico que faltaba:
**el datacenter es UN nodo, no el mundo** — el reveal diagonal (P3) ahora
muestra un haz de luz que emerge del nodo central y se desvanece en la niebla
hacia un clúster distante (el resto de la red). Y el fotón (P7d) cierra su
arco **partiendo por el haz** — el hilo de continuidad sale del datacenter.

## 2. Qué se construyó (data-driven, SPEC §20)

### `datacenter.storyline.ts` — config pura del haz

- **`BEAM_ORIGIN`** = el nodo central de S5 `[0, 2.0, -1.85]` (el mismo punto
  de llegada del fotón) y **`BEAM_TARGET`** = `[-5, 3, -24]`, al **borde de la
  niebla** (fog S5 near 18 / far 55) — la red "emergiendo de lo desconocido".
- **`beamClusterPoints(12)`**: la granja distante — retícula 4×3 con jitter
  determinístico alrededor del target (testeado que es determinístico).
- **`connectionBeamStrength(global)`**: ventana del clímax (0 antes de S5,
  1 en el reveal completo) — el haz se enciende cuando la cámara del reveal
  diagonal ya está de vuelta.
- **`beamPointAlong(t)`**: la línea nodo→clúster (la misma del fotón).
- **Extensión del tramo S5 del fotón**: 2 puntos nuevos **colineales con el
  haz** (testeado: dot > 0.999) — el fotón llega al nodo, enciende el haz y
  continúa viajando por él. `PHOTON_NODE_GLOBAL` ancla la llegada.
- **`photonArrival` re-ventaneado**: bloom exactamente en el nodo, que se
  desvanece cuando el fotón parte (antes: ventana genérica del final).
  **`photonDeparture`**: 0 en el nodo, 1 en el clúster — el fotón se encoge
  al receder hacia la niebla.

### `ConnectionBeam.tsx` (nuevo — 3 draw calls, presupuesto <50 verificado)

- **Shaft**: 2 planos cruzados (X) con el glow radial procedural — el streak
  volumétrico clásico sin shaders; el cuaternión alinea el eje Y del plano al
  haz y el spin de 90° cruza el segundo plano alrededor del eje. Opacidad
  aditiva champagne (0.3), se desvanece solo con la niebla.
- **Clúster + paquetes**: UNA geometry de Points (12 puntos fijos del clúster
  + 10 paquetes que fluyen origen→target con wrap continuo, patrón
  DataStreams) — 1 draw call.
- **Activación**: determinística por scroll (`connectionBeamStrength`),
  escritura directa en useFrame sin setState (SPEC §32), reduced-motion →
  haz estático pleno con paquetes congelados (defensivo).
- **`glowTexture.ts`**: el glow radial procedural se extrajo a un módulo
  compartido (StoryPhoton + ConnectionBeam) — DRY, sin duplicación.

## 3. Validación en navegador real

**Draw calls medidos en runtime** (probe temporal `state.gl.info.render.calls`,
eliminado después): S3 peor caso **45** → con el haz **48 < 50** (SPEC §21).

**A/B ON vs OFF (método de P7d) y una lección nueva:** el diff crudo ON−OFF
mostraba diffs enormes en S1/S4 que NO eran el haz — eran **varianza de las
partículas de polvo** entre runs (diff gris difuso en todo el frame, sin sesgo
de hue). El filtrado por hue champagne (el haz es cálido; el polvo es neutro)
lo aisló. El haz a fuerza parcial (S5-centro, strength 0.48) es sutil; a
**fuerza plena** (fondo de página, strength 1) se lee inequívocamente:

| Señal (canvas puro S5-full) | Evidencia |
|---|---|
| Clúster distante | 4 blobs champagne en la mitad superior (`148,39`/`134,39` …) — color EXACTO `#E8D5AC` = [232,213,172] |
| Paquetes en la línea | blob champagne a mitad de recorrido (`366,328`) + 566 px cálidos totales |
| Fotón partiendo | `photonDeparture` modula tamaño/opacidad (el fotón se encoge al receder) |

**Consola**: limpia (solo el CORS de telemetría legítimo). **Limitación
editorial documentada:** el DOM de `contacto` (cards LinkedIn/CV/Credly) cubre
el clímax en pantalla completa — el haz se lee en el canvas puro y en los
gutters (misma lección P4.1); adelgazar el DOM de contacto queda como
recomendación editorial, no bloquea.

## 4. Decision Engine

| Alternativa | Veredicto |
|---|---|
| Shaft cilíndrico con textura de falloff radial | Rechazada — la UV de un cilindro no da falloff radial sin shader; los 2 planos cruzados son el streak volumétrico clásico sin custom shaders (contrato) |
| Clúster + halo como Points separados | Rechazada — el halo hubiera sido un draw call extra; el glow del clúster con size 0.5 lee suficiente |
| Haz siempre visible | Rechazada — `connectionBeamStrength` lo gatea a S5 (0 antes de global 0.84) |
| Fotón se detiene en el nodo | Rechazada — el audit pedía el viaje por el haz; la partida es el cierre semántico |

## 5. Archivos

- `src/lib/datacenter.storyline.ts` — beam config + helpers + tramo S5 extendido + arrival/departure
- `src/lib/datacenter.storyline.test.ts` — 5 tests nuevos (colinealidad, strength, cluster, arrival/departure)
- `src/components/datacenter/ConnectionBeam.tsx` (nuevo)
- `src/components/datacenter/glowTexture.ts` (nuevo — glow compartido)
- `src/components/datacenter/StoryPhoton.tsx` — usa el glow compartido + departure
- `src/components/datacenter/DatacenterScene.tsx` — mount en el bloque no-LOW
- `artwork/living-datacenter/ab-photon.mjs` + `refcheck/p7e/` (probes y capturas)
