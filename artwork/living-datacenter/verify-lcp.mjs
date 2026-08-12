import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:3100/'

const browser = await chromium.launch({ headless: true })
// Emulación reduce-motion a nivel de contexto
const ctx = await browser.newContext({ reducedMotion: 'reduce' })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle' })

const preload = await page.evaluate(() => {
  const links = [...document.querySelectorAll('link[rel="preload"]')].map((l) => ({
    as: l.getAttribute('as'),
    href: l.getAttribute('href'),
    fp: l.getAttribute('fetchpriority'),
  }))
  return links
})
console.log('PRELOADS:', JSON.stringify(preload, null, 1))

const poster = await page.evaluate(() => {
  const img = document.querySelector('img[data-poster-img]')
  if (!img) return null
  return {
    src: img.src,
    fp: img.getAttribute('fetchpriority'),
    width: img.width,
    height: img.height,
    rendered: img.complete && img.naturalWidth > 0,
  }
})
console.log('POSTER IMG:', JSON.stringify(poster, null, 1))

await browser.close()
