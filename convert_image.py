from pathlib import Path
from PIL import Image
src = Path('public/JuanPalacios.png')
dest = Path('public/JuanPalacios.webp')
img = Image.open(src).convert('RGBA')
img.save(dest, 'WEBP', quality=85, method=6)
print('saved', dest, dest.exists())
