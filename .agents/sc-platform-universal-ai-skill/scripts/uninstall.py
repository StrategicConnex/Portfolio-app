from pathlib import Path
import shutil
p=Path.home()/'.sc-platform-universal-ai-skill'
if p.exists(): shutil.rmtree(p); print('Removed',p)
else: print('Nothing to remove')
