from pathlib import Path
import shutil
src=Path(__file__).resolve().parents[1]
dst=Path.home()/'.sc-platform-universal-ai-skill'
if dst.exists(): shutil.rmtree(dst)
shutil.copytree(src,dst,ignore=shutil.ignore_patterns('__pycache__','.git'))
print(f'Installed to {dst}')
