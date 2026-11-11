# LCDU landing page — konteks untuk Claude Code

## Proyek
Landing page marketing LCDU: kelas Bahasa Arab & Inggris online (usia 16+), program non-profit di bawah
Yayasan Taqwa Cerdas Kreatif (Alfa Centauri Schools, Bandung). Tujuan halaman: pendaftaran siswa dan donasi.
Pemilik: Bapak Reyhan (non-developer, berpikir sebagai desainer). Kode akhirnya diserahkan ke tim IT sekolah.

- Repo: `reyhanadiva/lcdu`, branch `main` → deploy otomatis ke Vercel (situs statis, tanpa build step).
- Komunikasi dengan pemilik: Bahasa Indonesia, sapa "Bapak". Setiap akhir jawaban, beri 1–2 kosakata/grammar
  bahasa Inggris level C1–C2 dengan contoh kalimat (permintaan pribadi pemilik).
- Jangan kirim screenshot ke pemilik kecuali diminta; ia mengecek sendiri di Vercel.

## Menjalankan lokal
Situs statis. Modul ES butuh server (bukan `file://`):
`python3 -m http.server 8000` atau `npx serve .` → buka `http://localhost:8000/?hero=lentera` atau `?hero=diorama`.

## Struktur
- `index.html` — seluruh halaman (CSS & JS section non-hero inline). Token warna/font di `:root` paling atas.
- `hero/hero.js` — pengendali hero: scroll → progres `p` (0..1), kursor, teks per babak, pemuat varian, tombol pembanding.
  Varian = modul `export default { mount(container, state) → { frame(state, now), resize(), destroy() } }`.
- `hero/lentera.js` + `hero/scene2d.js` — varian 2D (canvas): ilustrasi Al-Aqsa malam & fajar, cahaya kontribusi.
- `hero/diorama.js` — varian 3D (three.js r160, di-vendor di `vendor/three/`, lewat importmap di `index.html`).

## Keputusan yang sudah dikunci (jangan diubah tanpa bertanya)
- Konsep hero: **gelap → terang**. Cerita 3 babak lewat scroll, tanpa tombol/teks tambahan di dalam hero:
  1. "Bahasa untuk umat." 2. "Setiap ilmu yang kita pelajari menyalakan satu cahaya." 3. "Bersama, kita nyalakan harapan untuk Palestina."
- Narasi: harapan & semangat, bukan kesedihan. Tidak ada gambar penderitaan, tidak ada tema Isra Mi'raj.
- Tidak ada klik-untuk-lentera, tidak ada parallax berlebihan pada elemen hero. Scroll harus pendek dan jelas.
- Penanda Palestina: Kubah Shakhrah + Masjid Qibli (kompleks Al-Aqsa), pohon zaitun, motif keffiyeh × semangka di tepi bawah hero.
- Varian "Mozaik" sudah ditolak dan dihapus. Yang masih dibandingkan: **Lentera** vs **3D**.
- Palet: biru Lazuardi (Inggris), hijau Zamrud (Arab), kuning Kunyit (aksi). Font: Unbounded, Plus Jakarta Sans, Reem Kufi, Noto Naskh Arabic.

## Prioritas berikutnya
1. Pemilik memilih Lentera atau 3D (atau gabungan). Bantu dengan prototipe yang bisa dilihat di browser pane.
2. Naikkan kualitas visual varian terpilih:
   - 3D: ganti bangunan primitif dengan model glTF Al-Aqsa yang detail (berlisensi, kompres dengan Draco/Meshopt),
     pencahayaan & material lebih kaya, post-processing ringan (bloom untuk lentera), scroll halus (Lenis), easing kamera (GSAP).
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
