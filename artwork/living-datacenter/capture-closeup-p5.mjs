/**
 * Probe close-up P5 — materialidad PBR de GLBs (perfil por asset).
 * Mide en crops idénticos a la baseline P2 (capture-closeup.mjs):
 *   S1-rack-4x / S1-rack-2x — rack hero (respuesta del env, sheen industrial)
 *   S4-storage-4x / S4-storage-2x — storage protagonista (cálido S4, reflejo ámbar)
 * Métricas nuevas: warmPct (dominante cálido, umbral P2: r>g+20, r>60),
 * specPct (L>110 — presencia especular), además de meanLum/meanSat/canales.
 * Uso: node capture-closeup-p5.mjs [base] [outDir]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] || 'http://localhost:3100'
const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, process.argv[3] || 'refcheck/p5-materiality')
fs.mkdirSync(OUT, { recursive: true })

async function metrics(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  let lum = 0, lum2 = 0, sat = 0, r = 0, g = 0, b = 0, n = 0
  let warm = 0, spec = 0, bright = 0
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * ch
      const R = data[i], G = data[i + 1], B = data[i + 2]
      const L = 0.2126 * R + 0.7152 * G + 0.0722 * B
      lum += L; lum2 += L * L; n++
      r += R; g += G; b += B
      const mx = Math.max(R, G, B), mn = Math.min(R, G, B)
      sat += mx === 0 ? 0 : (mx - mn) / mx
      if (R > G + 20 && R > 60) warm++
      if (L > 110) spec++
      if (L > 60) bright++
    }
  }
  const mean = lum / n
  return {
    w, h,
    meanLum: +mean.toFixed(1),
    stdLum: +Math.sqrt(Math.max(0, lum2 / n - mean * mean)).toFixed(1),
    meanSat: +(sat / n).toFixed(3),
    ch: { r: +(r / n).toFixed(1), g: +(g / n).toFixed(1), b: +(b / n).toFixed(1) },
    warmPct: +((warm / n) * 100).toFixed(2),
    specPct: +((spec / n) * 100).toFixed(2),
    brightPct: +((bright / n) * 100).toFixed(1),
  }
}

async function crop(src, outName, { left, top, width, height }, zoom) {
  const img = sharp(src)
  const meta = await img.metadata()
  const cw = Math.round(width * meta.width)
  const chh = Math.round(height * meta.height)
  const outFile = path.join(OUT, outName)
  await img
    .extract({ left: Math.round(left * meta.width), top: Math.round(top * meta.height), width: cw, height: chh })
    .resize(Math.round(cw * zoom), Math.round(chh * zoom), { kernel: 'cubic' })
    .png()
    .toFile(outFile)
  return { file: outName, ...(await metrics(outFile)) }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))

  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(4500)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(4500)

  const goSection = async (id) => {
    if (id === 'home') await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    else await page.evaluate((sid) => document.getElementById(sid)?.scrollIntoView({ block: 'center', behavior: 'instant' }), id)
    for (let i = 0; i < 6; i++) await page.waitForTimeout(1200)
  }

  const shots = []

  // S1 · rack hero
  await goSection('home')
  const s1Full = path.join(OUT, 'S1-full.png')
  await page.screenshot({ path: s1Full })
  shots.push({ id: 'S1-rack-4x', ...(await crop(s1Full, 'S1-rack-4x.png', { left: 0.42, top: 0.38, width: 0.16, height: 0.24 }, 4)) })
  shots.push({ id: 'S1-rack-2x', ...(await crop(s1Full, 'S1-rack-2x.png', { left: 0.35, top: 0.28, width: 0.3, height: 0.5 }, 2)) })

  // S4 · storage protagonista
  await goSection('audit-hub')
  const s4Full = path.join(OUT, 'S4-full.png')
  await page.screenshot({ path: s4Full })
  shots.push({ id: 'S4-storage-4x', ...(await crop(s4Full, 'S4-storage-4x.png', { left: 0.38, top: 0.36, width: 0.24, height: 0.28 }, 4)) })
  shots.push({ id: 'S4-storage-2x', ...(await crop(s4Full, 'S4-storage-2x.png', { left: 0.3, top: 0.28, width: 0.4, height: 0.5 }, 2)) })

  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ date: new Date().toISOString(), shots, consoleErrors: errors.slice(0, 6) }, null, 2))
  console.log(JSON.stringify(shots, null, 2))
  console.log('consoleErrors:', errors.length)
} finally {
  await browser.close()
}
