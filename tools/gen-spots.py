#!/usr/bin/env python3
"""Buat titik cahaya awal (otomatis) untuk Lentera HD dan simpan ke hero/spots.json.

Pemakaian:
    python3 tools/gen-spots.py tall   # dari assets/hero/night-tall.png

Butuh: Pillow.  Hasilnya titik awal saja; rapikan sendiri di browser dengan ?edit-spots,
lalu tempel JSON hasil "Salin JSON" ke hero/spots.json.

Koordinat relatif terhadap gambar (0..1): [x, y, ukuran, jenis]. Titik hanya ditaruh di sumber cahaya yang masuk
akal (jendela, pintu, lentera arkade, tiang lampu, lentera jalan, rumah di bukit), ditulis manual di AREAS.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# Jenis titik (kolom ke-4 di spots.json) menentukan cara cahaya digambar di hero/lentera-hd.js:
#   w = jendela/pintu (pendar hangat di bukaan), a = lentera gantung di arkade (titik + genangan cahaya di bawahnya),
#   l = tiang lampu / lentera tembok (titik + genangan di tanah), g = lentera rendah di tanah, c = lampu kota jauh (kecil)
# Pola: ('row', (x0, y, x1), n)  deret mendatar | ('line', (x0, y0, x1, y1), n) garis | ('pts', [(x, y), ...])
# Koordinat piksel gambar tall 1024x1536 (lihat gambar berkisi saat menyetel).
AREAS = {
    'tall': [
        ('jendela drum', 'w', .6, ('row', (478, 1012, 668), 7)),
        ('jendela segi delapan', 'w', .7, ('row', (352, 1100, 792), 14)),
        ('pintu Kubah', 'w', 1.5, ('pts', [(534, 1148)])),
        ('jendela Masjid Qibli', 'w', .6, ('row', (118, 1074, 288), 6)),
        ('lentera arkade kiri', 'a', .9, ('pts', [(190, 1132), (232, 1132), (274, 1132)])),
        ('lentera arkade kanan', 'a', .9, ('pts', [(862, 1132), (892, 1132), (920, 1132)])),
        ('tiang lampu pelataran', 'l', 1.0, ('pts', [(60, 1186), (118, 1180), (352, 1240), (430, 1244), (650, 1246), (730, 1242), (962, 1190)])),
        ('lentera puncak tembok', 'l', .75, ('line', (40, 1203, 580, 1252), 9)),
        ('jendela kota tua', 'w', .45, ('pts', [(12, 1372), (40, 1368), (68, 1366), (18, 1452), (52, 1450), (84, 1306), (30, 1308)])),
        ('lentera jalan zaitun', 'g', 1.0, ('pts', [(300, 1470), (470, 1502), (565, 1452), (760, 1478), (900, 1468), (995, 1452)])),
        ('lampu rumah di bukit', 'c', .4, ('pts', [(860, 1000), (900, 992), (932, 985), (958, 978), (988, 972), (1010, 990), (760, 1004), (700, 1010), (115, 1015), (60, 1025), (300, 1018), (350, 1010)])),
    ],
    # gambar wide 1536x1024 (night-wide-v2 / dawn-wide)
    'wide': [
        ('jendela drum', 'w', .6, ('row', (1010, 428, 1240), 7)),
        ('jendela segi delapan', 'w', .7, ('pts', [(890 + i*36, 573) for i in range(14) if not 6 <= i <= 7])),
        ('pintu Kubah', 'w', 1.5, ('pts', [(1115, 612)])),
        ('jendela Masjid Qibli', 'w', .6, ('row', (380, 578, 590), 6)),
        ('lentera arkade kiri', 'a', .85, ('pts', [(455, 640), (495, 640), (535, 640)])),
        ('lentera paviliun', 'a', .8, ('pts', [(722, 632), (1427, 632)])),
        ('lentera arkade depan', 'a', 1.0, ('pts', [(842, 702), (906, 700), (975, 700), (1050, 702)])),
        ('tiang lampu pelataran', 'l', 1.0, ('pts', [(605, 668), (655, 676), (1180, 700), (1300, 690), (1395, 718), (1150, 768)])),
        ('lentera puncak tembok', 'l', .75, ('line', (20, 642, 380, 652), 6)),
        ('lentera tembok depan & tangga', 'l', .8, ('pts', [(1100, 772), (1190, 768), (1262, 760), (1300, 805), (1445, 818)])),
        ('jendela kota tua', 'w', .45, ('pts', [(40, 560), (90, 575), (150, 555), (200, 585), (250, 560), (300, 600), (60, 610), (130, 600), (180, 535), (230, 600)])),
        ('lentera kebun zaitun', 'g', 1.0, ('pts', [(260, 905), (480, 930), (560, 880), (820, 900), (150, 962), (420, 958), (700, 975), (980, 992)])),
        ('lampu rumah di bukit', 'c', .4, ('pts', [(1300, 470), (1350, 465), (1420, 455), (1480, 460), (1380, 500), (700, 470), (760, 480), (640, 490), (120, 520), (60, 500), (250, 500), (1500, 500)])),
    ],
}


def main():
    kind = sys.argv[1] if len(sys.argv) > 1 else 'tall'
    img = Image.open(os.path.join(ROOT, 'assets', 'hero', {'tall': 'night-tall.png', 'wide': 'night-wide-v2.png'}[kind]))
    W, H = img.size
    spots = []
    for name, kind_, size, (mode, geo, *rest) in AREAS[kind]:
        if mode == 'pts':
            pts = geo
        elif mode == 'row':
            x0, y, x1 = geo; n = rest[0]; pts = [(x0 + (x1 - x0)*(i + .5)/n, y) for i in range(n)]
        else:
            x0, y0, x1, y1 = geo; n = rest[0]; pts = [(x0 + (x1 - x0)*i/(n - 1), y0 + (y1 - y0)*i/(n - 1)) for i in range(n)]
        spots += [[round(x/W, 4), round(y/H, 4), size, kind_] for x, y in pts]
        print(f'{name:24} {len(pts):3d} titik ({kind_})')
    # urutan menyala dihitung di browser (gelombang dari Kubah ke luar), jadi urutan di berkas tidak penting
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
