# LCDU Landing Page

Prototipe landing page LCDU (kelas Bahasa Inggris & Arab, Yayasan Taqwa Cerdas Kreatif).
Situs statis tanpa build step: `index.html`, modul hero di `hero/`, dan three.js (MIT) di `vendor/three/` yang hanya dimuat untuk varian 3D. Bisa langsung di-deploy ke Vercel.

## Konsep: "Dua Aksara"

Inggris ditulis kiri ke kanan, Arab kanan ke kiri. Seluruh halaman bermain di antara dua arah itu.

- **Biru (Lazuardi)** = Bahasa Inggris
- **Hijau (Zamrud)** = Bahasa Arab
- **Kuning (Kunyit)** = aksi utama (daftar, cek level)
- Font (di-host sendiri, lihat `fonts/`): Fraunces (judul), Plus Jakarta Sans (teks), Reem Kufi & Noto Naskh Arabic (Arab)

## Section

| Section | Interaksi |
|---|---|
| Hero | Cerita scroll 3 babak: malam → lampu menyala dari Kubah ke luar → fajar. Dua varian lewat tombol di kiri bawah (atau `?hero=lentera-hd|diorama`): **Foto** (default; foto malam/fajar dari ChatGPT, cahaya di jendela, lentera, dan tiang lampu) dan **3D** (model Kubah & Qibli). Kode di folder `hero/`. Tepi bawah: motif keffiyeh × semangka. |
| Ticker | Keunggulan LCDU berjalan, bergantian Indonesia–Arab. |
| Cek level | Kuis 3 soal (Inggris / Arab) dengan pembahasan langsung dan perkiraan level. |
| Kenapa LCDU | Daftar tipografi besar, baris terbuka saat di-hover / di-tap. |
| Biaya | Rp100.000 per term (1 semester), sudah termasuk seluruh biaya belajar; donasi sukarela. Struk "tercetak" saat masuk layar. |
| Kelas | Toggle Inggris/Arab; layout dicerminkan untuk Arab, jadwal ditampilkan sebagai strip hari. |
| Syarat | Checklist interaktif; CTA berubah sesuai jumlah syarat yang terpenuhi. |
| Cara daftar | Desktop: scroll vertikal menggerakkan 6 langkah secara horizontal. HP: daftar vertikal. |
| Testimoni | Tumpukan kartu yang bisa diseret. |
| Tim | Filter (Inggris / Arab / Pengelola), kartu miring mengikuti kursor, sertifikasi muncul saat hover. |
| Donasi | Nomor rekening + tombol salin. |
| Footer | Kosakata hari ini (Inggris + Arab), berganti tiap hari. |

Semua animasi menghormati `prefers-reduced-motion`. Kursor kustom hanya aktif di perangkat dengan mouse.

## Gambar hero (hero Foto)

- Sumber: `assets/hero/night-tall.png` & `dawn-tall.png` (1024×1536, sejajar, lulus `tools/check-align.py`).
  Pasangan wide: `night-wide-v2.png` + `dawn-wide.png` (1536×1024, lulus; 0 px, korelasi 0,61). `night-wide.png` lama
  tidak sejajar dan tidak dipakai.
- Turunan web di `assets/hero/build/` (AVIF → WebP → JPG; tall 750 & 1024, wide 1280 & 1536), dibuat ulang dengan
  `python3 tools/build-hero-images.py`. Lihat `tools/README.md`.
- Titik cahaya: `hero/spots.json`, atur di browser dengan `?hero=lentera-hd&edit-spots` lalu "Salin JSON".

## Sumber aset 3D

- `assets/models/dome.glb` (Kubah Shakhrah) dan `qibli.glb` (Masjid Qibli) **dibuat dari gambar yang dihasilkan ChatGPT**
  (`assets/models/source/*.png`), lalu **diubah ke 3D dengan TRELLIS.2 (lisensi MIT)**. Meshy tidak dipakai.
- Versi web di `assets/models/optimized/` dibuat dengan `tools/prep-model-textures.py` lalu `npm run models` di `tools/`
  (gltf-transform, meshoptimizer, sharp). Berkas asli tidak ditimpa.
- Penyesuaian: color grade seragam, pita "kaligrafi" buatan AI di Kubah diganti ornamen polos tanpa huruf, bercak biru
  di batu Qibli dinetralkan, masker jendela sebagai lapisan emissive terpisah.
- Catatan akurasi: serambi Qibli hanya 3 lengkung (mengikuti gambar acuan; aslinya 7), sisi belakang Qibli "ditebak"
  generator (menghadap selatan, tidak terlihat kamera).

## Logo

- Sumber: `assets/brand/lcdu-logo-wide.png` (PNG resmi, latar sudah transparan, 4461×1767) dan `lcdu-logo-square.png`
  (latar abu-abu, resolusi rendah, tidak dipakai di situs).
- Turunan untuk web di `assets/brand/web/` dibuat dengan **memotong dan memperkecil** PNG resmi, bentuk, proporsi, dan
  huruf tidak diubah. Tidak ada tracing ke SVG.
  - `lcdu-logo-color.png` / `lcdu-logo-white.png`: logo lengkap + tagline "For a Better Ummah" (footer).
  - `lcdu-lockup-color.png` / `lcdu-lockup-white.png`: ikon "d" + LCDU + garis, tanpa tagline (hero, navbar).
  - Versi putih = semua piksel logo diwarnai putih, kanal transparansi asli dipertahankan.
  - Favicon (`/favicon.ico`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) dari ikon "d".
- Warna logo (diukur dari PNG): biru `#1724C0`, hijau `#7FA33F`, teks tagline `#332C2B`.
- [ ] **Minta berkas vektor resmi (SVG/AI/PDF) dari pembuat logo.** PNG cukup untuk sekarang, tetapi vektor lebih tajam
  di semua ukuran dan lebih ringan.

## Perlu dilengkapi / diverifikasi sebelum live

- [ ] **Foto**: slot foto kelas, foto tim (15), foto testimoni. Saat ini berupa kotak warna + inisial.
- [ ] **Ketentuan penggunaan gambar ChatGPT** untuk keperluan lembaga (sumber model 3D dan gambar hero hero Foto).
- [ ] **Logo mitra** (logo LCDU resmi sudah dipasang, lihat bagian Logo).
- [ ] **Link**: Placement Test, formulir registrasi, WhatsApp admin, Instagram, alamat (saat ini `#`).
- [ ] **Ejaan nama 5 guru di baris terakhir** (dibaca dari screenshot resolusi rendah): Alexandria Cempaka Harum, Ridha Fadilah, Astria Muzdalifah, Taara Dewiana Kania, Muhammad Edwar Kartakusuma.
- [ ] **Nama yayasan** di rekening: situs lama menulis "Yayasan Cerdas Taqwa Kreatif", nama resmi "Yayasan Taqwa Cerdas Kreatif". Pastikan sesuai buku rekening.
- [ ] **Nomor rekening** Bank Muamalat 10.10.11.83.94 (tombol salin menyalin `1010118394`).
- [ ] **Tujuan donasi**: situs lama mencampur "Donasi LCDU" dan "Donasi untuk Palestina" di satu rekening. Perlu dipisah/diperjelas.
- [ ] **Teks ayat** QS. Al-Baqarah: 261 (potongan awal) dan QS. Al-Isra: 1 (potongan) — cek di quran.kemenag.go.id.
- [ ] **Jadwal**: Inggris Senin & Rabu, Arab Selasa & Kamis, 16.00–17.30 WIB; weekend Sabtu 13.00–16.00 WIB.
- [ ] **Soal kuis** dan kunci jawaban — minta guru Inggris & Arab mengecek ulang.

## Deploy

1. Vercel → Add New → Project → Import `reyhanadiva/lcdu`.
2. Framework preset: **Other**. Build command kosong, output directory `.`
3. Setiap push ke `main` otomatis ter-deploy.

## Langkah berikutnya (Claude Code)

Pecah `index.html` menjadi komponen (rencana: Astro + Tailwind), siapkan konten untuk CMS, dan optimasi gambar (AVIF/WebP).
