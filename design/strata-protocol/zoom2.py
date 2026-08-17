from PIL import Image
import base64, io, os

BASE = os.path.dirname(os.path.abspath(__file__))
im = Image.open(os.path.join(BASE, "strata-protocol-plate2.webp"))
W, H = im.size

# wells cluster is near (deep_x, deep_y) = (1100, 1350) in final px
regions = {
    "wells-pay": (900, 1180, 1450, 1600),
    "contour-detail": (500, 1500, 1100, 1950),
    "fault-a": (500, 800, 1200, 1300),
}
cells = []
for name, box in regions.items():
    crop = im.crop(box)
    scale = 1100 / crop.width
    crop = crop.resize((1100, int(crop.height * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    crop.save(buf, "WEBP", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode()
    cells.append(f'<div class="cell"><div class="cap">{name}</div><img src="data:image/webp;base64,{b64}"></div>')

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Plate II — zoom</title>
<style>
  html, body { margin: 0; padding: 0; background: #11151c; color: #cbd5e1; font-family: monospace; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(520px, 1fr)); gap: 14px; padding: 14px; }
  .cell { background: #0a0d12; border: 1px solid #263041; border-radius: 8px; overflow: hidden; }
  .cap { padding: 6px 10px; font-size: 11px; letter-spacing: 2px; color: #8a94a6; text-transform: uppercase; }
  img { display: block; width: 100%; height: auto; }
</style>
</head>
<body><div class="grid">__CELLS__</div></body>
</html>""".replace("__CELLS__", "".join(cells))

with open(os.path.join(BASE, "zoom-plate2.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("zoom-plate2.html updated")
