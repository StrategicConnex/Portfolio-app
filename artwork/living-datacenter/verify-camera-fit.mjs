#!/usr/bin/env node
/**
 * Verificación cámara ↔ footprint del slot (MESHY-CONTACT-SHEET).
 *
 * Proyecta el bbox de cada footprint por los waypoints entry/mid/exit de su
 * escena (scenes.ts) y reporta encuadre en NDC (frustum de perspectiva real,
 * lookAt basis, fov vertical). Dos aspectos de viewport: 16:9 desktop y 9:16
 * mobile (el canvas es full-screen Z-20 detrás del DOM).
 *
 * Posiciones reales (layout): rack hero S1 base [0,0,0]; storage S4 centro
 * [0,-2.4,-4]. Posiciones PLANIFICADAS (docs, pools sin crear): switch S3 en
 * el rack del corredor más cercano [-2.6,1.2,-2.5] (cara frontal); display S5
 * en el nodo central [0,1.5,-2] (pantalla a +z).
 *
 *   node artwork/living-datacenter/verify-camera-fit.mjs
 */
const ASPECTS = { desktop: 16 / 9, mobile: 9 / 16 }

// Waypoints por escena (src/lib/scenes.ts — solo las escenas del check)
const CAM = {
  S1: { name: 'Boot (rack hero)', waypoints: [
    { name: 'entry', pos: [0, 1, 20], look: [0, 0.5, 0], fov: 35 },
    { name: 'mid',   pos: [0, 1, 13], look: [0, 0.5, 0], fov: 42 },
    { name: 'exit',  pos: [0, 1.2, 9], look: [0, 0.5, -1], fov: 48 },
  ] },
  S3: { name: 'Data in motion (switch)', waypoints: [
    { name: 'entry', pos: [1.5, 1.8, 6], look: [0, 1, -2], fov: 52 },
    { name: 'mid',   pos: [2.5, 1.6, 3.5], look: [0, 1, -0.5], fov: 45 },
    { name: 'exit',  pos: [1, 0.8, 3], look: [-1, 0.5, 0], fov: 42 },
  ] },
  S4: { name: 'Resilience (storage)', waypoints: [
    // 2026-08-11 (gap G4): fit corregido — el entry desciende mirando a la
    // línea de storage y el mid se acerca (sync con src/lib/scenes.ts).
    { name: 'entry', pos: [0, -0.5, 3.2], look: [0, -1.2, -2], fov: 50 },
    { name: 'mid',   pos: [0, -1.5, 3.2], look: [0, -1.8, -2.5], fov: 55 },
    { name: 'exit',  pos: [0, -1, 7], look: [0, -0.5, -2], fov: 58 },
  ] },
  S5: { name: 'Connection (display)', waypoints: [
    { name: 'entry', pos: [0, -0.5, 8], look: [0, 0, -1.5], fov: 55 },
    { name: 'mid',   pos: [1.5, 4.5, 12], look: [0, 0.5, -3], fov: 58 },
    { name: 'exit',  pos: [0, 6.5, 15], look: [0, 0, -4], fov: 60 },
  ] },
}

// Footprints: centro + media-extensión (w/2, h/2, d/2) en unidades de escena
const ASSETS = [
  { id: 'rack',     name: 'Rack 42U',     scene: 'S1', center: [0, 1.2, 0],     half: [0.5, 1.2, 0.45], status: 'REAL (GLB v02 vivo)' },
  { id: 'storage',  name: 'Storage 2U-4U', scene: 'S4', center: [0, -2.4, -4],   half: [0.9, 0.5, 0.6],  status: 'REAL (GLB v01 vivo) — fit S4 corregido G4' },
  { id: 'switch',   name: 'Switch 1U',    scene: 'S3', center: [-2.6, 1.9, -1.8], half: [0.41, 0.035, 0.25], status: 'REAL (ServerSwitchPool G4)' },
  { id: 'display',  name: 'Display SIEM', scene: 'S5', center: [0, 2.0, -2.0],  half: [0.81, 0.45, 0.06], status: 'REAL (SiemDisplayPanel G4)' },
]

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l] }

function project(wp, center, half, aspect) {
  const f = norm(sub(wp.look, wp.pos))
  const right = norm(cross(f, [0, 1, 0]))
  const up = cross(right, f)
  const tanH = Math.tan((wp.fov * Math.PI) / 360)
  const ndcs = []
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const q = [center[0] + sx * half[0], center[1] + sy * half[1], center[2] + sz * half[2]]
    const d = sub(q, wp.pos)
    const zc = dot(d, f)
    if (zc <= 0) return null // algún vértice detrás de la cámara
    const xc = dot(d, right)
    const yc = dot(d, up)
    ndcs.push([xc / (zc * tanH * aspect), yc / (zc * tanH)])
  }
  const xs = ndcs.map((p) => p[0]), ys = ndcs.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const wPct = ((maxX - minX) / 2) * 100, hPct = ((maxY - minY) / 2) * 100
  const inFrame = minX >= -1 && maxX <= 1 && minY >= -1 && maxY <= 1
  return { minX, maxX, minY, maxY, wPct, hPct, inFrame }
}

for (const a of ASSETS) {
  console.log(`\n━━━ ${a.name} — ${a.scene} (${a.status}) ━━━`)
  if (a.id === 'display') {
    // Check adicional: panel SIEM de S3 (slot real [0,1.35,-2.0]) — cámara cercana
    console.log('  · S3 (panel SIEM [0,1.35,-2.0], cámara cercana):')
    const s3Center = [0, 1.35, -2.0]
    for (const [aspName, aspect] of Object.entries(ASPECTS)) {
      for (const wp of CAM.S3.waypoints) {
        const r = project(wp, s3Center, a.half, aspect)
        if (!r) { console.log(`    ${aspName} ${wp.name.padEnd(6)} ✗ detrás de cámara`); continue }
        const fit = r.inFrame ? 'en frame' : 'FUERA DE FRAME'
        console.log(`    ${aspName.padEnd(7)} ${wp.name.padEnd(6)} ${fit.padEnd(14)} %ancho ${r.wPct.toFixed(1).padStart(5)}  %alto ${r.hPct.toFixed(1).padStart(5)}`)
      }
    }
  }
  for (const [aspName, aspect] of Object.entries(ASPECTS)) {
    console.log(`  · viewport ${aspName} (${aspect.toFixed(2)}:1)`)
    for (const wp of CAM[a.scene].waypoints) {
      const r = project(wp, a.center, a.half, aspect)
      if (!r) { console.log(`    ${wp.name.padEnd(6)} ✗ vértice detrás de la cámara`); continue }
      const fit = r.inFrame ? 'en frame' : 'FUERA DE FRAME'
      console.log(
        `    ${wp.name.padEnd(6)} ${fit.padEnd(14)} %ancho ${r.wPct.toFixed(1).padStart(5)}  %alto ${r.hPct.toFixed(1).padStart(5)}  ` +
        `bbox x[${r.minX.toFixed(2)},${r.maxX.toFixed(2)}] y[${r.minY.toFixed(2)},${r.maxY.toFixed(2)}]`
      )
    }
  }
}
