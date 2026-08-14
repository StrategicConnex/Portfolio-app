/**
 * Probe before/after — fix editorial del corredor (sección siem).
 * Normalización por ESTADO DE CÁMARA (no por scrollY — el layout refluye con
 * el ancho del contenedor): se busca la posición donde TODOS los hud-label de
 * S3 quedan a opacidad 0 (cámara en el fondo del corredor, z≈-4.7) haciendo
 * scroll en pasos. Ahí se captura full page + canvas y se miden la exposición
 * del corredor y la lectura del contenido.
 * Uso: node capture-siem-fix.mjs [base] [outDir] [label]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] || 'http://localhost:3100'
const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, process.argv[3] || 'refcheck/siem-fix')
const label = process.argv[4] || 'after'
fs.mkdirSync(OUT, { recursive: true })

async function analyze(file) {
  const { data, info } = await sharp(file).resize(960).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  let bright = 0, cyan = 0, n = 0
  const bands = []
  for (let b = 0; b < 12; b++) {
    let sum = 0, cnt = 0
    for (let y = 0; y < h; y += 2) {
      for (let x = Math.floor((b / 12) * w); x < Math.floor(((b + 1) / 12) * w); x += 2) {
        const i = (y * w + x) * ch
        const R = data[i], G = data[i + 1], B = data[i + 2]
        const L = 0.2126 * R + 0.7152 * G + 0.0722 * B
        sum += L; cnt++
        if (L > 60) bright++
        if (B > R + 25 && B > 80) cyan++
        n++
      }
    }
    bands.push(Math.round(sum / cnt))
  }
  return { bands, brightPct: +((bright / n) * 100).toFixed(1), cyanPct: +((cyan / n) * 100).toFixed(2) }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))

  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.waitForTimeout(3000)

  // Buscar el tramo profundo: scroll en pasos hasta que los 10 labels de S3
  // queden a opacidad 0 (cámara pasó todo — fondo del corredor).
  await page.evaluate(() => document.getElementById('siem')?.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForTimeout(6000)
  let deep = false
  let scrollY = await page.evaluate(() => window.scrollY)
  for (let step = 0; step < 6 && !deep; step++) {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.12)))
    await page.waitForTimeout(4500)
    const ops = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid="hud-label"]')).map((el) => Number(getComputedStyle(el).opacity)),
    )
    scrollY = await page.evaluate(() => window.scrollY)
    deep = ops.length > 0 && ops.every((o) => o === 0)
  }
  if (!deep) console.warn('⚠ no se alcanzó el tramo profundo (labels:', 'no dump)')

  const full = path.join(OUT, `siem-deep-${label}.png`)
  await page.screenshot({ path: full })
  const canvasFile = path.join(OUT, `siem-deep-canvas-${label}.png`)
  await page.locator('[data-testid="datacenter-canvas"] canvas').screenshot({ path: canvasFile })

  const result = {
    label, deep, scrollY,
    full: await analyze(full),
    canvas: await analyze(canvasFile),
    errors: errors.slice(0, 4),
  }
  fs.writeFileSync(path.join(OUT, `result-${label}.json`), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
