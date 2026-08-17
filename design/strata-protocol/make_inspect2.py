from PIL import Image
import base64, io, os

BASE = os.path.dirname(os.path.abspath(__file__))
im = Image.open(os.path.join(BASE, "strata-protocol-plate2.webp"))
W, H = im.size

regions = {
    "title": (0, 0.80, 1.0, 1.0),
    "map-west": (0.08, 0.10, 0.45, 0.42),
    "map-center": (0.30, 0.42, 0.75, 0.72),
    "map-east": (0.62, 0.10, 0.85, 0.40),
    "log-legend": (0.84, 0.10, 1.0, 0.62),
    "header": (0.0, 0.0, 1.0, 0.10),
}
cells = []
for name, (x0, y0, x1, y1) in regions.items():
    crop = im.crop((int(W * x0), int(H * y0), int(W * x1), int(H * y1)))
    scale = 900 / crop.width
    crop = crop.resize((900, int(crop.height * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    crop.save(buf, "WEBP", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode()
    cells.append(f'<div class="cell"><div class="cap">{name}</div><img src="data:image/webp;base64,{b64}"></div>')

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Plate II — inspect</title>
<style>
  html, body { margin: 0; padding: 0; background: #11151c; color: #cbd5e1; font-family: monospace; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 14px; padding: 14px; }
  .cell { background: #0a0d12; border: 1px solid #263041; border-radius: 8px; overflow: hidden; }
  .cap { padding: 6px 10px; font-size: 11px; letter-spacing: 2px; color: #8a94a6; text-transform: uppercase; }
  img { display: block; width: 100%; height: auto; }
</style>
</head>
<body><div class="grid">__CELLS__</div></body>
</html>""".replace("__CELLS__", "".join(cells))

with open(os.path.join(BASE, "inspect-plate2.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("inspect-plate2.html updated")
