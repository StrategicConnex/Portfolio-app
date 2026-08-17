from PIL import Image
import base64, io, os

BASE = os.path.dirname(os.path.abspath(__file__))
im = Image.open(os.path.join(BASE, "strata-protocol.webp"))
pv = im.resize((1100, int(im.height * 1100 / im.width)), Image.LANCZOS)
buf = io.BytesIO()
pv.save(buf, "WEBP", quality=85)
b64 = base64.b64encode(buf.getvalue()).decode()

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Strata Protocol</title>
<style>
  html, body { margin: 0; padding: 0; background: #0a0d12; }
  body { display: flex; justify-content: center; }
  img { display: block; max-width: 100%; height: auto; }
</style>
</head>
<body>
  <img src="data:image/webp;base64,__B64__" alt="Strata Protocol canvas">
</body>
</html>""".replace("__B64__", b64)

with open(os.path.join(BASE, "preview.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("preview.html updated")
