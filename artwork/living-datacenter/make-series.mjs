// Cold Cathedral — Series 02 "The Living Datacenter": 5 scene plates + book.pdf
// Each plate is a distinct composition telling one scene of the journey:
//   INIT (boot) -> ORDER (core) -> FLOW (data) -> KEEP (resilience) -> OPEN (connection)
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const W = 2160, H = 2880, CX = 1080;

const CYAN = '95,212,230';
const AMBER = '197,164,109';
const GOLD = '222,196,150';
const INK = '231,238,246';
const STEEL = '34,50,74';
const RED = '224,102,92';

const rgba = (c, a) => `rgba(${c},${a})`;

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
const poly = (pts, fill, o) =>
  `<polygon points="${pts}" fill="${fill}" opacity="${o}"/>`;
const txt = (x, y, s, size, family, weight, fill, o = 1, anchor = 'start', ls = 0, transform = null) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${o}" text-anchor="${anchor}" letter-spacing="${ls}"${transform ? ` transform="${transform}"` : ''}>${s}</text>`;

const MONO = 'JetBrains Mono';
const DISPLAY = 'Tektur';

const bez = (t, p0, p1, p2, p3) => {
  const u = 1 - t;
  return [
    u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
    u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1],
  ];
};
const dcurve = (p0, p1, p2, p3) =>
  `M${p0[0]},${p0[1]} C${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`;

// ---------- shared plate chrome ----------
function defs(extra = '') {
  return `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#05080d"/>
  <stop offset="0.45" stop-color="#0a1119"/>
  <stop offset="1" stop-color="#060a10"/>
</linearGradient>
<radialGradient id="vig" cx="0.5" cy="0.46" r="0.75">
  <stop offset="0.55" stop-color="#060a10" stop-opacity="0"/>
  <stop offset="1" stop-color="#02040a" stop-opacity="0.5"/>
</radialGradient>
<radialGradient id="glowCyan" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(CYAN, 0.09)}"/>
  <stop offset="1" stop-color="${rgba(CYAN, 0)}"/>
</radialGradient>
<radialGradient id="glowAmber" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(AMBER, 0.1)}"/>
  <stop offset="1" stop-color="${rgba(AMBER, 0)}"/>
</radialGradient>
<radialGradient id="glowGold" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(GOLD, 0.12)}"/>
  <stop offset="1" stop-color="${rgba(GOLD, 0)}"/>
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
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0c1219" stop-opacity="0"/>
  <stop offset="1" stop-color="#0c1219" stop-opacity="0.92"/>
</linearGradient>
<filter id="gCyan" x="-120%" y="-200%" width="340%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="gAmber" x="-120%" y="-200%" width="340%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="gGold" x="-120%" y="-200%" width="340%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="gApex" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="22"/></filter>
${extra}
</defs>`;
}

function base(S, extraDefs = '') {
  S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  S.push(defs(extraDefs));
  S.push(rect(0, 0, W, H, 'url(#bg)'));
  for (let x = 120; x < W; x += 120) S.push(line(x, 0, x, H, rgba(STEEL, 0.05), x % 480 === 0 ? 0.10 : 0.05));
  for (let y = 120; y < H; y += 120) S.push(line(0, y, W, y, rgba(STEEL, 0.05), y % 480 === 0 ? 0.10 : 0.05));
}

function chrome(S, meta) {
  S.push(txt(40, 66, `CATALOGUE NO. 07-00${meta.n}`, 18, MONO, 400, rgba(INK, 0.42), 1, 'start', 2));
  S.push(txt(2120, 66, 'SER. 02 — THE LIVING DATACENTER', 18, MONO, 400, rgba(INK, 0.42), 1, 'end', 2));
  S.push(txt(2116, 1450, meta.right, 26, DISPLAY, 300, rgba(INK, 0.16), 1, 'middle', 10, 'rotate(90 2116 1450)'));
  S.push(txt(64, 1450, meta.left, 20, MONO, 400, rgba(INK, 0.15), 1, 'middle', 6, 'rotate(90 64 1450)'));
  S.push(line(0, 2700, W, 2700, rgba(STEEL, 0.9), 1, 2));
  for (let k = 1; k <= 17; k++) S.push(line(k * 120, 2700, k * 120, 2718, rgba(STEEL, 0.8), 1, 1.5));
  S.push(line(CX, 2700, CX, 2724, rgba(INK, 0.5), 1, 2));
  S.push(txt(200, 2604, 'SCALE 1:1', 17, MONO, 400, rgba(INK, 0.4), 1, 'start', 1));
  S.push(line(200, 2620, 680, 2620, rgba(INK, 0.4), 1, 1.5));
  for (let i = 0; i <= 8; i++) S.push(line(200 + i * 60, 2612, 200 + i * 60, 2628, rgba(INK, 0.4), 1, 1.2));
  S.push(txt(680, 2644, '480 UNITS', 17, MONO, 400, rgba(INK, 0.4), 1, 'end', 1));
  S.push(txt(120, 2756, `FIG. ${meta.fig} — ${meta.band} · SECTION E-E`, 20, MONO, 400, rgba(INK, 0.72), 1, 'start', 2));
  S.push(txt(CX, 2756, 'N 03°25′12″ · W 076°32′06″', 20, MONO, 400, rgba(INK, 0.72), 1, 'middle', 2));
  S.push(txt(2040, 2756, `SHEET ${meta.sheet} / 05 · OBSERVED 03:14:07 UTC`, 20, MONO, 400, rgba(INK, 0.72), 1, 'end', 2));
  S.push(rect(0, 2872, W, 3, 'url(#bandAccent)', 0.85));
  const cross = (x, y) =>
    line(x - 8, y, x + 8, y, rgba(INK, 0.4), 1, 1.5) + line(x, y - 8, x, y + 8, rgba(INK, 0.4), 1, 1.5);
  S.push(cross(36, 36)); S.push(cross(2124, 36)); S.push(cross(36, 2844)); S.push(cross(2124, 2844));
  S.push(rect(0, 0, W, H, 'url(#vig)'));
  S.push('</svg>');
}

// ---------- PLATE 01 — BOOT (INIT) ----------
function plateBoot(S) {
  S.push(poly('1080,60 760,1700 1400,1700', rgba(CYAN, 0.05)));
  S.push(rect(0, 1500, W, 1380, 'url(#fog)'));
  for (let i = 0; i < 34; i++) {
    const x = 260 + ((i * 137.5) % 1640);
    const y = 480 + ((i * 293.7) % 900);
    const r = 2 + (i % 3);
    S.push(circle(x, y, r, rgba(CYAN, 0.06 + (i % 5) * 0.03)));
  }
  const R0 = 940, R1 = 1220, Y0 = 1560;
  S.push(rect(R0, Y0, R1 - R0, 1140, '#0b131d'));
  S.push(rectS(R0, Y0, R1 - R0, 1140, 'none', 1, 0, '#2b3d54', 1.5));
  S.push(line(R0 + 16, Y0, R0 + 16, 2700, rgba(STEEL, 0.25), 1, 1));
  S.push(line(R1 - 16, Y0, R1 - 16, 2700, rgba(STEEL, 0.25), 1, 1));
  const lit = new Set([1, 3, 5]);
  for (let r = 0; r <= 18; r++) {
    const y = 1640 + r * 56;
    const booting = r <= 6;
    const active = lit.has(r);
    S.push(rect(R0 + 40, y - 9, 200, 18, rgba(CYAN, active ? 0.5 : booting ? 0.15 : 0.05), 1, 3));
    S.push(rectS(R0 + 40, y - 9, 200, 18, 'none', 1, 3, rgba(CYAN, booting ? (active ? 0.7 : 0.3) : 0.18), 1));
    if (booting) S.push(circle(CX, y, 3.5, active ? rgba(CYAN, 0.85) : rgba(CYAN, 0.35)));
  }
  S.push(line(R0, Y0, R1, Y0, rgba(CYAN, 0.4), 1, 1.5));
  S.push(txt(40, 130, 'SYS.INIT ▸ BOOTING', 20, MONO, 400, rgba(CYAN, 0.8), 1, 'start', 2));
  S.push(circle(40, 96, 3.5, rgba(CYAN, 0.9)));
  S.push(txt(2120, 130, 'ETA 03:14:07 UTC', 20, MONO, 400, rgba(INK, 0.5), 1, 'end', 2));
  S.push(txt(CX, 1150, 'INIT', 300, DISPLAY, 220, rgba(INK, 0.055), 1, 'middle', 0.24));
}

// ---------- PLATE 02 — CORE (ORDER) ----------
function plateCore(S) {
  const VP = [CX, 800];
  for (let k = -8; k <= 8; k++) S.push(line(VP[0], VP[1], CX + k * 160, H, rgba(STEEL, 0.13)));
  for (const t of [0.06, 0.14, 0.26, 0.42, 0.64, 1.0]) {
    const y = VP[1] + (H - VP[1]) * t * t;
    S.push(line(0, y, W, y, rgba(STEEL, t > 0.9 ? 0.22 : 0.12)));
  }
  S.push(circleF(VP[0], VP[1], 26, rgba(CYAN, 0.4), 1, 'gApex'));
  S.push(circle(VP[0], VP[1], 10, rgba(INK, 0.9)));
  for (const [r, o] of [[44, 0.25], [80, 0.13]]) S.push(circle(VP[0], VP[1], r, 'none', 1, rgba(CYAN, o), 1.2));
  const depths = [
    { t: 0.95, h: 1760, w: 290, a: 330 },
    { t: 0.68, h: 1240, w: 205, a: 235 },
    { t: 0.45, h: 820, w: 135, a: 155 },
    { t: 0.28, h: 505, w: 85, a: 96 },
  ];
  for (const d of depths) {
    const yBase = VP[1] + (H - VP[1]) * d.t;
    const yTop = yBase - d.h;
    for (const sgn of [-1, 1]) {
      const xL = CX + sgn * d.a;
      const x0 = sgn < 0 ? xL - d.w : xL;
      S.push(rect(x0, yTop, d.w, d.h, '#0a1119'));
      S.push(rectS(x0, yTop, d.w, d.h, 'none', 1, 0, '#1d2c3d', 1.2));
      S.push(line(x0 + 6, yTop, x0 + 6, yBase, rgba(STEEL, 0.3), 1, 1));
      S.push(line(x0 + d.w - 6, yTop, x0 + d.w - 6, yBase, rgba(STEEL, 0.3), 1, 1));
      const p = 46 * d.t;
      const rows = Math.floor(d.h / p);
      for (let r = 1; r <= rows; r++) {
        const y = yBase - r * p;
        if (r % 5 === 1) S.push(rect(x0 + 8, y - p * 0.18, d.w - 16, p * 0.36, rgba(CYAN, 0.3 * d.t)));
        else S.push(line(x0 + 8, y, x0 + d.w - 8, y, rgba(STEEL, 0.5)));
      }
      S.push(line(x0, yTop, x0 + d.w, yTop, rgba(CYAN, 0.3 * d.t), 1, 1.2));
    }
  }
  S.push(txt(CX, 2490, 'ORDER', 300, DISPLAY, 220, rgba(INK, 0.05), 1, 'middle', 0.2));
  const lvls = [
    [1420, 'L5', 'ENT'], [1680, 'L4', 'BUS'], [1940, 'L3', 'OPS'],
    [2200, 'L2', 'CTL'], [2460, 'L1', 'BSC'], [2720, 'L0', 'PROC'],
  ];
  S.push(line(2030, 1420, 2030, 2720, rgba(INK, 0.12), 1, 1));
  for (const [y, l, name] of lvls) {
    S.push(line(1992, y, 2030, y, rgba(INK, 0.3), 1, 1));
    S.push(txt(1986, y + 7, `${l} ${name}`, 19, MONO, 400, rgba(INK, 0.38), 1, 'end', 1.5));
  }
}

// ---------- PLATE 03 — DATA (FLOW) ----------
function plateData(S) {
  const hub = [1080, 1400], hw = 220, hh = 170;
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
  S.push(`<g>${stream([140, 1150], [760, 980], [1400, 1440], [2020, 1290], CYAN, 44, 0.8)}</g>`);
  S.push(path(dcurve([140, 1150], [760, 980], [1400, 1440], [2020, 1290]), rgba(CYAN, 0.14), 1, 1.2, '1 18'));
  S.push(`<g>${stream([160, 1600], [820, 1460], [1400, 1660], [2000, 1510], CYAN, 30, 0.5)}</g>`);
  const nodes = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
    const R = 480 + (i % 3) * 90;
    nodes.push([hub[0] + R * Math.cos(a), hub[1] + R * 0.78 * Math.sin(a)]);
  }
  for (const [nx, ny] of nodes) S.push(line(hub[0], hub[1], nx, ny, rgba(CYAN, 0.13), 1, 1));
  for (const [ni] of [[1], [5], [8], [12]]) {
    const [nx, ny] = nodes[ni];
    for (let k = 1; k < 7; k++) {
      const t = k / 7;
      S.push(circle(hub[0] + (nx - hub[0]) * t, hub[1] + (ny - hub[1]) * t, 3.5, rgba(CYAN, 0.5 - Math.abs(t - 0.5) * 0.5)));
    }
    S.push(line(hub[0], hub[1], nx, ny, rgba(CYAN, 0.4), 1, 1.4));
  }
  S.push(rectS(hub[0] - hw / 2, hub[1] - hh / 2, hw, hh, rgba(CYAN, 0.07), 1, 8, rgba(CYAN, 0.55), 1.5));
  S.push(rectS(hub[0] - hw / 2 + 8, hub[1] - hh / 2 + 8, hw - 16, hh - 16, 'none', 1, 6, rgba(CYAN, 0.2), 1));
  for (let i = 0; i < 6; i++) {
    const py = hub[1] - 60 + i * 24;
    S.push(circle(hub[0] - hw / 2, py, 4, rgba(CYAN, 0.8)));
    S.push(circle(hub[0] + hw / 2, py, 4, rgba(CYAN, 0.8)));
  }
  for (let i = 0; i < nodes.length; i++) {
    const [nx, ny] = nodes[i];
    const alert = i === 3 || i === 11;
    S.push(circle(nx, ny, alert ? 12 : 9, alert ? rgba(RED, 0.12) : rgba(CYAN, 0.1), 1, alert ? rgba(RED, 0.65) : rgba(CYAN, 0.5), 1.2));
    if (i === 5 || i === 12) {
      S.push(circle(nx, ny, 20, 'none', 1, rgba(CYAN, 0.3), 1));
      S.push(circle(nx, ny, 30, 'none', 1, rgba(CYAN, 0.16), 1));
    }
    if (alert) S.push(txt(nx + 18, ny + 6, 'ALRT', 14, MONO, 400, rgba(RED, 0.7), 1, 'start', 1));
  }
  S.push(txt(CX, 2520, 'FLOW', 300, DISPLAY, 220, rgba(INK, 0.05), 1, 'middle', 0.2));
}

// ---------- PLATE 04 — RESILIENCE (KEEP) ----------
function plateResilience(S) {
  const HORIZON = 1560;
  S.push(line(0, HORIZON, W, HORIZON, rgba(STEEL, 0.3), 1));
  for (let k = -9; k <= 9; k++) S.push(line(CX, HORIZON, CX + k * 120, H, rgba(STEEL, 0.13)));
  for (const t of [0.12, 0.26, 0.46, 0.74, 1.0]) {
    const y = HORIZON + (H - HORIZON) * t * t;
    S.push(line(0, y, W, y, rgba(STEEL, t > 0.9 ? 0.22 : 0.12)));
  }
  S.push(circleF(CX, 2450, 900, rgba(AMBER, 0.15), 1, 'gGold'));
  S.push(poly('1080,40 820,1500 1340,1500', rgba(AMBER, 0.055)));
  S.push(txt(CX, 2610, 'KEEP', 280, DISPLAY, 220, rgba(INK, 0.05), 1, 'middle', 0.18));
  const unit = (x, y, w, h, op) => {
    const o = [];
    o.push(rect(x, y, w, h, '#0c1118', op));
    o.push(rectS(x, y, w, h, 'none', op, 2, rgba(AMBER, 0.4), 1.2));
    o.push(rectF(x, y - 8, w, 16, rgba(AMBER, 0.35), op, 6, 'gAmber'));
    o.push(rect(x, y, w, 5, rgba(AMBER, 0.75), op));
    for (let i = 1; i < 6; i++) o.push(line(x + 10, y + 24 + i * (h - 40) / 6, x + w - 10, y + 24 + i * (h - 40) / 6, rgba(AMBER, 0.22), op));
    o.push(rect(x + w - 26, y + 14, 12, 12, rgba(AMBER, 0.7), op));
    return o.join('');
  };
  for (const [x, y, w, h] of [[760, 2000, 380, 280], [1380, 2000, 380, 280]]) S.push(unit(x, y, w, h, 0.5));
  for (const [x, y, w, h] of [[360, 2300, 430, 340], [865, 2300, 430, 340], [1370, 2300, 430, 340]]) S.push(unit(x, y, w, h, 0.85));
  S.push(path('M120,2290 L2040,2290', rgba(AMBER, 0.45), 1, 1.5, '10 12'));
  S.push(circle(120, 2290, 4, rgba(AMBER, 0.7)));
  S.push(circle(2040, 2290, 4, rgba(AMBER, 0.7)));
  S.push(circle(1310, 1758, 2.5, rgba(AMBER, 0.7)));
  S.push(txt(1322, 1767, 'REDUNDANCY PAIR', 18, MONO, 400, rgba(AMBER, 0.6), 1, 'start'));
  S.push(txt(1322, 1789, '▸ MIRRORED', 18, MONO, 400, rgba(AMBER, 0.45), 1, 'start'));
}

// ---------- PLATE 05 — CONNECTION (OPEN) ----------
function plateConnection(S) {
  S.push(circleF(CX, 420, 1150, rgba(GOLD, 0.10), 1, 'gApex'));
  const AX = CX, AY = 320;
  for (const [r, o] of [[300, 0.07], [210, 0.12], [130, 0.2], [62, 0.32]]) {
    S.push(circle(AX, AY, r, 'none', 1, rgba(GOLD, o), 1.4));
  }
  S.push(circleF(AX, AY, 26, rgba(GOLD, 0.4), 1, 'gApex'));
  S.push(circle(AX, AY, 13, rgba(GOLD, 0.15), 1, rgba(GOLD, 0.7), 1.5));
  S.push(circle(AX, AY, 5, rgba(INK, 0.95)));
  S.push(line(AX, AY + 34, AX, 640, rgba(GOLD, 0.4), 1, 1.5));
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const R = 380 + (i % 4) * 110;
    const x = AX + R * Math.cos(a), y = AY + R * Math.sin(a) * 0.85;
    if (y < 40 || y > 2880 || x < 30 || x > 2130) continue;
    S.push(circle(x, y, 3.5, i % 2 === 0 ? rgba(GOLD, 0.55) : rgba(CYAN, 0.4)));
  }
  const slabYs = [640, 870, 1100, 1330, 1560, 1790];
  const slabH = 200, slabX0 = 430, slabW = 1300;
  for (let i = 0; i < 6; i++) {
    const y = slabYs[i];
    const warm = i >= 4;
    const col = warm ? AMBER : CYAN;
    S.push(rect(slabX0, y, slabW, slabH, warm ? '#0d1116' : '#0b131d'));
    S.push(rectS(slabX0, y, slabW, slabH, 'none', 1, 0, rgba(col, 0.5), 1.2));
    for (let d = 0; d < 10; d++) S.push(circle(slabX0 + 60 + d * 132, y + 100, 4, rgba(col, 0.55 - (i % 3) * 0.1)));
    S.push(txt(slabX0 - 18, y + 115, `L${5 - i}`, 18, MONO, 400, rgba(INK, 0.45), 1, 'end'));
  }
  S.push(line(CX, 320, CX, 1990, 'url(#spine)', 0.8, 2));
  S.push(txt(CX, 2520, 'OPEN', 300, DISPLAY, 220, rgba(INK, 0.06), 1, 'middle', 0.24));
  S.push(circleF(CX, 2520, 700, rgba(GOLD, 0.05), 1, 'gApex'));
}

// ---------- assemble ----------
const plates = [
  { id: 'plate-01-boot', meta: { n: 1, fig: '08', band: 'BOOT SEQUENCE', sheet: '01', right: 'BOOT SEQUENCE — SYSTEM INITIALIZING', left: 'OBS. 01 — NOTHING YET, ONLY LIGHT' }, draw: plateBoot },
  { id: 'plate-02-core', meta: { n: 2, fig: '09', band: 'CORE ARCHITECTURE', sheet: '02', right: 'CORE ARCHITECTURE — THE AISLE OF ORDER', left: 'OBS. 02 — SYMMETRY AS REVERENCE' }, draw: plateCore },
  { id: 'plate-03-data', meta: { n: 3, fig: '10', band: 'DATA IN MOTION', sheet: '03', right: 'DATA IN MOTION — COMPLEXITY, DOMINATED', left: 'OBS. 03 — FLOW IS THE PROOF OF WORK' }, draw: plateData },
  { id: 'plate-04-resilience', meta: { n: 4, fig: '11', band: 'RESILIENCE & DEPTH', sheet: '04', right: 'RESILIENCE & DEPTH — WHAT SURVIVES', left: 'OBS. 04 — WARMTH WHERE THE HEAVY THINGS ARE' }, draw: plateResilience },
  { id: 'plate-05-connection', meta: { n: 5, fig: '12', band: 'CONNECTION POINT', sheet: '05', right: 'CONNECTION POINT — ALL LIGHTS, ONE NODE', left: 'OBS. 05 — THE SYSTEM OPENS' }, draw: plateConnection },
];

const svgs = plates.map((p) => {
  const S = [];
  base(S);
  p.draw(S);
  chrome(S, p.meta);
  return S.join('\n');
});

const dir = (f) => join(__dirname, f);
const b64 = (f) => readFileSync(join(__dirname, 'fonts', f)).toString('base64');
const fontCSS = `@font-face{font-family:'JetBrains Mono';src:url(data:font/ttf;base64,${b64('JetBrainsMono.ttf')}) format('truetype');font-weight:100 800;}
@font-face{font-family:'Tektur';src:url(data:font/ttf;base64,${b64('Tektur.ttf')}) format('truetype');font-weight:100 900;}`;

const singleCSS = `html,body{margin:0;padding:0;background:#04060a;}
svg{display:block;}`;
const bookCSS = `html,body{margin:0;padding:0;background:#04060a;}
svg{display:block;}
.page{page-break-after:always;width:${W}px;height:${H}px;overflow:hidden;}
.page:last-child{page-break-after:auto;}
@page{size:${W}px ${H}px;margin:0;}`;

const coverSvg = readFileSync(dir('canvas.html'), 'utf8').match(/<body>([\s\S]*)<\/body>/)[1];
const bookHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>Cold Cathedral — Series 02 · The Living Datacenter</title>
<style>${fontCSS}\n${bookCSS}</style></head>
<body>
<div class="page">${coverSvg}</div>
${plates.map((p, i) => `<div class="page">${svgs[i]}</div>`).join('\n')}
</body></html>`;
writeFileSync(dir('preview-book.html'), bookHtml);

const browser = await chromium.launch();
for (let i = 0; i < plates.length; i++) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${plates[i].id}</title><style>${fontCSS}\n${singleCSS}</style></head><body>${svgs[i]}</body></html>`;
  writeFileSync(dir(`${plates[i].id}.html`), html);
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto('file:///' + dir(`${plates[i].id}.html`).replaceAll('\\', '/'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: dir(`${plates[i].id}.png`) });
  await page.close();
  console.log('rendered', plates[i].id);
}
const bookPage = await browser.newPage({ viewport: { width: W, height: H } });
await bookPage.goto('file:///' + dir('preview-book.html').replaceAll('\\', '/'));
await bookPage.evaluate(() => document.fonts.ready);
await bookPage.waitForTimeout(500);
await bookPage.pdf({ path: dir('book.pdf'), width: W + 'px', height: H + 'px', printBackground: true });
await bookPage.close();
await browser.close();
console.log('book.pdf rendered');
