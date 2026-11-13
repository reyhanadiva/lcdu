# LCDU Landing Page

Prototipe landing page LCDU (kelas Bahasa Inggris & Arab, Yayasan Taqwa Cerdas Kreatif).
Situs statis tanpa build step: `index.html`, modul hero di `hero/`, Lenis (MIT) di `vendor/lenis/`. Bisa langsung di-deploy ke Vercel.

Hero 3D (Kubah & Qibli, three.js) **diarsipkan** di [reyhanadiva/lcdu-3d](https://github.com/reyhanadiva/lcdu-3d) dan tidak lagi ada di repo ini.

## Konsep: "Dua Aksara"

Inggris ditulis kiri ke kanan, Arab kanan ke kiri. Seluruh halaman bermain di antara dua arah itu.

- **Biru (Lazuardi)** = Bahasa Inggris
- **Hijau (Zamrud)** = Bahasa Arab
- **Kuning (Kunyit)** = aksi utama (daftar, Placement Test)
- Font (di-host sendiri, lihat `fonts/`): Fraunces (judul), Plus Jakarta Sans (teks), Reem Kufi & Noto Naskh Arabic (Arab)

## Section

| Section | Interaksi |
|---|---|
| Hero | Cerita scroll 3 babak (tinggi 190vh, 13vh terakhir "tahan fajar"): malam → lampu menyala dari Kubah ke luar → fajar. Hero **Foto**: foto malam/fajar dari ChatGPT, cahaya di jendela, lentera, dan tiang lampu. Geser kencang tetap berakhir di fajar penuh. Kode di folder `hero/`. Tepi bawah: motif keffiyeh × semangka. |
| Pengantar | Tiga fragmen tipografi "Belajar Bahasa Arab dan Inggris. Online. Nirlaba." yang menyala kata per kata, foto lengkung Al-Aqsa. |
| Kenapa LCDU | Blok hijau, foto lengkung berganti mengikuti pernyataan (desktop); di HP tiap pernyataan = slide geser. |
| Biaya | Blok merah: "Tanpa biaya bulanan." + struk (biaya bulanan Rp0, donasi Palestina tidak wajib, total Rp100.000 per term/semester) yang tercetak keluar dari printer mengikuti scroll. "Rp100.000" hanya muncul di total struk. |
| Kelas | Layar terbelah Inggris \| Arab; garis pembagi bisa ditarik (desktop). HP < 700px: dua slide geser (Inggris, Arab) dengan penanda teks "Inggris \| Arab". |
| Cara bergabung | Syarat satu kalimat (empat hal), kartu Placement Test dengan tombol per bahasa (status & tautan di `site-config.js` → `placement.en` / `placement.ar`; sekarang keduanya tutup sementara → "Tanya admin lewat WhatsApp"), "Daftar dalam 6 langkah" sebagai tali lentera kiri→kanan. |
| Testimoni | Semua cerita terlihat: potret lengkung + kutipan besar (desktop asimetris; HP slide geser), penutup "Cerita berikutnya bisa datang dari kamu." Data di array `CERITA` (index.html); potret asli lewat `node tools/build-photos.mjs --potret <folder> stories`. |
| Tim | Rak buku kaca: tiga rak (Pengelola, Guru Bahasa Inggris, Guru Bahasa Arab), satu orang = satu buku. Disorot/difokus/diketuk → buku keluar & menampilkan sampul (penampung foto, nama, peran, sertifikasi di karabiner); panel rincian teks di bawah rak. HP: satu rak per slide geser. Data di array `TEAM`; foto tim opsional lewat `node tools/build-photos.mjs --potret <folder> team`. |
| FAQ | "Yang sering ditanyakan": 9 pertanyaan dari fakta yang sudah ada (array `FAQ` di index.html + JSON-LD dari array yang sama), kotak cari dengan sorotan, topik, tautan langsung `#faq-<id>`. |
| Donasi untuk Palestina | Alur empat lentera (Donatur → Rekening Yayasan → disalurkan melalui AWG → untuk Palestina), potongan QS. Al-Baqarah: 261, lembar setoran (salin nomor, konfirmasi transfer via WhatsApp). `donasi.siapTayang: false` di `site-config.js` menyembunyikan rekening. |
| Footer | Langit malam Al-Aqsa (foto hero yang sama) dengan sembilan lentera, "Bahasa untuk umat.", kosakata hari ini, tautan, logo resmi besar, pita keffiyeh. Instagram, alamat & mitra hanya tampil bila diisi di `site-config.js`. |

Semua animasi menghormati `prefers-reduced-motion`. Kursor kustom hanya aktif di perangkat dengan mouse.

## Gambar hero (hero Foto)

- Sumber: `assets/hero/night-tall.png` & `dawn-tall.png` (1024×1536, sejajar, lulus `tools/check-align.py`).
  Pasangan wide: `night-wide-v2.png` + `dawn-wide.png` (1536×1024, lulus; 0 px, korelasi 0,61). `night-wide.png` lama
  tidak sejajar dan tidak dipakai.
- Turunan web di `assets/hero/build/` (AVIF → WebP → JPG; tall 750 & 1024, wide 1280 & 1536), dibuat ulang dengan
  `python3 tools/build-hero-images.py`. Lihat `tools/README.md`.
- Titik cahaya: `hero/spots.json`, atur di browser dengan `?edit-spots` lalu "Salin JSON".

## Hero 3D (diarsipkan)

Model Kubah & Qibli (TRELLIS.2 dari gambar ChatGPT), sprite, tekstur, `hero/diorama.js`, three.js, GSAP, dan alat
`optimize-models.mjs` / `prep-model-textures.py` / `make-extras.py` dipindahkan ke
[reyhanadiva/lcdu-3d](https://github.com/reyhanadiva/lcdu-3d) (snapshot commit `b6e428e`). Catatan sumber aset ada di sana.

## Foto stok (SEMENTARA — ganti dengan foto asli)

- 7 foto Pexels (Pexels License, gratis komersial) di `assets/photos/`: menulis, kelas online, Al-Qur'an di rehal,
  kaligrafi, kebun zaitun, Al-Aqsa dari jauh, keffiyeh. Sumber, fotografer, lisensi & tanggal unduh di
  `assets/photos/CREDITS.md`. **Semuanya sementara, ganti dengan foto asli LCDU.**
- Turunan AVIF + WebP (480 / 960 / 1600, tidak diperbesar) dibuat dengan `node tools/build-photos.mjs <folder-jpg>`.

## Ornamen (keffiyeh & semangka)

- SVG di `assets/ornaments/`, dibuat ulang dengan `node tools/make-ornaments.mjs`. Pola satu warna = masker CSS
  (warnanya dari token); versi `-hitam/-merah/-hijau` = siap pakai untuk desainer. Kelas & aturan di CLAUDE.md.

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

- [ ] **Foto**: slot foto kelas, foto tim (15), foto testimoni. Saat ini penampung lengkung berwarna + inisial. Foto testimoni/tim HANYA foto asli pemiliknya (bukan foto stok).
- [ ] **Izin tertulis** dari setiap penulis testimoni untuk **foto dan kutipan** yang ditampilkan, dan dari anggota tim untuk fotonya.
- [ ] **Persetujuan orang tua/wali** untuk siswa yang berusia **di bawah 18 tahun** (sebagian siswa 16–17 tahun). Mohon konfirmasi prosedurnya dengan Yayasan.
- [ ] **Foto stok sementara** di `assets/photos/` (lihat `CREDITS.md`): ganti dengan foto asli LCDU. Isi tulisan foto kaligrafi perlu dicek guru Arab.
- [ ] **Ketentuan penggunaan gambar ChatGPT** untuk keperluan lembaga (gambar hero Foto; juga aset hero 3D di arsip `lcdu-3d`) — perlu diverifikasi.
- [ ] **Link formulir registrasi** (belum ada di halaman). Placement Test & WhatsApp admin sudah di `site-config.js`; nomor WhatsApp 0819-6009-333 perlu diverifikasi.
- [ ] **PERLU VERIFIKASI — Jadwal kelas** (section Pilih kelas): Inggris Senin & Rabu, Arab Selasa & Kamis, 16.00–17.30 WIB; Weekend Sabtu 13.00–16.00 WIB (keduanya).
- [ ] **PERLU VERIFIKASI — Arti "term"**: halaman menulis "per term (semester)" (1 term = 1 semester; struk Biaya, total Rp100.000). Pastikan sesuai kebijakan LCDU.
- [ ] **PERLU VERIFIKASI — Nomor WhatsApp admin** 0819-6009-333 (diambil dari lcdu.org; ada di `site-config.js`).
- [ ] **PERLU VERIFIKASI — Foto stok sementara** di `assets/photos/` (Pengantar, Kenapa, Pilih kelas): ganti dengan foto asli LCDU; daftar & lisensi di `CREDITS.md`.
- [ ] **Ejaan nama 5 guru di baris terakhir** (dibaca dari screenshot resolusi rendah): Alexandria Cempaka Harum, Ridha Fadilah, Astria Muzdalifah, Taara Dewiana Kania, Muhammad Edwar Kartakusuma.
- [ ] **Nama yayasan** di rekening: situs lama menulis "Yayasan Cerdas Taqwa Kreatif", nama resmi "Yayasan Taqwa Cerdas Kreatif". Pastikan sesuai buku rekening.
- [ ] **Nomor rekening** Bank Muamalat 10.10.11.83.94 (tombol salin menyalin `1010118394`, tanpa titik). **Pastikan format salin tanpa titik ini benar** untuk transfer.
- [ ] **Tujuan donasi**: situs lama mencampur "Donasi LCDU" dan "Donasi untuk Palestina" di satu rekening. Perlu dipisah/diperjelas.
- [ ] **Teks ayat** QS. Al-Baqarah: 261 (potongan awal) dan QS. Al-Isra: 1 (potongan) — cek di quran.kemenag.go.id.
- [ ] **Soal kuis** dan kunci jawaban — minta guru Inggris & Arab mengecek ulang.

## Menunggu dari pemilik

Data di bawah ini **sengaja tidak ditampilkan** di halaman sampai pemilik memberikannya (tidak ada penampung kosong).

**Nama lengkap LCDU**
- [ ] **Ejaan resmi kepanjangan**: halaman memakai "Language Course for Da'wah dan Ummah" (`lcdu.namaLengkap` di
  `site-config.js`, juga `<title>` dan meta description). Situs-situs saudara berbeda ("dan" / "&"; teks pembaca layar di
  hero masih "&"). Tentukan SATU ejaan, lalu samakan di semua tempat.

**Pertanyaan FAQ yang belum punya jawaban resmi** (tambahkan ke array `FAQ` di `index.html` setelah dijawab):
- [ ] Apakah ada sertifikat setelah menyelesaikan kelas?
- [ ] Apakah kelas direkam / ada rekaman kelas?
- [ ] Berapa lama satu term dalam bulan?
- [ ] Apa saja level yang tersedia (daftar level)?
- [ ] Metode pembayaran apa saja (selain yang tertulis)?
- [ ] Bagaimana kebijakan bila siswa tidak melanjutkan / berhenti di tengah term?

**Donasi**
- [ ] **Laporan penyaluran dari AWG**: tautan/ringkasan laporan hanya ditambahkan bila ada laporan nyata dari AWG. Tidak ada angka dampak di halaman.
- [ ] **Terjemah resmi** potongan QS. Al-Baqarah: 261 dari quran.kemenag.go.id → tempel ke `donasi.terjemahAyat` di `site-config.js` (kosong = tidak tampil). Verifikasi juga teks Arabnya.
- [ ] **Format nomor rekening** saat disalin (sekarang angka tanpa titik: `1010118394`).
- [ ] **Izin penghimpunan donasi (PUB) dan nama pemilik rekening** — konfirmasi Yayasan. Bila belum, ubah `donasi.siapTayang` ke `false` di `site-config.js` (rekening disembunyikan, diganti "Donasi akan segera dibuka. Hubungi admin").
- [ ] **Logo/izin AWG**: logo AWG tidak dipasang tanpa izin tertulis.

**Footer**
- [ ] **Instagram** → `kontak.instagram` (URL lengkap) di `site-config.js`.
- [ ] **Alamat sekretariat** → `kontak.alamat`.
- [ ] **Logo mitra** (dengan izin) → `mitra: [{ nama, url, logo }]`; kosong = baris mitra tersembunyi.

## Deploy

1. Vercel → Add New → Project → Import `reyhanadiva/lcdu`.
2. Framework preset: **Other**. Build command kosong, output directory `.`
3. Setiap push ke `main` otomatis ter-deploy.

## Langkah berikutnya (Claude Code)

Pecah `index.html` menjadi komponen (rencana: Astro + Tailwind), siapkan konten untuk CMS, dan optimasi gambar (AVIF/WebP).
