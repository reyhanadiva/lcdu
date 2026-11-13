# Alat bantu (dijalankan manual, tidak ikut ke situs)

Butuh Python 3.9+ dengan `numpy` dan `Pillow >= 11.2` (dukungan AVIF):

```bash
pip install numpy pillow
```

| Skrip | Kegunaan |
|---|---|
| `check-align.py <malam.png> <fajar.png>` | Periksa apakah pasangan malam/fajar sejajar. Lulus bila pergeseran ≤ 4 px di tiap zona (kiri, tengah, kanan, atas, bawah; diukur pada lebar 1536) dan korelasi tepi area bangunan ≥ 0,40. Pembanding: pasangan tall = 0–1 px, korelasi 0,52. Kode keluar 0 = lulus. |
| `build-hero-images.py` | Buat turunan AVIF/WebP/JPG di `assets/hero/build/` dan `manifest.json`. Tidak pernah memperbesar melampaui resolusi asli (tall: 750 & 1024; wide: 1280 & 1536). Pasangan yang berkasnya belum ada dilewati. |
| `gen-spots.py tall` | Buat titik cahaya awal otomatis ke `hero/spots.json`. Setelah itu rapikan di browser dengan `?edit-spots`. |

## Alur menambah pasangan wide (night-wide-v2)

1. Simpan berkas di `assets/hero/night-wide-v2.png` (pasangannya `assets/hero/dawn-wide.png`).
2. `python3 tools/check-align.py assets/hero/night-wide-v2.png assets/hero/dawn-wide.png` → harus **LULUS**.
3. `python3 tools/build-hero-images.py` → manifest kini berisi `wide`, dan Lentera HD otomatis aktif di layar landscape.
4. `python3 tools/gen-spots.py wide` (tambahkan dulu area `wide` di skrip), lalu rapikan dengan `?edit-spots`.
5. Periksa `ART.wide` (fokus kubah, posisi matahari, cakrawala) di `hero/lentera-hd.js`.

## Foto stok & ornamen (Node, `npm install` di `tools/`)

| Skrip | Kegunaan |
|---|---|
| `node build-photos.mjs <folder-jpg>` | Foto stok (`<nama>.jpg`) → `assets/photos/<nama>-{480,960,1600}.{avif,webp}` + `manifest.json`. Potongan per foto di objek `FOTO`. Tidak memperbesar. Catat sumber di `assets/photos/CREDITS.md`. |
| `node make-ornaments.mjs` | Tulis ulang semua SVG di `assets/ornaments/` (kain keffiyeh, pita, bingkai, semangka, lengkung). |

Alat model 3D (`optimize-models.mjs`, `prep-model-textures.py`, `make-extras.py`) ikut diarsipkan di repo `reyhanadiva/lcdu-3d`.
