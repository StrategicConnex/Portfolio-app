/**
 * Validación P7a.1 — EL CORTE FÍSICO. El failover ahora no solo cambia de
 * color: en `dead` el tráfico de A se detiene y queda re-encaminado en B —
 * la fila FRONTAL (z=-3.6) queda VACÍA — y en `recover` el tráfico ámbar se
 * lee EN TRÁNSITO entre las filas (reroute intermedio), no sobre la suya.
 *
 * Método: se scrollea S4 muestreando el progreso real (midpoint, igual que
 * useSectionProgress) y capturando el canvas puro por tramo. La banda frontal
 * se ancla al centroide y del cian en `normal` (A brillante en la fila
 * frontal); la banda trasera al centroide en `dead` (B cian plena en la
 * trasera). Se miden: (a) tráfico visible en la banda frontal por estado
 * (debe caer a ~0 en dead) y (b) el centroide y del ámbar en recover (debe
 * estar ENTRE ambas bandas — el tránsito de regreso).
 * Uso: node validate-failover-motion.mjs [base]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] || 'http://localhost:3100'
const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, 'refcheck/p7a1')
fs.mkdirSync(OUT, { recursive: true })

const S4_SECTIONS = ['audit-hub', 'scaudit', 'blog']
const TL = { faultStart: 0.3, deadStart: 0.48, recoverStart: 0.62, restored: 0.8 }
const stateOf = (p) => {
  if (p < TL.faultStart) return 'normal'
  if (p < TL.deadStart) return 'fault'
  if (p < TL.recoverStart) return 'dead'
  if (p < TL.restored) return 'recover'
  return 'restored'
}

async function trafficStats(file, band) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  const cyanPx = [], amberPx = []
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * ch
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const inBand = y >= band.top && y <= band.bottom
      if (b > r + 40 && b > 100 && inBand) cyanPx.push([x, y])
      else if (r > g + 40 && r > b + 40 && r > 90 && inBand) amberPx.push([x, y])
    }
  }
  const centroid = (pts) => (pts.length ? Math.round(pts.reduce((s, p) => s + p[1], 0) / pts.length) : null)
  return { cyan: cyanPx.length, amber: amberPx.length, cyanCy: centroid(cyanPx), amberCy: centroid(amberPx) }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('telemetry') && !m.text().includes('ERR_FAILED')) errors.push(m.text().slice(0, 120)) })
  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.waitForTimeout(3000)
  await page.evaluate(() => document.getElementById('audit-hub')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
  await page.waitForTimeout(7000)

  const samples = []
  for (let step = 0; step < 24; step++) {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.09)))
    await page.waitForTimeout(3200)
    const prog = await page.evaluate((ids) => {
      const vh = window.innerHeight
      const center = vh / 2
      let best = -1, bestD = Infinity
      for (let i = 0; i < ids.length; i++) {
        const el = document.getElementById(ids[i])
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.height <= 0) continue
        const d = Math.abs(center - (r.top + r.height / 2))
        if (d < bestD) { bestD = d; best = i }
      }
      if (best === -1) return -1
      const r = document.getElementById(ids[best]).getBoundingClientRect()
      return (best + Math.min(1, Math.max(0, (center - r.top) / r.height))) / ids.length
    }, S4_SECTIONS)
    if (prog < 0) continue
    const file = path.join(OUT, `step-${step}.png`)
    await page.locator('[data-testid="datacenter-canvas"]').screenshot({ path: file })
    samples.push({ step, prog: +(prog * 100).toFixed(1), state: stateOf(prog), file })
  }

  // Bandas: frontal = centroide cian en normal; trasera = centroide cian en dead
  const norm = samples.find((s) => s.state === 'normal')
  const dead = samples.find((s) => s.state === 'dead')
  const stNorm = norm ? await trafficStats(norm.file, { top: 0, bottom: 900 }) : null
  const stDead = dead ? await trafficStats(dead.file, { top: 0, bottom: 900 }) : null
  const frontCy = stNorm?.cyanCy ?? 450
  const rearCy = stDead?.cyanCy ?? 450
  const band = (cy) => ({ top: Math.max(0, cy - 42), bottom: Math.min(900, cy + 42) })

  const results = []
  for (const s of samples) {
    const full = await trafficStats(s.file, { top: 0, bottom: 900 })
    const front = await trafficStats(s.file, band(frontCy))
    const rear = await trafficStats(s.file, band(rearCy))
    results.push({
      step: s.step,
      prog: s.prog,
      state: s.state,
      front: { cyan: front.cyan, amber: front.amber, traffic: front.cyan + front.amber },
      rearTraffic: rear.cyan + rear.amber,
      amberCy: full.amberCy,
      cyanCy: full.cyanCy,
    })
  }

  const frontTrafficByState = {}
  for (const r of results) frontTrafficByState[r.state] = Math.max(frontTrafficByState[r.state] ?? 0, r.front.traffic)

  // recover: el ámbar debe estar ENTRE las bandas (tránsito de regreso)
  const recoverSamples = results.filter((r) => r.state === 'recover' && r.amberCy !== null)
  const amberMidTransit = recoverSamples.some((r) => r.amberCy > Math.min(frontCy, rearCy) - 15 && r.amberCy < Math.max(frontCy, rearCy) + 15)

  const result = {
    date: new Date().toISOString(),
    frontBandCy: frontCy,
    rearBandCy: rearCy,
    frontTrafficByState,
    deadFrontEmpty: (frontTrafficByState['dead'] ?? 999) < (frontTrafficByState['normal'] ?? 0) * 0.25 && (frontTrafficByState['dead'] ?? 999) < 30,
    recoverSamples: recoverSamples.map((r) => ({ prog: r.prog, amberCy: r.amberCy })),
    amberMidTransit,
    consoleErrors: errors.length,
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
