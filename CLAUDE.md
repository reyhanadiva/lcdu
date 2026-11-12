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
`python3 -m http.server 8000` atau `npx serve .` → buka `http://localhost:8000/?hero=lentera` atau `?hero=diorama`.
Saat mengembangkan, pakai server tanpa cache (browser menyimpan modul ES lama); jika masih basi, buka lewat `127.0.0.1`.

## Struktur
- `index.html` — seluruh halaman (CSS & JS section non-hero inline). Token warna/font di `:root` paling atas.
- `hero/hero.js` — pengendali hero: scroll → progres `p` (0..1), kursor, teks per babak, pemuat varian, tombol pembanding.
  Varian = modul `export default { mount(container, state) → { frame(state, now), resize(), destroy() } }`.
- `hero/lentera-hd.js` — hero **Foto** (tombol "Foto", default; id varian tetap `lentera-hd`): foto malam/fajar dari
  ChatGPT (`assets/hero/build/`, dari `tools/build-hero-images.py`), pasangan tall & wide sudah lulus `check-align.py`,
  titik cahaya di `hero/spots.json` (editor: `?hero=lentera-hd&edit-spots`). Teks ditaruh di langit (`text: 'top'`).
  Cahaya babak 2 harus **masuk akal** (keputusan pemilik): hanya di sumber nyata — jendela/pintu (w), lentera arkade (a),
  tiang lampu/lentera tembok (l), lentera di tanah (g), lampu kota jauh (c) — dengan genangan cahaya di tanah, menyala
  bergelombang dari Kubah ke luar. Jangan kembali ke titik acak yang melayang.
  `supports()` → false bila aset orientasi layar belum ada.
- Hero ilustrasi kanvas lama (`lentera.js`, `scene2d.js`) **sudah dihapus** atas permintaan pemilik. Pembanding hanya
  "Foto" dan "3D".
- `tools/` — skrip Python (numpy, Pillow): `check-align.py`, `build-hero-images.py`, `gen-spots.py`, `prep-model-textures.py`;
  Node (`npm install` di `tools/`): `optimize-models.mjs`. Lihat `tools/README.md`.
- `hero/diorama.js` — varian 3D (three.js r160, di-vendor di `vendor/three/`, lewat importmap di `index.html`), bloom,
  GSAP (lisensi standar GreenSock, bukan MIT) untuk easing kamera. Babak 1 malam tapi terbaca (bulan, rim light biru,
  jendela hangat sejak awal). Fallback: WebGL gagal → `lentera-hd`. Semua tingkat kualitas tetap memakai bayangan, bloom & grading (tanpa itu adegan
  tampak datar — pernah terjadi di laptop pemilik); yang turun hanya DPR (dibatasi jumlah piksel) & MSAA. `?tier=0|1|2` memaksa tingkat. Fps rendah menurunkan kualitas dulu (MSAA/bayangan/bloom/DPR, bisa naik lagi
  bila lancar); baru pindah ke `lentera-hd` bila di tingkat terendah fps < 24 (dulu langsung pindah → pemilik tidak bisa memakai 3D).
  Anti-aliasing: composer memakai render target MSAA (4× desktop, 2× HP) + alpha-to-coverage untuk daun/sprite; shader
  yang memakai `pow`/`normalize` pada varying wajib di-clamp (dengan MSAA nilai bisa sedikit di luar rentang → NaN → blok
  hitam di bloom). `?debug-perf` juga membuka `window.__dio` untuk memeriksa.
  Kubah & Qibli dari `assets/models/optimized/*.glb` (TRELLIS.2, Meshopt; `-mobile` untuk HP), dimuat malas; bangunan
  prosedural = layar sementara & cadangan bila gagal. Lentera dari `hero/lights3d.json` (editor `?hero=diorama&edit-lights`).
  Anggaran aset 3D: desktop ≤ 3 MB (sekarang 2,98 MB), HP 1,77 MB. HP lemah tidak membuka 3D dari preferensi tersimpan.
  **Vegetasi wajib lewat `plant()`** (zona larangan): ditolak bila ≤ 12 unit dari jalur kamera (semua babak, 4 ukuran
  layar), terlalu besar di layar, menutupi tepi layar, atau menimpa area teks; dicoba dipindah dulu, kalau gagal dibuang.
  Cadangan: vegetasi yang < 15 unit dari kamera mengecil halus (hilang di 9). Laporan: `?hero=diorama&debug-veg`.
  Elemen pendukung (hierarki detail: model utama > dekat kamera > jauh): zaitun (batang Tube bengkok + kartu daun
  ter-instance), cemara (kartu tegak), rumput & semak, kota tua 6 modul InstancedMesh (jendela emissive prosedural),
  qanatir & Kubah Rantai berkolom kapital, medan bukit ber-noise, kabut berlapis + pass grading/vignette. Semua tekstur
  prosedural (0 KB aset). Palet dicocokkan ke `assets/models/source/extras/` (lembar acuan pemilik).
  Anggaran: segitiga vegetasi ≤ 150 rb desktop (sekarang ±48 rb), HP ±40% (±18 rb). Draw call ±136 (dulu ±390).
  Alat pengembang: `?debug-perf` (draw call, segitiga, waktu render; fallback otomatis mati), `?debug-cam=x,y,z,tx,ty,tz`.
  Tahap 2 (aset 2D dari `assets/models/source/extras/`, dibuat `tools/make-extras.py` → `assets/models/extras/`):
  pohon tengah/jauh = sprite 3 bidang bersilang + blob shadow; rumah > 46 unit = sprite gugus rumah (papan reklame);
  panorama Bukit Zaitun di busur ke arah matahari terbit (malam dibirukan lewat shader, medan 3D di situ direndahkan);
  tembok/pelataran/tanah/plester bertekstur foto mulus. Semua lewat `plant()`; dimuat malas, prosedural = cadangan.
  Anggaran aset: desktop ±1,06 MB, HP ±0,29 MB (target ≤ 1,5 MB / ≈ 700 KB).
- iOS 26 Safari: elemen `position:fixed` yang menempel di tepi layar membuat Safari mengisi area status bar/toolbar dengan
  blok warna solid. Jangan pasang strip fixed di `safe-area-inset-top`; tombol pembanding hero disembunyikan di luar hero.
- `vendor/lenis/` — scroll halus seluruh halaman (mati saat reduced-motion). Klik anchor ditangani sendiri di `index.html`
  supaya `scroll-margin-top` dihormati.
- `site-config.js` — **satu tempat** untuk data yang berubah: status Placement Test (`placementTest.open`; `false` → tombol
  tes disembunyikan, tampil "Tanya admin"), tautan tes & aturan Inggris/Arab, WhatsApp admin + pesan awal per tombol,
  AWG, rekening. HTML memakai `data-cfg-href`, `data-cfg-text`, `data-wa="umum|placement|konfirmasi"`; teks di HTML =
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
- **Benang keffiyeh** (`.benang`, setelah footer): desktop ≥ 900px garis zigzag tipis di gutter kiri dengan titik lentera
  di ujung; HP garis progres 3px di atas (5px dari tepi, sengaja tidak menempel — lihat catatan iOS 26). Panjangnya dari
  CSS scroll-driven animation (`view-timeline: --hari`, range `entry 50% contain 100%`), cadangan JS mengisi `--benang`.
  Mulai terlihat saat Pengantar mencapai tengah layar (`.is-on`), selesai tepat di akhir Donasi. Disembunyikan saat reduced-motion.
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
- **Pengantar** (selesai): satu kalimat besar (teks persis dari pemilik) yang menyala kata per kata. Tiap kata `.k` dengan
  `--i`; `--p` (didaftarkan `@property`, awal 1 = penuh) dianimasikan view timeline kalimat (`cover 18% → 52%`, tanpa pin),
  cadangan JS. Redup ≥ 3:1 (campuran tinta + latar, terukur 3,4:1), penuh ≥ 4,5:1; pendar `--lentera` di kata yang sedang
  menyala. "Inggris" = `--lazuardi-ink` (= biru logo), "Arab" = `--zamrud-ink` (hijau logo asli `#7FA33F` hanya 2,4:1 di
  latar pagi, tidak boleh jadi teks). Pembaca layar membaca kalimat utuh (`.sr-only`), versi per kata `aria-hidden`.
  Empat pill fakta (garis 1px, sudut 3px, `.orn-leaf`) tersusun tangga tidak simetris, `data-muncul` dengan jeda `--d`.
- **Kenapa LCDU** (selesai): empat panel `.why-panel`, tiap panel = `<button aria-expanded aria-controls>` (urutan baca:
  nomor, judul, kata Arab; kata Arab dipindah ke atas lewat `order`). Desktop ≥ 960px: panel tinggi berjajar, tepat satu
  aktif (hover/fokus/klik) melebar 3 : 1 (`flex-grow`), teks lebar tetap 34ch muncul setelah panel melebar; saat pertama
  terlihat menyala 2 → 3 → 4 → 1 sekali lalu berhenti (interaksi menghentikannya). HP: panel terbuka saat melewati tengah
  layar dan tetap terbuka, ketuk untuk membuka/menutup. Kata Arab (Reem Kufi, `white-space:nowrap`, ukuran harus muat di
  panel sempit) = garis 1,2px, terisi saat aktif. Biru (`--lazuardi-ink`) panel 1–2, hijau (`--zamrud-ink`) panel 3–4.
  Reduced-motion / tanpa JS: `.why-statis` (semua terbuka, sama lebar). Kata Arab hanya yang sudah ada: مَنْهَج،
  عَنْ بُعْد، مُعَلِّم، القُرْآن.
- **Pilih kelas** (selesai): layar terbelah penuh-lebar `#split`, `--a` (didaftarkan `@property`) = lebar sisi Inggris %.
  Desktop ≥ 700px: grid `--a% | sisa`, pegangan `role="slider"` (30–70, panah/Home/End lompat ke snap 30/50/70, tarik
  lalu snap), klik sisi sempit → 70%. Sisi ≥ 60% menampilkan rincian (label, strip 7 hari, slot foto); rincian berlebar
  tetap `70vw − padding` supaya tidak mengalir ulang saat ditarik, dan selalu ada di DOM. Sisi Arab rata kanan &
  dicerminkan (foto di kiri), urutan hari tetap Sen → Min. HP < 700px: panel atas–bawah, ketuk judul/panel untuk membuka,
  panel lain deskripsinya dipendekkan 2 baris. Hari kelas = lentera (`--lentera`). Glyph latar Aa / أب (yang sudah ada).
  Slot foto = `.orn-net` (komentar `SLOT FOTO KELAS` di HTML). Jadwal belum diverifikasi (README). Tanpa daftar level.
- **Biaya** (selesai): angka besar + paragraf di kiri, struk di kanan (HP: di bawah). Struk keluar dari celah printer
  mengikuti scroll: `--cetak` (`@property`, awal 1 = penuh) dianimasikan view timeline `.receipt-wrap` (`cover 12% → 48%`),
  struk hanya di-`translateY` di dalam `.struk-jendela` (overflow hidden) — teks tetap di DOM dan terbaca berurutan.
  Kertas bertekstur garis halus, tanpa bayangan; tepi bawah sobekan zigzag keffiyeh (`--orn-sobek` sebagai masker).
  Teks struk persis dari pemilik (kepala, "Total per term", catatan biaya registrasi, penutup "Terima kasih sudah belajar
  bersama LCDU."). Catatan donasi Palestina di bawah struk. Tanpa count-up, tanpa stempel.
- Pita setelah hero: hanya `.kufiyah` (keffiyeh × semangka, tanpa teks, keputusan terkunci). Ticker berteks sudah dihapus.
- **Gerak (hanya tiga, + ayunan semangka)**: `data-muncul` (pudar + naik 12px, sekali; jeda opsional `--d`), `data-tergambar` (garis terbentang mengikuti scroll;
  view timeline, cadangan JS `--t`), `.menyala` (cahaya hangat menyala saat terlihat, padam di luar layar). Token
  `--dur-muncul --dur-menyala --ease-muncul --ease-menyala`. JS memasang `.gerak` di `<html>` hanya bila bukan
  reduced-motion; tanpa `.gerak` semuanya tampil diam & utuh.

## Keputusan yang sudah dikunci (jangan diubah tanpa bertanya)
- Hero harus jelas: kursus bahasa Arab & Inggris yang nirlaba untuk dakwah dan umat. Pesan Palestina tetap ada lewat cerita
  **gelap → terang**. Cerita 3 babak lewat scroll (copy persis, hanya pemilik yang mengubah):
  1. "Kelas Bahasa Arab & Inggris untuk dakwah dan umat." 2. "Setiap ilmu yang kita pelajari menyalakan satu cahaya."
  3. "Bersama, kita nyalakan harapan untuk Palestina."
- Wordmark permanen kiri atas hero: logo + "LCDU" saja (keputusan pemilik; nama panjang hanya untuk pembaca layar, `.sr-only`).
  Identitas, bukan tombol/tautan.
- Biaya (fakta dari pemilik): **Rp100.000 per term (1 term = 1 semester).** Di term pertama biaya ini disebut
  **biaya registrasi**. Dilarang menulis "gratis", "Rp0", "sudah termasuk seluruh biaya belajar", atau "tanpa biaya
  tambahan". Angka utama selalu Rp100.000 per term.
- **Donasi terbuka = untuk Palestina**, sukarela, terpisah dari biaya kelas, disalurkan melalui **AWG (Aqsa Working Group)**,
  mitra lama. Tidak ada "Donasi LCDU" terpisah di halaman.
- **Urutan section setelah hero** (id dalam kurung): Pengantar (`pengantar`), Kenapa LCDU (`kenapa`), Pilih kelas (`kelas`),
  Biaya (`biaya`), Cara bergabung = syarat + Placement Test + langkah (`bergabung`), Testimoni (`testimoni`), Tim (`tim`),
  FAQ (`faq`), Donasi untuk Palestina (`donasi`), Footer. Pemetaan fase: Pengantar & Kenapa = pagi; Kelas & Biaya = siang;
  Bergabung & Testimoni = sore; Tim & FAQ = senja; Donasi & Footer = malam. Navbar: Kelas, Biaya, Cara bergabung, Tim,
  FAQ, Donasi + pill "Daftar" (→ `#bergabung`).
- Section "Cek level" (kuis 3 soal) **dihapus**; diganti Placement Test resmi LCDU (tautan di `site-config.js`).
- Aturan UI: **tidak ada tombol "langkah berikutnya"** di tiap section. Tombol hanya di titik keputusan nyata: Placement
  Test, pill "Daftar" navbar, Tanya admin, Salin rekening & Konfirmasi transfer, CTA footer. Eyebrow maksimal 2 di seluruh
  halaman. Hanya tiga jenis gerak: **muncul, tergambar, menyala**. Tanpa scroll-jacking, tanpa pin horizontal. Semua
  gerak mati saat `prefers-reduced-motion`.
- **Anti-"AI slop"**: tanpa gradasi pada teks, tanpa emoji sebagai ikon, tanpa glassmorphism (pengecualian: navbar kaca,
  keputusan pemilik sebelumnya — perlu dikonfirmasi), tanpa tiga kartu simetris yang seragam, tanpa label kosong
  ("✨ Baru"), tanpa kalimat generik yang bisa ditempel ke lembaga lain, tanpa bayangan berlebihan dan sudut membulat
  penuh di mana-mana. Pakai tipografi tegas (Fraunces), garis halus, ritme tidak simetris, ruang kosong yang disengaja.
  Setiap section wajib lolos dua uji: **uji tukar** (bisakah teks ini dipindah ke lembaga lain tanpa diubah? kalau bisa,
  tulis ulang) dan **uji picing** (apakah hierarkinya tetap terbaca saat layar dipicingkan?).
- Narasi: harapan & semangat, bukan kesedihan. Tidak ada gambar penderitaan, tidak ada tema Isra Mi'raj.
- Tidak ada klik-untuk-lentera. **Tanpa parallax** di hero: teks babak hanya memudar, kamera/ilustrasi tidak mengikuti kursor.
  Scroll harus pendek dan jelas (tinggi hero 340vh; dinaikkan dari 290vh karena pemilik merasa transisi terlalu cepat).
- Tiga babak = tiga suasana yang jelas berbeda (permintaan pemilik), berubah bertahap sepanjang scroll, bukan melompat:
  Foto: malam → fajar biru + lampu menyala → subuh (bulan, bintang & biru memudar dulu; lapisan dari foto fajar yang
  diredam) → matahari terbit keemasan. Laju perubahan p dibatasi (`MAX_RATE` di hero.js) supaya scroll cepat tidak melompat.
  3D pagi = sudut matahari pagi (bukan siang), cahaya hangat & terang, kabut tipis — pemilik ingin "terik" tapi tidak pucat. 3D: malam → fajar ungu-jingga → pagi cerah
  (matahari tinggi, langit biru, kabut tipis). Teks babak 3 di Foto berwarna biru tua `#10163A` di atas langit terang
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
- Varian "Mozaik" sudah ditolak dan dihapus. Yang masih dibandingkan: **Lentera** vs **3D**.
- Logo resmi: `assets/brand/` (PNG transparan; turunan web di `assets/brand/web/`, versi warna & putih). Jangan ubah bentuk,
  proporsi, atau huruf logo. Navbar/footer: warna di mode terang, putih di mode gelap; hero selalu putih.
- Palet **semangka-keffiyeh × logo** (diminta pemilik, sesi fondasi seni; menggantikan latar krem-persik lama):
  hijau LCDU = hijau logo persis `#7FA33F` (`--logo-hijau`, juga kulit muda semangka; dekor saja, bukan teks),
  hijau kulit tua `#1E6B3A` (`--kulit`), biru logo `#1724C0` (`--logo-biru`/`--lazuardi`), merah semangka `#E23B4A`
  (`--semangka`, dekor & judul sangat besar), merah tua `#B3202E` (`--semangka-tua`, teks merah & blok merah ber-teks),
  hitam keffiyeh `#111111` (`--keffiyeh`), putih (`--putih`), kunyit `#FFC21A` (tidak berubah). Latar dasar putih hangat
  `#FCF9F4`. **Peran**: hijau = Bahasa Arab & identitas LCDU (teks Arab = `--kulit`, keputusan pemilik; di malam = hijau
  logo), biru = Bahasa Inggris, merah = aksen hangat & blok besar (blok ber-teks selalu merah tua), hitam + putih = pola
  keffiyeh, kunyit = **hanya** tombol aksi. Nama token lama dipertahankan supaya komponen tidak berubah:
  `--zamrud`/`--zamrud-ink` = `--kulit`. `--lazuardi`/`--zamrud` = **isi** (latar dengan teks putih);
  `--lazuardi-ink`/`--zamrud-ink` = **tinta** (teks, garis indikator; lebih terang di malam/mode gelap).
- Font (dipilih pemilik): **Fraunces** (judul, `--f-display`), Plus Jakarta Sans (teks), Reem Kufi (judul Arab),
  Noto Naskh Arabic (teks Arab). woff2 variabel di-host sendiri di `fonts/` (subset Latin/Arab, `font-display: swap`,
  preload Fraunces + Plus Jakarta), bukan CDN. Unbounded tidak dipakai lagi.
- Tata letak teks hero (dipilih pemilik): **kiri-bawah, rata kiri** untuk Lentera lama & 3D. **Lentera HD**: teks di area
  langit — layar tegak di ±8–45% tinggi layar (kubah foto ada di 52–77%, teks tidak boleh menyentuhnya), desktop kiri-atas;
  pita gelap tipis di atas (wordmark) + bayangan elips di belakang teks babak 1–2, kontras ≥ 4.5:1 di semua babak. Petunjuk gulir di atas keffiyeh, di area pohon zaitun.
- Aset hero Foto: pasangan **tall** (1024×1536, night-tall + dawn-tall) dan **wide** (1536×1024, night-wide-v2 +
  dawn-wide) — keduanya lulus `tools/check-align.py` (≤ 4 px per zona pada lebar 1536, korelasi ≥ 0,40). Pasangan baru
  wajib lulus skrip itu dulu. `night-wide.png` lama tidak sejajar dan tidak dipakai. **Jangan pernah memperbesar gambar melampaui resolusi aslinya**; butiran film halus
  ditampilkan otomatis bila foto tampil lebih besar dari aslinya. Target unduhan hero di HP < 700 KB (sekarang ±150 KB AVIF).

## Prioritas berikutnya
1. Pemilik memilih Lentera atau 3D (atau gabungan). Bantu dengan prototipe yang bisa dilihat di browser pane.
   Hero Foto jalan di layar tegak dan melebar.
2. Naikkan kualitas visual varian terpilih:
   - 3D: sudah detail prosedural + bloom + Lenis + GSAP. Berikutnya bila perlu: model glTF berlisensi (Draco/Meshopt).
   - Lentera: ilustrasi lebih detail (bisa SVG dari desainer), cahaya bertekstur, transisi fajar lebih sinematik.
3. Lanjut section lain satu per satu (pemilik ingin dibahas per section, perubahan berani boleh). Fondasi sudah ada
   (fase, benang, ornamen, gerak, konfigurasi). Masih memakai isi lama dan perlu didesain ulang:
   Bergabung, Testimoni, Tim, Donasi, Footer. FAQ masih stub. Selesai: Pengantar, Kenapa, Kelas, Biaya.
   Fondasi seni (palet semangka-keffiyeh, ornamen v2, bingkai lengkung, foto stok) sudah ada dan **menunggu persetujuan
   pemilik** di `ornamen-test.html`. Sesi berikutnya: blok warna kuat per section Pengantar–Biaya memakai fondasi itu
   (isi & tata letak section belum diubah).
4. Sebelum serah terima ke IT: pertimbangkan Astro + komponen, optimasi gambar (AVIF/WebP), Lighthouse ≥ 90 mobile.

## Aturan kualitas
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
