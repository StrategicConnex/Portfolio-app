/**
 * Recorrido visual por escena (comparación de los 7 commits P0→P4.1 contra el
 * estado servido). El preview deployado es SSO-protegido; este probe corre
 * sobre el build local (código idéntico, git-clean) y verifica por fase el
 * artefacto que cada commit introdujo:
 *   P0  paleta unificada + rim light + vignette + editorial DOM
 *   P1  env por tier + lightformers + losetas + vent tiles + contact shadows
 *   P2  Phase Gate (tint de temperatura por fase activa)
 *   P3  encuadre asimétrico + push-in
 *   P4  atravieso (labels cull a 0 en el fondo del corredor)
 *   P4.1 exposición del corredor en siem (gutters)
 * Uso: node walkthrough-preview.mjs [base] [outDir]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] || 'http://localhost:3100'
const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, process.argv[3] || 'refcheck/preview-walkthrough')
fs.mkdirSync(OUT, { recursive: true })

const SCENES = [
  { id: 'S1-boot', section: 'home', phase: 'boot', commit: 'P0/P1/P2 (tesis simétrica + rim + tint azul)' },
  { id: 'S2-core', section: 'arquitectura', phase: 'architecture', commit: 'P3 (encuadre asimétrico, tercios)' },
  { id: 'S3-data', section: 'siem', phase: 'data-in-motion', commit: 'P4 (push-in + atravieso)' },
  { id: 'S4-resilience', section: 'audit-hub', phase: 'resilience', commit: 'P1/P3 (fit G4 + tint ámbar)' },
  { id: 'S5-connection', section: 'contacto', phase: 'connection', commit: 'P3 (reveal diagonal + champagne)' },
]

async function stats(file) {
  const { data, info } = await sharp(file).resize(640).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  let lum = 0, dark = 0, n = 0, cyan = 0
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * ch
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
      lum += L; n++
      if (L < 40) dark++
      if (b > r + 25 && b > 80) cyan++
    }
  }
  return { meanLum: +(lum / n).toFixed(1), darkPct: +((dark / n) * 100).toFixed(1), cyanPct: +((cyan / n) * 100).toFixed(2) }
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

  const scenes = []
  for (const sc of SCENES) {
    if (sc.section === 'home') await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    else await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sc.section)
    await page.waitForTimeout(6500)
    const gate = await page.evaluate(() => {
      const el = document.querySelector('[data-phase][data-active="true"]')
      if (!el) return { phase: null, tint: null }
      const cs = getComputedStyle(el)
      return { phase: el.getAttribute('data-phase'), tint: cs.backgroundImage.slice(0, 70) }
    })
    const labels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid="hud-label"]')).map((el) => ({
        t: (el.textContent || '').replace(/\s+/g, ' ').slice(0, 30),
        o: Number(getComputedStyle(el).opacity),
      })),
    )
    const file = path.resolve(OUT, `${sc.id}-walk.png`)
    await page.screenshot({ path: file })
    scenes.push({ id: sc.id, section: sc.section, commit: sc.commit, gate, labels: labels.length, allHidden: labels.length > 0 && labels.every((l) => l.o === 0), stats: await stats(file) })
  }

  // P4 — tramo profundo: labels cull a 0 (atravieso). La cámara viaja desde
  // S5 (lejos); se converge en pasos (como capture-siem-fix) hasta que los 10
  // labels de S3 queden a opacidad 0 (cámara en el fondo del corredor).
  await page.evaluate(() => document.getElementById('siem')?.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForTimeout(6000)
  const deep = { count: 0, allZero: false, steps: 0 }
  for (let step = 0; step < 6 && !deep.allZero; step++) {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.12)))
    await page.waitForTimeout(4500)
    const ops = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid="hud-label"]')).map((el) => Number(getComputedStyle(el).opacity)))
    deep.count = ops.length
    deep.allZero = ops.length > 0 && ops.every((o) => o === 0)
    deep.steps = step + 1
  }

  // P4.1 — gutters del corredor en siem (exposición)
  await page.evaluate(() => document.getElementById('siem')?.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForTimeout(7000)
  const siemFull = path.resolve(OUT, 'S3-siem-center.png')
  await page.screenshot({ path: siemFull })
  const siem = await stats(siemFull)
  // gutters: bandas extremas del frame
  const gut = await (async () => {
    const { data, info } = await sharp(siemFull).resize(480).raw().toBuffer({ resolveWithObject: true })
    const w = info.width, h = info.height, ch = info.channels
    const band = (b) => {
      let sum = 0, n = 0
      for (let y = 0; y < h; y += 2) for (let x = Math.floor(b / 12 * w); x < Math.floor((b + 1) / 12 * w); x += 2) {
        const i = (y * w + x) * ch
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; n++
      }
      return Math.round(sum / n)
    }
    return { left: band(0), right: band(11) }
  })()

  const result = {
    date: new Date().toISOString(),
    base,
    scenes,
    deepPass: deep,
    siem: { ...siem, gutters: gut },
    consoleErrors: errors.slice(0, 5),
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
