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
 *   S5 conn   — asciende por el pasillo y llega al nodo central (display SIEM
 *               de S5, [0, 2.0, -1.85] frente a la pantalla)
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
  // S5 connection — ascenso al nodo central
  [
    [3.2, -0.8, -4.8],
    [1.5, 0.6, -3.2],
    [0, 1.5, -2.5],
    [0, 2.0, -1.85],
  ],
]

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
 * Ventana de llegada (pulso del clímax): 0 antes, 1 en el nodo. Último 10% del
 * progreso global (el final del tramo de connection).
 */
export function photonArrival(global: number): number {
  return Math.min(1, Math.max(0, (global - 0.9) / 0.1))
}
