#!/usr/bin/env python3
"""Strata Protocol — print PDF export.

Renders each plate at 3x supersampling, keeps full resolution (7200x9600 px),
and embeds it in a PDF at 300 DPI -> 24 x 32 in page (61 x 81 cm).
"""
import os
import subprocess
import sys

from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
SCALE = 3


def run_gen(script, out_png):
    env = dict(os.environ, SP_SCALE=str(SCALE), SP_FULL="1", SP_OUT=os.path.join(BASE, out_png))
    subprocess.run([sys.executable, os.path.join(BASE, script)], env=env, check=True)


def make_pdf(png, pdf):
    im = Image.open(os.path.join(BASE, png))
    path = os.path.join(BASE, pdf)
    im.save(path, "PDF", resolution=300)
    print("pdf:", pdf, f"{im.size[0]}x{im.size[1]}px", f"{im.size[0]/300:.2f}x{im.size[1]/300:.2f}in", f"{os.path.getsize(path)/1e6:.1f}MB")


run_gen("generate.py", "strata-protocol-hi.png")
make_pdf("strata-protocol-hi.png", "strata-protocol.pdf")

run_gen("generate-plate2.py", "strata-protocol-plate2-hi.png")
make_pdf("strata-protocol-plate2-hi.png", "strata-protocol-plate2.pdf")

print("done")
