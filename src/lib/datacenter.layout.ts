/**
 * Layout del datacenter (SPEC §20, data-driven): racks, unidades, backup,
 * partículas, rutas de flujos y holograma. Los conteos se escalan por tier
 * de calidad (ULTRA → LOW). Coordenadas en el espacio de la escena.
 */
export type TierCounts = {
  corridorRows: number
  backgroundRows: number
  particles: number
  backupUnits: number
}

export const TIER_COUNTS: Record<'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC', TierCounts> = {
  ULTRA: { corridorRows: 6, backgroundRows: 3, particles: 1400, backupUnits: 8 },
  HIGH: { corridorRows: 5, backgroundRows: 2, particles: 900, backupUnits: 6 },
  MEDIUM: { corridorRows: 4, backgroundRows: 1, particles: 450, backupUnits: 4 },
  LOW: { corridorRows: 2, backgroundRows: 0, particles: 150, backupUnits: 2 },
  // STATIC no monta canvas (poster); los conteos quedan en 0 por consistencia
  STATIC: { corridorRows: 0, backgroundRows: 0, particles: 0, backupUnits: 0 },
}

/** Rack central de la Escena 1 (Boot Sequence): centro del bloque procedural
 * (1×2.4×0.9, anclado al centro). */
export const HERO_RACK_POS: [number, number, number] = [0, 1.2, 0]

/** Base del GLB del rack hero: los GLB se autorizan origen-en-base
 * (ASSET-PIPELINE §5) — la base debe quedar en el piso (y=0), NO en el centro
 * como el bloque procedural. Sin este offset el rack GLB flota +1.2. */
export const HERO_RACK_GLB_POS: [number, number, number] = [0, 0, 0]

/**
 * Manifesto de assets GLB (ASSET-PIPELINE.md §8). `null` = geometría
 * procedural (default). Al añadir un asset a `/public/assets/3d/`, asignar su
 * ruta aquí: el slot (`GlbAsset`) lo intenta con fallback procedural (SPEC §37),
 * y `?dc-glb=<nombre>` permite forzarlo en runtime para QA.
 *
 * GLBs generados por `scripts/gen-assets.mjs` (gates de autoría + payload < 3 MB).
 * `heroRack` y `storageUnit` tienen slot en la escena; `networkSwitch` y
 * `siemDisplay` se montarán con `ServerSwitchPool`/`SiemDisplayPanel`
 * (ASSET-SCENE-MAP §5) — el manifiesto ya los declara listos.
 *
 * Outputs Tripo promovidos (SPEC §52): `server_rack_v03` (S1 hero) y
 * `storage_unit_v02` (S4 protagonista, ex-Catalyst reasignado). El switch
 * vuelve al v01 1U procedural hasta que exista un output real de switch.
 */
export const GLB_ASSETS: {
  heroRack: string | null
  networkSwitch: string | null
  storageUnit: string | null
  siemDisplay: string | null
} = {
  heroRack: '/assets/3d/server_rack_v03.glb',
  networkSwitch: '/assets/3d/network_switch_v01.glb',
  storageUnit: '/assets/3d/storage_unit_v02.glb',
  siemDisplay: '/assets/3d/siem_display_v01.glb',
}

/** Unidades (servidores) por rack del pasillo. */
export const UNIT_OFFSETS: [number, number, number][] = [
  [0, -1.0, 0.18],
  [0, -0.5, 0.18],
  [0, 0, 0.18],
  [0, 0.5, 0.18],
  [0, 1.0, 0.18],
]

/** Unidades del rack hero (8, más denso). */
export const HERO_UNIT_OFFSETS: [number, number, number][] = [
  [0, -1.12, 0.18],
  [0, -0.8, 0.18],
  [0, -0.48, 0.18],
  [0, -0.16, 0.18],
  [0, 0.16, 0.18],
  [0, 0.48, 0.18],
  [0, 0.8, 0.18],
  [0, 1.12, 0.18],
]

const CORRIDOR_Z = [-2.5, -4.7, -6.9, -9.1, -11.3, -13.5]

/** Racks del pasillo (Escenas 2–3), ambos lados del corredor. */
export const CORRIDOR_RACKS: { position: [number, number, number]; color: string }[] = CORRIDOR_Z.flatMap((z, i) => [
  { position: [-2.6, 1.2, z], color: i % 2 === 0 ? '#0d1524' : '#0a1120' },
  { position: [2.6, 1.2, z], color: i % 2 === 0 ? '#0a1120' : '#0d1524' },
])

const BG_Z = [-3.5, -7.5, -11.5]

/** Filas de fondo (más tenues). */
export const BACKGROUND_RACKS: { position: [number, number, number]; scale: number; color: string }[] = BG_Z.flatMap((z) => [
  { position: [-5.4, 1.2, z], scale: 0.7, color: '#070d18' },
  { position: [5.4, 1.2, z], scale: 0.7, color: '#070d18' },
])

/** Unidades de backup / mass storage (Escena 4, nivel inferior). */
export const BACKUP_UNITS: { position: [number, number, number]; scale: [number, number, number] }[] = [
  { position: [0, -2.4, -4], scale: [1.8, 1, 1.2] },
  { position: [3.2, -2.4, -6], scale: [1.8, 1, 1.2] },
  { position: [-3.2, -2.4, -6], scale: [1.8, 1, 1.2] },
  { position: [1.6, -2.4, -9], scale: [1.8, 1, 1.2] },
  { position: [-1.6, -2.4, -9], scale: [1.8, 1, 1.2] },
  { position: [4.6, -2.4, -3], scale: [1.6, 0.9, 1] },
  { position: [-4.6, -2.4, -3], scale: [1.6, 0.9, 1] },
  { position: [0, -2.4, -12], scale: [2, 1.1, 1.4] },
]

/** Switches 1U (ASSET-SCENE-MAP §5, gap G4): montados en la 1U superior de la
 * cara frontal de cada rack del corredor (S2-S5) — contexto decorativo con
 * LEDs estáticos (el detalle de puertos no es legible a distancia, §1b).
 * z = rack.z + 0.45 (frente) + 0.25 (media profundidad del chasis). */
export const SWITCH_SLOT_Y = 1.9
export const SWITCH_SLOT_Z_OFFSET = 0.7

export const SWITCH_SLOTS: { position: [number, number, number]; color: string }[] = CORRIDOR_RACKS.map((r) => ({
  position: [r.position[0], SWITCH_SLOT_Y, r.position[2] + SWITCH_SLOT_Z_OFFSET],
  color: '#16263f',
}))

/** Base del slot GLB del switch protagonista (S3, origen de data streams):
 * rack del corredor izquierdo frente a cámara. El v01 1U (0.82×0.07×0.5,
 * base-origin) asienta sobre la cara frontal del rack ([−2.6, 1.9, −1.8]
 * centro) — base en SWITCH_SLOT_Y − media 1U (0.035). El output Tripo que se
 * promovió aquí era un gabinete, no un switch: se reasignó a storage (S4),
 * el slot vuelve al v01 1U. */
export const SWITCH_PROTAGONIST_GLB_POS: [number, number, number] = [-2.6, SWITCH_SLOT_Y - 0.035, -2.5 + SWITCH_SLOT_Z_OFFSET]

/** Paneles SIEM (ASSET-SCENE-MAP §5, gap G4): display S3 (lectura de UI,
 * fit ~20% alto desktop — MESHY-CONTACT-SHEET §1b) + nodo central S5 (pulso,
 * bajo el CopilotNode). Footprint 1.62×0.9×0.12, pantalla a +z, base-origin. */
export const DISPLAY_SLOTS: { position: [number, number, number]; scene: number }[] = [
  { position: [0, 1.35, -2.0], scene: 2 },
  { position: [0, 2.0, -2.0], scene: 4 },
]

/** Rutas de flujos de datos (Escena 3). */
export const STREAM_PATHS: [number, number, number][][] = [
  [[-2.6, 1.7, -2.5], [-2.6, 1.7, -6.9], [-2.6, 1.7, -13.5]],
  [[2.6, 1.7, -13.5], [2.6, 1.7, -6.9], [2.6, 1.7, -2.5]],
  [[0, 1.5, 0], [0, 2.2, -1], [0, 3.2, -2]],
]

/** Caja de partículas de polvo ambiental. */
export const PARTICLES_BOX = { min: [-7, -3, -10], max: [7, 5, 2] }

/** Muestrea un path lineal por tramos en t ∈ [0,1]. */
export function samplePath(path: [number, number, number][], t: number): [number, number, number] {
  const tt = Math.min(1, Math.max(0, t))
  if (path.length === 1) return path[0]
  const seg = tt * (path.length - 1)
  const i = Math.min(path.length - 2, Math.floor(seg))
  const f = seg - i
  const a = path[i]
  const b = path[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}
