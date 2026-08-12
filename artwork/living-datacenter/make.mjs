// Cold Cathedral — "The Living Datacenter" poster generator
// Renders a single 2160x2880 SVG canvas, then rasterizes to PNG (+PDF) with Playwright.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- canvas ----------
const W = 2160, H = 2880, CX = 1080;

// ---------- palette ----------
const CYAN = '95,212,230';
const AMBER = '197,164,109';
const INK = '231,238,246';
const STEEL = '34,50,74';

const rgba = (c, a) => `rgba(${c},${a})`;

// ---------- helpers ----------
const rect = (x, y, w, h, fill, o = 1, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${o}"/>`;
const rectS = (x, y, w, h, fill, o, rx, stroke, sw) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${o}" stroke="${stroke}" stroke-width="${sw}"/>`;
const rectF = (x, y, w, h, fill, o, rx, filter) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${o}" filter="url(#${filter})"/>`;
const line = (x1, y1, x2, y2, stroke, o = 1, sw = 1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-opacity="${o}" stroke-width="${sw}"/>`;
const circle = (x, y, r, fill, o = 1, stroke = null, sw = 0) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${o}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;
const circleF = (x, y, r, fill, o, filter) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${o}" filter="url(#${filter})"/>`;
const path = (d, stroke, o = 1, sw = 1, dash = null) =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="${o}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const txt = (x, y, s, size, family, weight, fill, o = 1, anchor = 'start', ls = 0, transform = null) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${o}" text-anchor="${anchor}" letter-spacing="${ls}"${transform ? ` transform="${transform}"` : ''}>${s}</text>`;

const MONO = 'JetBrains Mono';
const DISPLAY = 'Tektur';

// ---------- cubic bezier sampling ----------
const bez = (t, p0, p1, p2, p3) => {
  const u = 1 - t;
  const x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0];
  const y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1];
  return [x, y];
};
const dcurve = (p0, p1, p2, p3) =>
  `M${p0[0]},${p0[1]} C${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`;

// ---------- build SVG ----------
const S = [];
S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);

// defs
S.push(`<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#05080d"/>
  <stop offset="0.45" stop-color="#0a1119"/>
  <stop offset="1" stop-color="#060a10"/>
</linearGradient>
<radialGradient id="apexGlow" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(CYAN, 0.10)}"/>
  <stop offset="1" stop-color="${rgba(CYAN, 0)}"/>
</radialGradient>
<radialGradient id="vig" cx="0.5" cy="0.46" r="0.75">
  <stop offset="0.55" stop-color="#060a10" stop-opacity="0"/>
  <stop offset="1" stop-color="#02040a" stop-opacity="0.48"/>
</radialGradient>
<radialGradient id="amberGlow" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(AMBER, 0.09)}"/>
  <stop offset="1" stop-color="${rgba(AMBER, 0)}"/>
</radialGradient>
<linearGradient id="spine" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${rgba(CYAN, 0.55)}"/>
  <stop offset="0.62" stop-color="${rgba(CYAN, 0.16)}"/>
  <stop offset="0.7" stop-color="${rgba(AMBER, 0.14)}"/>
  <stop offset="1" stop-color="${rgba(AMBER, 0.5)}"/>
</linearGradient>
<linearGradient id="bandAccent" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${rgba(CYAN, 0.5)}"/>
  <stop offset="0.5" stop-color="${rgba(INK, 0.22)}"/>
  <stop offset="1" stop-color="${rgba(AMBER, 0.55)}"/>
</linearGradient>
<filter id="gCyan" x="-120%" y="-200%" width="340%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="gAmber" x="-120%" y="-200%" width="340%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="gApex" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="20"/></filter>
</defs>`);

// background
S.push(rect(0, 0, W, H, 'url(#bg)'));
S.push(circle(CX, 240, 1050, 'url(#apexGlow)'));

// global faint grid (every 120px, majors every 480)
for (let x = 120; x < W; x += 120) S.push(line(x, 0, x, H, rgba(STEEL, 0.05), x % 480 === 0 ? 0.10 : 0.05));
for (let y = 120; y < H; y += 120) S.push(line(0, y, W, y, rgba(STEEL, 0.05), y % 480 === 0 ? 0.10 : 0.05));

// ---------- perspective floor (bottom corridor) ----------
const HORIZON = 1500;
S.push(line(0, HORIZON, W, HORIZON, rgba(STEEL, 0.30), 1));
for (let k = -9; k <= 9; k++) S.push(line(CX, HORIZON, CX + k * 120, H, rgba(STEEL, 0.14)));
for (const t of [0.10, 0.20, 0.34, 0.52, 0.76, 1.0]) {
  const y = HORIZON + (H - HORIZON) * t * t;
  S.push(line(0, y, W, y, rgba(STEEL, t > 0.9 ? 0.22 : 0.13)));
}

// ---------- data streams (drawn behind totem) ----------
const stream = (p0, p1, p2, p3, col, n, peak) => {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const [x, y] = bez(t, p0, p1, p2, p3);
    const jx = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 2 - 1;
    const jy = ((Math.sin(i * 78.233 + 13.7) * 12543.123) % 1) * 2 - 1;
    const o = peak * (0.18 + 0.82 * Math.max(0, 1 - Math.abs(t - 0.5) * 1.9));
    parts.push(circle(x + jx * 12, y + jy * 12, 5, rgba(col, o)));
  }
  return parts.join('');
};
S.push(`<g>${stream([140, 1150], [760, 980], [1400, 1440], [2020, 1290], CYAN, 46, 0.85)}</g>`);
S.push(path(dcurve([140, 1150], [760, 980], [1400, 1440], [2020, 1290]), rgba(CYAN, 0.15), 1, 1.2, '1 18'));
S.push(`<g>${stream([160, 1560], [820, 1420], [1400, 1620], [2000, 1470], CYAN, 34, 0.55)}</g>`);
S.push(path(dcurve([160, 1560], [820, 1420], [1400, 1620], [2000, 1470]), rgba(CYAN, 0.10), 1, 1.2, '1 22'));
S.push(`<g>${stream([240, 2390], [820, 2280], [1400, 2420], [1960, 2330], AMBER, 24, 0.5)}</g>`);
S.push(path(dcurve([240, 2390], [820, 2280], [1400, 2420], [1960, 2330]), rgba(AMBER, 0.10), 1, 1.2, '1 24'));

// ---------- floor word (engraved) ----------
S.push(txt(CX, 2510, 'SIGNAL', 300, DISPLAY, 220, rgba(INK, 0.08), 1, 'middle', 0.14));
// amber atmosphere at the base (warmth where the heavy things are kept)
S.push(circle(CX, 2060, 760, 'url(#amberGlow)'));

// ---------- flanking racks ----------
const flankRack = (cx0, cx1, op) => {
  const out = [];
  out.push(rect(cx0, 640, cx1 - cx0, 1620, '#0a1119', op));
  out.push(rectS(cx0, 640, cx1 - cx0, 1620, 'none', 1, 0, '#1c2b3c', 1.5));
  const a0 = cx0 + 18, b0 = a0 + 116, a1 = cx1 - 18 - 116, b1 = cx1 - 18;
  for (let r = 6; r <= 32; r++) {
    const y = 380 + r * 56;
    const active = r % 6 === 4 || r === 22;
    const warm = r >= 22;
    const col = warm ? AMBER : CYAN;
    const base = active ? 0.32 : 0.08;
    for (const [sx, ex] of [[a0, b0], [a1, b1]]) {
      out.push(rect(sx, y - 8, ex - sx, 16, rgba(col, base), op));
      out.push(rectS(sx, y - 8, ex - sx, 16, 'none', 1, 2, rgba(col, 0.30), 1));
    }
  }
  return out.join('');
};
S.push(`<g>${flankRack(320, 620, 0.55)}</g>`);
S.push(`<g>${flankRack(1540, 1840, 0.55)}</g>`);

// cable bundles
S.push(path('M620,660 C700,620 760,556 850,532', rgba(STEEL, 0.55), 1, 1.5));
S.push(path('M624,668 C704,628 764,562 854,540', rgba(STEEL, 0.35), 1, 1.5));
S.push(path('M1540,700 C1460,660 1400,596 1310,572', rgba(STEEL, 0.55), 1, 1.5));
S.push(path('M1536,708 C1456,668 1396,602 1306,580', rgba(STEEL, 0.35), 1, 1.5));

// ---------- central totem ----------
const T0 = 850, T1 = 1310, Y0 = 300, Y1 = 2260;
S.push(rect(T0, Y0, T1 - T0, Y1 - Y0, '#0b131d'));
S.push(rectS(T0, Y0, T1 - T0, Y1 - Y0, 'none', 1, 0, '#2b3d54', 1.5));
S.push(line(T0 + 24, Y0, T0 + 24, Y1, rgba(STEEL, 0.25), 1, 1));
S.push(line(T1 - 24, Y0, T1 - 24, Y1, rgba(STEEL, 0.25), 1, 1));
S.push(line(T0 + 24 + 178 + 1, Y0, T0 + 24 + 178 + 1, Y1, rgba(INK, 0.10), 1, 1.5));
S.push(line(T0 + 24 + 178 + 55, Y0, T0 + 24 + 178 + 55, Y1, rgba(INK, 0.10), 1, 1.5));
S.push(line((T0 + T1) / 2, Y0, (T0 + T1) / 2, Y1, 'url(#spine)', 1, 1.5));

const colA0 = T0 + 24, colB0 = T0 + 24 + 178 + 56;
const ACTIVE = new Set([1, 2, 6, 11, 16, 19, 21, 23, 26, 31]);
for (let r = 0; r <= 32; r++) {
  const y = 380 + r * 56;
  const warm = r >= 22;
  const transition = r === 20 || r === 21;
  const col = warm ? AMBER : CYAN;
  const active = ACTIVE.has(r);
  for (const sx of [colA0, colB0]) {
    if (active) S.push(rectF(sx - 3, y - 13, 184, 26, rgba(col, 0.5), 1, 6, warm ? 'gAmber' : 'gCyan'));
    const base = transition ? 0.09 : active ? 0.58 : warm ? 0.17 : 0.13;
    S.push(rect(sx, y - 10, 178, 20, rgba(col, base), 1, 3));
    S.push(rectS(sx, y - 10, 178, 20, 'none', 1, 3, rgba(col, active ? 0.75 : warm ? 0.5 : 0.36), 1));
  }
  const lit = r % 3 !== 1;
  S.push(circle(CX, y, 4, lit ? rgba(col, 0.8) : rgba(STEEL, 0.5), 1, lit ? rgba(col, 0.5) : null, lit ? 1 : 0));
}

// ---------- Purdue level ticks (left of totem) ----------
const LVLS = [
  [463, 'L5', 'ENT'],
  [789, 'L4', 'BUS'],
  [1115, 'L3', 'OPS'],
  [1441, 'L2', 'CTL'],
  [1767, 'L1', 'BSC'],
  [2093, 'L0', 'PROC'],
];
S.push(line(814, 463, 814, 2093, rgba(INK, 0.10), 1, 1));
for (const [y, l, name] of LVLS) {
  S.push(line(806, y, 846, y, rgba(INK, 0.30), 1, 1));
  S.push(txt(800, y + 7, `${l} ${name}`, 19, MONO, 400, rgba(INK, 0.38), 1, 'end', 1.5));
}

// ---------- apex node ----------
const AX = CX, AY = 240;
for (const [r, o] of [[232, 0.06], [158, 0.11], [96, 0.19], [46, 0.30]]) {
  S.push(circle(AX, AY, r, 'none', 1, rgba(CYAN, o), 1.5));
}
S.push(circleF(AX, AY, 22, rgba(CYAN, 0.35), 1, 'gApex'));
S.push(circle(AX, AY, 14, rgba(CYAN, 0.10), 1, rgba(CYAN, 0.65), 1.5));
S.push(circle(AX, AY, 5, rgba(INK, 0.9)));
S.push(line(AX, AY + 24, AX, Y0, rgba(CYAN, 0.32), 1, 1.5));

// ---------- field labels + leader lines (all in clean gaps, no overlaps) ----------
const lead = (x1, y1, x2, y2, col) =>
  line(x1, y1, x2, y2, col, 0.55, 1) + circle(x2, y2, 2.5, col, 0.8);
// SYS.INIT — free upper-left (above flank rack, which starts at y=640)
S.push(txt(640, 421, 'SYS.INIT ▸ OK', 20, MONO, 400, rgba(CYAN, 0.8), 1, 'end'));
S.push(lead(648, 414, 848, 414, rgba(CYAN, 0.55)));
// LEVEL 2 — right gap between totem (1310) and right flank (1540)
S.push(circle(1310, 758, 2.5, rgba(INK, 0.6), 0.8));
S.push(txt(1322, 767, 'LEVEL 2 ▸ CONTROL', 18, MONO, 400, rgba(INK, 0.75), 1, 'start'));
// DATA IN MOTION — left gap, two quiet lines, leader to totem edge
S.push(txt(790, 1225, 'DATA IN MOTION', 18, MONO, 400, rgba(CYAN, 0.8), 1, 'end'));
S.push(txt(790, 1249, '▸ 1.4 TB/s', 18, MONO, 400, rgba(CYAN, 0.55), 1, 'end'));
S.push(lead(798, 1225, 848, 1225, rgba(CYAN, 0.5)));
// RESILIENCE LAYER — right gap at the amber zone, two quiet lines
S.push(circle(1310, 1758, 2.5, rgba(AMBER, 0.7), 0.8));
S.push(txt(1322, 1767, 'RESILIENCE LAYER', 18, MONO, 400, rgba(AMBER, 0.85), 1, 'start'));
S.push(txt(1322, 1789, '▸ AMBER', 18, MONO, 400, rgba(AMBER, 0.6), 1, 'start'));
// RE:CONNECTION — upper right, clear of apex rings (max x=1312)
S.push(txt(1408, 212, 'RE:CONNECTION ▸ NODE 07', 20, MONO, 400, rgba(INK, 0.8), 1, 'start'));
S.push(lead(1190, 205, 1400, 205, rgba(CYAN, 0.5)));

// ---------- corner catalogue ----------
S.push(txt(40, 66, 'CATALOGUE NO. 07-002', 18, MONO, 400, rgba(INK, 0.42), 1, 'start', 2));
S.push(txt(2120, 66, 'REF. PURDUE MODEL 0–5', 18, MONO, 400, rgba(INK, 0.42), 1, 'end', 2));

// ---------- vertical inscriptions ----------
S.push(txt(2116, 1450, 'THE COLD CATHEDRAL — A STUDY IN ORDERED LIGHT', 26, DISPLAY, 300, rgba(INK, 0.16), 1, 'middle', 10, 'rotate(90 2116 1450)'));
S.push(txt(64, 1450, 'REPETITION AS REVERENCE ▸ OBS. 01', 20, MONO, 400, rgba(INK, 0.15), 1, 'middle', 6, 'rotate(90 64 1450)'));

// ---------- bottom band ----------
S.push(line(0, 2700, W, 2700, rgba(STEEL, 0.9), 1, 2));
for (let k = 1; k <= 17; k++) S.push(line(k * 120, 2700, k * 120, 2718, rgba(STEEL, 0.8), 1, 1.5));
S.push(line(CX, 2700, CX, 2724, rgba(INK, 0.5), 1, 2));
// scale bar
S.push(txt(200, 2604, 'SCALE 1:1', 17, MONO, 400, rgba(INK, 0.4), 1, 'start', 1));
S.push(line(200, 2620, 680, 2620, rgba(INK, 0.4), 1, 1.5));
for (let i = 0; i <= 8; i++) S.push(line(200 + i * 60, 2612, 200 + i * 60, 2628, rgba(INK, 0.4), 1, 1.2));
S.push(txt(680, 2644, '480 UNITS', 17, MONO, 400, rgba(INK, 0.4), 1, 'end', 1));
// band text
S.push(txt(120, 2756, 'FIG. 07 — COLD CORRIDOR B-07 · SECTION E-E', 20, MONO, 400, rgba(INK, 0.72), 1, 'start', 2));
S.push(txt(CX, 2756, 'N 03°25′12″ · W 076°32′06″', 20, MONO, 400, rgba(INK, 0.72), 1, 'middle', 2));
S.push(txt(2040, 2756, 'SHEET 07 / 07 · OBSERVED 03:14:07 UTC', 20, MONO, 400, rgba(INK, 0.72), 1, 'end', 2));
// accent line
S.push(rect(0, 2872, W, 3, 'url(#bandAccent)', 0.85));

// ---------- registration crosses ----------
const cross = (x, y) =>
  line(x - 8, y, x + 8, y, rgba(INK, 0.4), 1, 1.5) + line(x, y - 8, x, y + 8, rgba(INK, 0.4), 1, 1.5);
S.push(cross(36, 36)); S.push(cross(2124, 36)); S.push(cross(36, 2844)); S.push(cross(2124, 2844));

// ---------- vignette (last) ----------
S.push(rect(0, 0, W, H, 'url(#vig)'));

S.push('</svg>');

const svg = S.join('\n');
// inline fonts as data URIs so canvas.html is fully self-contained (preview + offline)
const b64 = (f) => readFileSync(join(__dirname, 'fonts', f)).toString('base64');
const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Cold Cathedral</title>
<style>
@font-face{font-family:'JetBrains Mono';src:url(data:font/ttf;base64,${b64('JetBrainsMono.ttf')}) format('truetype');font-weight:100 800;}
@font-face{font-family:'Tektur';src:url(data:font/ttf;base64,${b64('Tektur.ttf')}) format('truetype');font-weight:100 900;}
@font-face{font-family:'Instrument Sans';src:url(data:font/ttf;base64,${b64('InstrumentSans.ttf')}) format('truetype');font-weight:100 900;}
html,body{margin:0;padding:0;background:#04060a;}
svg{display:block;}
@page{size:${W}px ${H}px;margin:0;}
</style></head>
<body>${svg}</body></html>`;

writeFileSync(join(__dirname, 'canvas.html'), html);

// ---------- render ----------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file://' + join(__dirname, 'canvas.html').replace(/\\/g, '/'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: join(__dirname, 'canvas.png') });
await page.pdf({ path: join(__dirname, 'canvas.pdf'), width: W + 'px', height: H + 'px', printBackground: true });
await browser.close();
console.log('rendered canvas.html / canvas.png / canvas.pdf');
