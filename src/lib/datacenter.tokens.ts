/**
 * Tokens centralizados del Living Datacenter (SPEC §3).
 * Nunca hardcodear valores visuales dispersos: colores, luz, fog y motion
 * viven acá. Semántica de color: BLUE = infraestructura/datos,
 * AMBER = resiliencia/auditoría, RED = incidente, CYAN = flujos de datos.
 */
export const DATACENTER_TOKENS = {
  colors: {
    bg: '#050b14',
    primaryCold: '#1E90FF',
    secondaryBlue: '#38bdf8',
    dataCyan: '#22d3ee',
    securityAmber: '#f59e0b',
    warningRed: '#ef4444',
    gold: '#C5A46D',
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
