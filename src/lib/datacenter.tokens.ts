/**
 * Tokens centralizados del Living Datacenter (SPEC §3).
 * Nunca hardcodear valores visuales dispersos: colores, luz, fog y motion
 * viven acá. Semántica de color: BLUE = infraestructura/datos,
 * AMBER = resiliencia/auditoría, RED = incidente, CYAN = flujos de datos.
 */
export const DATACENTER_TOKENS = {
  colors: {
    // P0 audit de diseño: fondo unificado DOM↔3D y azul instrumental (#4DA3FF,
    // mismo hue, menos chroma que el dodger #1E90FF plantilla). Champagne para
    // el clímax de conexión (S5/hero). El resto de la semántica no cambia.
    bg: '#04080f',
    primaryCold: '#4DA3FF',
    secondaryBlue: '#38bdf8',
    dataCyan: '#22d3ee',
    securityAmber: '#f59e0b',
    warningRed: '#ef4444',
    gold: '#E8D5AC',
    white: '#ffffff',
  },
  fog: {
    near: 16,
    far: 40,
  },
  camera: {
    lambda: 3.2,
    maxDelta: 0.1,
    settleMs: 650,
  },
} as const

/**
 * Phase Gate (P2 — firma del sitio): temperatura de color por fase para el
 * overlay DOM fijo z-30. El índice del array sigue el orden de `SCENES`
 * (boot → architecture → data-in-motion → resilience → connection) y por
 * tanto el índice del store `activeScene` (0-4). Arco azul → cian → ámbar →
 * champagne; `edgeAlpha` es la intensidad del tinte en el borde del frame
 * (el centro queda casi limpio — la lectura del DOM Z-40 no se toca).
 */
export const PHASE_TINTS: ReadonlyArray<{
  sceneId: string
  color: string
  edgeAlpha: number
}> = [
  { sceneId: 'boot', color: '#4DA3FF', edgeAlpha: 0.16 },
  { sceneId: 'architecture', color: '#38bdf8', edgeAlpha: 0.17 },
  { sceneId: 'data-in-motion', color: '#22d3ee', edgeAlpha: 0.19 },
  { sceneId: 'resilience', color: '#f59e0b', edgeAlpha: 0.17 },
  { sceneId: 'connection', color: '#E8D5AC', edgeAlpha: 0.26 },
]
