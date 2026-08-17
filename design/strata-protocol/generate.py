#!/usr/bin/env python3
"""Strata Protocol — cross-section canvas generator.

Draws a 2400x3200 poster at 2x supersampling, then downsamples with LANCZOS.
Concept: geological strata of an oil basin (Vaca Muerta) doubling as the
layered Purdue / ISA-95 industrial network model (LVL 0 .. LVL 4/5), with a
central well column and a wireline log on the right — the subtle reference
for anyone who reads OT/cybersecurity or geophysics.
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------- constants
W, H = 2400, 3200
S = int(os.environ.get("SP_SCALE", "2"))   # supersample factor (2x display, 3x print)
FW, FH = W * S, H * S
OUT = os.environ.get("SP_OUT", "design/strata-protocol/strata-protocol.webp")
M = 150                    # margin (final px)

SEED = 20260816
rng = random.Random(SEED)

# palette
GROUND      = (10, 13, 18)
BONE        = (232, 227, 216)
AMBER       = (217, 164, 65)
CYAN        = (92, 168, 160)
MUTED       = (138, 148, 166)
FAINT       = (74, 84, 101)
BOUNDARY    = (42, 53, 66)
SEDIMENT    = (90, 106, 126)
ISOPACH     = (58, 70, 88)

# fonts
FD = "design/strata-protocol/fonts/"
def font(name, size):
    return ImageFont.truetype(FD + name, int(size * S))

F_DM   = lambda s: font("DMMono-Regular.ttf", s)     # annotations / mono
F_PLEX = lambda s: font("IBMPlexMono-Regular.ttf", s)  # labels
F_ITA  = lambda s: font("Italiana-Regular.ttf", s)    # display title
F_YS   = lambda s: font("YoungSerif-Regular.ttf", s)  # whisper

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

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

def cross(d, x, y, arm, color):
    hline(d, x - arm, x + arm, y, color, 1)
    vline(d, x, y - arm, y + arm, color, 1)

def tracked(d, xy, text, fnt, fill, tracking=0, anchor_left=True):
    """Draw text with manual letter-spacing (tracking in final px)."""
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

def poly(d, pts, color, w=1):
    d.line([(x * S, y * S) for x, y in pts], fill=color, width=int(w * S), joint="curve")

# ---------------------------------------------------------------- canvas
img = Image.new("RGB", (FW, FH), GROUND)
d = ImageDraw.Draw(img, "RGBA")

# ---------------------------------------------------------------- global grain
noise = Image.effect_noise((FW, FH), 22).convert("L")
grain = Image.new("RGB", (FW, FH), (0, 0, 0))
grain.paste(noise, (0, 0))
img = Image.blend(img, grain, 0.045)

# vertical streak grain (core texture)
streak = Image.effect_noise((FW, FH // 3), 30).convert("L").resize((FW, FH), Image.BILINEAR)
g2 = Image.new("RGB", (FW, FH), (0, 0, 0))
g2.paste(streak, (0, 0))
img = Image.blend(img, g2, 0.035)

d = ImageDraw.Draw(img, "RGBA")

# ---------------------------------------------------------------- strata bands
# (label, height) top -> bottom — Purdue levels 4/5 .. 0
BANDS = [
    ("LVL 4/5", "ENTERPRISE NETWORK", 190),
    ("LVL 3.5", "INDUSTRIAL DMZ",     150),
    ("LVL 3",   "PLANT OPERATIONS",   230),
    ("LVL 2",   "PROCESS CONTROL",    280),
    ("LVL 1",   "FIELD DEVICES",      350),
    ("LVL 0",   "INSTRUMENTATION",    460),
]
GAPS = [70, 80, 90, 100, 110]

yF = 300
band_rects = []  # (top, bottom, label, name)
for i, (lbl, name, h) in enumerate(BANDS):
    top = yF
    bot = yF + h
    band_rects.append((top, bot, lbl, name))

    # band fill — subtle depth ramp (deeper = darker)
    base = mix(hex2rgb("#111722"), hex2rgb("#0A0E15"), i / (len(BANDS) - 1))
    d.rectangle([M * S, top * S, (W - M) * S, bot * S], fill=base)

    # hairline sediment lines
    density = max(2.6, 5.5 - i * 0.35)   # px spacing, tighter when deep
    n = int(h / density)
    alpha = rng.uniform(12, 18)
    for j in range(n):
        yy = top + (j + 0.5) * (h / n) + rng.uniform(-0.8, 0.8)
        hline(d, M + 6, W - M - 6, yy, with_alpha(SEDIMENT, alpha), 1)

    # occasional fault line (skewed brighter hairline)
    if i in (1, 3, 5):
        for _ in range(2):
            yy = top + rng.uniform(0.2, 0.8) * h
            hline(d, M + 6, W - M - 6, yy, with_alpha((160, 172, 190), 9), 1)

    # band boundary
    hline(d, M, W - M, top, with_alpha(BOUNDARY, 210), 1)
    yF = bot + GAPS[i] if i < len(GAPS) else bot

# closing boundary at the base of the field
_, last_bot, _, _ = band_rects[-1]
hline(d, M, W - M, last_bot, with_alpha(BOUNDARY, 210), 1)

# faint amber pay-zone hairline inside LVL 0 (the valuable stratum)
_, l0_top, _, _ = band_rects[-1]
pay_y = l0_top + (last_bot - l0_top) * 0.62
hline(d, M + 6, W - M - 6, pay_y, with_alpha(AMBER, 46), 1)
hline(d, M + 6, W - M - 6, pay_y + 5, with_alpha(AMBER, 22), 1)

# ---------------------------------------------------------------- isopach lines in the gaps
def draw_isopachs(gap_top, gap_bot, n_lines):
    mid = (gap_top + gap_bot) / 2
    for k in range(n_lines):
        yy = mid + (k - (n_lines - 1) / 2) * (gap_bot - gap_top) / n_lines
        amp = rng.uniform(5, 15)
        lam = rng.uniform(380, 720)
        ph = rng.uniform(0, math.tau)
        pts = []
        x = M + 10
        while x <= W - M - 10:
            y = yy + amp * math.sin(math.tau * x / lam + ph)
            pts.append((x, y))
            x += 14
        poly(d, pts, with_alpha(ISOPACH, 42), 1)

for i in range(len(GAPS)):
    draw_isopachs(band_rects[i][1], band_rects[i + 1][0], rng.randint(7, 11))

# ---------------------------------------------------------------- well column (the conduit)
CX = 1240
HW = 95                      # half width
col_left, col_right = CX - HW, CX + HW
field_top = band_rects[0][0]
field_bot = band_rects[-1][1]

# column overlay (slightly lifted, like a cased borehole)
col = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
cd = ImageDraw.Draw(col)
cd.rectangle([col_left * S, field_top * S, col_right * S, field_bot * S],
             fill=(120, 140, 165, 26))
# casing joints — vertical ticks every 30px
y = field_top
while y <= field_bot:
    cd.line([(col_left * S, y * S), (col_right * S, y * S)],
            fill=(150, 165, 185, 34), width=1)
    y += 30
# faint center axis
cd.line([(CX * S, field_top * S), (CX * S, field_bot * S)],
        fill=(150, 165, 185, 20), width=1)
# dashed depth ticks with meter labels
y = field_top + 60
step = 420
k = 1
while y < field_bot - 40:
    cd.line([(CX * S, y * S), (CX + 18) * S, (y * S)], fill=(180, 190, 205, 60), width=1)
    d.text(((CX + 26) * S, (y - 12) * S), f"{k * 420} m", font=F_PLEX(15),
           fill=with_alpha((160, 170, 190), 90))
    y += step
    k += 1
img.paste(col, (0, 0), col)
d = ImageDraw.Draw(img, "RGBA")

# column edge lines
vline(d, col_left, field_top, field_bot, with_alpha(BOUNDARY, 220), 1)
vline(d, col_right, field_top, field_bot, with_alpha(BOUNDARY, 220), 1)

# ---------------------------------------------------------------- band labels (left) + level ticks on well
for idx, (top, bot, lbl, name) in enumerate(band_rects):
    mid = (top + bot) / 2
    # left label block
    tracked(d, (M + 26, mid - 26), lbl, F_DM(22), with_alpha(BONE, 165), tracking=2)
    tracked(d, (M + 26, mid + 6), name, F_PLEX(15), with_alpha(MUTED, 130), tracking=1.4)
    # thickness annotation (right of name)
    thk = bot - top
    tracked(d, (M + 26, mid + 28), f"THK {thk}", F_PLEX(13), with_alpha(FAINT, 110), tracking=1.2)
    # boundary cross on the well
    if idx > 0:
        prev_bot = band_rects[idx - 1][1]
        cross(d, CX, prev_bot, 10, with_alpha(SEDIMENT, 190))

# ---------------------------------------------------------------- annotations around the well
ANNO = [
    (band_rects[0][0] + 6, "LEVEL BOUNDARY 01", FAINT),
    ((band_rects[1][0] + band_rects[1][1]) / 2, "DMZ SEAL", AMBER),
    ((band_rects[2][0] + band_rects[2][1]) / 2, "OPERATIONS FLOOR", MUTED),
    ((band_rects[3][0] + band_rects[3][1]) / 2, "CONTROL PLANE", CYAN),
    ((band_rects[4][0] + band_rects[4][1]) / 2, "CONDUIT A", MUTED),
    ((band_rects[5][0] + band_rects[5][1]) / 2 + 60, "PAY ZONE", AMBER),
]
lx = col_right + 42
for y, label, colr in ANNO:
    dot(d, CX, y, 3.2, with_alpha(colr, 200))
    # leader
    ly = y
    hline(d, CX + 14, lx - 8, ly, with_alpha(SEDIMENT, 90), 1)
    dot(d, lx - 8, ly, 1.8, with_alpha(colr, 150))
    tracked(d, (lx + 8, ly - 9), label, F_DM(17), with_alpha(colr, 200), tracking=1.6)

# ---------------------------------------------------------------- wireline log (right column)
WX0, WX1 = 2050, 2250
WL_TOP, WL_BOT = 340, 2360
d.rectangle([WX0 * S, WL_TOP * S, WX1 * S, WL_BOT * S], fill=(13, 18, 25, 255))
hline(d, WX0, WX1, WL_TOP, with_alpha(BOUNDARY, 200), 1)
hline(d, WX0, WX1, WL_BOT, with_alpha(BOUNDARY, 200), 1)
vline(d, WX0, WL_TOP, WL_BOT, with_alpha(BOUNDARY, 160), 1)
vline(d, WX1, WL_TOP, WL_BOT, with_alpha(BOUNDARY, 160), 1)
# header
tracked(d, (WX0 + 4, WL_TOP - 30), "WIRELINE — GR / RES", F_DM(14), with_alpha(MUTED, 150), tracking=1.2)
tracked(d, (WX0 + 4, WL_TOP - 14), "RUN 02 · 0.5 m/s", F_PLEX(12), with_alpha(FAINT, 110), tracking=1)
# center dashed axis
y = WL_TOP
while y < WL_BOT:
    vline(d, (WX0 + WX1) / 2, y, min(y + 10, WL_BOT), with_alpha(SEDIMENT, 60), 1)
    y += 16
# traces: left = GR (cyan), right = RES (amber); amplitude varies per band region
def region_of(yy):
    for i, (top, bot, _, _) in enumerate(band_rects):
        if top <= yy <= bot:
            return i
    return 2

AX = (WX0 + WX1) / 2
for side, color in (("L", CYAN), ("R", AMBER)):
    pts = []
    y = WL_TOP
    while y <= WL_BOT:
        reg = region_of(y)
        base_amp = 16 + reg * 7          # deeper strata → wider trace
        lam = 90 + (reg % 3) * 55
        ph = (reg * 1.7) + (0 if side == "L" else math.pi / 2)
        a = base_amp * (0.55 + 0.45 * math.sin(y / 60 + ph))
        if side == "L":
            x = AX - (8 + a * (0.5 + 0.5 * math.sin(math.tau * y / lam + ph)))
        else:
            x = AX + (8 + a * (0.5 + 0.5 * math.sin(math.tau * y / lam + ph * 1.3)))
        pts.append((x, y))
        y += 4
    poly(d, pts, with_alpha(color, 150), 1)
# tiny GR / RES ticks at top
tracked(d, (WX0 + 6, WL_TOP + 8), "GR", F_PLEX(12), with_alpha(CYAN, 160), tracking=1)
tracked(d, (WX1 - 34, WL_TOP + 8), "RES", F_PLEX(12), with_alpha(AMBER, 160), tracking=1)

# ---------------------------------------------------------------- datum lines
# top datum
DY = 232
hline(d, M, W - M, DY, with_alpha(BONE, 120), 1)
x = M
while x <= W - M:
    vline(d, x, DY - 5, DY + 5, with_alpha(BONE, 130), 1)
    x += 40
# numbers
x = M + 8
while x <= W - M:
    n = int((x - M) // 40 * 40)
    d.text((x * S, (DY + 10) * S), str(n), font=F_PLEX(13), fill=with_alpha(FAINT, 130))
    x += 240
tracked(d, (M + 4, DY - 26), "DATUM — 0.00 m", F_DM(14), with_alpha(MUTED, 150), tracking=1.4)
tracked(d, (W - M - text_w(F_DM(14), "ELEV +38.95", 1.4), DY - 26), "ELEV +38.95",
        F_DM(14), with_alpha(MUTED, 150), tracking=1.4)

# bottom datum
DY2 = 2470
hline(d, M, W - M, DY2, with_alpha(BONE, 100), 1)
x = M
while x <= W - M:
    vline(d, x, DY2 - 5, DY2 + 5, with_alpha(BONE, 110), 1)
    x += 40
tracked(d, (M + 4, DY2 + 12), "DATUM — −2120 m", F_DM(14), with_alpha(MUTED, 140), tracking=1.4)
tracked(d, (W - M - text_w(F_DM(14), "ELEV −68.06", 1.4), DY2 + 12), "ELEV −68.06",
        F_DM(14), with_alpha(MUTED, 140), tracking=1.4)

# ---------------------------------------------------------------- header text
tracked(d, (M + 4, 158), "FIELD NOTE 07 — CONVERGENCE CROSS-SECTION",
        F_DM(20), with_alpha(BONE, 150), tracking=2)
right_txt = "SCALE 1:100 · 38.95°S 68.06°W"
tracked(d, (W - M - text_w(F_DM(20), right_txt, 2), 158), right_txt,
        F_DM(20), with_alpha(BONE, 150), tracking=2)

# ---------------------------------------------------------------- title block
TY = 2625
centered_tracked(d, W / 2, TY, "STRATA PROTOCOL", F_ITA(150), with_alpha(BONE, 235), tracking=13)
# rule — surveyor bar with end ticks and a center mark
rw = 640
ry = TY + 130
hline(d, W / 2 - rw / 2, W / 2 + rw / 2, ry, with_alpha(AMBER, 120), 1)
hline(d, W / 2 - rw / 2 + 60, W / 2 + rw / 2 - 60, ry, with_alpha(AMBER, 190), 1)
vline(d, W / 2 - rw / 2, ry - 9, ry + 9, with_alpha(AMBER, 160), 1)
vline(d, W / 2 + rw / 2, ry - 9, ry + 9, with_alpha(AMBER, 160), 1)
# center diamond mark
cxp = W / 2
d.polygon([(cxp * S, (ry - 7) * S), ((cxp + 7) * S, ry * S), (cxp * S, (ry + 7) * S),
           ((cxp - 7) * S, ry * S)], fill=with_alpha(AMBER, 220))
centered_tracked(d, W / 2, TY + 175, "a cross-section of layered signal",
                 F_YS(34), with_alpha(MUTED, 190), tracking=1)
centered_tracked(d, W / 2, TY + 250, "FIELD LOG N° 001/007 — NEUQUÉN BASIN · ARGENTINA",
                 F_DM(17), with_alpha(MUTED, 150), tracking=2.4)
centered_tracked(d, W / 2, TY + 284, "VACA MUERTA · 38.9516°S 68.0591°W",
                 F_DM(17), with_alpha(AMBER, 170), tracking=2.4)

# ---------------------------------------------------------------- footer
FY = 3050
tracked(d, (M + 4, FY), "ISA-95 · IEC 62443 — ZONE REFERENCE",
        F_PLEX(14), with_alpha(FAINT, 140), tracking=1.6)
centered_tracked(d, W / 2, FY, "PLATE 01/01", F_PLEX(14), with_alpha(FAINT, 140), tracking=2)
right_txt = "© MMXXVI STRATA PROTOCOL"
tracked(d, (W - M - text_w(F_PLEX(14), right_txt, 1.6), FY), right_txt,
        F_PLEX(14), with_alpha(FAINT, 140), tracking=1.6)

# ---------------------------------------------------------------- registration marks
for rx, ry in ((M, M), (W - M, M), (M, H - M), (W - M, H - M)):
    cross(d, rx, ry, 14, with_alpha(MUTED, 130))

# ---------------------------------------------------------------- vignette
# radial mask: 0 at center -> 118 at edges/corners (built from concentric rings)
grad = Image.new("L", (512, 512), 0)
gd = ImageDraw.Draw(grad)
for r in range(256):
    a = int(118 * (r / 256) ** 2.1)
    gd.ellipse([256 - r, 256 - r, 256 + r, 256 + r], fill=a)
grad = grad.resize((FW, FH))
# composite: where mask is bright (edges) show the dark tone; center keeps the art
dark = Image.new("RGB", (FW, FH), (4, 6, 10))
img = Image.composite(dark, img, grad)

# ---------------------------------------------------------------- output
FINAL_W = W * S if os.environ.get("SP_FULL") == "1" else W
FINAL_H = H * S if os.environ.get("SP_FULL") == "1" else H
img = img.resize((FINAL_W, FINAL_H), Image.LANCZOS)
img.save(OUT)
print("saved", OUT, img.size)
