#!/usr/bin/env python3
"""Siapkan tekstur model 3D (hasil TRELLIS) sebelum dioptimasi oleh optimize-models.mjs.

Pemakaian:
    python3 tools/prep-model-textures.py            # tulis assets/models/optimized/src/*.png
    python3 tools/prep-model-textures.py --probe    # cetak profil warna dinding per ketinggian (untuk menyetel BANDS)

Butuh: numpy, Pillow.  Berkas asli di assets/models/ TIDAK diubah.

Atlas tekstur generator AI terpecah-pecah, jadi setiap texel dipetakan ke posisi 3D-nya (rasterisasi segitiga di
ruang UV). Dengan begitu kita bisa mengubah tekstur berdasarkan letak di bangunan:
  1. color grade seragam: bayangan terpanggang diangkat sedikit, kontras & saturasi diredam;
  2. Kubah: pita "kaligrafi" buatan AI diganti ornamen polos biru-emas (tanpa huruf; teks Arab buatan AI sering
     tidak bermakna dan pengunjung bisa mengiranya ayat);
  3. Qibli: bercak biru-abu sisa generator di dinding batu dinetralkan ke warna batu;
  4. masker jendela (lapisan emissive terpisah) untuk cahaya hangat malam hari, dikendalikan dari kode.
"""
import io
import json
import os
import struct
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'models')
OUT = os.path.join(SRC, 'optimized', 'src')

# Pita ornamen Kubah: rentang tinggi (y, satuan model) dan jari-jari minimum dari sumbu (pita luar segi delapan, pita drum).
# Disetel dengan --probe (pita = biru tua + kontras tinggi di dekat puncak dinding).
BANDS = {'dome': [(-.145, -.105, .36), (-.020, .008, .17)]}   # puncak dinding segi delapan; puncak drum
# Area dinding tempat jendela dicari: (y_min, y_max, jari-jari minimum)
WINDOW_ZONES = {'dome': [(-.27, -.15, .36), (-.09, -.025, .17)], 'qibli': [(-.25, .03, 0)]}

CT = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def load_glb(path):
    b = open(path, 'rb').read()
    off, js, bin_ = 12, None, None
    while off < len(b):
        ln, typ = struct.unpack_from('<II', b, off)
        chunk = b[off + 8:off + 8 + ln]
        off += 8 + ln
        if typ == 0x4E4F534A:
            js = json.loads(chunk)
        else:
            bin_ = chunk
    return js, bin_


def accessor(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']])
    n = NC[a['type']]
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(bin_, dt, count=a['count'] * n, offset=start).reshape(a['count'], n)


def image(js, bin_, idx):
    bv = js['bufferViews'][js['images'][idx]['bufferView']]
    return Image.open(io.BytesIO(bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))


def rasterize(P, N, UV, I, size):
    """Untuk tiap texel atlas: posisi 3D, normal, dan apakah terisi."""
    pos = np.zeros((size, size, 3), np.float32)
    nor = np.zeros((size, size, 3), np.float32)
    hit = np.zeros((size, size), bool)
    uv = UV[I] * size                       # (T,3,2); glTF: v=0 di atas gambar, sama dengan baris 0
    for t in range(len(I)):
        tri = uv[t]
        x0, y0 = np.floor(tri.min(0)).astype(int)
        x1, y1 = np.ceil(tri.max(0)).astype(int)
        x0, y0 = max(x0, 0), max(y0, 0)
        x1, y1 = min(x1, size - 1), min(y1, size - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        (ax, ay), (bx, by), (cx, cy) = tri
        d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(d) < 1e-12:
            continue
        w0 = ((by - cy) * (xs - cx) + (cx - bx) * (ys - cy)) / d
        w1 = ((cy - ay) * (xs - cx) + (ax - cx) * (ys - cy)) / d
        w2 = 1 - w0 - w1
        m = (w0 >= -.02) & (w1 >= -.02) & (w2 >= -.02)
        if not m.any():
            continue
        iy, ix = (ys[m] - .5).astype(int), (xs[m] - .5).astype(int)
        W = np.stack([w0[m], w1[m], w2[m]], 1)
        pos[iy, ix] = W @ P[I[t]]
        nor[iy, ix] = W @ N[I[t]]
        hit[iy, ix] = True
    return pos, nor, hit


def grade(rgb, kind):
    """Satu color grade untuk semua aset: angkat bayangan terpanggang, redam kontras & saturasi."""
    x = rgb.astype(np.float32) / 255
    L = x @ np.array([.299, .587, .114], np.float32)
    blurL = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(24)), np.float32) / 255
    # bayangan besar (gelap berskala besar) diangkat; detail kecil (jendela, nat) tetap
    lift = np.clip(.42 - blurL, 0, None)[..., None] * .55
    x = x + lift
    mean = x.mean((0, 1), keepdims=True)
    x = mean + (x - mean) * .9                      # kontras sedikit diredam
    g = (x @ np.array([.299, .587, .114], np.float32))[..., None]
    x = g + (x - g) * (.88 if kind == 'dome' else .95)   # saturasi sedikit diredam agar menyatu; batu Qibli tetap hangat
    return np.clip(x * 255, 0, 255).astype(np.uint8)


def main():
    probe = '--probe' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    for kind in ('dome', 'qibli'):
        js, bin_ = load_glb(os.path.join(SRC, f'{kind}.glb'))
        prim = js['meshes'][0]['primitives'][0]
        P = accessor(js, bin_, prim['attributes']['POSITION']).astype(np.float64)
        N = accessor(js, bin_, prim['attributes']['NORMAL']).astype(np.float64)
        UV = accessor(js, bin_, prim['attributes']['TEXCOORD_0']).astype(np.float64)
        I = accessor(js, bin_, prim['indices']).astype(np.int64).reshape(-1, 3)
        mat = js['materials'][0]['pbrMetallicRoughness']
        tex = js['textures'][mat['baseColorTexture']['index']]
        src = tex.get('source', tex.get('extensions', {}).get('EXT_texture_webp', {}).get('source'))
        base = image(js, bin_, src).convert('RGBA')
        size = base.width
        pos, nor, hit = rasterize(P, N, UV, I, size)
        rgba = np.asarray(base).copy()
        rgb = rgba[..., :3]
        radius = np.hypot(pos[..., 0], pos[..., 2])
        nlen = np.linalg.norm(nor, axis=-1) + 1e-9
        vertical = hit & (np.abs(nor[..., 1] / nlen) < .35)        # permukaan dinding tegak

        if probe:
            lum = rgb.astype(np.float32) @ np.array([.299, .587, .114], np.float32) / 255
            for rmin in ((.36, .17) if kind == 'dome' else (0,)):
                sel = vertical & (radius > rmin)
                print(f'{kind}: dinding dengan jari-jari > {rmin}')
                for y in np.arange(-.36, .36, .01):
                    m = sel & (pos[..., 1] >= y) & (pos[..., 1] < y + .01)
                    if m.sum() < 400:
                        continue
                    c = rgb[m].mean(0)
                    print(f'  y {y:+.2f}: n={m.sum():6d} warna {c.astype(int)} kontras {lum[m].std():.3f}')
            continue

        out = grade(rgb, kind)

        if kind == 'dome':
            for y0, y1, rmin in BANDS['dome']:
                m = vertical & (radius > rmin) & (pos[..., 1] >= y0) & (pos[..., 1] <= y1)
                t = (pos[..., 1] - y0) / (y1 - y0)                      # 0..1 dari bawah ke atas pita
                ang = np.arctan2(pos[..., 0], pos[..., 2])
                per = np.mod(ang * radius * 60, 1.0)                    # pola berulang sepanjang keliling
                navy = np.array([24, 44, 120]); gold = np.array([226, 182, 74]); cream = np.array([236, 230, 214])
                col = np.empty(rgb.shape, np.float32); col[:] = navy
                edge = (t < .12) | (t > .88)
                col[edge] = gold
                dia = (np.abs(per - .5) * 2 + np.abs(t - .5) * 2.6) < .55   # belah ketupat
                col[dia & ~edge] = cream
                dot = (np.abs(per - .5) * 2 + np.abs(t - .5) * 2.6) < .22
                col[dot & ~edge] = gold
                # sedikit variasi agar tidak terlihat seperti tempelan digital
                noise = np.random.default_rng(3).normal(0, 6, rgb.shape)
                out[m] = np.clip(col[m] + noise[m], 0, 255).astype(np.uint8)
                print(f'dome: pita y {y0}..{y1} r>{rmin}: {m.sum()} texel diganti ornamen')
        else:
            # bercak biru-abu di dinding batu (bukan kubah timah, bukan jendela gelap) -> warna batu
            x = out.astype(np.float32)
            blue = vertical & (x[..., 2] > x[..., 0] + 6) & (pos[..., 1] < .03)    # kubah timah mulai y=+0,04: jangan disentuh
            stone = vertical & (x[..., 0] > x[..., 2] + 18)
            stone_col = x[stone].mean(0)
            L = (x @ np.array([.299, .587, .114]))[..., None]
            target = stone_col * (L / (stone_col @ np.array([.299, .587, .114])))
            x[blue] = x[blue] * .25 + target[blue] * .75
            out = np.clip(x, 0, 255).astype(np.uint8)
            print(f'qibli: {blue.sum()} texel biru-abu dinetralkan ke warna batu {stone_col.astype(int)}')

        # masker jendela: texel gelap di dinding tegak (ceruk jendela/pintu) di zona jendela
        lum = out.astype(np.float32) @ np.array([.299, .587, .114], np.float32)
        local = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(10)), np.float32)
        zone = np.zeros_like(hit)
        for y0, y1, rmin in WINDOW_ZONES[kind]:
            zone |= vertical & (radius > rmin) & (pos[..., 1] >= y0) & (pos[..., 1] <= y1)
        win = zone & (lum < local * .62) & (lum < 95)
        mask = Image.fromarray((win * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        mask.resize((size // 2, size // 2), Image.LANCZOS).save(os.path.join(OUT, f'{kind}-emissive.png'))
        print(f'{kind}: masker jendela {win.sum()} texel ({win.sum() / hit.sum() * 100:.1f}% permukaan)')

        Image.fromarray(np.dstack([out, rgba[..., 3]]).astype(np.uint8)).convert('RGB').save(os.path.join(OUT, f'{kind}-base.png'))
        print(f'{kind}: tekstur warna -> optimized/src/{kind}-base.png')
    return 0


if __name__ == '__main__':
    sys.exit(main())
