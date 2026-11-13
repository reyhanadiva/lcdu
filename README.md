# LCDU Landing Page

Landing page **LCDU (Language Course for Da'wah dan Ummah)**: kelas Bahasa Arab & Inggris online, nirlaba, di bawah
Yayasan Taqwa Cerdas Kreatif (Alfa Centauri Schools, Bandung). Tujuan halaman: pendaftaran siswa dan donasi untuk Palestina.

Situs **statis tanpa build step**: satu `index.html` (CSS & JS inline), modul hero di `hero/`, data yang sering berubah di
`site-config.js`, Lenis (MIT) di `vendor/lenis/`. Deploy otomatis ke Vercel dari branch `main`.
Hero 3D lama **diarsipkan** di [reyhanadiva/lcdu-3d](https://github.com/reyhanadiva/lcdu-3d).

> Dokumen ini = serah terima untuk tim IT. Keputusan desain, aturan, dan alasannya ada di `CLAUDE.md` (baca dulu sebelum
> mengubah tampilan). Bagian **"Menunggu dari pemilik"** di bawah = data yang belum ada dan sengaja tidak ditampilkan.

## Menjalankan lokal

```bash
python3 -m http.server 8000
```

Buka `http://localhost:8000/`. Modul ES butuh server (bukan `file://`). Saat mengembangkan, matikan cache browser
(atau pakai server tanpa cache) karena modul ES lama sering tersimpan. Alat pengembang: `?edit-spots` (titik cahaya hero).

## Peta struktur

| Path | Isi |
|---|---|
| `index.html` | Seluruh halaman: `<head>` (meta, preload font), CSS inline (token di `:root` paling atas, lalu per section), markup, dan skrip inline (satu IIFE + modul Lenis). Data konten di array JS `CERITA` (testimoni), `TEAM` (tim), `FAQ` (FAQ + JSON-LD). |
| `site-config.js` | **Satu tempat** untuk data yang berubah (lihat tabel kunci di bawah). HTML memakai `data-cfg-href`, `data-cfg-text`, `data-wa`; teks di HTML = cadangan. |
| `hero/hero.js` | Pengendali hero: scroll → progres `p`, teks tiga babak, pegas + pemandu supaya fajar selalu tercapai. |
| `hero/lentera-hd.js`, `hero/spots.json` | Hero Foto (kanvas: foto malam/fajar + titik cahaya). |
| `assets/hero/` | Foto hero sumber + turunan web di `build/` (AVIF/WebP/JPG + `manifest.json`). |
| `assets/photos/` | Foto stok SEMENTARA (Pexels) + `CREDITS.md`. |
| `assets/stories/`, `assets/team/` | Potret ASLI testimoni/tim (sekarang kosong; `manifest.json` = daftar slug yang tersedia). |
| `assets/brand/` | Logo resmi (PNG) + turunan web. |
| `assets/ornaments/` | SVG ornamen keffiyeh & semangka (masker CSS). |
| `fonts/` | woff2 di-host sendiri: Fraunces, Plus Jakarta Sans, Reem Kufi, Noto Naskh Arabic. |
| `vendor/lenis/` | Scroll halus (MIT). |
| `tools/` | Skrip aset (Python & Node), lihat `tools/README.md`. Tidak ikut ke situs. |
| `ornamen-test.html` | Halaman uji ornamen SEMENTARA untuk persetujuan pemilik — boleh dihapus bila tidak dibutuhkan. |
| `CLAUDE.md` | Konteks desain, keputusan terkunci, aturan kualitas. |

## Kunci `site-config.js`

| Kunci | Arti |
|---|---|
| `lcdu.namaLengkap` | Kepanjangan LCDU (Pengantar & footer). Ejaan resmi menunggu pemilik. |
| `placement.en` / `placement.ar` → `open`, `url`, `urlSoal` | Status Placement Test per bahasa. `open: true` → tombol "Mulai tes …" ke `url` (halaman awal tes). Keduanya `false` → kalimat tutup + "Tanya admin lewat WhatsApp". `urlSoal` disimpan, tidak dipakai. |
| `whatsappAdmin.nomor` / `.tampil` / `.pesan.umum\|placement\|konfirmasi` | Nomor untuk `wa.me` (tanpa "+"), versi tampilan (belum dipakai di teks), pesan awal per tombol (`data-wa="…"`). |
| `yayasan.nama` / `.url` | Nama & tautan Yayasan (Pengantar, footer, FAQ). |
| `donasi.mitra` / `.url` | Nama & situs AWG. |
| `donasi.siapTayang` | `false` → lembar rekening disembunyikan, diganti "Donasi akan segera dibuka. Hubungi admin". |
| `donasi.logo` | Path logo AWG (kosong = tidak tampil; perlu izin AWG). |
| `rekening.bank` / `.nomor` / `.atasNama` | Rekening donasi. Tombol salin menyalin angka tanpa titik. |
| `kontak.email` / `.instagram` / `.alamat` | Kontak footer; kosong = tidak tampil. |
| `jaringan[]` (`nama`, `url`) | Jaringan pendidikan di footer; hanya entri ber-URL yang tampil. |
| `mitra[]` (`nama`, `url`, `logo`) | Baris mitra di footer; kosong = tersembunyi. |

Data di `index.html` (bukan config): `CERITA` (nama, kelas, kutipan, foto, bahasa), `TEAM` (nama, peran, kelompok,
sertifikasi), `FAQ` (id, topik, tanya, jawab). Untuk CMS kelak: pertahankan bentuk objek ini.

## Section

| Section | Interaksi |
|---|---|
| Hero | Cerita scroll 3 babak (tinggi 190vh, 13vh terakhir "tahan fajar"): malam → lampu menyala dari Kubah ke luar → fajar. Hero **Foto**: foto malam/fajar dari ChatGPT, cahaya di jendela, lentera, dan tiang lampu. Geser kencang tetap berakhir di fajar penuh. Kode di folder `hero/`. Tepi bawah: motif keffiyeh × semangka. |
| Pengantar | Tiga fragmen tipografi "Belajar Bahasa Arab dan Inggris. Online. Nirlaba." yang menyala kata per kata, foto lengkung Al-Aqsa. |
| Kenapa LCDU | Blok hijau, foto lengkung berganti mengikuti pernyataan (desktop); di HP tiap pernyataan = slide geser. |
| Biaya | Blok merah: "Tanpa biaya bulanan." + struk (biaya bulanan Rp0, donasi Palestina tidak wajib, total Rp100.000 per term/semester) yang tercetak keluar dari printer mengikuti scroll. "Rp100.000" hanya muncul di total struk. |
| Kelas | Layar terbelah Inggris \| Arab; garis pembagi bisa ditarik (desktop). HP < 700px: dua slide geser (Inggris, Arab) dengan penanda teks "Inggris \| Arab". |
| Cara bergabung | Syarat satu kalimat (empat hal), kartu Placement Test dengan tombol per bahasa (status & tautan di `site-config.js` → `placement.en` / `placement.ar`; sekarang keduanya tutup sementara → "Tanya admin lewat WhatsApp"), "Daftar dalam 6 langkah" sebagai tali lentera kiri→kanan. |
| Testimoni | "Rak cerita": satu rak kaca, satu buku per testimoni + buku kosong "Ceritamu"; buku terpilih (bawaan: pertama) menampilkan sampul (potret lengkung/penampung, nama, gantungan kelas) dan kutipannya di panel. Data di array `CERITA` (index.html); potret asli lewat `node tools/build-photos.mjs --potret <folder> stories`. |
| Tim | Daftar nama editorial tiga kelompok (Pengelola, Guru Bahasa Inggris, Guru Bahasa Arab + kata مُعَلِّم kecil), peran & sertifikasi sebaris. HP: satu kelompok per slide geser. Data di array `TEAM`; foto kecil hanya bila ada lewat `node tools/build-photos.mjs --potret <folder> team`. |
| FAQ | "Yang sering ditanyakan": 9 pertanyaan dari fakta yang sudah ada (array `FAQ` di index.html + JSON-LD dari array yang sama), kotak cari dengan sorotan, topik, tautan langsung `#faq-<id>`. |
| Donasi untuk Palestina | Kalimat pembuka, panel AWG besar (foto ilustrasi kebun zaitun + fakta dari aqsaworkinggroup.com + "Kunjungi situs AWG"), alur empat lentera (Donatur → Rekening Yayasan → disalurkan melalui AWG → untuk Palestina), lembar setoran (salin nomor, konfirmasi transfer via WhatsApp). `donasi.siapTayang: false` di `site-config.js` menyembunyikan rekening. |
| Footer | Langit malam Al-Aqsa (foto hero yang sama) + sembilan lentera + "Bahasa untuk umat.", lalu empat kolom gaya situs saudara: Identitas (logo kecil, kepanjangan, deskripsi, "For a Better Ummah"), Jelajahi, Hubungi kami (WhatsApp; email/Instagram/alamat bila diisi), Jaringan pendidikan (`jaringan[]`, hanya yang ber-URL); garis + baris legal; pita keffiyeh. |

Semua gerak menghormati `prefers-reduced-motion` (diuji: tanpa kelas `.gerak` & tanpa Lenis). Tidak ada scroll horizontal
halaman di 360/390px; geser horizontal hanya di dalam komponen `.geser` (keputusan pemilik).

## Kualitas (pemeriksaan akhir, 13 Nov 2026)

- **Lighthouse** (lokal, `python3 -m http.server` tanpa kompresi & tanpa cache — Vercel biasanya lebih baik):
  - Mobile (emulasi HP kelas menengah, CPU 4×): Performance **80 / 97 / 98** (tiga kali, median 97; awal audit 69),
    Accessibility **100**, Best Practices **100**, SEO **100**. LCP ±1,8 s, CLS 0. Penyebab skor turun-naik: Total Blocking
    Time 30–810 ms dari skrip saat muat (skrip inline utama, hero kanvas `lentera-hd.js`, inisialisasi Lenis).
  - Desktop: **100 / 100 / 100 / 100**.
- Tautan: 28 anchor internal valid; 5 tautan eksternal hidup (Yayasan 200, Placement EN/AR 200, AWG 200 tetapi lambat
  ±19 s, wa.me 302 → api.whatsapp.com); semua tautan keluar `target=_blank` + `rel=noopener`.
- Sisa kerangka ("stub", "menyusul", `href="#"`, "Logo mitra", "Lorem", `console.log`): **0**.
- Fakta: "Rp100.000" hanya di total struk Biaya & jawaban FAQ biaya; "Rp0" hanya di struk; tidak ada "gratis", "sudah
  termasuk seluruh biaya belajar", "tanpa biaya tambahan"; jadwal, nomor WhatsApp, rekening konsisten dengan config.

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

## Foto stok & kredit (SEMENTARA — ganti dengan foto asli)

- Foto Pexels (Pexels License, gratis komersial) di `assets/photos/`: menulis, kelas online, Al-Qur'an di rehal,
  kaligrafi, kebun zaitun (juga latar panel AWG, berketerangan "Foto ilustrasi"), Al-Aqsa dari jauh, keffiyeh, guru di
  papan tulis. Sumber, fotografer, lisensi & tanggal di **`assets/photos/CREDITS.md`**.
- Turunan AVIF + WebP (480 / 960 / 1600, tidak diperbesar): `node tools/build-photos.mjs <folder-jpg>`.
- Potret ASLI testimoni/tim (hanya yang sudah disetujui): `node tools/build-photos.mjs --potret <folder-jpg> stories|team`
  → 4:5, ≤ 60 KB, `manifest.json`. **Dilarang foto stok sebagai wajah siswa/guru.**
- Gambar hero dibuat dengan ChatGPT (lihat "Menunggu dari pemilik": ketentuan penggunaan).

## Ornamen (keffiyeh & semangka)

- SVG di `assets/ornaments/`, dibuat ulang dengan `node tools/make-ornaments.mjs`. Pola satu warna = masker CSS
  (warnanya dari token); versi `-hitam/-merah/-hijau` = siap pakai untuk desainer. Kelas & aturan di CLAUDE.md.

## Logo

- Sumber: `assets/brand/lcdu-logo-wide.png` (PNG resmi, latar sudah transparan, 4461×1767) dan `lcdu-logo-square.png`
  (latar abu-abu, resolusi rendah, tidak dipakai di situs).
- Turunan untuk web di `assets/brand/web/` dibuat dengan **memotong dan memperkecil** PNG resmi, bentuk, proporsi, dan
  huruf tidak diubah. Tidak ada tracing ke SVG.
  - `lcdu-logo-color.png` / `lcdu-logo-white.png`: logo lengkap + tagline "For a Better Ummah" (cadangan, tidak dipakai halaman).
  - `lcdu-lockup-color.png` / `lcdu-lockup-white.png` (720×240) dan turunan `-360.png` (360×120, dipakai halaman):
    ikon "d" + LCDU + garis, tanpa tagline (navbar, hero, footer).
  - Versi putih = semua piksel logo diwarnai putih, kanal transparansi asli dipertahankan.
  - Favicon (`/favicon.ico`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) dari ikon "d".
- Warna logo (diukur dari PNG): biru `#1724C0`, hijau `#7FA33F`, teks tagline `#332C2B`.
- Berkas vektor resmi (SVG/AI/PDF) belum ada — lihat "Menunggu dari pemilik".

## Menunggu dari pemilik

Diurutkan menurut prioritas. Data di bawah **sengaja tidak ditampilkan** sampai diberikan (tidak ada penampung kosong).

**1. Izin & risiko (sebelum rilis publik)**
- [ ] **Izin penghimpunan donasi (PUB) dan nama pemilik rekening** — konfirmasi Yayasan. Bila belum, set
  `donasi.siapTayang: false`. Situs lama menulis "Yayasan Cerdas Taqwa Kreatif"; nama resmi "Yayasan Taqwa Cerdas
  Kreatif" — samakan dengan buku rekening. Situs lama juga mencampur "Donasi LCDU" & "Donasi untuk Palestina" di satu
  rekening: pastikan rekening ini memang untuk donasi Palestina (AWG).
- [ ] **Izin tertulis** setiap penulis testimoni untuk **foto dan kutipan**, dan anggota tim untuk fotonya.
- [ ] **Persetujuan orang tua/wali** untuk siswa **di bawah 18 tahun** (sebagian 16–17 tahun) — prosedur dari Yayasan.
- [ ] **Logo & foto resmi AWG beserta izin tertulis** → `donasi.logo`. Sekarang: foto stok ilustrasi, tanpa logo.
- [ ] **Ketentuan penggunaan gambar ChatGPT** untuk keperluan lembaga (gambar hero; aset 3D di arsip).

**2. Verifikasi fakta yang sudah tampil**
- [ ] **Jadwal kelas**: Inggris Senin & Rabu, Arab Selasa & Kamis, 16.00–17.30 WIB; weekend Sabtu 13.00–16.00 WIB (keduanya).
- [ ] **Arti "term"**: halaman menulis "per term (semester)", Rp100.000.
- [ ] **Nomor WhatsApp admin** 0819-6009-333 (dari lcdu.org).
- [ ] **Format nomor rekening** saat disalin (angka tanpa titik: `1010118394`).
- [ ] **Ejaan 5 nama guru** (dibaca dari screenshot resolusi rendah): Alexandria Cempaka Harum, Ridha Fadilah, Astria
  Muzdalifah, Taara Dewiana Kania, Muhammad Edwar Kartakusuma.
- [ ] **Ejaan resmi kepanjangan**: "Language Course for Da'wah dan Ummah" (`lcdu.namaLengkap`, `<title>`, meta) vs "&"
  (situs saudara; teks pembaca layar hero). Pilih SATU, samakan di semua tempat.
- [ ] **Isi tulisan foto kaligrafi** (stok) dicek guru Arab.

**3. Data yang belum ada**
- [ ] **Jawaban FAQ resmi** (lalu tambahkan ke array `FAQ`): sertifikat? rekaman kelas? lama satu term dalam bulan? daftar
  level? metode pembayaran? kebijakan bila berhenti di tengah term?
- [ ] **Bahasa kelas Fitriza Rahma** (Siswa Elementary): isi `bahasa` di `CERITA` (untuk pembatas buku berwarna).
- [ ] **Link formulir registrasi** (langkah 4 belum bertaut).
- [ ] **Kontak footer**: `kontak.email`, `kontak.instagram` (URL lengkap), `kontak.alamat` (opsional, kelas online).
- [ ] **URL jaringan pendidikan** (`jaringan[]`): SD Alfa Centauri, SMP Alfa Centauri, SMA Alfa Centauri, TK Alfa Centauri,
  English Now. (Yayasan sudah.)
- [ ] **Logo mitra** (dengan izin) → `mitra[]`.
- [ ] **Laporan penyaluran dari AWG** — hanya ditautkan bila ada laporan nyata; tidak ada angka dampak di halaman.

**4. Aset**
- [ ] **Foto asli LCDU** pengganti foto stok (Pengantar, Kenapa, Pilih kelas, panel AWG) dan **potret asli** testimoni/tim.
- [ ] **Berkas vektor logo** resmi (SVG/AI/PDF) dari pembuat logo.

## Ditunda

- **Ayat QS. Al-Baqarah: 261** (potongan awal) dihapus dari Donasi (sesi F). Dipertimbangkan lagi setelah teks Arab &
  terjemah resmi diverifikasi di quran.kemenag.go.id.

## Deploy

1. Vercel → Add New → Project → Import `reyhanadiva/lcdu`.
2. Framework preset: **Other**. Build command kosong, output directory `.`
3. Setiap push ke `main` otomatis ter-deploy.

## Rekomendasi untuk tim IT (belum dikerjakan)

- **Astro** (output statis, tetap bisa di Vercel): pecah `index.html` per section menjadi komponen (`Hero`, `Pengantar`,
  `Kenapa`, `PilihKelas`, `Biaya`, `CaraBergabung`, `Testimoni`, `Tim`, `Faq`, `Donasi`, `Footer`) + komponen bersama
  (`Geser`, `RakBuku`, `Kufiyah`, `Lentera`). Pindahkan `CERITA`/`TEAM`/`FAQ` dan `site-config.js` ke content collections
  (atau CMS) dengan bentuk objek yang sama; render HTML di build time supaya konten tampil tanpa JS & JS saat muat berkurang
  (TBT mobile turun). JSON-LD FAQ juga dibuat saat build.
- CSS per komponen dengan token yang sama (`:root`); minify CSS/JS (Lighthouse: ±29 KB + 38 KB), hapus CSS tak terpakai.
- Pertahankan aturan di `CLAUDE.md`: animasi hanya transform/opacity/clip-path, reduced-motion, tanpa scroll horizontal,
  `.geser` native, fakta hanya dari pemilik.
- Gambar: pakai `<Image>`/`<Picture>` Astro atau tetap `tools/build-photos.mjs`; jangan memperbesar melampaui resolusi asli.
