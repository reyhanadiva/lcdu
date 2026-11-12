/* Konfigurasi situs LCDU — satu tempat untuk data yang sering berubah (tautan, status tes, kontak, rekening).
   Halaman (index.html) membaca objek ini lewat atribut data-cfg-href, data-cfg-text, dan data-wa.
   Untuk tim IT: kelak bisa diganti dengan data dari CMS. Cukup pertahankan bentuk objek ini (nama kunci yang sama),
   atau ubah fungsi `cfg()` di index.html agar membaca dari sumber lain. Teks di HTML tetap menjadi cadangan
   bila berkas ini gagal dimuat. */
window.LCDU_CONFIG = {
  /* Placement Test resmi LCDU, PER BAHASA (en = Inggris, ar = Arab).
     open: true  → tombol "Mulai Placement Test" menuju `url` (halaman AWAL tes, "-rule"; tombol "Mulai Test" ada di
                   akhir halaman itu);
     open: false → tombol diganti "Tanya admin lewat WhatsApp" + kalimat bahwa tes ditutup sementara.
     urlSoal = halaman soal langsung (disimpan sebagai data, tidak dipakai di halaman). */
  placement: {
    en: { open: false, url: 'https://lcdu.org/en-placement-rule/', urlSoal: 'https://lcdu.org/en-placement/' },
    ar: { open: false, url: 'https://lcdu.org/ar-placement-rule/', urlSoal: 'https://lcdu.org/ar-placement/' }
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

  /* Yayasan pengelola LCDU: tautan dari Pengantar ("Dikelola Yayasan …") dan footer. Nama di rekening tetap teks biasa. */
  yayasan: {
    nama: 'Yayasan Taqwa Cerdas Kreatif',
    url: 'https://alfacentauri.sch.id/yayasan/'
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
