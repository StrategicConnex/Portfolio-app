import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();

const page = await browser.newPage({ viewport: { width: 2160, height: 2880 } });
await page.setContent(readFileSync(join(__dirname, 'abstract.html'), 'utf8'));
await page.waitForTimeout(200);
const textCount = await page.evaluate(() => document.querySelectorAll('text').length);
console.log('text elements:', textCount);
await page.close();

const p2 = await browser.newPage();
await p2.setContent('<img id="i">');
await p2.evaluate(async (b64) => {
  await new Promise((res, rej) => { const im = document.getElementById('i'); im.onload = res; im.onerror = rej; im.src = 'data:image/png;base64,' + b64; });
}, readFileSync(join(__dirname, 'abstract.png')).toString('base64'));
const out = await p2.evaluate(() => {
  const im = document.getElementById('i');
  const W = im.naturalWidth, H = im.naturalHeight;
  const c = document.createElement('canvas'); c.width = 216; c.height = 288;
  const ctx = c.getContext('2d'); ctx.drawImage(im, 0, 0, 216, 288);
  const d = ctx.getImageData(0, 0, 216, 288).data;
  const sample = (x, y) => {
    const sx = Math.round(x / W * 216), sy = Math.round(y / H * 288);
    let r = 0, g = 0, b = 0, k = 0;
    for (let yy = sy - 3; yy <= sy + 3; yy++) for (let xx = sx - 3; xx <= sx + 3; xx++) {
      const i = (yy * 216 + xx) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; k++;
    }
    return [Math.round(r / k), Math.round(g / k), Math.round(b / k)];
  };
  let lum = 0, n = 216 * 288;
  for (let i = 0; i < d.length; i += 4) lum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  return {
    meanLum: +(lum / n).toFixed(1),
    colTop: sample(1080, 600), colMid: sample(1080, 1500),
    transition: sample(1080, 1930), colWarm: sample(1080, 2150),
    apex: sample(1080, 250), flankL: sample(520, 1200), flankR: sample(1640, 1200),
    basePool: sample(1080, 2600), bgCorner: sample(100, 1500), bgTop: sample(1080, 80),
  };
});
console.log(JSON.stringify(out, null, 1));
await p2.close();
await browser.close();
