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
| Hero | Cerita scroll 3 babak: gelap → cahaya kontribusi menyala → fajar. Dua varian untuk dibandingkan lewat tombol di kiri bawah (atau `?hero=lentera|diorama`): **Lentera** (ilustrasi 2D, ratusan cahaya kecil menyingkap warna fajar), **3D** (maket three.js, kamera bergerak dari malam ke fajar). Kode di folder `hero/`. Tepi bawah: motif keffiyeh × semangka. |
| Ticker | Keunggulan LCDU berjalan, bergantian Indonesia–Arab. |
| Cek level | Kuis 3 soal (Inggris / Arab) dengan pembahasan langsung dan perkiraan level. |
| Kenapa LCDU | Daftar tipografi besar, baris terbuka saat di-hover / di-tap. |
| Biaya | Struk yang "tercetak" saat masuk layar. |
| Kelas | Toggle Inggris/Arab; layout dicerminkan untuk Arab, jadwal ditampilkan sebagai strip hari. |
| Syarat | Checklist interaktif; CTA berubah sesuai jumlah syarat yang terpenuhi. |
| Cara daftar | Desktop: scroll vertikal menggerakkan 6 langkah secara horizontal. HP: daftar vertikal. |
| Testimoni | Tumpukan kartu yang bisa diseret. |
| Tim | Filter (Inggris / Arab / Pengelola), kartu miring mengikuti kursor, sertifikasi muncul saat hover. |
| Donasi | Nomor rekening + tombol salin. |
| Footer | Kosakata hari ini (Inggris + Arab), berganti tiap hari. |

Semua animasi menghormati `prefers-reduced-motion`. Kursor kustom hanya aktif di perangkat dengan mouse.

## Perlu dilengkapi / diverifikasi sebelum live

- [ ] **Foto**: slot foto kelas, foto tim (15), foto testimoni. Saat ini berupa kotak warna + inisial.
- [ ] **Logo** LCDU asli (saat ini wordmark sementara) dan logo mitra.
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
