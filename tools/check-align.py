#!/usr/bin/env python3
"""Periksa apakah dua gambar (malam & fajar) sejajar, untuk varian hero Lentera HD.

Pemakaian:
    python3 tools/check-align.py assets/hero/night-wide-v2.png assets/hero/dawn-wide.png

Butuh: Python 3.9+, numpy, Pillow  (pip install numpy pillow)

Cara kerja: kedua gambar diubah menjadi peta tepi (bentuk bangunan, bukan terang-gelapnya), lalu
dicari pergeseran terbaik per zona dengan korelasi silang. Gambar yang benar-benar sejajar
memberi pergeseran ~0 px di SEMUA zona. Pergeseran yang berbeda antar zona berarti komposisi atau
skala berbeda (misalnya kubah lebih besar), bukan sekadar bergeser.

Ambang lulus (keputusan pemilik):
  - pergeseran <= 4 px di tiap zona, diukur pada lebar 1536 (diskalakan untuk lebar lain);
  - korelasi tepi area bangunan >= 0,40.
Pembanding: pasangan tall yang sudah baik -> 0 px dan korelasi 0,51.

Kode keluar: 0 = lulus, 1 = tidak lulus, 2 = kesalahan masukan.
"""
import sys

import numpy as np
from PIL import Image

MAX_SHIFT_AT_1536 = 4.0
MIN_CORR = 0.40
SEARCH = 60          # rentang pencarian pergeseran (px) tiap arah
MIN_DETAIL = 0.02    # zona dengan tepi terlalu sedikit (mis. langit polos) tidak dinilai


def load(path):
    return np.asarray(Image.open(path).convert('RGB'), dtype=np.float32) / 255


def edges(img):
    """Gradien luminans yang dinormalisasi: tahan terhadap perbedaan cahaya malam/fajar."""
    g = img @ np.array([.299, .587, .114], dtype=np.float32)
    g = (g - g.mean()) / (g.std() + 1e-6)
    gx = np.zeros_like(g)
    gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]
    gy[1:-1] = g[2:] - g[:-2]
    m = np.hypot(gx, gy)
    return np.clip(m / (np.percentile(m, 99) + 1e-6), 0, 1)


def best_shift(a, b, search=SEARCH):
    """Pergeseran (dx, dy) yang paling menyelaraskan b ke a, serta korelasinya."""
    A = a - a.mean()
    B = b - b.mean()
    spec = np.fft.rfft2(A) * np.conj(np.fft.rfft2(B))
    corr = np.fft.fftshift(np.fft.irfft2(spec, s=A.shape))
    corr /= np.sqrt((A * A).sum() * (B * B).sum()) + 1e-9
    cy, cx = A.shape[0] // 2, A.shape[1] // 2
    s = min(search, cy - 1, cx - 1)
    win = corr[cy - s:cy + s + 1, cx - s:cx + s + 1]
    iy, ix = np.unravel_index(np.argmax(win), win.shape)
    return ix - s, iy - s, float(win.max()), float(corr[cy, cx])


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    pa, pb = sys.argv[1], sys.argv[2]
    a, b = load(pa), load(pb)
    if a.shape != b.shape:
        print(f'TIDAK LULUS: ukuran berbeda {a.shape[1]}x{a.shape[0]} vs {b.shape[1]}x{b.shape[0]}')
        return 1
    h, w = a.shape[:2]
    limit = MAX_SHIFT_AT_1536 * w / 1536
    ea, eb = edges(a), edges(b)

    # area bangunan: buang langit di atas cakrawala (baris dengan tepi sangat sedikit di kedua gambar)
    rows = (ea.mean(1) + eb.mean(1)) / 2
    busy = np.nonzero(rows > np.percentile(rows, 60) * .5)[0]
    top = int(busy[0]) if len(busy) else 0
    zones = {
        'kiri': (slice(0, h), slice(0, w // 3)),
        'tengah': (slice(0, h), slice(w // 3, 2 * w // 3)),
        'kanan': (slice(0, h), slice(2 * w // 3, w)),
        'atas': (slice(0, h // 2), slice(0, w)),
        'bawah': (slice(h // 2, h), slice(0, w)),
    }

    print(f'{pa}\n{pb}\nukuran {w}x{h}; batas pergeseran {limit:.1f} px (= 4 px pada lebar 1536); korelasi minimum {MIN_CORR:.2f}\n')
    ok = True
    dx, dy, c, c0 = best_shift(ea[top:], eb[top:])
    corr_ok = c >= MIN_CORR
    ok &= corr_ok
    print(f'  area bangunan (y >= {top}): geser dx={dx:+d} dy={dy:+d}  korelasi {c:.3f}  {"OK" if corr_ok else "KURANG"}')
    for name, (ys, xs) in zones.items():
        za, zb = ea[ys, xs], eb[ys, xs]
        detail = min(za.mean(), zb.mean())
        if detail < MIN_DETAIL:
            print(f'  {name:6}: detail terlalu sedikit (mis. langit polos), tidak dinilai')
            continue
        zdx, zdy, zc, _ = best_shift(za, zb)
        dist = (zdx * zdx + zdy * zdy) ** .5
        zok = dist <= limit
        ok &= zok
        print(f'  {name:6}: geser dx={zdx:+d} dy={zdy:+d} ({dist:.1f} px)  korelasi {zc:.3f}  {"OK" if zok else "BERGESER"}')
    print('\nHASIL:', 'LULUS' if ok else 'TIDAK LULUS')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
