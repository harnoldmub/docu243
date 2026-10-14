"""Builds the responsive AVIF/WebP photos used by the site.

Usage: python3 -I scripts/optimize-images.py
Reads the original photos in assets/ and writes client/public/img/<name>-<width>.{avif,webp}.
Requires Pillow, cwebp and avifenc.
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets")
OUT = os.path.join(ROOT, "client", "public", "img")

# name -> (source file, aspect ratio w/h or None to keep, widths, vertical focus 0..1)
PHOTOS = {
    "maman-documents": ("Confident mother with passport and documents.png", 4 / 5, [480, 720, 960], 0.3),
    "citoyenne-telephone": ("Convenient digital services at home.png", 3 / 2, [640, 960, 1440], 0.4),
    "entrepreneur": ("Kinshasa Shopkeeper with Business Papers.png", 3 / 2, [640, 960, 1440], 0.35),
    "parent-enfant": ("Mother and child review registration papers.png", 3 / 2, [640, 960, 1440], 0.35),
    "guichet": ("Remise d’un document à Kinshasa.png", 16 / 9, [640, 960, 1440], 0.4),
    "voyageur": ("Traveler with passport and suitcase.png", 4 / 5, [480, 720, 960], 0.25),
    "construction": ("Ingénieure sur chantier, plans en main.png", 3 / 2, [640, 960, 1440], 0.3),
    "connexion": ("Welcoming woman with phone and folder.png", 4 / 5, [480, 720, 960], 0.3),
    "banniere-finale": ("Community service, shared smiles.png", 21 / 9, [960, 1440, 1916], 0.3),
    "diplome": ("Diploma Folder, New Beginnings.png", 4 / 5, [480, 720, 960], 0.3),
}


def crop(im, ratio, focus):
    w, h = im.size
    if ratio is None:
        return im
    if w / h > ratio:
        nw = round(h * ratio)
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = round(w / ratio)
    top = round((h - nh) * focus)
    return im.crop((0, top, w, top + nh))


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, (filename, ratio, widths, focus) in PHOTOS.items():
        path = os.path.join(SRC, filename)
        if not os.path.exists(path):
            print(f"skip {name}: {filename} not found")
            continue
        im = crop(Image.open(path).convert("RGB"), ratio, focus)
        for width in widths:
            if width > im.size[0]:
                continue
            height = round(width * im.size[1] / im.size[0])
            resized = im.resize((width, height), Image.LANCZOS)
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                resized.save(tmp.name)
                base = os.path.join(OUT, f"{name}-{width}")
                subprocess.run(["cwebp", "-quiet", "-q", "78", tmp.name, "-o", base + ".webp"], check=True)
                subprocess.run(["avifenc", "-q", "55", "-s", "6", tmp.name, base + ".avif"], check=True, stdout=subprocess.DEVNULL)
                os.unlink(tmp.name)
            print(f"{name}-{width} ({width}x{height})")


if __name__ == "__main__":
    sys.exit(main())
