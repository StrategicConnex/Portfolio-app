/**
 * Probe determinístico del fotón (P7d): replica la cámara del runtime
 * (interpolateWaypoints de scenes.ts) + la proyección perspectiva y examina
 * el crop EXACTO de pantalla donde debe estar el fotón según su posición de
 * mundo determinística (samplePath sobre el path continuo, con el progreso
 * de sección real evaluado en-page).
 * Uso: node probe-photon.mjs [base]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'

const base = process.argv[2] || 'http://localhost:3100'

// Replica de scenes.ts (S1 y S4 — las dos escenas de interés)
const SCENES = {
  boot: {
    camera: {
      entry: { position: [0, 1, 20], lookAt: [0, 0.5, 0], fov: 35 },
      mid: { position: [0, 1, 13], lookAt: [0, 0.5, 0], fov: 42 },
      exit: { position: [0, 1.2, 9], lookAt: [0, 0.5, -1], fov: 48 },
    },
  },
  resilience: {
    camera: {
      entry: { position: [0, -0.5, 3.2], lookAt: [0, -1.2, -2], fov: 50 },
      mid: { position: [0, -1.5, 3.2], lookAt: [0, -1.8, -2.5], fov: 55 },
      exit: { position: [0, -1, 7], lookAt: [0, -0.5, -2], fov: 58 },
    },
  },
  connection: {
    camera: {
      entry: { position: [0, -0.5, 8], lookAt: [0, 0, -1.5], fov: 55 },
      mid: { position: [2, 4.5, 12], lookAt: [-0.6, 0.5, -3], fov: 58 },
      exit: { position: [1.6, 6.5, 15], lookAt: [-0.8, 0, -4], fov: 60 },
    },
  },
}

function interp(cam, p) {
  const q = Math.min(1, Math.max(0, p))
  const from = q < 0.5 ? cam.entry : cam.mid
  const to = q < 0.5 ? cam.mid : cam.exit
  const t = q < 0.5 ? q * 2 : (q - 0.5) * 2
  const lerp = (a, b) => a + (b - a) * t
  return {
    position: [lerp(from.position[0], to.position[0]), lerp(from.position[1], to.position[1]), lerp(from.position[2], to.position[2])],
    lookAt: [lerp(from.lookAt[0], to.lookAt[0]), lerp(from.lookAt[1], to.lookAt[1]), lerp(from.lookAt[2], to.lookAt[2])],
    fov: lerp(from.fov, to.fov),
  }
}

function samplePath(path, t) {
  const tt = Math.min(1, Math.max(0, t))
  const seg = tt * (path.length - 1)
  const i = Math.min(path.length - 2, Math.floor(seg))
  const f = seg - i
  const a = path[i], b = path[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

// El path continuo (mismo que datacenter.storyline.ts)
const SEGMENTS = [
  [[0, 0.35, 0.62], [0, 1.5, 0.62], [0, 2.35, 0.45]],
  [[0, 2.35, 0.45], [0, 2.3, -1.5], [0.4, 1.9, -2.5]],
  [[0.4, 1.9, -2.5], [-2.2, 1.7, -4.7], [-2.6, 1.7, -6.9], [0, 1.6, -6.9], [2.6, 1.7, -6.9], [0, 0.8, -6.4]],
  [[0, 0.8, -6.4], [0, -1.6, -6.4], [-4.6, -1.75, -6.4], [0, -1.75, -7.2], [4.6, -1.75, -6.4], [3.2, -0.8, -4.8]],
  [[3.2, -0.8, -4.8], [1.5, 0.6, -3.2], [0, 1.5, -2.5], [0, 2.0, -1.85]],
]
const PATH = SEGMENTS.flat()

function project(world, cam, sw, sh) {
  const [px, py, pz] = cam.position
  const [lx, ly, lz] = cam.lookAt
  let fx = lx - px, fy = ly - py, fz = lz - pz
  const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl
  // right = normalize(cross(f, up(0,1,0)))
  let rx = fz, ry = 0, rz = -fx
  const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl
  // upv = cross(right, forward)
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx
  const cx = world[0] - px, cy = world[1] - py, cz = world[2] - pz
  const x = cx * rx + cy * ry + cz * rz
  const y = cx * ux + cy * uy + cz * uz
  const z = cx * fx + cy * fy + cz * fz
  if (z <= 0.1) return null
  const focal = sh / 2 / Math.tan((cam.fov * Math.PI) / 360)
  return [sw / 2 + (x * focal) / z, sh / 2 - (y * focal) / z]
}

async function inspectCrop(file, cx, cy, label) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  const R = 60
  let bright = 0, sat = 0, warm = 0, n = 0, rS = 0, gS = 0, bS = 0
  for (let y = Math.max(0, Math.round(cy - R)); y < Math.min(h, Math.round(cy + R)); y += 2) {
    for (let x = Math.max(0, Math.round(cx - R)); x < Math.min(w, Math.round(cx + R)); x += 2) {
      const i = (y * w + x) * ch
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
      const v = mx / 255
      n++
      if (v > 0.55) bright++
      if (mx > 0 && (mx - mn) / mx > 0.3 && v > 0.5) { sat++; rS += r; gS += g; bS += b }
      if (r > g + 30 && r > b + 50) warm++
    }
  }
  const satAvg = sat > 0 ? [Math.round(rS / sat), Math.round(gS / sat), Math.round(bS / sat)] : null
  return { label, at: [Math.round(cx), Math.round(cy)], cropPx: n, bright, sat, satAvg, warm }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const warnings = []
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warnings.push(m.text().slice(0, 160)) })
  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.waitForTimeout(2500)

  // S1: scrollY 0, progreso de sección real — captura EN EL MOMENTO
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(6500)
  const s1prog = await page.evaluate(() => {
    const el = document.getElementById('home')
    if (!el) return -1
    const rect = el.getBoundingClientRect()
    const center = window.innerHeight / 2
    return Math.min(1, Math.max(0, (center - rect.top) / rect.height))
  })
  const s1cam = interp(SCENES.boot.camera, s1prog)
  const s1global = (0 + Math.min(1, Math.max(0, s1prog))) / 5
  const s1pos = samplePath(PATH, s1global)
  const f1 = 'refcheck/p7d-photon/S1-canvas.png'
  await page.locator('[data-testid="datacenter-canvas"]').screenshot({ path: f1 })
  const c1 = await inspectCrop(f1, ...(project(s1pos, s1cam, 1440, 900) || [-999, -999]), `S1 sp=${s1prog.toFixed(2)} photon@[${s1pos.map((v) => v.toFixed(2)).join(',')}]`)
  console.log(JSON.stringify({ ...c1, projected: project(s1pos, s1cam, 1440, 900)?.map((v) => Math.round(v)) }))

  // S4: scroll al audit-hub (entry/mid del storage), progreso real
  await page.evaluate(() => document.getElementById('audit-hub')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
  await page.waitForTimeout(6500)
  const s4prog = await page.evaluate(() => {
    const ids = ['audit-hub', 'scaudit', 'blog']
    const vh = window.innerHeight, center = vh / 2
    let best = -1, bestD = Infinity
    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i])
      if (!el) continue
      const r = el.getBoundingClientRect()
      const d = Math.abs(center - (r.top + r.height / 2))
      if (d < bestD) { bestD = d; best = i }
    }
    if (best === -1) return -1
    const r = document.getElementById(ids[best]).getBoundingClientRect()
    return (best + Math.min(1, Math.max(0, (center - r.top) / r.height))) / 3
  })
  const s4cam = interp(SCENES.resilience.camera, Math.min(1, Math.max(0, s4prog)))
  const s4global = (3 + Math.min(1, Math.max(0, s4prog))) / 5
  const s4pos = samplePath(PATH, s4global)
  const f4 = 'refcheck/p7d-photon/S4-canvas.png'
  await page.locator('[data-testid="datacenter-canvas"]').screenshot({ path: f4 })
  const c4 = await inspectCrop(f4, ...(project(s4pos, s4cam, 1440, 900) || [-999, -999]), `S4 sp=${s4prog.toFixed(2)} photon@[${s4pos.map((v) => v.toFixed(2)).join(',')}]`)
  console.log(JSON.stringify({ ...c4, projected: project(s4pos, s4cam, 1440, 900)?.map((v) => Math.round(v)) }))

  // S5: llegada al nodo central (contacto)
  await page.evaluate(() => document.getElementById('contacto')?.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForTimeout(7500)
  const s5prog = await page.evaluate(() => {
    const el = document.getElementById('contacto')
    if (!el) return -1
    const rect = el.getBoundingClientRect()
    const center = window.innerHeight / 2
    return Math.min(1, Math.max(0, (center - rect.top) / rect.height))
  })
  const s5cam = interp(SCENES.connection.camera, s5prog)
  const s5global = (4 + Math.min(1, Math.max(0, s5prog))) / 5
  const s5pos = samplePath(PATH, s5global)
  const f5 = 'refcheck/p7d-photon/S5-canvas.png'
  await page.locator('[data-testid="datacenter-canvas"]').screenshot({ path: f5 })
  const c5 = await inspectCrop(f5, ...(project(s5pos, s5cam, 1440, 900) || [-999, -999]), `S5 sp=${s5prog.toFixed(2)} photon@[${s5pos.map((v) => v.toFixed(2)).join(',')}]`)
  console.log(JSON.stringify({ ...c5, projected: project(s5pos, s5cam, 1440, 900)?.map((v) => Math.round(v)) }))
  console.log('consoleWarnings:', JSON.stringify(warnings.slice(0, 6)))
} finally {
  await browser.close()
}
