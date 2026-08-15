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
