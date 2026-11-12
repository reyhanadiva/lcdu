/* Konfigurasi situs LCDU — satu tempat untuk data yang sering berubah (tautan, status tes, kontak, rekening).
   Halaman (index.html) membaca objek ini lewat atribut data-cfg-href, data-cfg-text, dan data-wa.
   Untuk tim IT: kelak bisa diganti dengan data dari CMS. Cukup pertahankan bentuk objek ini (nama kunci yang sama),
   atau ubah fungsi `cfg()` di index.html agar membaca dari sumber lain. Teks di HTML tetap menjadi cadangan
   bila berkas ini gagal dimuat. */
window.LCDU_CONFIG = {
  /* Placement Test resmi LCDU.
     open: true  → tombol "Mulai tes" tampil;
     open: false → tombol tes disembunyikan, diganti tombol "Tanya admin". Tautan aturan tes tetap tampil. */
  placementTest: {
    open: false,
    inggris: { tes: 'https://lcdu.org/en-placement/', aturan: 'https://lcdu.org/en-placement-rule/' },
    arab:    { tes: 'https://lcdu.org/ar-placement/', aturan: 'https://lcdu.org/ar-placement-rule/' },
    teksBuka:  'Pilih tes sesuai bahasa yang ingin kamu pelajari. Baca aturannya dulu sebelum mulai.',
    teksTutup: 'Placement Test sedang ditutup. Tanyakan ke admin kapan tes dibuka lagi.'
  },

  /* WhatsApp admin (diambil dari lcdu.org — PERLU DIVERIFIKASI pemilik sebelum live).
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

  /* Donasi terbuka = untuk Palestina, disalurkan melalui AWG (mitra lama LCDU). */
  donasi: {
    mitra: 'Aqsa Working Group (AWG)',
    url: 'https://aqsaworkinggroup.com/'
  },

  /* Rekening (data yang sudah ada di halaman). PERLU DIVERIFIKASI: apakah rekening ini dipakai untuk donasi
     Palestina, dan apakah nama pemilik rekening persis sama dengan buku rekening. */
  rekening: {
    bank: 'Bank Muamalat',
    nomor: '10.10.11.83.94',
    atasNama: 'Yayasan Taqwa Cerdas Kreatif'
  }
};
