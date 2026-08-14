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
