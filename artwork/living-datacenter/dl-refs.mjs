// Assemble the Meshy.ai input kit: download missing references with a real
// browser (bypasses hotlink protection), normalize formats (HEIF/WebP -> JPEG)
// and write clean inputs into artwork/living-datacenter/meshy-kit/.
// Idempotent: skips files that already exist. Usage: node dl-refs.mjs
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = import.meta.dirname
const KIT = path.join(ROOT, 'meshy-kit')

// name -> { url, dir, note }  (dirs are created under meshy-kit)
const TARGETS = [
  {
    out: '01-switch/ref-cisco-9300x.jpg',
    url: 'https://www.cisco.com/content/dam/cisco-cdc/site/images/heroes/products/networking/9300x-hero-overview-desktop-3200x1312.jpg',
    referer: 'https://www.cisco.com/site/us/en/products/networking/switches/catalyst-9300-series-switches/index.html',
    note: 'switch 1U — canonical enterprise chassis (48p + uplinks)',
  },
  {
    out: '02-storage/ref-netapp-a250-bezel.jpg',
    url: 'https://www.storagereview.com/wp-content/uploads/2021/01/Netapp-AFF-250-with-bezel.jpg',
    referer: 'https://www.storagereview.com/reviews/netapp-aff-a250-review',
    note: 'storage 2U — monolithic silver vented bezel (front)',
  },
  {
    out: '02-storage/ref-me5-rear.jpg',
    url: 'https://www.storagereview.com/wp-content/uploads/2022/02/StorageReview-Dell-PowerVault-ME5-Connectivity.jpg',
    referer: 'https://www.storagereview.com/reviews/dell-powervault-me5-review',
    note: 'storage rear — dual controllers + PSU (S4/S5 camera)',
  },
]

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
})

let done = 0
let skipped = 0
let failed = 0

for (const t of TARGETS) {
  const dest = path.join(KIT, t.out)
  if (fs.existsSync(dest)) {
    console.log(`skip ${t.out} (already present)`)
    skipped++
    continue
  }
  const page = await ctx.newPage()
  try {
    if (t.referer) await page.setExtraHTTPHeaders({ Referer: t.referer })
    const resp = await page.goto(t.url, { timeout: 30000 })
    const ctype = resp.headers()['content-type'] || ''
    if (!resp.ok() || !ctype.startsWith('image/')) {
      console.log(`FAIL ${t.out} status=${resp.status()} ${ctype}`)
      failed++
      continue
    }
    const buf = await resp.body()
    const meta = await sharp(buf).metadata()
    // Normalize to baseline JPEG (Meshy-safe; HEIF/WebP can be rejected on upload)
    const jpeg = await sharp(buf)
      .rotate()
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 92 })
      .toBuffer()
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, jpeg)
    console.log(
      `OK   ${t.out}  (src ${meta.width}x${meta.height} ${meta.format} -> jpeg ${(jpeg.length / 1024).toFixed(0)} KB) — ${t.note}`
    )
    done++
  } catch (e) {
    console.log(`FAIL ${t.out}: ${e.message}`)
    failed++
  } finally {
    await page.close()
  }
}

await browser.close()
console.log(`\n${done} downloaded, ${skipped} skipped, ${failed} failed`)
