/**
 * Storyline del Living Datacenter (P7a + P7c, audit de narrativa):
 * data-driven, sin `if section === …` dispersos (SPEC §20).
 *
 * P7c — EJE PURDUE (IEC 62443): cada escena declara el nivel del modelo
 * Purdue donde vive la cámara. El recorrido entra desde el dominio empresarial
 * (L4), baja a operaciones (L3), cruza la frontera de seguridad (L3.5 DMZ),
 * desciende al nivel protegido (L1 control) y emerge hacia el mundo (L5).
 * El HUD lo muestra como `NIVEL 0X · NOMBRE` junto al `FASE 0n/05`.
 *
 * P7a — FAILOVER (semántica de red real): en S4 (resilience) dos rutas gemelas
 * A (replicación primaria) y B (respaldo) ejecutan un evento determinístico
 * por progreso de scroll: A degrada (ámbar), muere, el tráfico se re-encamina
 * visiblemente a B, A se recupera y todo vuelve al estado normal. La
 * resiliencia se CUENTA (corte → reroute → resync), no solo se tiñe.
 */

export type PurdueRef = { level: string; nameKey: string }

export const PURDUE_BY_SCENE: PurdueRef[] = [
  { level: '04', nameKey: 'dc.purdue.enterprise' }, // S1 boot — el sitio que nace
  { level: '03', nameKey: 'dc.purdue.operations' }, // S2 core — el piso de operaciones (Purdue)
  { level: '03.5', nameKey: 'dc.purdue.dmz' }, // S3 data — la frontera donde se vigila el tráfico
  { level: '01', nameKey: 'dc.purdue.control' }, // S4 resilience — el descenso al nivel protegido
  { level: '05', nameKey: 'dc.purdue.internet' }, // S5 connection — el nodo hacia el mundo
]

/** Referencia Purdue de una escena (null si fuera de rango). */
export function purdueForScene(sceneIndex: number): PurdueRef | null {
  return PURDUE_BY_SCENE[sceneIndex] ?? null
}

/** Estados del failover (misma semántica para ambas rutas; los targets de
 *  material difieren por ruta — ver FailoverStreams). */
export type FailoverState = 'normal' | 'fault' | 'dead' | 'recover' | 'restored'

export type FailoverSnapshot = { primary: FailoverState; backup: FailoverState }

/** Timeline del evento por progreso de la escena S4 (0..1). */
export const FAILOVER_TIMELINE = {
  faultStart: 0.3, // A degrada (ámbar), B despierta
  deadStart: 0.48, // A oscura, B transporta todo
  recoverStart: 0.62, // A se recupera, B vuelve a standby
  restored: 0.8, // estado normal restaurado
} as const

/** Resuelve el estado del failover según el progreso (determinístico por
 *  scroll, clamp en [0,1] — reversible al scrollear hacia atrás). */
export function failoverEvent(sceneProgress: number): FailoverSnapshot {
  const p = Math.min(1, Math.max(0, sceneProgress))
  if (p < FAILOVER_TIMELINE.faultStart) return { primary: 'normal', backup: 'normal' }
  if (p < FAILOVER_TIMELINE.deadStart) return { primary: 'fault', backup: 'fault' }
  if (p < FAILOVER_TIMELINE.recoverStart) return { primary: 'dead', backup: 'dead' }
  if (p < FAILOVER_TIMELINE.restored) return { primary: 'recover', backup: 'recover' }
  return { primary: 'restored', backup: 'restored' }
}

/**
 * P7d — FOTÓN (hilo de continuidad del storyline): una partícula de luz que
 * nace en el boot, viaja con los streams de data, SOBREVIVE al failover de
 * resilience (cabalgando la ruta B, la superviviente) y llega al nodo central
 * en connection. Un único path continuo (5 tramos, uno por escena, conectados
 * extremo-a-extremo) parametrizado por progreso GLOBAL — el fotón nunca salta
 * en las fronteras de escena.
 *
 * Cada tramo está anclado a la geometría real del layout:
 *   S1 boot   — nace en la cara frontal del rack hero (y 0.35) y asciende
 *   S2 core   — viaja por el pasillo sobre los anillos KPI (x=0, z=-1.6)
 *   S3 data   — cabalga el stream izquierdo (x=-2.6, y=1.7, como STREAM_PATHS),
 *               cruza el pasillo (hop este-oeste) y empieza a descender
 *   S4 res    — desciende al nivel de storage y recorre la RUTA B del failover
 *               ([-4.6,-1.75,-6.4]→[0,-1.75,-7.2]→[4.6,-1.75,-6.4] — la misma
 *               geometría de FailoverStreams: el fotón sobrevive porque va en
 *               la ruta que transporta todo durante la ventana dead)
 *   S5 conn   — asciende por el pasillo, llega al nodo central (display SIEM
 *               de S5, [0, 2.0, -1.85] frente a la pantalla) y CONTINÚA por el
 *               haz hacia el clúster distante (P7e): los últimos 2 puntos del
 *               tramo son colineales con BEAM_ORIGIN→BEAM_TARGET (testeado) —
 *               el fotón enciende el haz y viaja por él hacia la red.
 */
export const PHOTON_SEGMENTS: [number, number, number][][] = [
  // S1 boot — nacimiento en el rack hero. El tramo va DELANTE del rack
  // (z ≥ 0.62 > cara frontal z≈0.45): el GLB hero es opaco y si el fotón
  // pasara a z<0.45 quedaría oculto detrás de la cara frontal.
  [
    [0, 0.35, 0.62],
    [0, 1.5, 0.62],
    [0, 2.35, 0.45],
  ],
  // S2 core — viaje por el pasillo
  [
    [0, 2.35, 0.45],
    [0, 2.3, -1.5],
    [0.4, 1.9, -2.5],
  ],
  // S3 data — stream izquierdo + hop este-oeste + descenso
  [
    [0.4, 1.9, -2.5],
    [-2.2, 1.7, -4.7],
    [-2.6, 1.7, -6.9],
    [0, 1.6, -6.9],
    [2.6, 1.7, -6.9],
    [0, 0.8, -6.4],
  ],
  // S4 resilience — ruta B del failover (la superviviente)
  [
    [0, 0.8, -6.4],
    [0, -1.6, -6.4],
    [-4.6, -1.75, -6.4],
    [0, -1.75, -7.2],
    [4.6, -1.75, -6.4],
    [3.2, -0.8, -4.8],
  ],
  // S5 connection — ascenso al nodo central y partida por el haz (P7e)
  // (los 2 últimos puntos son colineales con el haz — el fotón viaja por él)
  [
    [3.2, -0.8, -4.8],
    [1.5, 0.6, -3.2],
    [0, 1.5, -2.5],
    [0, 2.0, -1.85],
    [-2.25, 2.45, -11.82],
    [-4, 2.8, -19.57],
  ],
]

/** Progreso GLOBAL en el que el fotón está en el nodo central (índice del nodo
 *  sobre el path total): el bloom de llegada (P7d) y la partida por el haz
 *  (P7e) se anclan a esta constante, no a literales dispersos. */
export const PHOTON_NODE_GLOBAL = 21 / 23

/**
 * P7e — CONEXIÓN COMO WAN (el clímax): el nodo central de S5 enciende un haz
 * de luz hacia un clúster distante fuera de frame — el resto de la red — al
 * borde de la niebla (fog S5 near 18 / far 55). El datacenter es UN nodo, no
 * el mundo; el reveal diagonal del P3 muestra el haz emergiendo del nodo y
 * desvaneciéndose en lo desconocido.
 */
export const BEAM_ORIGIN: [number, number, number] = [0, 2.0, -1.85]
export const BEAM_TARGET: [number, number, number] = [-5, 3, -24]

/** Puntos del clúster distante (la "granja" de la red, al borde de la niebla):
 *  retícula 4×3 con jitter determinístico alrededor del target. */
export function beamClusterPoints(count = 12): [number, number, number][] {
  const pts: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const col = i % 4
    const row = Math.floor(i / 4)
    const jx = ((i * 37) % 10) / 10 - 0.5
    const jy = ((i * 53) % 10) / 10 - 0.5
    pts.push([
      BEAM_TARGET[0] - 1.35 + col * 0.9 + jx * 0.35,
      BEAM_TARGET[1] - 0.7 + row * 0.55 + jy * 0.3,
      BEAM_TARGET[2] + jx * 0.4,
    ])
  }
  return pts
}

/** Intensidad del haz (0 antes de S5, 1 en el reveal completo): ventana
 *  determinística por progreso global — el haz se enciende cuando la cámara
 *  del reveal diagonal ya está de vuelta (sp ≈ 0.2 de connection). */
export function connectionBeamStrength(global: number): number {
  return Math.min(1, Math.max(0, (global - 0.84) / 0.1))
}

/** Punto a lo largo del haz (0 = origen/nodo, 1 = target/clúster) — la misma
 *  línea que recorre el fotón en su último tramo (colinealidad testeada). */
export function beamPointAlong(t: number): [number, number, number] {
  const tt = Math.min(1, Math.max(0, t))
  return [
    BEAM_ORIGIN[0] + (BEAM_TARGET[0] - BEAM_ORIGIN[0]) * tt,
    BEAM_ORIGIN[1] + (BEAM_TARGET[1] - BEAM_ORIGIN[1]) * tt,
    BEAM_ORIGIN[2] + (BEAM_TARGET[2] - BEAM_ORIGIN[2]) * tt,
  ]
}

/**
 * Arco de temperatura del fotón (mismo arco del Phase Gate, SPEC §3):
 * azul (nacimiento) → cian (los streams) → ámbar (el nivel protegido) →
 * champagne (la llegada). La identidad del fotón ES el arco del sitio en una
 * sola partícula.
 */
export const PHOTON_COLOR_BY_SCENE: string[] = [
  '#8fb7ff', // S1 boot — azul instrumental
  '#7fd4e8', // S2 core — transición
  '#22d3ee', // S3 data — cian de los streams
  '#f59e0b', // S4 resilience — ámbar del nivel protegido
  '#E8D5AC', // S5 connection — champagne de la llegada
]

/**
 * Path continuo del fotón: concatenación de los 5 tramos (los tramos están
 * autorados conectados extremo-a-extremo, así que `samplePath` nunca salta
 * en las fronteras de escena — el contrato de continuidad lo testea la suite).
 */
export function buildPhotonPath(): [number, number, number][] {
  return PHOTON_SEGMENTS.flat()
}

/**
 * Progreso GLOBAL del fotón (0..1): el viaje completo. Cada escena aporta
 * 1/5 del progreso, con el progreso interno de la escena (computeSceneProgress)
 * interpolando dentro de su tramo. Clamps por seguridad; fuera de rango
 * (antes de la primera sección) el fotón espera en su nacimiento.
 */
export function photonGlobalProgress(sceneIndex: number, sceneProgress: number): number {
  if (sceneIndex < 0) return 0
  if (sceneIndex >= PHOTON_SEGMENTS.length) return 1
  const p = Math.min(1, Math.max(0, sceneProgress))
  return Math.min(1, Math.max(0, (sceneIndex + p) / PHOTON_SEGMENTS.length))
}

/**
 * El momento del failover (P7a) modula al fotón (P7d): durante la ventana
 * `dead` el fotón es EL portador — brilla más (intensidad + tamaño). El fotón
 * sobrevive porque va en la ruta B; el evento lo subraya con un pulso de
 * intensidad, sin cambiar su identidad.
 */
export function photonFailoverTint(state: FailoverState): { sizeBoost: number; opacityBoost: number } {
  switch (state) {
    case 'fault':
      return { sizeBoost: 0.08, opacityBoost: 0.06 }
    case 'dead':
      return { sizeBoost: 0.28, opacityBoost: 0.22 }
    case 'recover':
      return { sizeBoost: 0.12, opacityBoost: 0.1 }
    default:
      return { sizeBoost: 0, opacityBoost: 0 }
  }
}

/**
 * P7a.1 — MOVIMIENTO DEL FAILOVER (el corte se hace físico, no solo de
 * color): además del material, la ruta A modula la VELOCIDAD de su tráfico y
 * su RE-RUTEO hacia la ruta B durante la ventana del evento:
 *   normal   — A fluye normal (speed 1), todo en su ruta (reroute 0)
 *   fault    — A se degrada: su tráfico se LENTIFICA (speed 0.35) y empieza
 *              a derivar visiblemente hacia B (reroute 0.35) — el ámbar en
 *              movimiento entre las filas cuenta el comienzo del corte
 *   dead     — A se detiene (speed 0) y su tráfico quedó re-encaminado en B
 *              (reroute 1): la fila frontal queda VACÍA — el corte es físico
 *   recover  — A se recupera: el tráfico vuelve a su ruta (reroute 0.5) y
 *              reanuda el flujo (speed 0.6)
 *   restored — estado normal
 * Los puntos de B fluyen SIEMPRE (es el respaldo que toma el control).
 */
export type FailoverMotion = { speedA: number; reroute: number }

export function failoverMotion(state: FailoverState): FailoverMotion {
  switch (state) {
    case 'fault':
      return { speedA: 0.35, reroute: 0.35 }
    case 'dead':
      return { speedA: 0, reroute: 1 }
    case 'recover':
      return { speedA: 0.6, reroute: 0.5 }
    default:
      return { speedA: 1, reroute: 0 }
  }
}

/**
 * Ventana de llegada (pulso del clímax, P7d): el bloom sube al llegar al nodo
 * central (PHOTON_NODE_GLOBAL) y se desvanece cuando el fotón parte por el haz
 * (P7e). 0 antes de la ventana, 1 exactamente en el nodo, 0 al partir.
 */
export function photonArrival(global: number): number {
  const g = Math.min(1, Math.max(0, global))
  const rise = Math.min(1, Math.max(0, (g - 0.84) / (PHOTON_NODE_GLOBAL - 0.84)))
  const fade = 1 - Math.min(1, Math.max(0, (g - PHOTON_NODE_GLOBAL) / 0.05))
  return rise * fade
}

/** Partida por el haz (P7e): 0 en el nodo central, 1 en el clúster distante —
 *  el fotón continúa el viaje más allá del datacenter, hacia la red. */
export function photonDeparture(global: number): number {
  return Math.min(1, Math.max(0, (global - PHOTON_NODE_GLOBAL) / (1 - PHOTON_NODE_GLOBAL)))
}
