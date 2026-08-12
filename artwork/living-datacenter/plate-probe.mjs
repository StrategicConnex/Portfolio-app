import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();

const plates = [
  ['plate-01-boot', { rack: [1080, 1700], word: [1080, 1150], sky: [300, 700] }],
  ['plate-02-core', { vp: [1080, 800], rack: [620, 2400], word: [1080, 2550], purdue: [126, 1680] }],
  ['plate-03-data', { hub: [1080, 1400], node: [1080, 1400 - 480 * 0.78], word: [1080, 2520] }],
  ['plate-04-resilience', { block: [1080, 2470], scan: [1080, 2290], word: [1080, 2690], glow: [1080, 2450] }],
  ['plate-05-connection', { apex: [1080, 320], slab: [1080, 740], word: [1080, 2520], spine: [1080, 1000] }],
];

for (const [id, pts] of plates) {
  const page = await browser.newPage();
  await page.setContent('<img id="i">');
  await page.evaluate(async (b64) => {
    await new Promise((res, rej) => { const im = document.getElementById('i'); im.onload = res; im.onerror = rej; im.src = 'data:image/png;base64,' + b64; });
  }, readFileSync(join(__dirname, id + '.png')).toString('base64'));
  const out = await page.evaluate((pts) => {
    const im = document.getElementById('i');
    const W = im.naturalWidth, H = im.naturalHeight;
    const c = document.createElement('canvas'); c.width = 216; c.height = 288;
    const ctx = c.getContext('2d'); ctx.drawImage(im, 0, 0, 216, 288);
    const d = ctx.getImageData(0, 0, 216, 288).data;
    let lit = 0, cyan = 0, amber = 0, lum = 0, n = 216 * 288;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lum += L;
      if (L > 14) lit++;
      if (g > 110 && b > 120 && r < 150 && g > r + 40) cyan++;
      if (r > 130 && g > 100 && g < 190 && b < 120 && r > b + 50) amber++;
    }
    const sample = (x, y) => {
      const sx = Math.round(x / W * 216), sy = Math.round(y / H * 288);
      let r = 0, g = 0, b = 0, k = 0;
      for (let yy = sy - 2; yy <= sy + 2; yy++) for (let xx = sx - 2; xx <= sx + 2; xx++) {
        const i = (yy * 216 + xx) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; k++;
      }
      return [Math.round(r / k), Math.round(g / k), Math.round(b / k)];
    };
    const probes = {};
    for (const [k, [x, y]] of Object.entries(pts)) probes[k] = sample(x, y);
    return { meanLum: +(lum / n).toFixed(1), litPct: +(lit / n * 100).toFixed(1), cyanPct: +(cyan / n * 100).toFixed(2), amberPct: +(amber / n * 100).toFixed(2), probes };
  }, pts);
  console.log(id, JSON.stringify(out));
  await page.close();
}

// text bounds/overlap check per plate
for (const id of plates.map(p => p[0])) {
  const page = await browser.newPage({ viewport: { width: 2160, height: 2880 } });
  await page.setContent(readFileSync(join(__dirname, id + '.html'), 'utf8'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const res = await page.evaluate(() => {
    const texts = [...document.querySelectorAll('text')].map((t) => {
      const r = t.getBoundingClientRect();
      return { s: t.textContent.trim().slice(0, 26), o: parseFloat(t.getAttribute('opacity') || '1'), x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const issues = [];
    const oob = texts.filter(t => t.x < -2 || t.y < -2 || t.x + t.w > 2162 || t.y + t.h > 2882).map(t => t.s);
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (a.w === 0 || b.w === 0) continue;
      const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      if (ox > 4 && oy > 4) issues.push(`"${a.s}" × "${b.s}"`);
    }
    return { textCount: texts.length, overlaps: issues, outOfBounds: oob };
  });
  console.log(id, 'text:', res.textCount, 'overlaps:', res.overlaps.length ? res.overlaps : 'none', 'oob:', res.outOfBounds.length ? res.outOfBounds : 'none');
  await page.close();
}
await browser.close();
