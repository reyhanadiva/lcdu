#!/usr/bin/env python3
"""Buat turunan web gambar hero Lentera HD (AVIF, WebP, JPG) dan manifest-nya.

Pemakaian:
    python3 tools/build-hero-images.py

Butuh: Python 3.9+, Pillow >= 11.2 (dengan dukungan AVIF)  (pip install pillow)

Masukan : assets/hero/<nama>.png  (lihat PAIRS di bawah)
Keluaran: assets/hero/build/<nama>-<lebar>.{avif,webp,jpg} dan assets/hero/build/manifest.json

Aturan: gambar TIDAK PERNAH diperbesar melampaui resolusi aslinya. Lebar target yang lebih besar dari
aslinya diganti dengan lebar asli. Pasangan yang berkasnya belum ada dilewati (manifest = null),
sehingga varian Lentera HD otomatis memakai varian lain untuk orientasi itu.
Sebelum menambah pasangan baru, jalankan tools/check-align.py dulu.
"""
import json
import os
import sys

from PIL import Image, features

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'hero')
OUT = os.path.join(SRC, 'build')

# orientasi -> (berkas malam, berkas fajar, lebar target)
PAIRS = {
    'tall': ('night-tall.png', 'dawn-tall.png', [750, 1500]),
    'wide': ('night-wide-v2.png', 'dawn-wide.png', [1280, 2560]),
}
QUALITY = {'avif': 52, 'webp': 78, 'jpg': 82}


def save(img, base, fmt):
    path = os.path.join(OUT, f'{base}.{fmt}')
    if fmt == 'avif':
        img.save(path, 'AVIF', quality=QUALITY['avif'], speed=4)
    elif fmt == 'webp':
        img.save(path, 'WEBP', quality=QUALITY['webp'], method=6)
    else:
        img.save(path, 'JPEG', quality=QUALITY['jpg'], optimize=True, progressive=True)
    return os.path.getsize(path)


def main():
    if not features.check('avif'):
        print('Pillow ini tidak mendukung AVIF. Perbarui: pip install -U pillow')
        return 1
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for orient, (night, dawn, targets) in PAIRS.items():
        paths = [os.path.join(SRC, n) for n in (night, dawn)]
        if not all(os.path.exists(p) for p in paths):
            print(f'{orient}: dilewati (berkas belum ada: {", ".join(n for n, p in zip((night, dawn), paths) if not os.path.exists(p))})')
            manifest[orient] = None
            continue
        imgs = [Image.open(p).convert('RGB') for p in paths]
        if imgs[0].size != imgs[1].size:
            print(f'{orient}: GAGAL, ukuran malam {imgs[0].size} dan fajar {imgs[1].size} berbeda')
            return 1
        w, h = imgs[0].size
        widths = sorted({min(t, w) for t in targets})   # tidak pernah melebihi lebar asli
        entry = {'night': os.path.splitext(night)[0], 'dawn': os.path.splitext(dawn)[0], 'w': w, 'h': h,
                 'widths': widths, 'formats': ['avif', 'webp', 'jpg']}
        for key, img in zip(('night', 'dawn'), imgs):
            for tw in widths:
                th = round(h * tw / w)
                r = img if tw == w else img.resize((tw, th), Image.LANCZOS)
                sizes = {fmt: save(r, f'{entry[key]}-{tw}', fmt) for fmt in entry['formats']}
                print(f'{orient} {entry[key]}-{tw} ({tw}x{th}): ' + ', '.join(f'{f} {s // 1024} KB' for f, s in sizes.items()))
        manifest[orient] = entry
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
    print('manifest:', json.dumps(manifest))
    return 0


if __name__ == '__main__':
    sys.exit(main())
