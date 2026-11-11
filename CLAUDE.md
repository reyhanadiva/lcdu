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
- `hero/lentera.js` + `hero/scene2d.js` — varian 2D (canvas): ilustrasi Al-Aqsa malam & fajar, cahaya kontribusi.
- `hero/diorama.js` — varian 3D (three.js r160, di-vendor di `vendor/three/`, lewat importmap di `index.html`), bloom,
  GSAP (lisensi standar GreenSock, bukan MIT) untuk easing kamera, kualitas otomatis & fallback ke Lentera.
- `vendor/lenis/` — scroll halus seluruh halaman (mati saat reduced-motion). Klik anchor ditangani sendiri di `index.html`
  supaya `scroll-margin-top` dihormati.

## Keputusan yang sudah dikunci (jangan diubah tanpa bertanya)
- Hero harus jelas: kursus bahasa Arab & Inggris yang nirlaba untuk dakwah dan umat. Pesan Palestina tetap ada lewat cerita
  **gelap → terang**. Cerita 3 babak lewat scroll (copy persis, hanya pemilik yang mengubah):
  1. "Kelas Bahasa Arab & Inggris untuk dakwah dan umat." 2. "Setiap ilmu yang kita pelajari menyalakan satu cahaya."
  3. "Bersama, kita nyalakan harapan untuk Palestina."
- Wordmark permanen kiri atas hero: "LCDU" + "Language Course for Da'wah & Ummah" (identitas, bukan tombol/tautan).
- Biaya (fakta dari pemilik): **Rp100.000 per term, tidak gratis.** Jangan menulis "gratis" di mana pun. Klaim lama
  (angka "Rp0", "tidak ada biaya kursus bulanan") berisiko dibaca "gratis" dan menunggu keputusan pemilik — jangan ubah diam-diam.
- Narasi: harapan & semangat, bukan kesedihan. Tidak ada gambar penderitaan, tidak ada tema Isra Mi'raj.
- Tidak ada klik-untuk-lentera. **Tanpa parallax** di hero: teks babak hanya memudar, kamera/ilustrasi tidak mengikuti kursor.
  Scroll harus pendek dan jelas.
- Kursor: kursor bawaan tidak disembunyikan, tidak ada kursor kustom. Di hero: cahaya hangat lembut mengikuti kursor
  (HP: mengikuti jari) dan menyingkap fajar di sekitarnya. Di luar hero: tanpa efek kursor khusus.
- Navbar: tersembunyi selama hero; setelahnya muncul saat scroll ke atas, sembunyi saat ke bawah; muncul saat fokus
  keyboard; skip link "Lewati ke konten"; tanpa slide saat reduced-motion.
- Teks hero kontras ≥ 4.5:1 di semua babak (scrim), dan tidak menutupi kubah.
- Penanda Palestina: Kubah Shakhrah + Masjid Qibli (kompleks Al-Aqsa), pohon zaitun, motif keffiyeh × semangka di tepi bawah hero.
- Varian "Mozaik" sudah ditolak dan dihapus. Yang masih dibandingkan: **Lentera** vs **3D**.
- Logo resmi: `assets/brand/` (PNG transparan; turunan web di `assets/brand/web/`, versi warna & putih). Jangan ubah bentuk,
  proporsi, atau huruf logo. Navbar/footer: warna di mode terang, putih di mode gelap; hero selalu putih.
- Palet (diselaraskan dengan logo, disetujui pemilik): biru Lazuardi (Inggris) = biru logo `#1724C0`, hijau Zamrud (Arab)
  `#5B752D` = hijau logo `#7FA33F` digelapkan (hue sama), kuning Kunyit `#FFC21A` (aksi, tidak berubah).
  `--lazuardi`/`--zamrud` = **isi** (latar dengan teks putih); `--lazuardi-ink`/`--zamrud-ink` = **tinta** (teks, garis
  indikator; lebih terang di mode gelap); `--logo-biru`/`--logo-hijau` = warna logo persis, hanya dekoratif, bukan teks.
- Font (dipilih pemilik): **Fraunces** (judul, `--f-display`), Plus Jakarta Sans (teks), Reem Kufi (judul Arab),
  Noto Naskh Arabic (teks Arab). woff2 variabel di-host sendiri di `fonts/` (subset Latin/Arab, `font-display: swap`,
  preload Fraunces + Plus Jakarta), bukan CDN. Unbounded tidak dipakai lagi.
- Tata letak teks hero (dipilih pemilik): **kiri-bawah, rata kiri**, ukuran fluid `clamp()`. Desktop: kubah di kanan;
  HP: kubah di tengah, diangkat di atas teks. Scrim radial kiri-bawah + scrim tipis di atas (wordmark).

## Prioritas berikutnya
1. Pemilik memilih Lentera atau 3D (atau gabungan). Bantu dengan prototipe yang bisa dilihat di browser pane.
   Varian "Lentera HD" (gambar asli malam/fajar) sudah diminta; gambarnya ada di `hero/*.png` (belum dipakai).
2. Naikkan kualitas visual varian terpilih:
   - 3D: sudah detail prosedural + bloom + Lenis + GSAP. Berikutnya bila perlu: model glTF berlisensi (Draco/Meshopt).
   - Lentera: ilustrasi lebih detail (bisa SVG dari desainer), cahaya bertekstur, transisi fajar lebih sinematik.
3. Lanjut section lain satu per satu (pemilik ingin dibahas per section, perubahan berani boleh).
4. Sebelum serah terima ke IT: pertimbangkan Astro + komponen, optimasi gambar (AVIF/WebP), Lighthouse ≥ 90 mobile.

## Aturan kualitas
- Wajib menghormati `prefers-reduced-motion`, fokus keyboard terlihat, kontras teks cukup, tidak ada scroll horizontal di 390px.
- Animasi berhenti saat tidak terlihat (IntersectionObserver). Cek performa di HP kelas menengah, bukan hanya laptop.
- Uji di 1440×900 dan 390×844 sebelum push.
- Jangan mengarang fakta: harga (Rp100.000/term), jadwal, nama guru, nomor rekening hanya dari data yang ada (lihat README checklist).
- Ayat & hadits: cantumkan rujukan, minta pemilik verifikasi di quran.kemenag.go.id. Jangan mengeluarkan fatwa.
- Commit kecil dengan pesan Bahasa Indonesia yang jelas. Tanyakan sebelum push jika perubahan besar.

## Belum lengkap (lihat juga checklist di README)
Foto asli (tim, kelas, testimoni), logo LCDU & mitra, link WhatsApp/Placement Test/formulir, ejaan 5 nama guru,
nama yayasan di rekening, pemisahan tujuan donasi LCDU vs Palestina.
