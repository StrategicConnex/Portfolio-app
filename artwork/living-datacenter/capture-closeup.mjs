/**
 * Capturas de cerca (zoom) — validación de materialidad P1/P2 a distancia de
 * cámara real (SPEC §3): losetas de raised floor, vent tiles del plenum y
 * reflejos del env map sobre el rack hero (S1) y el storage (S4).
 *
 * Uso: node capture-closeup.mjs [base] [outDir]
 *   base  → URL del server (default http://localhost:3100)
 *   outDir → relativo a artwork/living-datacenter/ (default refcheck/p2-closeup)
 *
 * Salida (deviceScaleFactor 2 → fuente 2880×1800):
 *   S1-full.png / S4-full.png                 — frame completo real
 *   S1-rack-2x.png / S1-rack-4x.png           — crop centro del rack hero (zoom)
 *   S1-floor-2x.png                           — piso: losetas + vent tiles
 *   S4-storage-2x.png / S4-storage-4x.png     — crop storage protagonista
 *   S4-floor-2x.png                           — piso nivel inferior
 *   result.json                               — métricas de legibilidad
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] || 'http://localhost:3100'
const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, process.argv[3] || 'refcheck/p2-closeup')
const W = 1440
const H = 900

fs.mkdirSync(OUT, { recursive: true })

/** Métricas de un crop: luminancia media, desvío (contraste de textura),
 *  saturación media, canales, y picos de una scanline horizontal. */
async function metrics(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  let lum = 0, lum2 = 0, sat = 0, r = 0, g = 0, b = 0, n = 0
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * ch
      const R = data[i], G = data[i + 1], B = data[i + 2]
      const L = 0.2126 * R + 0.7152 * G + 0.0722 * B
      lum += L; lum2 += L * L; n++
      r += R; g += G; b += B
      const mx = Math.max(R, G, B), mn = Math.min(R, G, B)
      sat += mx === 0 ? 0 : (mx - mn) / mx
    }
  }
  const mean = lum / n
  const std = Math.sqrt(Math.max(0, lum2 / n - mean * mean))
  // Scanline en la fila 60% (centro-bajo del crop) → picos de luminancia
  // (bordes de loseta / damasco). Umbral: desvío local > std/2 con subida
  // monótona de >2 niveles → cuenta un "borde".
  const y = Math.floor(h * 0.6)
  const row = []
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * ch
    row.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
  }
  let peaks = 0
  for (let x = 1; x < w - 1; x++) {
    if (row[x] - row[x - 1] > 2.2 && row[x + 1] - row[x] > -2.2 && row[x] - Math.min(row[x - 1], row[x + 1]) > std * 0.55) peaks++
  }
  const minLum = Math.min(...row)
  const maxLum = Math.max(...row)
  return {
    w, h,
    meanLum: +mean.toFixed(1),
    stdLum: +std.toFixed(1),
    meanSat: +(sat / n).toFixed(3),
    ch: { r: +(r / n).toFixed(1), g: +(g / n).toFixed(1), b: +(b / n).toFixed(1) },
    scanline: { minLum: +minLum.toFixed(1), maxLum: +maxLum.toFixed(1), range: +(maxLum - minLum).toFixed(1), peaks },
  }
}

async function cropAndZoom(src, outName, { left, top, width, height }, zoom = 1) {
  const img = sharp(src)
  const meta = await img.metadata()
  const cw = Math.round(width * meta.width)
  const chh = Math.round(height * meta.height)
  const cx = Math.round(left * meta.width)
  const cy = Math.round(top * meta.height)
  const outFile = path.join(OUT, outName)
  await img
    .extract({ left: cx, top: cy, width: cw, height: chh })
    .resize(Math.round(cw * zoom), Math.round(chh * zoom), { kernel: zoom > 1 ? 'cubic' : 'lanczos3' })
    .png()
    .toFile(outFile)
  return { file: outName, ...(await metrics(outFile)) }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))

  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })

  // Calentamiento: montar secciones lazy y estabilizar layout.
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(4500)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(4500)

  const goSection = async (id) => {
    if (id === 'home') await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    else await page.evaluate((sid) => document.getElementById(sid)?.scrollIntoView({ block: 'center', behavior: 'instant' }), id)
    // Esperar settle de cámara (650 ms) + spring + micro-anims + que la fase
    // del Phase Gate quede estable (2 lecturas iguales separadas 1.2 s).
    for (let i = 0; i < 6; i++) await page.waitForTimeout(1200)
    const p1 = await page.evaluate(() => document.querySelector('[data-phase][data-active="true"]')?.getAttribute('data-phase'))
    await page.waitForTimeout(1200)
    const p2 = await page.evaluate(() => document.querySelector('[data-phase][data-active="true"]')?.getAttribute('data-phase'))
    return { phase: p2, stable: p1 === p2 }
  }

  const shots = []

  // ── S1 · Boot — rack hero + piso ──
  const s1 = await goSection('home')
  const s1Full = path.join(OUT, 'S1-full.png')
  await page.screenshot({ path: s1Full })
  shots.push({ id: 'S1-full', file: 'S1-full.png', section: 'home', phase: s1.phase, stable: s1.stable, ...(await metrics(s1Full)) })
  // Rack hero: centro del frame (x 35-65%, y 28-78%) + zoom 2x y 4x del rostro.
  shots.push(await cropAndZoom(s1Full, 'S1-rack-2x.png', { left: 0.35, top: 0.28, width: 0.3, height: 0.5 }, 2))
  shots.push(await cropAndZoom(s1Full, 'S1-rack-4x.png', { left: 0.42, top: 0.38, width: 0.16, height: 0.24 }, 4))
  // Piso: banda inferior (losetas + vent tiles del plenum).
  shots.push(await cropAndZoom(s1Full, 'S1-floor-2x.png', { left: 0.08, top: 0.62, width: 0.84, height: 0.3 }, 2))

  // ── S4 · Resilience — storage + piso ──
  const s4 = await goSection('audit-hub')
  const s4Full = path.join(OUT, 'S4-full.png')
  await page.screenshot({ path: s4Full })
  shots.push({ id: 'S4-full', file: 'S4-full.png', section: 'audit-hub', phase: s4.phase, stable: s4.stable, ...(await metrics(s4Full)) })
  shots.push(await cropAndZoom(s4Full, 'S4-storage-2x.png', { left: 0.3, top: 0.28, width: 0.4, height: 0.5 }, 2))
  shots.push(await cropAndZoom(s4Full, 'S4-storage-4x.png', { left: 0.38, top: 0.36, width: 0.24, height: 0.28 }, 4))
  shots.push(await cropAndZoom(s4Full, 'S4-floor-2x.png', { left: 0.08, top: 0.6, width: 0.84, height: 0.32 }, 2))

  fs.writeFileSync(
    path.join(OUT, 'result.json'),
    JSON.stringify({ date: new Date().toISOString(), base, shots, consoleErrors: errors.slice(0, 6) }, null, 2),
  )
  console.log(JSON.stringify(shots, null, 2))
  console.log('consoleErrors:', errors.length, JSON.stringify(errors.slice(0, 3)))
} finally {
  await browser.close()
}
