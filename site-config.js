/* Konfigurasi situs LCDU — satu tempat untuk data yang sering berubah (tautan, status tes, kontak, rekening).
   Halaman (index.html) membaca objek ini lewat atribut data-cfg-href, data-cfg-text, dan data-wa.
   Untuk tim IT: kelak bisa diganti dengan data dari CMS. Cukup pertahankan bentuk objek ini (nama kunci yang sama),
   atau ubah fungsi `cfg()` di index.html agar membaca dari sumber lain. Teks di HTML tetap menjadi cadangan
   bila berkas ini gagal dimuat. */
window.LCDU_CONFIG = {
  /* Nama lengkap LCDU. Ejaan di situs-situs saudara berbeda ("dan" / "&"): PERLU DIVERIFIKASI pemilik, lalu pakai SATU
     ejaan yang sama di semua tempat (juga <title>, meta description, dan teks pembaca layar di hero pada index.html). */
  lcdu: {
    namaLengkap: "Language Course for Da'wah dan Ummah"
  },

  /* Placement Test resmi LCDU, PER BAHASA (en = Inggris, ar = Arab).
     open: true  → kartu Placement Test menampilkan tombol "Mulai tes Inggris" / "Mulai tes Arab" menuju `url` (halaman
                   AWAL tes, "-rule"; tombol "Mulai Test" ada di akhir halaman itu); tes lain yang tutup = "tutup sementara";
     open: false untuk KEDUANYA → satu kalimat "Placement Test Inggris dan Arab sedang tutup sementara." + tombol
                   "Tanya Admin lewat WhatsApp".
     urlSoal = halaman soal langsung (disimpan sebagai data, tidak dipakai di halaman). */
  placement: {
    en: { open: false, url: 'https://lcdu.org/en-placement-rule/', urlSoal: 'https://lcdu.org/en-placement/' },
    ar: { open: false, url: 'https://lcdu.org/ar-placement-rule/', urlSoal: 'https://lcdu.org/ar-placement/' }
  },

  /* WhatsApp Admin (diambil dari lcdu.org — PERLU DIVERIFIKASI pemilik sebelum live).
     nomor: format internasional tanpa "+" dan tanpa spasi, dipakai untuk tautan wa.me.
     pesan: teks awal yang otomatis terisi di WhatsApp, sesuai tombol yang diklik (data-wa="umum" dst.). */
  whatsappAdmin: {
    tampil: '0819-6009-333',
    nomor: '628196009333',
    pesan: {
      umum: "Assalamu'alaikum, saya ingin bertanya tentang kelas LCDU.",
      placement: "Assalamu'alaikum, saya ingin bertanya kapan Placement Test LCDU dibuka.",
      konfirmasi: "Assalamu'alaikum, saya ingin konfirmasi transfer donasi untuk Palestina."
    }
  },

  /* Yayasan pengelola LCDU: tautan dari Pengantar ("Dikelola Yayasan …") dan footer. Nama di rekening tetap teks biasa. */
  yayasan: {
    nama: 'Yayasan Taqwa Cerdas Kreatif',
    url: 'https://alfacentauri.sch.id/yayasan/'
  },

  /* Donasi terbuka = untuk Palestina, disalurkan melalui AWG. */
  donasi: {
    mitra: 'Aqsa Working Group (AWG)',
    url: 'https://aqsaworkinggroup.com/',
    /* siapTayang: false → lembar rekening disembunyikan, diganti "Donasi akan segera dibuka. Hubungi Admin".
       Ubah ke false bila Yayasan belum mengonfirmasi izin penghimpunan donasi (PUB) dan nama rekening. */
    siapTayang: true,
    /* Logo AWG di panel Donasi: path berkas (mis. 'assets/partners/awg.svg'). KOSONG = tidak tampil.
       Pasang hanya dengan izin tertulis AWG. */
    logo: ''
  },

  /* Kontak tambahan di footer. KOSONG = tidak ditampilkan (jangan mengarang akun/alamat).
     email: alamat email; instagram: URL profil lengkap (https://instagram.com/…); alamat: teks alamat sekretariat. */
  kontak: {
    email: '',
    instagram: '',
    alamat: ''
  },

  /* Kantor LCDU (section "Kantor LCDU" + footer "Hubungi kami"). Tautan peta & titik dari pemilik (Google Maps "LCDU
     Bandung", 17 Nov 2026). Alamat jalan dari pemilik ("Jl. Diponegoro …"); nomor, kelurahan, kecamatan & kode pos diambil
     dari footer situs TK Alfa Centauri (Lokasi Diponegoro) — PERLU DIKONFIRMASI pemilik. Kosongkan `lengkap` untuk
     menyembunyikan alamat. */
  kantor: {
    nama: 'Kantor LCDU Bandung',
    jalan: 'Jl. Diponegoro No. 48',
    kota: 'Kota Bandung',
    lengkap: 'Jl. Diponegoro No. 48, Citarum, Bandung Wetan, Kota Bandung 40115',
    singkat: 'Jl. Diponegoro No. 48, Bandung',   // footer (pemilik: cukup ini)
    peta: 'https://maps.app.goo.gl/BMVJsNqZdJs6WWMz8',
    lat: -6.9013996,
    lng: 107.6241906
  },

  /* Jaringan pendidikan (footer, tautan keluar), urutan & nama seperti footer situs saudara (SD/TK/English Now).
     URL dari halaman Yayasan https://alfacentauri.sch.id/yayasan/ (dicek 17 Nov 2026; PAUD/TK = /tk). Hanya entri yang
     URL-nya TERISI yang tampil. JANGAN menebak URL. Yayasan memakai URL yang sama dengan yayasan.url. */
  /* Dipakai di DUA tempat: pita "Jaringan pendidikan" (akhir Pengantar) dan kolom footer. `logo` = berkas logo RESMI di
     assets/jaringan/ (PNG/SVG transparan, versi warna, tinggi ≥ 80 px); kosong = nama unit ditampilkan sebagai tulisan. */
  jaringan: [
    { nama: 'Yayasan Taqwa Cerdas Kreatif', url: 'https://alfacentauri.sch.id/yayasan/', logo: '' },
    { nama: 'TK Alfa Centauri', url: 'https://alfacentauri.sch.id/tk', logo: '' },
    { nama: 'SD Alfa Centauri', url: 'https://sdalfacentauri.sch.id', logo: '' },
    { nama: 'SMP Alfa Centauri', url: 'https://smpalfacentauri.sch.id', logo: '' },
    { nama: 'SMA Alfa Centauri', url: 'https://smaalfacentauri.sch.id', logo: '' },
    { nama: 'English Now', url: 'https://englishnow.co.id', logo: '' }
  ],

  /* Mitra di footer: [{ nama: 'Nama mitra', url: 'https://…', logo: 'assets/partners/nama.svg' }].
     KOSONG = baris mitra disembunyikan. Pasang logo hanya dengan izin pemiliknya. */
  mitra: [],

  /* Rekening (data yang sudah ada di halaman). PERLU DIVERIFIKASI: apakah rekening ini dipakai untuk donasi
     Palestina, dan apakah nama pemilik rekening persis sama dengan buku rekening. */
  rekening: {
    bank: 'Bank Muamalat',
    nomor: '10.10.11.83.94',
    atasNama: 'Yayasan Taqwa Cerdas Kreatif'
  }
};
