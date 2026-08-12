// Harvest real image URLs + natural dimensions from candidate reference pages.
// Usage: node img-harvest.mjs <url> [url...]
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const showAll = args.includes('--all')
const urls = args.filter((a) => !a.startsWith('--'))
if (!urls.length) {
  console.error('usage: node img-harvest.mjs [--all] <url> [...]')
  process.exit(1)
}

const browser = await chromium.launch({ headless: true })

for (const url of urls) {
  console.log(`\n########## ${url}`)
  let page
  try {
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    // Trigger lazy loading by scrolling through the page
    for (let y = 0; y < 8000; y += 600) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y)
      await page.waitForTimeout(120)
    }
    await page.waitForTimeout(1200)

    const imgs = await page.evaluate(() => {
      const out = []
      const seen = new Set()
      const push = (src, naturalW, naturalH) => {
        if (!src || seen.has(src)) return
        seen.add(src)
        out.push({ src, naturalW, naturalH })
      }
      // og:image
      const og = document.querySelector('meta[property="og:image"]')
      if (og) push(og.getAttribute('content'), 0, 0)
      // <img> tags with real rendered sizes
      for (const el of document.querySelectorAll('img')) {
        const w = el.naturalWidth, h = el.naturalHeight
        push(el.currentSrc || el.src, w, h)
        // srcset candidates
        for (const s of (el.getAttribute('srcset') || '').split(',')) {
          const src = s.trim().split(/\s+/)[0]
          if (src) push(src, w, h)
        }
      }
      return out
    })

    let list = imgs.filter((i) => i.naturalW >= 1024 || i.naturalH >= 1024 || (i.naturalW === 0 && i.naturalH === 0))
    if (showAll) list = imgs
    const sorted = list.sort((a, b) => b.naturalW - a.naturalW)
    const shown = showAll ? sorted.slice(0, 30) : sorted.slice(0, 15)
    for (const i of shown) {
      console.log(`${i.naturalW}x${i.naturalH}\t${i.src}`)
    }
    if (!shown.length) console.log('(no images found)')
  } catch (err) {
    console.log(`ERROR: ${err.message}`)
  } finally {
    if (page) await page.close()
  }
}

await browser.close()
