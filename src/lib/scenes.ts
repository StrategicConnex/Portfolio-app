/**
 * Config data-driven de las 5 escenas (SPEC §5, §20).
 * Las secciones usan los IDs reales del sitio. La cámara interpola
 * entry → mid → exit por escena con easing exponencial (SPEC §6).
 * Nada de `if section === …` disperso: los eventos visuales se declaran acá.
 */
export type CameraWaypoint = {
  position: [number, number, number]
  lookAt: [number, number, number]
  fov: number
}

export type SceneConfig = {
  id: string
  sections: string[]
  camera: {
    entry: CameraWaypoint
    mid: CameraWaypoint
    exit: CameraWaypoint
  }
  fog: { near: number; far: number }
  visualEvents: string[]
}

export const SCENES: SceneConfig[] = [
  {
    id: 'boot',
    sections: ['home'],
    camera: {
      entry: { position: [0, 1, 20], lookAt: [0, 0.5, 0], fov: 35 },
      mid: { position: [0, 1, 13], lookAt: [0, 0.5, 0], fov: 42 },
      exit: { position: [0, 1.2, 9], lookAt: [0, 0.5, -1], fov: 48 },
    },
    fog: { near: 14, far: 34 },
    visualEvents: ['emergeRack', 'activateParticles'],
  },
  {
    id: 'architecture',
    sections: ['perfil', 'arquitectura', 'stack', 'confianza'],
    camera: {
      entry: { position: [0, 1.4, 9], lookAt: [0, 0.5, -1], fov: 48 },
      mid: { position: [0, 1.8, 7], lookAt: [0, 0.5, -2], fov: 50 },
      exit: { position: [1.5, 1.8, 6], lookAt: [0, 1, -2], fov: 52 },
    },
    fog: { near: 12, far: 30 },
    visualEvents: ['showCorridor', 'activateTopology'],
  },
  {
    id: 'data-in-motion',
    sections: ['experiencia', 'proyecto', 'certificaciones', 'siem'],
    camera: {
      entry: { position: [1.5, 1.8, 6], lookAt: [0, 1, -2], fov: 52 },
      mid: { position: [2.5, 1.6, 3.5], lookAt: [0, 1, -0.5], fov: 45 },
      exit: { position: [1, 0.8, 3], lookAt: [-1, 0.5, 0], fov: 42 },
    },
    fog: { near: 9, far: 26 },
    visualEvents: ['activateDataStreams', 'activateTelemetry', 'focusSecurityNode'],
  },
  {
    id: 'resilience',
    sections: ['audit-hub', 'scaudit', 'blog'],
    camera: {
      // Fit del storage protagonista (MESHY-CONTACT-SHEET §1b, gap G4): el entry
      // anterior (y=0.8 mirando al centro) dejaba la unidad FUERA del frustum en
      // la 1ª mitad de la escena; ahora la cámara desciende desde el inicio
      // mirando a la línea de storage (y≈-2.4) y el mid se acerca (z=3.2).
      entry: { position: [0, -0.5, 3.2], lookAt: [0, -1.2, -2], fov: 50 },
      mid: { position: [0, -1.5, 3.2], lookAt: [0, -1.8, -2.5], fov: 55 },
      exit: { position: [0, -1, 7], lookAt: [0, -0.5, -2], fov: 58 },
    },
    fog: { near: 8, far: 24 },
    visualEvents: ['activateBackupUnits', 'warmLighting'],
  },
  {
    id: 'connection',
    sections: ['contacto'],
    camera: {
      // Ascenso y giro: desde el nivel bajo hacia una vista amplia ALTA y
      // oblicua que revela el datacenter completo (mirar a lo largo del
      // corredor desde z=18 veía los racks de punta — clímax sin lectura).
      entry: { position: [0, -0.5, 8], lookAt: [0, 0, -1.5], fov: 55 },
      mid: { position: [1.5, 4.5, 12], lookAt: [0, 0.5, -3], fov: 58 },
      exit: { position: [0, 6.5, 15], lookAt: [0, 0, -4], fov: 60 },
    },
    // Fog amplio: el pull-back final debe REVELAR el datacenter completo
    // (la cámara está a z 14-18; near 20/far 44 niebla todo — clímax oscuro).
    fog: { near: 18, far: 55 },
    visualEvents: ['synchronizeLights', 'pulseCentralNode'],
  },
]

export const ALL_SECTIONS: string[] = SCENES.flatMap((s) => s.sections)

export function resolveSceneForSection(sectionIndex: number): SceneConfig | null {
  if (sectionIndex < 0 || sectionIndex >= ALL_SECTIONS.length) return null
  const id = ALL_SECTIONS[sectionIndex]
  return SCENES.find((s) => s.sections.includes(id)) ?? null
}

/**
 * Progreso dentro de la escena: posición de la sección dentro de la escena
 * + progreso de la sección, normalizado al total de secciones de la escena.
 */
export function computeSceneProgress(scene: SceneConfig, sectionIndex: number, sectionProgress: number): number {
  const within = scene.sections.indexOf(ALL_SECTIONS[sectionIndex])
  if (within === -1) return 0
  return Math.min(1, Math.max(0, (within + sectionProgress) / scene.sections.length))
}

/** Interpola entry→mid→exit según el progreso de la escena (0..1). */
export function interpolateWaypoints(
  camera: SceneConfig['camera'],
  progress: number,
): { position: [number, number, number]; lookAt: [number, number, number]; fov: number } {
  const p = Math.min(1, Math.max(0, progress))
  const from = p < 0.5 ? camera.entry : camera.mid
  const to = p < 0.5 ? camera.mid : camera.exit
  const t = p < 0.5 ? p * 2 : (p - 0.5) * 2
  const lerp = (a: number, b: number) => a + (b - a) * t
  return {
    position: [lerp(from.position[0], to.position[0]), lerp(from.position[1], to.position[1]), lerp(from.position[2], to.position[2])],
    lookAt: [lerp(from.lookAt[0], to.lookAt[0]), lerp(from.lookAt[1], to.lookAt[1]), lerp(from.lookAt[2], to.lookAt[2])],
    fov: lerp(from.fov, to.fov),
  }
}
