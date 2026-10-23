#!/usr/bin/env node
/**
 * Generates the 1200×630 Open Graph cards in `public/og/`.
 *
 * Why a script instead of hand-made images:
 * - deterministic layout for every page/locale pair;
 * - copy comes from the same strings published in `src/lib/seo.ts` (keep them
 *   in sync when a title/description changes, then re-run `npm run og:generate`);
 * - headless Chromium renders the HTML card, sharp encodes the JPEG.
 *
 * Usage: `npm run og:generate`
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'og')

/** Card copy per page and locale (mirror of `src/lib/seo.ts`). */
const CARDS = {
  home: {
    es: {
      eyebrow: 'CIBERSEGURIDAD INDUSTRIAL · IT/OT',
      title: 'Juan Felipe Palacios',
      subtitle: 'Arquitecto IT/OT · 20+ años en Oil & Gas',
      meta: 'IEC 62443 · Modelo Purdue · SIEM · Vaca Muerta',
    },
    en: {
      eyebrow: 'INDUSTRIAL CYBERSECURITY · IT/OT',
      title: 'Juan Felipe Palacios',
      subtitle: 'IT/OT Architect · 20+ years in Oil & Gas',
      meta: 'IEC 62443 · Purdue Model · SIEM · Vaca Muerta',
    },
  },
  'cyber-attack-map': {
    es: {
      eyebrow: 'INTELIGENCIA DE AMENAZAS EN VIVO',
      title: 'Mapa Global de Ciberataques',
      subtitle: 'Visualización 3D de amenazas reales',
      meta: 'DShield (SANS ISC) · CISA KEV · ipwho.is',
    },
    en: {
      eyebrow: 'LIVE THREAT INTELLIGENCE',
      title: 'Global Cyber Attack Map',
      subtitle: '3D visualization of real threats',
      meta: 'DShield (SANS ISC) · CISA KEV · ipwho.is',
    },
  },
  recursos: {
    es: {
      eyebrow: 'BIBLIOTECA IT/OT',
      title: 'Biblioteca IT/OT',
      subtitle: 'Guías, plantillas y estándares',
      meta: '5 volúmenes · DOCX · XLSX · descarga gratuita',
    },
    en: {
      eyebrow: 'IT/OT LIBRARY',
      title: 'IT/OT Library',
      subtitle: 'Guides, templates and standards',
      meta: '5 volumes · DOCX · XLSX · free download',
    },
  },
  estadisticas: {
    es: {
      eyebrow: 'MÉTRICAS DE LA BIBLIOTECA',
      title: 'Estadísticas de descargas',
      subtitle: 'Métricas agregadas y anónimas',
      meta: 'Por documento · por día · por país · sin datos personales',
    },
    en: {
      eyebrow: 'LIBRARY METRICS',
      title: 'Download stats',
      subtitle: 'Aggregated, anonymous metrics',
      meta: 'Per document · per day · per country · no personal data',
    },
  },
}

const LOCALES = { es: 'ES', en: 'EN' }

async function fontFace(family, relPath, weight = '400') {
  const bytes = await readFile(join(ROOT, relPath))
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype')}`
}

function cardHtml(copy, locale) {
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<style>
  ${cardHtml.fonts ?? ''}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: 'DM Mono', monospace;
    color: #e8edf6;
    background:
      radial-gradient(900px 620px at 88% 18%, rgba(46,107,255,.22), transparent 62%),
      radial-gradient(760px 560px at 74% 92%, rgba(197,164,109,.16), transparent 64%),
      #070b12;
    position: relative;
    overflow: hidden;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(1000px 700px at 50% 45%, #000 30%, transparent 78%);
  }
  .frame { position: absolute; inset: 28px; border: 1px solid rgba(148,163,184,.18); border-radius: 18px; }
  .content { position: absolute; left: 76px; top: 96px; width: 780px; }
  .eyebrow { font-size: 17px; letter-spacing: 4px; color: #c5a46d; text-transform: uppercase; }
  .rule { width: 120px; height: 3px; margin: 22px 0 30px; background: linear-gradient(90deg, #2e6bff, #c5a46d); border-radius: 2px; }
  h1 { font-family: 'Italiana', serif; font-weight: 400; font-size: 78px; line-height: 1.02; letter-spacing: -1px; color: #f6f8fc; }
  .subtitle { margin-top: 22px; font-size: 25px; line-height: 1.35; color: #9fb0c8; max-width: 720px; }
  .meta { margin-top: 30px; font-size: 17px; letter-spacing: .5px; color: #7f93ad; }
  .orb { position: absolute; right: -80px; top: 60px; width: 560px; height: 560px; }
  .ring { position: absolute; border-radius: 50%; border: 1px solid rgba(46,107,255,.28); }
  .ring.r1 { inset: 0; }
  .ring.r2 { inset: 62px; border-color: rgba(197,164,109,.26); }
  .ring.r3 { inset: 126px; border-color: rgba(46,107,255,.2); background: radial-gradient(circle at 38% 32%, rgba(46,107,255,.16), transparent 60%); }
  .bottom { position: absolute; left: 76px; right: 76px; bottom: 54px; display: flex; align-items: center; justify-content: space-between; font-size: 16px; letter-spacing: 1px; color: #8296b0; }
  .badge { border: 1px solid rgba(197,164,109,.5); color: #c5a46d; padding: 7px 13px; border-radius: 8px; font-size: 15px; letter-spacing: 2px; }
  .dot { color: #2e6bff; margin: 0 10px; }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="frame"></div>
  <div class="orb">
    <div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div>
  </div>
  <div class="content">
    <div class="eyebrow">${copy.eyebrow}</div>
    <div class="rule"></div>
    <h1>${copy.title}</h1>
    <div class="subtitle">${copy.subtitle}</div>
    <div class="meta">${copy.meta}</div>
  </div>
  <div class="bottom">
    <div>juanpalacios.vercel.app<span class="dot">/</span>Neuquén · Argentina</div>
    <div class="badge">${LOCALES[locale]}</div>
  </div>
</body>
</html>`
}

async function main() {
  const fonts = [
    await fontFace('Italiana', 'design/strata-protocol/fonts/Italiana-Regular.ttf'),
    await fontFace('DM Mono', 'public/fonts/DMMono-Regular.ttf'),
  ].join('\n')
  cardHtml.fonts = fonts

  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })

  for (const [pageKey, locales] of Object.entries(CARDS)) {
    for (const [locale, copy] of Object.entries(locales)) {
      await page.setContent(cardHtml(copy, locale), { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      const png = await page.screenshot({ type: 'png' })
      const out = join(OUT_DIR, `${pageKey}-${locale}.jpg`)
      await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(out)
      const { size } = await sharp(out).metadata()
      console.log(`✓ ${pageKey}-${locale}.jpg (${size ? Math.round(size / 1024) : '?'} KB)`)
    }
  }

  await browser.close()
  console.log(`\nGenerated ${Object.keys(CARDS).length * 2} cards in public/og/`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
