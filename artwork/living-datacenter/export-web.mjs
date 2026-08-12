// Export the Cold Cathedral poster as an optimized webp for the site hero (Z-10).
import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', '..', 'public', 'images');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file:///' + join(__dirname, 'canvas.png').replaceAll('\\', '/'));
const buf = await page.evaluate(async () => {
  const img = document.querySelector('img');
  const c = document.createElement('canvas');
  c.width = 1400; c.height = 1867;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, 1400, 1867);
  const blob = await new Promise((res) => c.toBlob(res, 'image/webp', 0.82));
  return new Uint8Array(await blob.arrayBuffer());
});
writeFileSync(join(out, 'cold-cathedral-poster.webp'), Buffer.from(buf));
await browser.close();
console.log('exported webp', buf.length, 'bytes');
