# LCDU landing page — konteks untuk Claude Code

## Proyek
Landing page marketing LCDU (**Language Course for Da'wah and Ummah**): kelas Bahasa Arab & Inggris online (usia 16+),
untuk dakwah dan umat, nirlaba, di bawah
Yayasan Taqwa Cerdas Kreatif (Alfa Centauri Schools, Bandung). Tujuan halaman: pendaftaran siswa dan donasi.
Pemilik: Bapak Reyhan (non-developer, berpikir sebagai desainer). Kode akhirnya diserahkan ke tim IT sekolah.

- Repo: `reyhanadiva/lcdu`, branch `main` → deploy otomatis ke Vercel (situs statis, tanpa build step).
- Komunikasi dengan pemilik: Bahasa Indonesia, sapa "Bapak". Setiap akhir jawaban, beri 1–2 kosakata/grammar
  bahasa Inggris level C1–C2 dengan contoh kalimat (permintaan pribadi pemilik).
- Jangan kirim screenshot ke pemilik kecuali diminta; ia mengecek sendiri di Vercel.

## Menjalankan lokal
Situs statis. Modul ES butuh server (bukan `file://`):
`python3 -m http.server 8000` atau `npx serve .` → buka `http://localhost:8000/`.
Saat mengembangkan, pakai server tanpa cache (browser menyimpan modul ES lama); jika masih basi, buka lewat `127.0.0.1`.

## Struktur
- `index.html` — seluruh halaman (CSS & JS section non-hero inline). Token warna/font di `:root` paling atas.
- `hero/hero.js` — pengendali hero: scroll → progres `p` (0..1), kursor, teks per babak; langsung memuat hero Foto
  (tanpa pemuat varian, tanpa `?hero=`, tanpa tombol pembanding — sejak sesi "Hero Foto saja").
  Visual = modul `export default { mount(container, state) → { frame(state, now), resize(), destroy() } }`.
- `hero/lentera-hd.js` — hero **Foto** (satu-satunya hero; nama berkas tetap `lentera-hd`): foto malam/fajar dari
  ChatGPT (`assets/hero/build/`, dari `tools/build-hero-images.py`), pasangan tall & wide sudah lulus `check-align.py`,
  titik cahaya di `hero/spots.json` (editor: `?edit-spots`; titik awal dari `tools/gen-spots.py`). Teks ditaruh di langit
  (`data-text="top"` statis di `<section class="hero">`).
  Cahaya babak 2 harus **masuk akal** (keputusan pemilik): hanya di sumber nyata — jendela/pintu (w), lentera arkade (a),
  tiang lampu/lentera tembok (l), lentera di tanah (g), lampu kota jauh (c) — dengan genangan cahaya di tanah, menyala
  bergelombang dari Kubah ke luar. Jangan kembali ke titik acak yang melayang.
  `supports()` → false bila aset orientasi layar belum ada.
- **Hero 3D diarsipkan** (keputusan pemilik) di https://github.com/reyhanadiva/lcdu-3d (snapshot utuh dari commit
  `b6e428e`, jalan sendiri: `/?hero=diorama`). Dihapus dari repo ini: `hero/diorama.js`, `hero/lights3d.json`,
  `assets/models/` (glb, sumber, extras), `vendor/three/` + importmap, `vendor/gsap/` (hanya dipakai 3D),
  `tools/optimize-models.mjs`, `tools/prep-model-textures.py`, `tools/make-extras.py`, dependensi gltf-transform &
  meshoptimizer. Hero kanvas lama (`lentera.js`, `scene2d.js`) dan "Mozaik" juga sudah lama dihapus.
- `tools/` — skrip Python (numpy, Pillow): `check-align.py`, `build-hero-images.py`, `gen-spots.py`;
  Node (`npm install` di `tools/`, hanya `sharp`): `build-photos.mjs`, `make-ornaments.mjs`. Lihat `tools/README.md`.
- iOS 26 Safari: elemen `position:fixed` yang menempel di tepi layar membuat Safari mengisi area status bar/toolbar dengan
  blok warna solid. Jangan pasang strip fixed di `safe-area-inset-top`.
- `vendor/lenis/` — scroll halus seluruh halaman (mati saat reduced-motion). Klik anchor ditangani sendiri di `index.html`
  supaya `scroll-margin-top` dihormati.
- `site-config.js` — **satu tempat** untuk data yang berubah: status Placement Test **per bahasa** (`placement.en.open`,
  `placement.ar.open`; `false` → "Tanya admin lewat WhatsApp" + kalimat ditutup sementara; `url` = halaman awal tes `-rule`), tautan tes & aturan Inggris/Arab, WhatsApp admin + pesan awal per tombol,
  AWG, rekening, tautan Yayasan (`yayasan.url` → https://alfacentauri.sch.id/yayasan/, dipakai `.tautan-yayasan` di
  Pengantar & footer; nama aksesibel "… (buka di tab baru)"; nama di rekening Donasi tetap teks biasa). HTML memakai `data-cfg-href`, `data-cfg-text`, `data-wa="umum|placement|konfirmasi"`; teks di HTML =
  cadangan. Tim IT bisa menggantinya dengan CMS (pertahankan bentuk objek).

### Sistem bersama setelah hero (fondasi, sesi "seluruh halaman setelah hero")
- **Satu hari belajar**: `<div class="hari" id="hari">` membungkus semua section setelah hero; di dalamnya
  `<div class="fase" data-fase="pagi|siang|sore|senja|malam">`. Tiap `[data-fase]` menimpa token `--paper --surface --ink
  --ink-soft --line --lazuardi-ink --zamrud-ink`, jadi komponen ikut berubah. Token latar: `--pagi-bg` dst. di `:root`.
  Fase tidak ikut mode gelap sistem (logo navbar/footer ikut fase). Navbar & benang membaca fase aktif lewat JS.
  Sambungan = gradasi smoothstep (OKLab) di padding atas fase berikutnya (`--sambung`, malam `--sambung-malam`); teks pertama
  mulai setelah gradasi. Alasannya: di titik tengah senja → malam tidak ada tinta yang cukup kontras untuk keduanya
  (terang → hampir hitam), jadi teks **tidak boleh** berada di atas gradasi. Karena itu latar tidak memakai lapisan fixed yang berubah.
  Sejak palet semangka-keffiyeh, fase **sangat halus** (semua putih hangat dengan rona tipis); warna kuat datang dari
  blok warna per section (sesi berikutnya). Malam tetap gelap: hampir hitam keffiyeh yang hangat. Kontras (WCAG, dihitung):

  | Fase | Latar | Tinta | Teks | Teks lembut | Biru | Hijau (Arab) | Merah tua | Teks di kartu |
  |---|---|---|---|---|---|---|---|---|
  | pagi | #FDF8F1 | #10163A | 16,6 | 7,7 (#4B4F63) | 9,7 | 6,2 (#1E6B3A) | 6,3 | 17,5 / 8,1 |
  | siang | #FAFAF7 | #10163A | 16,8 | 7,7 | 9,8 | 6,2 | 6,3 | 17,5 / 8,1 |
  | sore | #FCF5EA | #10163A | 16,2 | 7,5 | 9,5 | 6,0 | 6,1 | 17,5 / 8,1 |
  | senja | #FAF3F1 | #10163A | 16,0 | 7,4 | 9,3 | 5,9 | 6,1 | 17,5 / 8,1 |
  | malam | #14120F | #F3EFE8 | 16,3 | 8,9 (#B9B2A6) | 7,0 (#8F97F3) | 6,4 (#7FA33F) | 7,4 (#FF7A82) | 15,1 / 8,2 |

  Blok warna (teks di atas isi): putih/merah tua `#B3202E` 6,6 · putih/hijau kulit `#1E6B3A` 6,5 · putih/biru 10,2 ·
  putih/hitam 18,9 · kunyit/hitam 11,7 · tinta kunyit/kunyit 10,1. **Gagal untuk teks biasa** (hanya dekor atau judul
  ≥ 24px tebal): putih/merah terang `#E23B4A` 4,2 · hijau logo `#7FA33F` di latar terang 2,8 · putih/hijau logo 2,9 ·
  kunyit/merah tua 4,1. Kata redup Pengantar (≥ 3:1): tinta 3,6 · biru 3,5 · Arab 3,7.
- **Geser `.geser`** (komponen dipakai ulang; kelak Testimoni & Tim): `<div class="geser" data-geser="(media query)"
  data-geser-nama="…">` berisi jalur `[data-geser-jalur]` dengan slide `[data-geser-slide]`, opsional penanda sendiri
  `[data-geser-penanda]` berisi `<button>` (tanpa itu: titik dibuat otomatis). Di bawah breakpoint JS memasang `.is-geser`,
  `role="region"` + `aria-roledescription="carousel"` + nama, slide `role="group"` "1 dari 4", `tabindex=0` di jalur
  (panah kiri/kanan, Home/End), `aria-current` di penanda, event `geser` (detail = indeks, bubble). CSS: scroll-snap x
  mandatory, `overscroll-behavior-x: contain`, scrollbar tersembunyi, jalur menjorok selebar layar (padding .wrap),
  slide `flex: 0 0 86%` + `contain: layout paint`, tinggi sama (flex stretch). Penanda lewat IntersectionObserver (root =
  jalur, threshold .6), tanpa scroll listener/rAF. Isyarat sekali (slide translateX −28px lalu kembali) saat pertama
  terlihat, tidak saat reduced-motion. Tanpa JS / di atas breakpoint: tata letak asli. Desktop tidak berubah.
- **Skala jarak vertikal** (sesi "jarak"; dulu `.band` `clamp(72px,10vw,140px)` → ±280px kosong antar isi di 1440):
  satu token `--jarak-section: clamp(44px,6.5vw,88px)` (HP 44px, desktop 88px) untuk `.band`, bawah Pengantar, Kenapa
  (`.why-wrap`), Biaya (`.cost`), footer; `--jarak-sambung: clamp(20px,2vw,28px)` = jeda teks setelah gradasi
  (fase baru, masuk blok hijau). `--sambung` 140–240 → `clamp(96px,11vw,160px)`; `.why --masuk` 96–190 →
  `clamp(72px,9vw,130px)`. `--sambung-malam` (senja → malam) **tidak diubah**. Tinggi halaman: 1440×900 12.763 → 11.870 px,
  390×844 21.627 → 21.083 px. Jarak dalam komponen (kartu, grid, pembatas) tetap angka setempat.
- **Benang + lentera + ranting** (sesi "aliran", lalu dikembalikan sebagian atas keputusan pemilik):
  - **Benang** = versi sebelum "aliran": `.benang` `position:fixed` di gutter kiri (`--benang-x`), jahitan tipis yang
    tergambar mengikuti scroll (view timeline `--hari`, cadangan JS `--benang`) dengan bulat kuning `.benang-ujung` yang
    BERGERAK sepanjang garis. HP: garis progres atas. **Dihapus** (keputusan pemilik): benang menempel per ruas
    (`.ruas-isi`, `::after`, `--benang-bg`, `--picu`, `--orn-benang-tebal`) dan garis tenun (`.tenun`, desktop & HP).
  - **Lentera** (`[data-lentera]` pada section; Donasi = `"zaitun"`): penanda 1px selalu ada (juga di HP) di x benang,
    y = tengah baris pertama judul (dihitung saat muat/load/resize). Inti 18px (cincin `--lt-c` kontras ≥ 3:1 → isi
    kunyit), cahaya radius 40px (radial-gradient, opacity, z-index −1 di bawah teks). Satu IntersectionObserver,
    `rootMargin: 100000px 0 −45% 0` → menyala saat baris pertama judul melewati **garis picu 55%** tinggi layar (tidak
    lagi terikat bulat kuning; diuji 7 section: mati 20px sebelum, nyala 20px sesudah), juga saat melompat jauh;
    lentera sebelumnya ikut menyala. Desktop 1440: inti berakhir 7px sebelum judul (tidak menabrak teks).
  - **Ranting zaitun** `.lt-ranting`: tumbuh ke KIRI benang saja (kanan = teks). Satu ruas per lentera yang menyala:
    batang (stroke-dashoffset) + daun lancip (scale dari pangkal), 2 → 5 daun makin ke bawah; Donasi 5 daun + 3 buah
    zaitun gelap bertepi krem. Lebar `min(106px, --benang-x − 6px)`; disembunyikan < 1296px (margin kiri < ±40px).
  - **HP**: titik lentera 11px di garis progres atas (`.lt-hp`; posisi = isi garis saat judul di garis picu); tanpa ranting.
  - Reduced-motion: benang utuh tanpa bulat kuning, lentera yang sudah dilewati menyala & ranting tampil tanpa transisi.
    Tanpa JS: benang tidak tampil. Hanya transform/opacity/clip-path/stroke-dashoffset; tanpa rAF baru.
- **Ornamen** (SVG sebagai `mask`, warna = `currentColor`/token, tanpa warna tertanam; data URI di token `--orn-*`):
  `.orn-band` pita keffiyeh horizontal (daun zaitun + dua garis), `.orn-net` jaring keffiyeh untuk latar (opacity .05,
  `position:absolute; inset:0`), `.orn-leaf` ikon daun zaitun (centang), `.orn-list` daftar berbutir daun,
  `.orn-lentera` titik lentera (`--lentera`), `.orn-seed` biji semangka — **sangat jarang**, maksimal satu tempat.
- **Ornamen v2** (blok `ORNAMEN v2` di `index.html`; berkas `assets/ornaments/`, dibuat `tools/make-ornaments.mjs`, 108 KB):
  pola satu warna dipakai sebagai masker (warna dari token); versi `-hitam/-merah/-hijau` = berkas siap pakai.
  Warna kain: `.kain-hitam` (bawaan) `.kain-merah` (`--semangka-tua`) `.kain-hijau` (`--kulit`); latar kain `--kain-dasar`.
  `.orn-kain` bidang kain keffiyeh (jaring/fishnet, ubin `--kain-ubin` 24px), `.orn-kain--kotak` houndstooth (12px).
  `.orn-band--tebal` pita pembatas 24–48px (`--pita`, bawaan 40px: garis, ranting zaitun, gelombang, zigzag),
  `.orn-band--sempit` 24px — dipakai bersama `.orn-band`; `.orn-band` polos (14px) tetap untuk struk & footer.
  `.orn-net.orn-net--kain` tekstur jaring keffiyeh tipis (`--orn-alpha`, 6–12%, bawaan 8%). `.orn-bingkai` tepi bingkai
  (border-image, warna dari berkas). Semangka (warna tertanam, datar, tanpa gradasi/wajah): `.orn-slice` irisan setengah
  lingkaran, `.orn-slice--segitiga`, `.orn-seeds` sebaran biji (`--biji`, `--orn-alpha` 12%). Lebar `--slice`,
  menjorok keluar layar lewat `--jorok` (translate, body sudah `overflow-x:clip`), sudut dasar `--putar`.
  Gerak irisan **tertaut scroll** (izin pemilik, sesi fondasi seni): berayun ±8° (bawaan) atau `.orn-slice--buka` (terbuka
  dari miring −26° & 0,88 ke tegak). Hanya bila `.gerak` + view timeline didukung; selain itu diam; mati saat reduced-motion.
  `.frame-arch` bingkai foto lengkung bulat (arkade Al-Aqsa), `.frame-arch--lancip` mihrab; garis ganda = `currentColor`
  (2px + 1px, tidak ikut membesar), rasio tetap 4:5; isi `<img>`/`<picture>`, atur `object-position` per foto.
- **Foto stok** (`assets/photos/`, SEMENTARA): hanya Unsplash (bukan Unsplash+), Pexels, Pixabay dengan lisensi komersial
  gratis; setiap foto dicatat di `assets/photos/CREDITS.md` (URL, fotografer, lisensi, tanggal). Dilarang: wajah yang bisa
  dianggap siswa/guru/penulis testimoni LCDU, foto penderitaan, bendera/poster politik, merek/logo (potong bila perlu).
  Jangan menyalin dari sumber tak berlisensi. AVIF + WebP 480/960/1600 lewat `tools/build-photos.mjs`, tidak diperbesar.
  Sekarang 7 foto Pexels (±1,7 MB AVIF semua ukuran). Ganti dengan foto asli LCDU sebelum rilis.
- `ornamen-test.html` = halaman uji **sementara** untuk persetujuan pemilik (gaya diambil dari `index.html`;
  `?bandingkan` = 1440 & 390 berdampingan). Hapus setelah disetujui.
- **Pengantar** (selesai, revisi 2 — seni): tiga fragmen (teks persis dari pemilik): baris 1 "Belajar Bahasa Arab dan
  Inggris." Fraunces 300 besar ("Arab" `--zamrud-ink` = hijau kulit, "Inggris" `--lazuardi-ink`, keduanya 700); baris 2
  "Online." dan baris 3 "Nirlaba." Fraunces 700 **miring** jauh lebih besar ("Nirlaba." `--semangka-tua`; merah terang
  4,0:1 tidak dipakai untuk teks). Hierarki dari ukuran & ketebalan. Tanpa "16 tahun ke atas", tanpa pill. Di bawahnya
  satu baris kecil `.intro-yayasan`: `.orn-leaf` + "Dikelola Yayasan Taqwa Cerdas Kreatif." + `.orn-band` tipis merah.
  Menyala kata per kata: `.k` dengan `--i`, `--n:7`; `--p` (`@property`, awal 1 = penuh) dianimasikan view timeline
  (`cover 18% → 50%`, tanpa pin), cadangan JS. Lebih tegas: jendela 1,5 kata, pendar `--lentera` 95%. Redup terukur:
  tinta 48% 3,2:1 · Arab 68% 3,2 · Inggris 54% 3,1 · merah 62% 3,1; penuh ≥ 6,2:1. Pembaca layar: `.sr-only`
  "Belajar Bahasa Arab dan Inggris. Online. Nirlaba." Seni: foto Al-Aqsa (`.frame-arch`, garis hijau kulit,
  `object-position:100% 50%` supaya Kubah terlihat) di kolom 9–12 (HP: di bawah teks, rata kanan), `.orn-slice` besar
  menjorok dari tepi kanan (HP: kiri) di belakang foto, pita `.orn-band--tebal.kain-merah` di tepi bawah = tepi atas Kenapa
  (kini diganti gradasi warna, lihat tabel pembatas). Font: `fonts/fraunces-latin.woff2` ternyata sudah variabel 300–700 (sama
  persis dengan unduhan Google Fonts); ditambah `fraunces-italic-latin.woff2` (600–700, 45 KB, tidak di-preload).
- **Kenapa LCDU** (selesai, revisi 2): blok `.why` hijau kulit penuh lebar, teks putih (6,5:1; teks lembut putih 88% 5,5:1),
  aksen merah semangka hanya dekor (garis 64px di atas pernyataan aktif, isi kata Arab, pita). Judul "Kenapa LCDU?".
  Tanpa kotak/panel/tombol/eyebrow. Pernyataan = `<ol>`: `h3` Fraunces 36–48px + kalimat (teks persis dari pemilik).
  Desktop ≥ 960px: grid 5 : 7; judul di atas kolom kanan (`.why-kanan`); kiri `.why-stage` sticky (tinggi `min(54vh,480px)`, rasio 4:5) berisi empat `.frame-arch`
  bertumpuk + empat kata Arab raksasa (Reem Kufi 5,4–8,8rem, garis putih 1,5px, rata kiri di tepi bawah foto supaya tidak
  masuk kolom teks), crossfade .7s saat pernyataan melewati tengah layar (IntersectionObserver `-45% 0px -45% 0px`, JS
  memasang `.aktif` di item & `.on` di panggung). Kata Arab aktif terisi `--semangka`. Foto: menulis (kurikulum),
  kelas-online, guru-papan (tangan + kapur, lengan berbaju), quran-rehal. **HP & tablet (< 960px): `.geser`** — tiap pernyataan = satu slide
  (`.why-media` foto 54vw maks. 220px + kata Arab + judul + kalimat), slide yang tampil = pernyataan aktif (kata Arab
  merah; IO vertikal diabaikan saat geser aktif). Section di 390×844: 2.543 → 784 px (≤ satu layar). **Dimampatkan** (permintaan pemilik): pernyataan desktop
  `min(29vh,280px)`, terakhir `min(37vh,360px)` → section 1,70 layar di 1440×900 (1,65 tanpa pita); HP foto 66vw. Panggung & media = duplikat dekoratif (`aria-hidden`,
  `alt=""`, lazy + display:none → yang tak tampil tidak diunduh). Tepi atas: gradasi; tepi bawah: tepi mihrab.
  Reduced-motion: tetap berganti tanpa transisi. Tanpa JS: foto pertama, semua teks terbaca. Crossfade = gerak tambahan
  atas permintaan pemilik. Kata Arab hanya yang sudah ada: مَنْهَج، عَنْ بُعْد، مُعَلِّم، القُرْآن.
- **Pilih kelas** (selesai, revisi 3 — performa): layar terbelah `#split`. **Prinsip: semua informasi terlihat penuh
  tanpa interaksi; geser/ketuk/hover hanya memberi penekanan.** **Aturan performa (keputusan pemilik): yang dianimasikan
  HANYA transform & opacity** — tidak ada grid-template-columns/width/left yang berubah, tidak ada `@property`, tidak ada
  variabel CSS yang diwariskan untuk posisi (memicu hitung ulang gaya & paint seluruh isi tiap frame). Desktop ≥ 1000px:
  kolom tetap 50/50; isi tiap sisi = kolom teks berlebar tetap `--isi` (`clamp(280px,25vw,340px)`) di tepi luar
  (`--pad-luar`, min 32px) + foto di sisi dalam (lebar sisa, maks 230px). Latar: `.latar-ar` hijau penuh di bawah,
  `.latar-en` biru digeser `translateX(d − 50%)` dengan isi (warna, jaring, glyph Aa) digeser balik → batas "terpotong"
  oleh compositor. JS menulis transform langsung di `.latar-en`, `.latar-en-isi`, `.split-garis`, `.split-pegangan`.
  Rentang `[MIN, 100−MIN]` dihitung JS dari tepi kolom teks (35–65 di 1024 & 1440), snap MIN/50/100−MIN, `aria-valuemin/max`
  ikut. Sisi yang menyempit (< 49%): foto memudar (opacity) supaya tidak tertabrak; sisi yang ditekankan: foto skala 1,12
  ke arah pita, glyph .26. Tarik: pointer capture, posisi di rAF, `.is-tarik` = tanpa transisi + `will-change:transform`
  (hanya selama menarik), `touch-action:pan-y`. Undangan sekali 58 → 42 → 50 (dihentikan & kembali 50 bila section keluar
  layar), denyut = scale pada SVG pegangan hanya saat `.is-lihat` & belum ada interaksi. Diukur (Chrome, CPU 4x, tracing):
  menarik → 0 layout di tengah gerakan (hanya ±1 ms saat tekan & lepas), 60 fps, frame terpanjang 16,8 ms (1440);
  undangan → layout 174/detik → 6/detik. 700–999px: dua blok bertumpuk (latar per sisi), tanpa tarik; ketuk = garis tepi
  6px (pseudo, scaleY) + glyph lebih tegas. **HP < 700px: `.geser`** dengan dua slide (Inggris, Arab), penanda
  `.kelas-penanda` "Inggris | Arab" = teks bergaris bawah (bukan pill) tersinkron & bisa diketuk; foto sisi disembunyikan
  di slide supaya semua info muat; tanpa ketuk-untuk-penekanan. Section di 390×844: 1.821 → 798 px. Isi: judul (biru / hijau kulit; Arab rata kanan &
  dicerminkan), deskripsi, fokus belajar berbutir daun, label jadwal **hanya jam** ("Weekday 16.00–17.30 WIB",
  "Weekend 13.00–16.00 WIB"), strip 7 hari `<ul>`: hari kelas menyala + teks tersembunyi "Senin, kelas Inggris" dst.,
  hari lain `aria-hidden`. Latar sisi `#C9D1F8` / `#D2E6C6` (kontras sama seperti sebelumnya). **Jadwal perlu verifikasi.**
- **Biaya** (selesai, revisi 2): blok `.cost-blok` merah tua `#B3202E` penuh lebar (teks putih 6,6:1; kalimat pendukung
  putih 90% 5,6:1), pita keffiyeh merah-putih di atas & bawah (`.cost-pita`), biji tersebar di tepi kiri-kanan
  (`.orn-seeds.cost-biji`, 22%); tepi atas kini tepi biji `.batas-biji`, pita hanya di bawah. Kiri: label kecil
  `.cost-label` "Berapa biayanya?" (h2; Plus Jakarta 500, 1,1–1,3rem, krem `#F5DEC1` 5,1:1, jarak tegas), pernyataan raksasa
  "Tanpa biaya bulanan." (Fraunces 700 3,2–7,6rem, putih 6,6:1) dengan aksen kunyit sebagai **garis bawah tebal** pada
  "biaya bulanan" (`.cost-kunci`; teks tetap putih — varian teks kunyit 4,1:1 ditolak: kurang terbaca dan menonjolkan
  kata "biaya", bukan "Tanpa"; label Fraunces 300 ditolak: terlalu tipis di merah), satu kalimat pendukung. Kanan: printer + struk putih, seluruh `.receipt-wrap` miring −1,5°; irisan semangka besar di
  belakang struk. Struk (teks persis dari pemilik): kepala "LCDU, Rincian biaya"; "Biaya bulanan — Rp0"; "Donasi untuk
  Palestina (tidak wajib) — sebebasnya"; garis putus-putus; total besar "Total per term (semester) — Rp100.000"
  (`--semangka-tua` di putih 6,6:1); penutup جَزَاكُمُ اللّٰهُ خَيْرًا + "Terima kasih sudah belajar bersama LCDU.".
  Gerak "tergambar": `--cetak` (`@property`, awal 1 = penuh) dianimasikan view timeline `.receipt-wrap` (`cover 12% →
  48%`), struk hanya di-`translateY` di dalam `.struk-jendela` — teks tetap di DOM, terbaca berurutan; cadangan JS.
  Tepi bawah sobekan zigzag keffiyeh (`--orn-sobek`). Tanpa count-up, tanpa stempel, tanpa tombol, tanpa eyebrow.
- Pita setelah hero: hanya `.kufiyah` (keffiyeh × semangka, tanpa teks, keputusan terkunci). Ticker berteks sudah dihapus.
- **Pembatas antar-section** (keputusan pemilik: bervariasi, tidak seragam; rajut maks SATU kali; tidak ada dua jenis
  sama berurutan; CSS di blok "PEMBATAS ANTAR-SECTION"; animasi masuk sekali lewat `[data-muncul]`, tanpa scroll listener):

  | Batas | Jenis | Alasan |
  |---|---|---|
  | Hero → Pengantar | hijau–jaring–merah `.kufiyah` | favorit pemilik, dipertahankan persis |
  | Pengantar → Kenapa | pergeseran warna saja (gradasi OKLab putih hangat → hijau kulit, `--masuk`) | setelah motif ramai di atas, napas; blok hijau "terbit" dari kertas |
  | Kenapa → Pilih kelas | tepi mihrab `.batas-mihrab` (SVG lengkung lancip + garis tergambar) | keluar dari blok hijau seperti melewati mihrab; menggemakan `.frame-arch` |
  | Pilih kelas → Biaya | tepi biji semangka `.batas-biji` (biji merah di atas garis, hitam di bawah) | Biaya = blok merah semangka; biji menjembatani |
  | Biaya → Cara bergabung | rajut: pita keffiyeh merah-putih (satu-satunya) | menutup blok merah seperti tepi kain |
  | Cara bergabung → Testimoni | satu garis daun zaitun `.batas-daun` yang tergambar dari tengah | satu fase (sore), cukup jeda halus |
  | Testimoni → Tim | pergeseran warna (fase sore → senja) | pergantian waktu sudah jadi pembatas |
  | Tim → FAQ | kata Arab raksasa `.batas-kata` (مُعَلِّم, bergaris) menyeberangi batas | tipografi; "guru" menutup Tim |
  | FAQ → Donasi | pergeseran warna panjang (senja → malam) | cerita hari menuju malam |
  | Donasi → Footer | garis daun zaitun tipis tergambar (`.foot-band`, sudah ada) | penutup tenang |

  Ornamen di dalam section (bukan pembatas) tetap: garis keffiyeh tipis di baris Yayasan & struk, pita keffiyeh tegak
  pada pembagi Pilih kelas (diminta pemilik), benang di gutter. Pita rajut antar-blok Pilih kelas di HP dihapus.
- **Cara bergabung** (selesai, revisi 2; id tetap `bergabung` karena navbar & pill "Daftar"): judul "Cara bergabung" +
  syarat satu kalimat (dari teks checklist lama: usia 16+, bisa membaca Al-Qur'an, laptop/HP, konsisten sampai term
  selesai) + pilihan "Aku mau belajar: Inggris | Arab" (radio asli dalam fieldset = radiogroup keyboard; menulis
  `section[data-bahasa]` & event `bahasa`; tanpa JS disembunyikan). Checklist "Kamu siap bergabung?" **dihapus**
  (keputusan pemilik). **Kartu Placement Test** `#placement` = "lembar ujian" (putih bergaris, margin merah, strip
  houndstooth hijau): tujuan, komposisi 70 titik (20 biru Listening/Istima' · 20 hijau Reading/Qira'ah · 30 merah
  Grammar/Tata bahasa; muncul berurutan sekali; hover/fokus menampilkan nama & jumlah, selalu tampil di perangkat sentuh),
  cincin "60 menit, maks." (stroke-dashoffset sekali), "Tes suara" (nada C5–E5–G5 Web Audio + gelombang, statis saat
  reduced-motion), catatan 4 baris, satu tombol kunyit: "Mulai Placement Test" → `placement.<bhs>.url` (halaman awal tes
  `-rule`, keputusan pemilik: satu tujuan, tanpa tautan sekunder) atau "Tanya admin lewat WhatsApp" saat tutup. Fakta tes
  hanya dari halaman resmi (20/20/30, maks. 60 menit, sekali duduk, audio maks. 2×, speaker/headset, tanpa auto
  translate/bertanya/tab lain, kosongkan yang tidak dipahami) — **jangan** menambah durasi per bagian, nilai lulus, hasil.
  Kata "aturan test" tidak dipakai. Zoom/Canvas tidak disebut di kartu. **Enam langkah** (teks lama): desktop = tali
  lentera horizontal berombak (SVG) dengan 6 lentera menyala berurutan sekali (120 ms), ke-6 lebih besar; Arab =
  dicerminkan kanan→kiri lewat translateX((5−2i)×100%) per kolom, DOM tetap 1→6; HP = daftar rapat + benang tegak.
  Langkah 1 menaut ke `#placement`. Tinggi section: 2,46 → 1,74 layar (1440×900), 3,02 → 2,27 (390×844).
- **Gerak (hanya tiga, + ayunan semangka & crossfade foto Kenapa)**: `data-muncul` (pudar + naik 12px, sekali; jeda opsional `--d`), `data-tergambar` (garis terbentang mengikuti scroll;
  view timeline, cadangan JS `--t`), `.menyala` (cahaya hangat menyala saat terlihat, padam di luar layar). Token
  `--dur-muncul --dur-menyala --ease-muncul --ease-menyala`. JS memasang `.gerak` di `<html>` hanya bila bukan
  reduced-motion; tanpa `.gerak` semuanya tampil diam & utuh.

## Keputusan yang sudah dikunci (jangan diubah tanpa bertanya)
- **Judul section `[data-judul]`** (permintaan pemilik; varian "muncul" khusus judul): JS memecah h2 per KATA (span `.jk`
  inline-block, spasi tetap teks; span berwarna & kata Arab dipertahankan, `.sr-only`/`aria-hidden` dilewati), awal
  opacity 0 + blur(6px) + translateY(.55em), 800 ms `cubic-bezier(.2,.8,.2,1)`, jeda 75 ms/kata (maks 600 ms),
  IntersectionObserver threshold .4 sekali. Judul yang terlihat/terlewati saat halaman dibuka (termasuk #anchor dalam
  350 ms pertama) tampil langsung. Tanpa JS/IO/reduced-motion: utuh. Kelas `.judul-tunggu`/`.judul-jalan` dilepas
  setelah selesai (will-change & filter bersih). Dipakai 9 judul: Pengantar, Kenapa, Pilih kelas, Biaya, Bergabung,
  Testimoni, Tim, FAQ, Donasi — `data-muncul` lama pada judul itu dihapus. Pengantar memakai `data-judul=".k"` (span kata
  yang sudah ada, tidak dipecah ulang); blur-in lalu efek menyala per kata mengikuti scroll tetap berjalan (keputusan
  pemilik). Section baru: cukup tambahkan `data-judul` pada h2. `<html class="js">` dipasang di `<head>`.
- Hero harus jelas: kursus bahasa Arab & Inggris yang nirlaba untuk dakwah dan umat. Pesan Palestina tetap ada lewat cerita
  **gelap → terang**. Cerita 3 babak lewat scroll (copy persis, hanya pemilik yang mengubah):
  1. "Kelas Bahasa Arab & Inggris untuk dakwah dan umat." 2. "Setiap ilmu yang kita pelajari menyalakan satu cahaya."
  3. "Bersama, kita nyalakan harapan untuk Palestina."
- Wordmark permanen kiri atas hero: logo + "LCDU" saja (keputusan pemilik; nama panjang hanya untuk pembaca layar, `.sr-only`).
  Identitas, bukan tombol/tautan.
- Biaya (fakta dari pemilik): **Rp100.000 per term (1 term = 1 semester).** Di term pertama biaya ini disebut
  biaya registrasi (fakta; tidak lagi ditulis di halaman atas permintaan pemilik). **"Rp100.000" hanya di total struk
  Biaya**; boleh di maksimal dua tempat lain (langkah 4 Cara bergabung, FAQ) — sekarang langkah 4 berbunyi "Isi formulir
  registrasi dan bayar biaya term pertama." tanpa angka. Meta description tetap memuat angka (keputusan pemilik; tidak
  terlihat di halaman). Dilarang menulis "gratis", "sudah termasuk seluruh biaya belajar", atau "tanpa biaya tambahan".
  **"Rp0" hanya boleh** di baris struk "Biaya bulanan" (keputusan pemilik, sesi Biaya revisi 2), selalu bersama total
  Rp100.000 yang paling menonjol. Pernyataan besar Biaya: "Tanpa biaya bulanan."
- **Donasi terbuka = untuk Palestina**, sukarela, terpisah dari biaya kelas, disalurkan melalui **AWG (Aqsa Working Group)**,
  mitra lama. Tidak ada "Donasi LCDU" terpisah di halaman.
- **Urutan section setelah hero** (id dalam kurung): Pengantar (`pengantar`), Kenapa LCDU (`kenapa`), Pilih kelas (`kelas`),
  Biaya (`biaya`), Cara bergabung = syarat + pilihan bahasa + Placement Test + langkah (`bergabung`), Testimoni (`testimoni`), Tim (`tim`),
  FAQ (`faq`), Donasi untuk Palestina (`donasi`), Footer. Pemetaan fase: Pengantar & Kenapa = pagi; Kelas & Biaya = siang;
  Bergabung & Testimoni = sore; Tim & FAQ = senja; Donasi & Footer = malam. Navbar: Kelas, Biaya, Cara bergabung, Tim,
  FAQ, Donasi + pill "Daftar" (→ `#bergabung`).
- Section "Cek level" (kuis 3 soal) **dihapus**; diganti Placement Test resmi LCDU (tautan di `site-config.js`).
- Aturan UI: **tidak ada tombol "langkah berikutnya"** di tiap section. Tombol hanya di titik keputusan nyata: Placement
  Test, pill "Daftar" navbar, Tanya admin, Salin rekening & Konfirmasi transfer, CTA footer. Eyebrow maksimal 2 di seluruh
  halaman. Hanya tiga jenis gerak: **muncul, tergambar, menyala**. Tanpa scroll-jacking, tanpa pin horizontal, tanpa
  scroll horizontal pada halaman. **Pengecualian (keputusan pemilik, sesi geser):** geser horizontal NATIVE (scroll-snap)
  di dalam section lewat komponen `.geser` boleh. Semua
  gerak mati saat `prefers-reduced-motion`.
- **Anti-"AI slop"**: tanpa gradasi pada teks, tanpa emoji sebagai ikon, tanpa glassmorphism (pengecualian: navbar kaca,
  keputusan pemilik sebelumnya — perlu dikonfirmasi), tanpa tiga kartu simetris yang seragam, tanpa label kosong
  ("✨ Baru"), tanpa kalimat generik yang bisa ditempel ke lembaga lain, tanpa bayangan berlebihan dan sudut membulat
  penuh di mana-mana. Pakai tipografi tegas (Fraunces), garis halus, ritme tidak simetris, ruang kosong yang disengaja.
  Setiap section wajib lolos dua uji: **uji tukar** (bisakah teks ini dipindah ke lembaga lain tanpa diubah? kalau bisa,
  tulis ulang) dan **uji picing** (apakah hierarkinya tetap terbaca saat layar dipicingkan?).
- Narasi: harapan & semangat, bukan kesedihan. Tidak ada gambar penderitaan, tidak ada tema Isra Mi'raj.
- Tidak ada klik-untuk-lentera. **Tanpa parallax** di hero: teks babak hanya memudar, kamera/ilustrasi tidak mengikuti kursor.
  Scroll harus pendek dan jelas: tinggi hero **190vh** (permintaan pemilik; dulu 340 → 220vh) = ±77vh peta babak
  (`CENTERS`, jendela pudar tidak berubah) + **13vh "tahan fajar"** (`HOLD_VH`; p sudah 1, panggung masih menempel).
  **Geser kencang tidak boleh melewatkan fajar**: p ≥ 0,98 sebelum panggung mulai terangkat, apa pun kecepatannya.
  `state.p` mengikuti target lewat pegas teredam kritis (`K=70`, `MAX_RATE=.45`) + dua lapis di `step()` hero.js:
  (1) *panduan* — bila scroll diperkirakan melewati titik jaminan B (60% segmen tahan; titik henti dari
  `lenis.targetScroll` atau, scroll native, kecepatan × 0,5 s), percepatan `a = 6D/T² − 4v/T` (kontinu, mengerem
  sendiri), (2) *lantai* — ketertinggalan maks. menyusut .45 → 0 antara s = .6 dan B (hanya mengikat pada lompatan
  instan/roda raksasa). Scroll dibaca tiap frame (event scroll tertinggal 1 frame dari Lenis). Tanpa scroll-jacking.
  Diukur (simulasi `Lenis lerp .12` / usapan native + momentum iOS .998/ms, dan uji nyata di browser): p saat panggung
  terangkat — roda 3000px/100ms .05–.06 → **1,00**; usapan cepat 7000px/s .13–.14 → **1,00**; scrollTo instan .02 →
  **1,00**; tautan #pengantar .08 → **1,00**; usapan normal (200px + 1500px/s) .67–.96 → 1,00. Lonjakan Δ²p roda 100px
  .0005 → .0006–.0007 (browser ±.0012 termasuk derau); usapan pendek di tengah hero .0006 → .0008–.0009; usapan yang
  melewati ujung hero .0009 → .006–.015 (fisik: p harus naik ±.5 dalam ±.3 s; dulu tidak naik sama sekali).
- Tiga babak = tiga suasana yang jelas berbeda (permintaan pemilik), berubah bertahap sepanjang scroll, bukan melompat:
  Foto: malam → fajar biru + lampu menyala → subuh (bulan, bintang & biru memudar dulu; lapisan dari foto fajar yang
  diredam) → matahari terbit keemasan. Laju perubahan p dihaluskan (pegas di hero.js), tetapi fajar selalu tercapai.
  Teks babak 3 di Foto berwarna biru tua `#10163A` di atas langit terang
  (kontras ≥ 6:1); babak 1–2 putih di atas gradasi lebar & lembut dari pojok kiri-atas yang memudar habis sebelum
  babak 3. Jangan pakai elips/bercak gelap di belakang teks dan jangan ada gradasi yang berhenti mendadak (pemilik menolak:
  terlihat sebagai bulatan hitam dan garis).
- Tombol mengambang "Tanya admin" (`.fab`) tersembunyi selama hero, muncul halus setelah hero.
- Kursor: kursor bawaan tidak disembunyikan, tidak ada kursor kustom. Di hero: cahaya hangat lembut mengikuti kursor
  (HP: mengikuti jari) dan menyingkap fajar di sekitarnya. Di luar hero: tanpa efek kursor khusus.
- Navbar: kaca transparan ala Apple (isi 58%, blur 8px, saturate 1.8, garis tepi putih tipis; jangan terlalu blur).
  Tersembunyi selama hero; setelahnya muncul, baru hilang setelah scroll ke bawah ±220 px (geser + pudar halus .7s),
  muncul lagi saat scroll ke atas; muncul saat fokus
  keyboard; skip link "Lewati ke konten"; tanpa slide saat reduced-motion.
- Teks hero kontras ≥ 4.5:1 di semua babak (scrim), dan tidak menutupi kubah.
- Penanda Palestina: Kubah Shakhrah + Masjid Qibli (kompleks Al-Aqsa), pohon zaitun. Motif keffiyeh × semangka **tidak di dalam
  hero** (keputusan pemilik): tampil sebagai pembatas tepat setelah hero, di awal section berikutnya.
- Hero = **Foto** saja (keputusan pemilik); 3D diarsipkan di `reyhanadiva/lcdu-3d`, "Mozaik" & kanvas lama dihapus.
- Logo resmi: `assets/brand/` (PNG transparan; turunan web di `assets/brand/web/`, versi warna & putih). Jangan ubah bentuk,
  proporsi, atau huruf logo. Navbar/footer: warna di mode terang, putih di mode gelap; hero selalu putih.
- Palet **semangka-keffiyeh × logo** (diminta pemilik, sesi fondasi seni; menggantikan latar krem-persik lama):
  hijau LCDU = hijau logo persis `#7FA33F` (`--logo-hijau`, juga kulit muda semangka; dekor saja, bukan teks),
  hijau kulit tua `#1E6B3A` (`--kulit`), biru logo `#1724C0` (`--logo-biru`/`--lazuardi`), merah semangka `#E23B4A`
  (`--semangka`, dekor & judul sangat besar), merah tua `#B3202E` (`--semangka-tua`, teks merah & blok merah ber-teks),
  hitam keffiyeh `#111111` (`--keffiyeh`), putih (`--putih`), kunyit `#FFC21A` (tidak berubah). Latar dasar putih hangat
  `#FCF9F4`. **Peran**: hijau = Bahasa Arab & identitas LCDU (teks Arab = `--kulit`, keputusan pemilik; di malam = hijau
  logo), biru = Bahasa Inggris, merah = aksen hangat & blok besar (blok ber-teks selalu merah tua), hitam + putih = pola
  keffiyeh, kunyit = **hanya** tombol aksi (satu pengecualian dari pemilik: garis bawah frasa kunci di Biaya). Nama token lama dipertahankan supaya komponen tidak berubah:
  `--zamrud`/`--zamrud-ink` = `--kulit`. `--lazuardi`/`--zamrud` = **isi** (latar dengan teks putih);
  `--lazuardi-ink`/`--zamrud-ink` = **tinta** (teks, garis indikator; lebih terang di malam/mode gelap).
- Font (dipilih pemilik): **Fraunces** (judul, `--f-display`), Plus Jakarta Sans (teks), Reem Kufi (judul Arab),
  Noto Naskh Arabic (teks Arab). woff2 variabel di-host sendiri di `fonts/` (subset Latin/Arab, `font-display: swap`,
  preload Fraunces + Plus Jakarta), bukan CDN. Unbounded tidak dipakai lagi.
- Tata letak teks hero (dipilih pemilik). **Hero Foto**: teks di area
  langit — layar tegak di ±8–45% tinggi layar (kubah foto ada di 52–77%, teks tidak boleh menyentuhnya), desktop kiri-atas;
  pita gelap tipis di atas (wordmark) + bayangan elips di belakang teks babak 1–2, kontras ≥ 4.5:1 di semua babak. Petunjuk gulir di atas keffiyeh, di area pohon zaitun.
- Aset hero Foto: pasangan **tall** (1024×1536, night-tall + dawn-tall) dan **wide** (1536×1024, night-wide-v2 +
  dawn-wide) — keduanya lulus `tools/check-align.py` (≤ 4 px per zona pada lebar 1536, korelasi ≥ 0,40). Pasangan baru
  wajib lulus skrip itu dulu. `night-wide.png` lama tidak sejajar dan tidak dipakai. **Jangan pernah memperbesar gambar melampaui resolusi aslinya**; butiran film halus
  ditampilkan otomatis bila foto tampil lebih besar dari aslinya. Target unduhan hero di HP < 700 KB (sekarang ±150 KB AVIF).

## Prioritas berikutnya
1. Hero Foto (jalan di layar tegak & melebar): bila perlu foto/ilustrasi lebih detail, cahaya bertekstur, transisi fajar
   lebih sinematik. 3D tidak dikembangkan lagi (arsip di `lcdu-3d`).
2. Lanjut section lain satu per satu (pemilik ingin dibahas per section, perubahan berani boleh). Fondasi sudah ada
   (fase, benang, ornamen, gerak, konfigurasi). Masih memakai isi lama dan perlu didesain ulang:
   Testimoni, Tim, Donasi, Footer. FAQ masih stub. Selesai: Pengantar, Kenapa, Kelas, Biaya, Cara bergabung
   (keempatnya sudah memakai fondasi seni).
   Fondasi seni (palet semangka-keffiyeh, ornamen v2, bingkai lengkung, foto stok) **disetujui pemilik**;
   `ornamen-test.html` masih ada — hapus bila pemilik tidak membutuhkannya lagi.
3. Sebelum serah terima ke IT: pertimbangkan Astro + komponen, optimasi gambar (AVIF/WebP), Lighthouse ≥ 90 mobile.

## Aturan kualitas
- **Animasi hanya transform & opacity** (clip-path bila perlu). Jangan menganimasikan properti tata letak (width, left,
  grid-template-columns, margin) — juga tidak lewat `@property` — dan jangan menggerakkan elemen lewat variabel CSS yang
  diwariskan ke banyak turunan. Ukur dengan CPU throttling 4x.
- Wajib menghormati `prefers-reduced-motion`, fokus keyboard terlihat, kontras teks cukup, tidak ada scroll horizontal di 390px.
- Animasi berhenti saat tidak terlihat (IntersectionObserver). Cek performa di HP kelas menengah, bukan hanya laptop.
- Uji di 1440×900 dan 390×844 sebelum push.
- Jangan mengarang fakta: harga (Rp100.000/term), jadwal, nama guru, nomor rekening hanya dari data yang ada (lihat README checklist).
- Ayat & hadits: cantumkan rujukan, minta pemilik verifikasi di quran.kemenag.go.id. Jangan mengeluarkan fatwa.
- Commit kecil dengan pesan Bahasa Indonesia yang jelas. Tanyakan sebelum push jika perubahan besar.

## Belum lengkap (lihat juga checklist di README)
Foto asli (tim, kelas, testimoni), logo mitra, link formulir registrasi/Instagram/alamat, ejaan 5 nama guru,
nama yayasan di rekening. Perlu verifikasi pemilik: nomor WhatsApp admin 0819-6009-333 (dari lcdu.org), dan apakah
rekening Bank Muamalat di section Donasi memang untuk donasi Palestina (AWG).
