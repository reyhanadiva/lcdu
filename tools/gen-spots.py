#!/usr/bin/env python3
"""Buat titik cahaya awal (otomatis) untuk Lentera HD dan simpan ke hero/spots.json.

Pemakaian:
    python3 tools/gen-spots.py tall   # dari assets/hero/night-tall.png

Butuh: numpy, Pillow.  Hasilnya titik awal saja; rapikan sendiri di browser dengan ?edit-spots,
lalu tempel JSON hasil "Salin JSON" ke hero/spots.json.

Koordinat relatif terhadap gambar (0..1): [x, y, ukuran]. Ukuran 1 = lentera biasa, < 1 = lebih kecil
(jendela jauh, lampu kota). Urutan di berkas = urutan menyala saat scroll.
Area per gambar ditulis manual di AREAS (koordinat piksel gambar asli), lalu disaring dengan masker:
langit dan kubah emas tidak pernah diberi titik.
"""
import json
import os
import random
import sys

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# (nama, kotak x0,y0,x1,y1 dalam piksel gambar 1024x1536, jumlah titik, ukuran, pola)
AREAS = {
    'tall': [
        ('jendela kubah (drum)', (468, 985, 676, 1010), 9, .55, 'row'),
        ('jendela segi delapan', (352, 1095, 792, 1115), 16, .65, 'row'),
        ('pintu & serambi', (480, 1130, 590, 1175), 4, .8, 'row'),
        ('jendela Masjid Qibli', (78, 1060, 300, 1080), 8, .55, 'row'),
        ('arkade kiri', (165, 1135, 320, 1200), 4, .8, 'row'),
        ('arkade kanan', (828, 1135, 940, 1195), 3, .8, 'row'),
        ('pelataran', (60, 1175, 1000, 1255), 70, 1.0, 'scatter'),
        ('tembok', (0, 1205, 640, 1330), 45, .8, 'scatter'),
        ('kota tua kiri', (0, 1235, 230, 1520), 40, .6, 'scatter'),
        ('lampu kota di bukit', (0, 940, 1024, 1000), 30, .4, 'scatter'),
        ('jalan di antara zaitun', (250, 1440, 1000, 1520), 25, .9, 'scatter'),
    ],
}


def masks(img):
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gold = (r > b * 1.2) & (g > b * 1.05) & (r > .12)          # kubah emas (redup di malam hari)
    lum = a @ np.array([.299, .587, .114], dtype=np.float32)
    gy = np.abs(np.diff(lum, axis=0, prepend=lum[:1]))
    # langit: dari atas sampai baris pertama yang cukup "ramai" per kolom
    sky = np.zeros(lum.shape, bool)
    busy = gy > .035
    for x in range(lum.shape[1]):
        ys = np.nonzero(busy[int(lum.shape[0] * .45):, x])[0]
        top = int(lum.shape[0] * .45) + (ys[0] if len(ys) else lum.shape[0])
        sky[:top, x] = True
    return gold, sky


def main():
    kind = sys.argv[1] if len(sys.argv) > 1 else 'tall'
    img = Image.open(os.path.join(ROOT, 'assets', 'hero', f'night-{kind}.png'))
    W, H = img.size
    gold, sky = masks(img)
    rnd = random.Random(7)
    spots = []
    for name, (x0, y0, x1, y1), n, size, mode in AREAS[kind]:
        got = []
        tries = 0
        while len(got) < n and tries < n * 60:
            tries += 1
            if mode == 'row':
                x = x0 + (x1 - x0) * (len(got) + .5) / n
                y = rnd.uniform(y0, y1)
            else:
                x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
            xi, yi = int(min(W - 1, x)), int(min(H - 1, y))
            if gold[yi, xi] or (sky[yi, xi] and 'bukit' not in name):
                if mode == 'row':
                    got.append(None)                       # lewati slot ini, jaga jarak antar jendela
                continue
            # jarak minimum supaya tidak menumpuk
            if mode == 'scatter' and any((x - p[0]) ** 2 + (y - p[1]) ** 2 < (22 * size) ** 2 for p in got if p):
                continue
            got.append((x, y))
        spots += [[round(p[0] / W, 4), round(p[1] / H, 4), size] for p in got if p]
        print(f'{name:24} {sum(1 for p in got if p):3d} titik')
    rnd.shuffle(spots)                                     # urutan menyala acak, merata di seluruh gambar
    path = os.path.join(ROOT, 'hero', 'spots.json')
    data = json.load(open(path)) if os.path.exists(path) else {}
    data.setdefault('wide', [])
    data[kind] = spots
    with open(path, 'w') as f:
        f.write('{\n' + ',\n'.join(f'  "{k}": [' + ', '.join(json.dumps(s) for s in v) + ']' for k, v in data.items()) + '\n}\n')
    print(f'total {len(spots)} titik -> hero/spots.json ({kind})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
