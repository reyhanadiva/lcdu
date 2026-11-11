#!/usr/bin/env python3
"""Ubah lembar gambar acuan (ChatGPT) di assets/models/source/extras/ menjadi aset hero 3D di assets/models/extras/.

Pemakaian:  python3 tools/make-extras.py          (butuh numpy + Pillow >= 11.2)

Berkas asli TIDAK pernah ditimpa. Tidak ada gambar yang diperbesar melampaui resolusi aslinya.
Hasil (desktop + versi HP setengah ukuran, akhiran -m):
  trees.webp / trees-m.webp      atlas sprite zaitun (4) + cemara (3), beralfa
  houses.webp / houses-m.webp    atlas sprite gugus rumah (3), beralfa
  tex-{wall,paving,plaster,ground}[-m].webp  + -n (normal map) [+ -r roughness untuk paving]: petak mulus (seamless)
  panorama.webp / panorama-m.webp  pita Bukit Zaitun + kota jauh, langit dibuang, tepi memudar
  extras.json                     posisi tiap sprite di atlas (u0, v0, u1, v1, rasio lebar/tinggi)

Latar abu polos dihapus dengan kunci warna, lalu warna tepi "dibersihkan" dari campuran abu (dekontaminasi) dan
alfa dikikis 1 px supaya tidak ada halo terang. Ukuran diperkecil dengan alfa premultiplied (tidak ada pinggiran gelap/terang).
"""
import json
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'models', 'source', 'extras')
OUT = os.path.join(ROOT, 'assets', 'models', 'extras')

# kotak objek (x0, y0, x1, y1) di lembar asli, dari audit (komponen terhubung) + margin
OLIVES = [(10, 10, 630, 612), (626, 14, 1250, 612), (2, 642, 620, 1244), (626, 650, 1250, 1244)]
CYPRESS = [(206, 168, 446, 1080), (598, 8, 858, 1080), (1018, 376, 1222, 1080)]
HOUSES = [(312, 12, 1180, 508), (792, 508, 1520, 990), (16, 524, 732, 986)]
TEXTURES = {'wall': (8, 8, 757, 501), 'paving': (778, 8, 1528, 501), 'plaster': (8, 522, 757, 1016), 'ground': (778, 522, 1528, 1016)}
PANO = (340, 250, 1536, 660)   # tanpa menara besar di depan-kiri, tanpa bangunan dekat di bawah


def smoothstep(a, b, x):
    t = np.clip((x - a)/(b - a), 0, 1)
    return t*t*(3 - 2*t)


def key_out(img, bg):
    """latar polos → alfa; warna tepi didekontaminasi dari warna latar"""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    d = np.abs(a - bg).max(2)
    chroma = a.max(2) - a.min(2)
    alpha = smoothstep(14, 42, d)
    # Hanya abu yang tersambung ke latar murni (d < 8) yang boleh transparan: celah di sela daun & bayangan di tanah.
    # Bagian abu muda di dalam batang/dinding (tidak tersambung) tetap utuh, jadi tidak bolong.
    cand = (d < 50).astype(np.uint8)*255
    reach = Image.fromarray(((d < 8)*255).astype(np.uint8))
    for _ in range(14):
        reach = Image.fromarray(np.minimum(np.asarray(reach.filter(ImageFilter.MaxFilter(3))), cand))
    bgreg = np.asarray(reach) > 0
    alpha[(d < 50) & ~bgreg] = 1
    alpha[bgreg & (chroma < 7)] = 0              # bayangan abu netral di bawah objek bukan bagian objek
    am = Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))   # kikis 1 px
    alpha = np.minimum(alpha, np.asarray(am)/255.)
    rgb = (a - (1 - alpha[..., None])*bg)/np.maximum(alpha[..., None], .08)
    return np.clip(rgb, 0, 255), alpha


def premul_resize(rgb, alpha, size):
    pm = np.dstack([rgb*alpha[..., None], alpha*255]).astype(np.float32)
    chans = [np.asarray(Image.fromarray(pm[..., i]).resize(size, Image.LANCZOS)) for i in range(4)]
    al = np.clip(chans[3]/255., 0, 1)
    col = np.stack(chans[:3], 2)/np.maximum(al[..., None], 1e-3)
    al[al < .02] = 0
    return np.clip(col, 0, 255), al


def sprites(sheet, boxes, target_h):
    img = Image.open(os.path.join(SRC, sheet)).convert('RGB')
    a = np.asarray(img).astype(np.float32)
    bg = np.median(np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)]), 0)
    rgb, alpha = key_out(img, bg)
    out = []
    for (x0, y0, x1, y1), th in zip(boxes, target_h):
        r, al = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
        ys, xs = np.where(al > .05)
        r, al = r[ys.min():ys.max() + 1, xs.min():xs.max() + 1], al[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        h, w = al.shape
        s = min(1, th/h)                      # tidak pernah memperbesar
        out.append(premul_resize(r, al, (max(1, round(w*s)), max(1, round(h*s)))))
    return out


def pack(items, pad=6):
    """rak tunggal: semua sprite berjajar; tinggi atlas = sprite tertinggi"""
    W = sum(c.shape[1] for c, _ in items) + pad*(len(items) + 1)
    H = max(c.shape[0] for c, _ in items) + pad*2
    W, H = (W + 3)//4*4, (H + 3)//4*4
    rgba = np.zeros((H, W, 4), np.float32)
    rects, x = [], pad
    for c, al in items:
        h, w = al.shape
        y = H - pad - h                       # rata bawah (pangkal batang / dasar rumah)
        rgba[y:y + h, x:x + w, :3] = c; rgba[y:y + h, x:x + w, 3] = al*255
        rects.append([x/W, 1 - (y + h)/H, (x + w)/W, 1 - y/H, round(w/h, 4)])
        x += w + pad
    # isi warna piksel transparan dengan warna tetangga (dilasi) supaya filter tekstur tidak menarik warna hitam ke tepi
    col = Image.fromarray(rgba[..., :3].astype(np.uint8)); m = rgba[..., 3] > 0
    for _ in range(6):
        grown = np.asarray(col.filter(ImageFilter.MaxFilter(3))).astype(np.float32)
        c = rgba[..., :3]; c[~m] = grown[~m]; m = np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
        col = Image.fromarray(c.astype(np.uint8))
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA'), rects


def seamless(img):
    """petak mulus: campur dengan salinan yang digeser setengah, bobot nol di tepi → sambungan hilang"""
    a = np.asarray(img).astype(np.float32); h, w = a.shape[:2]
    sh = np.roll(np.roll(a, h//2, 0), w//2, 1)
    yy, xx = np.mgrid[0:h, 0:w]
    wt = np.minimum(np.minimum(xx, w - 1 - xx)/(w*.5), np.minimum(yy, h - 1 - yy)/(h*.5))
    wt = smoothstep(0, .35, wt)[..., None]
    return Image.fromarray((a*wt + sh*(1 - wt)).astype(np.uint8))


def normal_map(img, strength):
    L = np.asarray(img.convert('L').filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255.
    dx = (np.roll(L, -1, 1) - np.roll(L, 1, 1))*strength
    dy = (np.roll(L, -1, 0) - np.roll(L, 1, 0))*strength
    n = np.dstack([-dx, dy, np.ones_like(L)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return Image.fromarray(((n*.5 + .5)*255).astype(np.uint8))


def panorama():
    img = Image.open(os.path.join(SRC, 'panorama-dawn.png')).convert('RGB').crop(PANO)
    a = np.asarray(img).astype(np.float32); h, w = a.shape[:2]
    # langit: halus & jenuh (merah muda-jingga); bukit/kota: bertekstur & kurang jenuh. Garis cakrawala per kolom
    L = a.mean(2); sat = (a.max(2) - a.min(2))/np.maximum(a.max(2), 1)
    gy, gx = np.gradient(np.asarray(Image.fromarray(L.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))).astype(np.float32))
    detail = np.asarray(Image.fromarray(np.clip(np.hypot(gx, gy)*12, 0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(4))).astype(np.float32)/255.
    sky_sat = np.median(sat[:12], 0)
    score = detail*1.6 + np.clip(sky_sat[None, :] - sat, 0, 1)*3
    line = np.full(w, h - 1, np.float32)
    for x in range(w):
        idx = np.where(score[:, x] > .45)[0]
        if len(idx): line[x] = idx[0]
    line = np.asarray(Image.fromarray(line[None, :]).filter(ImageFilter.MedianFilter(1)))[0]
    k = np.ones(15)/15; line = np.convolve(np.pad(line, 7, mode='edge'), k, 'valid')
    yy, xx = np.mgrid[0:h, 0:w]
    alpha = smoothstep(line[None, :] - 2, line[None, :] + 5, yy)
    alpha *= smoothstep(h, h*.62, yy)                                         # bawah memudar ke kabut
    alpha *= smoothstep(0, w*.14, xx)*smoothstep(w, w*.86, xx)                # tepi kiri-kanan memudar (tak ada sambungan)
    rgba = np.dstack([a, alpha*255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA'), [int(line.min()), int(line.max())]


def save(img, name, q=80):
    path = os.path.join(OUT, name); img.save(path, 'WEBP', quality=q, method=6, exact=False)
    return os.path.getsize(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    meta, sizes = {}, {}
    for suffix, k in (('', 1), ('-m', .5)):
        trees = sprites('olive-sheet.png', OLIVES, [400*k]*4) + sprites('cypress-sheet.png', CYPRESS, [512*k, 512*k, 512*k])
        atlas, rects = pack(trees)
        sizes['trees' + suffix] = save(atlas, f'trees{suffix}.webp', 82)
        meta['trees'] = {'zaitun': rects[:4], 'cemara': rects[4:]}
        houses = sprites('oldcity-sheet.png', HOUSES, [360*k, 340*k, 330*k])
        atlas, rects = pack(houses)
        sizes['houses' + suffix] = save(atlas, f'houses{suffix}.webp', 82)
        meta['houses'] = rects
        sheet = Image.open(os.path.join(SRC, 'textures-sheet.png')).convert('RGB')
        for name, (x0, y0, x1, y1) in TEXTURES.items():
            s = min(x1 - x0, y1 - y0); cx = (x0 + x1)//2
            tile = seamless(sheet.crop((cx - s//2, y0, cx - s//2 + s, y0 + s)))
            if k < 1: tile = tile.resize((round(s*k), round(s*k)), Image.LANCZOS)
            sizes[f'tex-{name}{suffix}'] = save(tile, f'tex-{name}{suffix}.webp', 78)
            sizes[f'tex-{name}{suffix}-n'] = save(normal_map(tile, {'wall': 5, 'paving': 3, 'plaster': 2, 'ground': 4}[name]), f'tex-{name}{suffix}-n.webp', 80)
            if name == 'paving':
                L = np.asarray(tile.convert('L')).astype(np.float32)/255.
                r = np.clip(.95 - (L - L.mean())*.9, .5, 1)          # nat gelap lebih kasar, batu aus lebih halus
                sizes[f'tex-{name}{suffix}-r'] = save(Image.fromarray((r*255).astype(np.uint8)), f'tex-{name}{suffix}-r.webp', 75)
        pano, line = panorama()
        if k < 1: pano = pano.resize((pano.width//2, pano.height//2), Image.LANCZOS)   # Pillow me-resample RGBA secara premultiplied
        sizes['panorama' + suffix] = save(pano, f'panorama{suffix}.webp', 80)
        meta['panorama'] = {'aspect': round(pano.width/pano.height, 4), 'horizon_px': line}
    with open(os.path.join(OUT, 'extras.json'), 'w') as f: json.dump(meta, f, indent=1)
    tot = {'desktop': sum(v for k, v in sizes.items() if '-m' not in k), 'hp': sum(v for k, v in sizes.items() if '-m' in k)}
    for k_, v in sorted(sizes.items()): print(f'{k_:22} {v/1024:7.1f} KB')
    print(f"total desktop {tot['desktop']/1024:.0f} KB, HP {tot['hp']/1024:.0f} KB")


if __name__ == '__main__':
    main()
