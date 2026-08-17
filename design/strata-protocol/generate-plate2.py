#!/usr/bin/env python3
"""Strata Protocol — Plate II: basin plan view (structure contour map).

Companion to the cross-section plate. The same Neuquén Basin, now read from
above: depth contours (isobaths) drawn by marching squares over a synthetic
structure field, a fault that offsets them, a pay-zone core hatched in amber,
well heads, a graticule, a type log in the right margin, and the same quiet
apparatus of mono annotations. The hidden language stays: the zone labels
(OPERATIONS FLOOR, CONTROL PLANE, DMZ SEAL, PAY ZONE) are the ISA-95 Purdue
names painted onto a geology map — for anyone who reads OT.
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------- constants
W, H = 2400, 3200
S = int(os.environ.get("SP_SCALE", "2"))   # supersample factor (2x display, 3x print)
FW, FH = W * S, H * S
OUT = os.environ.get("SP_OUT", "design/strata-protocol/strata-protocol-plate2.webp")
M = 150                    # margin (final px)

SEED = 20260817
rng = random.Random(SEED)

# palette (identical to plate I)
GROUND      = (10, 13, 18)
BONE        = (232, 227, 216)
AMBER       = (217, 164, 65)
CYAN        = (92, 168, 160)
MUTED       = (138, 148, 166)
FAINT       = (74, 84, 101)
BOUNDARY    = (42, 53, 66)
SEDIMENT    = (90, 106, 126)

# fonts
FD = "design/strata-protocol/fonts/"
def font(name, size):
    return ImageFont.truetype(FD + name, int(size * S))

F_DM   = lambda s: font("DMMono-Regular.ttf", s)
F_PLEX = lambda s: font("IBMPlexMono-Regular.ttf", s)
F_ITA  = lambda s: font("Italiana-Regular.ttf", s)
F_YS   = lambda s: font("YoungSerif-Regular.ttf", s)

def mix(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def with_alpha(rgb, a):
    return rgb + (int(a),)

# ---------------------------------------------------------------- helpers
def vline(d, x, y0, y1, color, w=1):
    d.line([(x * S, y0 * S), (x * S, y1 * S)], fill=color, width=int(w * S))

def hline(d, x0, x1, y, color, w=1):
    d.line([(x0 * S, y * S), (x1 * S, y * S)], fill=color, width=int(w * S))

def dot(d, x, y, r, color):
    d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=color)

def cross(d, x, y, arm, color, w=1):
    hline(d, x - arm, x + arm, y, color, w)
    vline(d, x, y - arm, y + arm, color, w)

def poly(d, pts, color, w=1):
    d.line([(x * S, y * S) for x, y in pts], fill=color, width=int(w * S), joint="curve")

def tracked(d, xy, text, fnt, fill, tracking=0):
    x, y = xy
    for ch in text:
        w = fnt.getlength(ch)
        d.text((x * S, y * S), ch, font=fnt, fill=fill)
        x += (w / S) + tracking
    return x - tracking

def text_w(fnt, text, tracking=0):
    total = 0.0
    for ch in text:
        total += fnt.getlength(ch) / S + tracking
    return total - tracking

def centered_tracked(d, cx, y, text, fnt, fill, tracking=0):
    tw = text_w(fnt, text, tracking)
    tracked(d, (cx - tw / 2, y), text, fnt, fill, tracking)

def dashed(d, x0, y0, x1, y1, color, dash=14, gap=10, w=1):
    length = math.hypot(x1 - x0, y1 - y0)
    n = int(length / (dash + gap))
    dx, dy = (x1 - x0) / length, (y1 - y0) / length
    for i in range(n):
        a = i * (dash + gap)
        b = min(a + dash, length)
        d.line([((x0 + dx * a) * S, (y0 + dy * a) * S),
                ((x0 + dx * b) * S, (y0 + dy * b) * S)], fill=color, width=int(w * S))

# ---------------------------------------------------------------- structure field
# map interior (inside the neatline frame)
FX0, FY0, FX1, FY1 = 250, 340, 2000, 2350
IX0, IY0, IX1, IY1 = FX0 + 14, FY0 + 14, FX1 - 14, FY1 - 14
NX, NY = 173, 199                 # ~10 px cells
CX, CY = 1100, 1330               # basin centre

BASE_D = 1500.0
PAY    = 1250.0                   # pay-zone depth threshold

def basin_radius(theta):
    r = 800.0
    r += 96 * math.sin(1.0 * theta + 0.7)
    r += 58 * math.sin(2.0 * theta + 2.3)
    r += 34 * math.sin(3.0 * theta + 4.1)
    r += 18 * math.sin(5.0 * theta + 1.2)
    return r

# fault A — normal fault crossing the west-centre (offsets the contours)
FA_A, FA_B = (600, 950), (1500, 1660)
FA_BAND, FA_OFF = 210.0, 300.0
# fault B — smaller, north-east
FB_A, FB_B = (1500, 700), (1820, 990)
FB_BAND, FB_OFF = 120.0, 150.0

def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L2 = vx * vx + vy * vy
    t = max(0.0, min(1.0, (wx * vx + wy * vy) / L2))
    qx, qy = ax + t * vx, ay + t * vy
    return math.hypot(px - qx, py - qy), t

def side_of(px, py, ax, ay, bx, by):
    # cross product sign: >0 = left of A->B
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax)

def fault_offset(x, y):
    out = 0.0
    dist, _ = seg_dist(x, y, *FA_A, *FA_B)
    if dist < FA_BAND and side_of(x, y, *FA_A, *FA_B) > 0:
        f = 1.0 - dist / FA_BAND
        out += FA_OFF * (f * f * (3 - 2 * f))
    dist, _ = seg_dist(x, y, *FB_A, *FB_B)
    if dist < FB_BAND and side_of(x, y, *FB_A, *FB_B) < 0:
        f = 1.0 - dist / FB_BAND
        out += FB_OFF * (f * f * (3 - 2 * f))
    return out

def depth_at(x, y):
    dx, dy = x - CX, y - CY
    theta = math.atan2(dy, dx)
    R = basin_radius(theta)
    r = math.hypot(dx, dy)
    if r >= R * 1.03:
        return 0.0
    t = max(0.0, min(1.0, r / R))
    d = BASE_D * (1.0 - t) ** 1.5
    # secondary sub-basin to the east, structural high to the west
    dr = math.hypot(x - (CX + 280), y - (CY + 130)) / 680.0
    d += 300.0 * math.exp(-dr * dr)
    hr = math.hypot(x - (CX - 480), y - (CY - 150)) / 540.0
    d -= 430.0 * math.exp(-hr * hr)
    # organic wiggle
    d += 52.0 * (math.sin(x / 185.0 + 1.3) * math.cos(y / 225.0 + 0.7)
                 + 0.6 * math.sin((x + y) / 310.0 + 2.1) * math.cos((x - y) / 265.0 + 4.2))
    d += fault_offset(x, y)
    return max(0.0, d)

print("building structure field...")
field = [[0.0] * (NX + 1) for _ in range(NY + 1)]
for j in range(NY + 1):
    y = IY0 + (IY1 - IY0) * j / NY
    row = field[j]
    for i in range(NX + 1):
        x = IX0 + (IX1 - IX0) * i / NX
        row[i] = depth_at(x, y)

def cell_pos(i, j):
    return (IX0 + (IX1 - IX0) * i / NX, IY0 + (IY1 - IY0) * j / NY)

# ---------------------------------------------------------------- marching squares
def contour_segments(level):
    segs = []
    cxw = (IX1 - IX0) / NX
    cyh = (IY1 - IY0) / NY
    for j in range(NY):
        for i in range(NX):
            v00, v10 = field[j][i], field[j][i + 1]
            v11, v01 = field[j + 1][i + 1], field[j + 1][i]
            case = ((v00 > level) | ((v10 > level) << 1)
                    | ((v11 > level) << 2) | ((v01 > level) << 3))
            if case == 0 or case == 15:
                continue
            x0, y0 = cell_pos(i, j)
            x1 = x0 + cxw
            y1 = y0 + cyh
            # edge crossing points (linear interpolation)
            def tx(v_a, v_b):
                if v_b == v_a:
                    return 0.5
                return max(0.0, min(1.0, (level - v_a) / (v_b - v_a)))
            e0 = (x0 + tx(v00, v10) * cxw, y0)          # top
            e1 = (x1, y0 + tx(v10, v11) * cyh)          # right
            e2 = (x0 + (1.0 - tx(v01, v11)) * cxw, y1)  # bottom (reversed)
            e3 = (x0, y0 + (1.0 - tx(v00, v01)) * cyh)  # left (reversed)
            table = {
                1: (e0, e3), 2: (e0, e1), 3: (e1, e3), 4: (e1, e2),
                6: (e0, e2), 7: (e2, e3), 8: (e2, e3), 9: (e0, e2),
                11: (e1, e2), 12: (e1, e3), 13: (e0, e1), 14: (e0, e3),
            }
            if case in table:
                segs.append(table[case])
            else:  # ambiguous 5 / 10 — two curves
                segs.append((e0, e3))
                segs.append((e1, e2))
    return segs

LEVELS = [200, 400, 600, 800, 1000, 1200, 1400]
def level_color(lv):
    if lv <= 200:
        return with_alpha(FAINT, 125)
    if lv <= 400:
        return with_alpha(mix(FAINT, MUTED, 0.5), 140)
    if lv <= 600:
        return with_alpha(MUTED, 150)
    if lv <= 800:
        return with_alpha(mix(MUTED, BONE, 0.45), 152)
    if lv <= 1000:
        return with_alpha(mix(BONE, AMBER, 0.35), 158)
    if lv <= 1200:
        return with_alpha(mix(AMBER, BONE, 0.25), 175)
    return with_alpha(AMBER, 195)

# ---------------------------------------------------------------- canvas
img = Image.new("RGB", (FW, FH), GROUND)
d = ImageDraw.Draw(img, "RGBA")

# grain (same as plate I)
noise = Image.effect_noise((FW, FH), 22).convert("L")
grain = Image.new("RGB", (FW, FH), (0, 0, 0))
grain.paste(noise, (0, 0))
img = Image.blend(img, grain, 0.045)
streak = Image.effect_noise((FW, FH // 3), 30).convert("L").resize((FW, FH), Image.BILINEAR)
g2 = Image.new("RGB", (FW, FH), (0, 0, 0))
g2.paste(streak, (0, 0))
img = Image.blend(img, g2, 0.035)
d = ImageDraw.Draw(img, "RGBA")

# ---------------------------------------------------------------- map backdrop
# faint basement hairlines across the frame (echoes plate I's sediment)
yy = IY0
while yy <= IY1:
    hline(d, IX0, IX1, yy + rng.uniform(-2, 2), with_alpha(SEDIMENT, 7), 1)
    yy += 30

# graticule
gx = IX0
while gx <= IX1:
    vline(d, gx, IY0, IY1, with_alpha(FAINT, 22), 1)
    gx += 240
gy = IY0
while gy <= IY1:
    hline(d, IX0, IX1, gy, with_alpha(FAINT, 22), 1)
    gy += 240

# basin rim (level ~1 traces the edge of the structure)
for seg in contour_segments(1.0):
    poly(d, seg, with_alpha(BONE, 95), 2)

# ---------------------------------------------------------------- pay zone fill (masked hatch)
print("pay zone...")
paymask = [[field[j][i] > PAY for i in range(NX + 1)] for j in range(NY + 1)]
for j in range(NY):
    row = paymask[j]
    y = IY0 + (IY1 - IY0) * j / NY
    i = 0
    while i < NX:
        if row[i]:
            i0 = i
            while i < NX + 1 and row[i]:
                i += 1
            i1 = min(i - 1, NX)
            xa = IX0 + (IX1 - IX0) * i0 / NX
            xb = IX0 + (IX1 - IX0) * i1 / NX
            a = 30 if j % 4 else 52
            hline(d, xa, xb, y, with_alpha(AMBER, a), 1)
        else:
            i += 1
    # diagonal hatch every 4th row
    if j % 4 == 0:
        row2 = paymask[j]
        i = 0
        while i < NX:
            if row2[i]:
                i0 = i
                while i < NX + 1 and row2[i]:
                    i += 1
                i1 = min(i - 1, NX)
                xa = IX0 + (IX1 - IX0) * i0 / NX
                xb = IX0 + (IX1 - IX0) * i1 / NX
                y2 = IY0 + (IY1 - IY0) * min(j + 1, NY) / NY
                d.line([(xa * S, y * S), (xb * S, y2 * S)], fill=with_alpha(AMBER, 26), width=1)
            else:
                i += 1

# ---------------------------------------------------------------- contours
print("contours...")
for lv in LEVELS:
    col = level_color(lv)
    w = 2 if lv >= 1400 else 1
    for seg in contour_segments(lv):
        poly(d, seg, col, w)

# contour value labels (halo-cut, cartographic style)
def contour_label(x, y, text, fnt, color, alpha):
    tw = text_w(fnt, text, 0)
    hh = fnt.size / S * 0.72
    d.rectangle([(x - 5) * S, (y - hh) * S, (x + tw + 5) * S, (y + hh) * S],
                fill=with_alpha(GROUND, 238))
    d.text((x * S, (y - hh + 1) * S), text, font=fnt, fill=with_alpha(color, alpha))

print("labels...")
for lv in (400, 600, 800, 1000, 1200, 1400):
    segs = contour_segments(lv)
    best = None
    best_key = 1e9
    for seg in segs:
        mx = (seg[0][0] + seg[1][0]) / 2
        my = (seg[0][1] + seg[1][1]) / 2
        key = abs(mx - 620) + abs(my - 1250) * 0.4
        if key < best_key:
            best_key = key
            best = (mx, my)
    if best and best_key < 400:
        contour_label(best[0], best[1], f"-{lv}", F_PLEX(15), MUTED if lv < 1200 else AMBER, 215)

# ---------------------------------------------------------------- faults
def draw_fault(a, b, color, ticks_side):
    x0, y0 = a
    x1, y1 = b
    length = math.hypot(x1 - x0, y1 - y0)
    ux, uy = (x1 - x0) / length, (y1 - y0) / length
    px, py = -uy, ux                 # perpendicular
    d.line([(x0 * S, y0 * S), (x1 * S, y1 * S)], fill=with_alpha(color, 215), width=int(2 * S))
    # downthrown ticks every 60 px
    t = 0
    while t <= length:
        tx, ty = x0 + ux * t, y0 + uy * t
        s = ticks_side
        d.line([((tx + px * 6) * S, (ty + py * 6) * S),
                ((tx + px * (6 + 14)) * S, (ty + py * (6 + 14)) * S)],
               fill=with_alpha(color, 190), width=1)
        t += 60

draw_fault(FA_A, FA_B, (150, 165, 185), +1)
draw_fault(FB_A, FB_B, (150, 165, 185), -1)
# fault labels
tracked(d, (FA_A[0] - 150, FA_A[1] - 66), "FAULT A — NORMAL", F_DM(15), with_alpha(MUTED, 180), tracking=1.6)
tracked(d, (FB_A[0] + 60, FB_A[1] - 46), "FAULT B — NORMAL", F_DM(15), with_alpha(MUTED, 180), tracking=1.6)

# ---------------------------------------------------------------- wells
def grid_argmax():
    bj = bi = 0
    bv = -1.0
    for j in range(NY + 1):
        for i in range(NX + 1):
            v = field[j][i]
            if v > bv:
                bv, bj, bi = v, j, i
    return cell_pos(bi, bj)

deep_x, deep_y = grid_argmax()
print("deepest:", deep_x, deep_y)

def well_head(x, y, r, fill, ring, label, lcolor, ldx=26):
    dot(d, x, y, r, with_alpha(fill, 230))
    d.ellipse([(x - r - 2.5) * S, (y - r - 2.5) * S, (x + r + 2.5) * S, (y + r + 2.5) * S],
              outline=with_alpha(ring, 200), width=1)
    if label:
        tracked(d, (x + ldx, y - 8), label, F_DM(14), with_alpha(lcolor, 210), tracking=1.4)

# sweet-spot cluster (producers) — spaced so none crowd the discovery crosshair
cluster = []
rng2 = random.Random(SEED + 1)
tries = 0
while len(cluster) < 6 and tries < 600:
    tries += 1
    ox = deep_x + rng2.uniform(-95, 115)
    oy = deep_y + rng2.uniform(-75, 85)
    if depth_at(ox, oy) > 1150:
        if math.hypot(ox - deep_x, oy - deep_y) < 62:
            continue
        if any(math.hypot(ox - wx, oy - wy) < 48 for wx, wy in cluster):
            continue
        cluster.append((ox, oy))
for k, (wx, wy) in enumerate(cluster[:4]):
    well_head(wx, wy, 6, AMBER, BONE, f"W-0{k + 14}", AMBER)
# discovery well — ring + crosshair
well_head(deep_x, deep_y, 7, AMBER, BONE, None, AMBER)
d.ellipse([(deep_x - 20) * S, (deep_y - 20) * S, (deep_x + 20) * S, (deep_y + 20) * S],
          outline=with_alpha(AMBER, 190), width=1)
cross(d, deep_x, deep_y, 26, with_alpha(BONE, 170), 1)
tracked(d, (deep_x + 34, deep_y - 34), "W-001 · DISCOVERY 2010", F_DM(15), with_alpha(AMBER, 220), tracking=1.6)

# appraisal wells (cyan) scattered
for k, (ox, oy) in enumerate(((620, 1250), (1520, 1020), (1580, 1780), (760, 1900))):
    if depth_at(ox, oy) > 250:
        well_head(ox, oy, 5, CYAN, BONE, f"MON-0{k + 2}", CYAN)

# ---------------------------------------------------------------- zone annotations (the OT whisper)
ANNO = [
    (deep_x + 150, deep_y + 40, "PAY ZONE", AMBER, deep_x, deep_y),
    (1030, 1960, "OPERATIONS FLOOR", MUTED, 1140, 1860),
    (600, 1160, "CONTROL PLANE", CYAN, 640, 1210),
    (1380, 880, "DMZ SEAL", MUTED, 1300, 1010),
]
for tx, ty, label, colr, px, py in ANNO:
    dot(d, px, py, 3.2, with_alpha(colr, 210))
    d.line([(px * S, py * S), (tx * S, ty * S)], fill=with_alpha(SEDIMENT, 80), width=1)
    tracked(d, (tx, ty), label, F_DM(17), with_alpha(colr, 205), tracking=1.8)

# ---------------------------------------------------------------- frame (neatline) + graticule ticks
d.rectangle([FX0 * S, FY0 * S, FX1 * S, FY1 * S], outline=with_alpha(BOUNDARY, 230), width=int(1.5 * S))
d.rectangle([(FX0 + 6) * S, (FY0 + 6) * S, (FX1 - 6) * S, (FY1 - 6) * S],
            outline=with_alpha(BOUNDARY, 130), width=1)
# edge ticks
tx = FX0
while tx <= FX1:
    vline(d, tx, FY0 - 8, FY0 + 8, with_alpha(BONE, 120), 1)
    vline(d, tx, FY1 - 8, FY1 + 8, with_alpha(BONE, 120), 1)
    tx += 40
ty = FY0
while ty <= FY1:
    hline(d, FX0 - 8, FX0 + 8, ty, with_alpha(BONE, 120), 1)
    hline(d, FX1 - 8, FX1 + 8, ty, with_alpha(BONE, 120), 1)
    ty += 40
# corner coordinates
tracked(d, (FX0 + 12, FY0 - 30), "38.9516°S · 68.0591°W", F_PLEX(14), with_alpha(FAINT, 160), tracking=1.2)
tracked(d, (FX0 + 12, FY1 + 14), "39.0516°S · 68.0591°W", F_PLEX(14), with_alpha(FAINT, 160), tracking=1.2)

# ---------------------------------------------------------------- north arrow
NAX, NAY = 1830, 470
d.ellipse([(NAX - 46) * S, (NAY - 46) * S, (NAX + 46) * S, (NAY + 46) * S],
          outline=with_alpha(MUTED, 110), width=1)
vline(d, NAX, NAY - 32, NAY + 32, with_alpha(BONE, 170), 1)
d.polygon([(NAX * S, (NAY - 52) * S), ((NAX - 9) * S, (NAY - 30) * S),
           ((NAX + 9) * S, (NAY - 30) * S)], fill=with_alpha(BONE, 190))
tracked(d, (NAX - 6, NAY - 92), "N", F_DM(18), with_alpha(BONE, 200), tracking=0)
tracked(d, (NAX - 52, NAY + 56), "MAG 5.4°E", F_PLEX(12), with_alpha(FAINT, 150), tracking=1)

# ---------------------------------------------------------------- scale bar
SX0, SX1, SY = 1480, 1960, 2290
seg_n = 4
seg_w = (SX1 - SX0) / seg_n
d.line([(SX0 * S, SY * S), (SX1 * S, SY * S)], fill=with_alpha(BONE, 150), width=1)
for k in range(seg_n + 1):
    x = SX0 + k * seg_w
    vline(d, x, SY - 8, SY + 8, with_alpha(BONE, 150), 1)
    if k % 2 == 0:
        vline(d, x, SY, SY + 16, with_alpha(BONE, 110), 1)
for k, lab in enumerate(("0", "5", "10", "15", "20")):
    x = SX0 + k * seg_w
    tracked(d, (x - text_w(F_PLEX(13), lab, 0) / 2, SY + 22), lab, F_PLEX(13), with_alpha(FAINT, 160), tracking=0)
tracked(d, (SX1 - 130, SY + 46), "km · CI 25 m", F_PLEX(12), with_alpha(FAINT, 130), tracking=1)

# ---------------------------------------------------------------- left margin column
LX, LY0 = M + 4, 430
LEFT_ITEMS = [
    "STRUCTURE CONTOUR",
    "CI 25 m · ISO 710-1",
    "DATUM — MSL",
    "GRID — 1 km",
    "SURVEY 2026-Q3",
    "MAG DEC 5.4°E",
]
for k, item in enumerate(LEFT_ITEMS):
    y = LY0 + k * 84
    dot(d, LX + 3, y + 7, 2.2, with_alpha(AMBER if k == 0 else MUTED, 170))
    tracked(d, (LX + 18, y), item, F_DM(17), with_alpha(BONE if k == 0 else MUTED, 165), tracking=1.6)

# ---------------------------------------------------------------- type log (right margin)
TX0, TX1 = 2030, 2250
TL_TOP, TL_BOT = 380, 1150
d.rectangle([TX0 * S, TL_TOP * S, TX1 * S, TL_BOT * S], fill=(13, 18, 25, 255))
hline(d, TX0, TX1, TL_TOP, with_alpha(BOUNDARY, 200), 1)
hline(d, TX0, TX1, TL_BOT, with_alpha(BOUNDARY, 200), 1)
vline(d, TX0, TL_TOP, TL_BOT, with_alpha(BOUNDARY, 160), 1)
vline(d, TX1, TL_TOP, TL_BOT, with_alpha(BOUNDARY, 160), 1)
tracked(d, (TX0 + 4, TL_TOP - 30), "TYPE LOG — GR / RES", F_DM(14), with_alpha(MUTED, 150), tracking=1.2)
tracked(d, (TX0 + 4, TL_TOP - 14), "VACA MUERTA · 1:200", F_PLEX(12), with_alpha(FAINT, 110), tracking=1)
AXL = (TX0 + TX1) / 2
y = TL_TOP
while y < TL_BOT:
    vline(d, AXL, y, min(y + 10, TL_BOT), with_alpha(SEDIMENT, 55), 1)
    y += 16
TOPS = [("TOP VACA MUERTA", 430), ("TOP AGUA FRÍA", 640), ("TOP MULICHINCO", 850), ("BASEMENT", 1020)]
for name, yt in TOPS:
    hline(d, TX0 + 3, TX1 - 3, yt, with_alpha(BONE, 120), 1)
    tracked(d, (TX0 + 6, yt + 5), name, F_DM(12), with_alpha(MUTED, 160), tracking=1.2)
def region_of(yy):
    for k, (_, yt) in enumerate(TOPS):
        if yy < yt:
            return k
    return len(TOPS) - 1
for side, color in (("L", CYAN), ("R", AMBER)):
    pts = []
    y = TL_TOP
    while y <= TL_BOT:
        reg = region_of(y)
        base_amp = 9 + reg * 5
        ph = (reg * 1.7) + (0 if side == "L" else math.pi / 2)
        a = base_amp * (0.55 + 0.45 * math.sin(y / 55 + ph))
        if side == "L":
            x = AXL - (6 + a * (0.5 + 0.5 * math.sin(math.tau * y / 95 + ph)))
        else:
            x = AXL + (6 + a * (0.5 + 0.5 * math.sin(math.tau * y / 95 + ph * 1.3)))
        pts.append((x, y))
        y += 4
    poly(d, pts, with_alpha(color, 140), 1)
tracked(d, (TX0 + 6, TL_TOP + 8), "GR", F_PLEX(12), with_alpha(CYAN, 160), tracking=1)
tracked(d, (TX1 - 30, TL_TOP + 8), "RES", F_PLEX(12), with_alpha(AMBER, 160), tracking=1)

# ---------------------------------------------------------------- legend
LG_X0, LG_Y0, LG_X1, LG_Y1 = 2030, 1230, 2250, 1720
d.rectangle([LG_X0 * S, LG_Y0 * S, LG_X1 * S, LG_Y1 * S], outline=with_alpha(BOUNDARY, 200), width=1)
tracked(d, (LG_X0 + 10, LG_Y0 + 12), "LEGEND", F_DM(15), with_alpha(BONE, 190), tracking=2)
items = [
    ("CONTOUR — 25 m CI", "contour"),
    ("FAULT — NORMAL", "fault"),
    ("WELL HEAD — PRODUCER", "well"),
    ("PAY ZONE — VACA MUERTA", "pay"),
]
for k, (cap, kind) in enumerate(items):
    y = LG_Y0 + 58 + k * 112
    if kind == "contour":
        pts = [(LG_X0 + 16 + t * 5, y + 14 + 8 * math.sin(t * 0.9 + 1)) for t in range(20)]
        poly(d, pts, with_alpha(MUTED, 180), 1)
    elif kind == "fault":
        dashed(d, LG_X0 + 16, y + 14, LG_X1 - 16, y + 14, with_alpha(MUTED, 180), dash=10, gap=7, w=1.4)
        for xx in range(LG_X0 + 16, LG_X1 - 10, 48):
            vline(d, xx, y + 8, y + 20, with_alpha(MUTED, 150), 1)
    elif kind == "well":
        dot(d, LG_X0 + 40, y + 14, 5, with_alpha(AMBER, 230))
        d.ellipse([(LG_X0 + 33) * S, (y + 7) * S, (LG_X0 + 47) * S, (y + 21) * S],
                  outline=with_alpha(BONE, 190), width=1)
    else:
        d.rectangle([(LG_X0 + 16) * S, (y + 6) * S, (LG_X1 - 16) * S, (y + 22) * S],
                    fill=with_alpha(AMBER, 26))
        for xx in range(LG_X0 + 16, LG_X1 - 16, 8):
            vline(d, xx, y + 6, y + 22, with_alpha(AMBER, 55), 1)
    tracked(d, (LG_X0 + 16, y + 34), cap, F_PLEX(12), with_alpha(MUTED, 170), tracking=1)

# ---------------------------------------------------------------- header
tracked(d, (M + 4, 158), "FIELD NOTE 08 — BASIN PLAN SURVEY", F_DM(20), with_alpha(BONE, 150), tracking=2)
right_txt = "SCALE 1:250,000 · 38.95°S 68.06°W"
tracked(d, (W - M - text_w(F_DM(20), right_txt, 2), 158), right_txt, F_DM(20), with_alpha(BONE, 150), tracking=2)

# ---------------------------------------------------------------- title block
TY = 2625
centered_tracked(d, W / 2, TY, "STRATA PROTOCOL", F_ITA(150), with_alpha(BONE, 235), tracking=13)
rw = 640
ry = TY + 130
hline(d, W / 2 - rw / 2, W / 2 + rw / 2, ry, with_alpha(AMBER, 120), 1)
hline(d, W / 2 - rw / 2 + 60, W / 2 + rw / 2 - 60, ry, with_alpha(AMBER, 190), 1)
vline(d, W / 2 - rw / 2, ry - 9, ry + 9, with_alpha(AMBER, 160), 1)
vline(d, W / 2 + rw / 2, ry - 9, ry + 9, with_alpha(AMBER, 160), 1)
cxp = W / 2
d.polygon([(cxp * S, (ry - 7) * S), ((cxp + 7) * S, ry * S), (cxp * S, (ry + 7) * S),
           ((cxp - 7) * S, ry * S)], fill=with_alpha(AMBER, 220))
centered_tracked(d, W / 2, TY + 175, "a basin read from above", F_YS(34), with_alpha(MUTED, 190), tracking=1)
centered_tracked(d, W / 2, TY + 250, "FIELD LOG N° 002/007 — NEUQUÉN BASIN · ARGENTINA",
                 F_DM(17), with_alpha(MUTED, 150), tracking=2.4)
centered_tracked(d, W / 2, TY + 284, "VACA MUERTA · 38.9516°S 68.0591°W",
                 F_DM(17), with_alpha(AMBER, 170), tracking=2.4)

# ---------------------------------------------------------------- footer
FY = 3050
tracked(d, (M + 4, FY), "STRUCTURE CONTOUR — ISA-95 · IEC 62443 ZONE REFERENCE",
        F_PLEX(14), with_alpha(FAINT, 140), tracking=1.6)
centered_tracked(d, W / 2, FY, "PLATE 02/02", F_PLEX(14), with_alpha(FAINT, 140), tracking=2)
right_txt = "© MMXXVI STRATA PROTOCOL"
tracked(d, (W - M - text_w(F_PLEX(14), right_txt, 1.6), FY), right_txt,
        F_PLEX(14), with_alpha(FAINT, 140), tracking=1.6)

# ---------------------------------------------------------------- registration marks
for rx, ry in ((M, M), (W - M, M), (M, H - M), (W - M, H - M)):
    cross(d, rx, ry, 14, with_alpha(MUTED, 130))

# ---------------------------------------------------------------- vignette
grad = Image.new("L", (512, 512), 0)
gd = ImageDraw.Draw(grad)
for r in range(256):
    a = int(118 * (r / 256) ** 2.1)
    gd.ellipse([256 - r, 256 - r, 256 + r, 256 + r], fill=a)
grad = grad.resize((FW, FH))
dark = Image.new("RGB", (FW, FH), (4, 6, 10))
img = Image.composite(dark, img, grad)

# ---------------------------------------------------------------- output
FINAL_W = W * S if os.environ.get("SP_FULL") == "1" else W
FINAL_H = H * S if os.environ.get("SP_FULL") == "1" else H
img = img.resize((FINAL_W, FINAL_H), Image.LANCZOS)
img.save(OUT)
print("saved", OUT, img.size)
