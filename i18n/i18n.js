/* LCDU — pilihan bahasa halaman: Indonesia (asli, di index.html), English, العربية.
   Cara kerja (situs statis, tanpa build step):
   1. <head> memasang lang + kelas `i18n-tunggu` (body disembunyikan sebentar supaya teks Indonesia tidak berkedip).
   2. Berkas ini (sinkron, sebelum skrip utama) memilih bahasa: ?lang=… → localStorage 'lcdu-bahasa' → 'id', lalu memuat
      kamus i18n/<lang>.js (sinkron, hanya bila bukan Indonesia).
   3. LCDU_I18N.terapkan() menerjemahkan HTML statis per "satuan" = elemen yang isinya hanya teks + elemen sebaris.
      Kunci satuan = teks Indonesia dengan penanda elemen: "Cukup empat hal: <0>usia 16+</0>, …". Terjemahan memakai
      penanda yang sama; elemen ASLI dipakai ulang (atribut, kelas, data-*, pendengar event tetap). Penanda yang tidak
      dipakai terjemahan = elemen dihapus. Atribut aria-label/title/placeholder/alt juga diterjemahkan.
   4. Teks yang dibuat skrip utama memakai window.LCDU_T('teks Indonesia', [nilai…]) → terjemahan, {0} {1} = nilai.
   Kamus kosong / kunci tidak ada → teks Indonesia tetap tampil (aman). Ganti bahasa = muat ulang halaman (?lang=en),
   jadi setiap bahasa punya URL sendiri. Arab: hanya arah TEKS kanan-ke-kiri (dir="rtl" per satuan), tata letak tetap.
   Untuk tim IT: kamus dibuat ulang/diperiksa dengan tools/i18n-cek.py (daftar kunci yang belum diterjemahkan). */
(function(){
  'use strict';
  var BAHASA = ['id', 'en', 'ar'], NAMA = { id: 'Indonesia', en: 'English', ar: 'العربية' }, PENDEK = { id: 'ID', en: 'EN', ar: 'عربي' };
  var dariUrl = null, simpan = null;
  try { dariUrl = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  try { simpan = localStorage.getItem('lcdu-bahasa'); } catch (e) {}
  var lang = BAHASA.indexOf(dariUrl) > -1 ? dariUrl : (BAHASA.indexOf(simpan) > -1 ? simpan : 'id');
  if (BAHASA.indexOf(dariUrl) > -1) try { localStorage.setItem('lcdu-bahasa', dariUrl); } catch (e) {}
  var rekam = /[?&]i18n-rekam\b/.test(location.search) ? {} : null;   // alat pengembang: catat semua kunci LCDU_T

  /* kamus dimuat sinkron (sama-origin) supaya siap sebelum skrip utama membangun FAQ, Tim, dst. */
  if (lang !== 'id') document.write('<script src="i18n/' + lang + '.js"><\/script>');

  var INLINE = /^(A|ABBR|B|BDI|BDO|CITE|CODE|DATA|DFN|EM|I|KBD|LABEL|MARK|Q|S|SAMP|SMALL|SPAN|STRONG|SUB|SUP|TIME|U|VAR)$/;
  var ATOM = /^(BR|WBR|IMG|PICTURE|SVG|svg|INPUT|SELECT|TEXTAREA|CANVAS|VIDEO|AUDIO|IFRAME|OBJECT)$/;
  var LEWAT = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|svg|SVG)$/;
  var ATRIBUT = ['aria-label', 'title', 'placeholder', 'alt', 'aria-roledescription', 'data-geser-nama'];

  function lewati(el){ return LEWAT.test(el.tagName) || el.hasAttribute('data-i18n-lewati'); }
  function adaTeks(el){ return /\S/.test(el.textContent); }
  function sebaris(el){
    for (var c = el.firstElementChild; c; c = c.nextElementSibling){
      if (lewati(c) || ATOM.test(c.tagName)) continue;
      if (!INLINE.test(c.tagName) || !sebaris(c)) return false;
    }
    return true;
  }
  function rapi(s){ return s.replace(/\s+/g, ' '); }
  /* kunci satuan + daftar elemen (urutan praorder) */
  function kunci(el, els){
    var s = '';
    for (var n = el.firstChild; n; n = n.nextSibling){
      if (n.nodeType === 3) s += n.nodeValue.replace(/</g, '&lt;');
      else if (n.nodeType === 1){
        var i = els.length; els.push(n);
        if (lewati(n) || ATOM.test(n.tagName) || !adaTeks(n)) s += '<' + i + '/>';
        else s += '<' + i + '>' + kunci(n, els) + '</' + i + '>';
      }
    }
    return s;
  }
  function kunciSatuan(el){ var els = []; return { k: rapi(kunci(el, els)).trim(), els: els }; }
  /* bangun ulang isi elemen dari terjemahan bertanda */
  function bangun(target, teks, els){
    var re = /<(\d+)\/>|<(\d+)>|<\/(\d+)>/g, tumpuk = [target], m, akhir = 0, frag;
    var bersih = function(el){ while (el.firstChild) el.removeChild(el.firstChild); };
    var tulis = function(t){ if (t) tumpuk[tumpuk.length - 1].appendChild(document.createTextNode(t.replace(/&lt;/g, '<'))); };
    bersih(target);
    while ((m = re.exec(teks))){
      tulis(teks.slice(akhir, m.index)); akhir = re.lastIndex;
      if (m[1] != null){ if (els[+m[1]]) tumpuk[tumpuk.length - 1].appendChild(els[+m[1]]); }
      else if (m[2] != null){ var e = els[+m[2]]; if (!e) continue; bersih(e); tumpuk[tumpuk.length - 1].appendChild(e); tumpuk.push(e); }
      else if (tumpuk.length > 1) tumpuk.pop();
    }
    tulis(teks.slice(akhir));
  }

  var K = null;   // kamus aktif: { k: {kunci: terjemahan}, pola: [[pola, terjemahan]], meta: {...} }
  function cari(s){
    if (!K) return null;
    if (Object.prototype.hasOwnProperty.call(K.k, s)) return K.k[s];
    return null;
  }
  function T(s, nilai){
    if (rekam) rekam[s] = 1;
    var t = cari(s); if (t == null) t = s;
    if (nilai) t = t.replace(/\{(\d+)\}/g, function(_, i){ return nilai[+i] != null ? nilai[+i] : ''; });
    return t;
  }
  window.LCDU_T = T;

  function terjemahkan(akar){
    var rtl = lang === 'ar', belum = [];
    (function jalan(el){
      if (lewati(el)) return;
      if (el !== document.body && sebaris(el) && adaTeks(el)){
        var u = kunciSatuan(el), t = cari(u.k);
        if (t != null){ if (t !== u.k) bangun(el, t, u.els); if (rtl) el.dir = 'rtl'; el.setAttribute('data-i18n', ''); }
        else belum.push(u.k);
        return;
      }
      for (var n = el.firstChild; n; n = n.nextSibling){
        if (n.nodeType === 1) jalan(n);
        else if (n.nodeType === 3 && /\S/.test(n.nodeValue)){
          var asli = rapi(n.nodeValue), k = asli.trim(), tt = cari(k);
          if (tt != null) n.nodeValue = asli.replace(k, tt); else belum.push(k);
        }
      }
    })(akar);
    var semua = akar.querySelectorAll('[' + ATRIBUT.join('],[') + ']');
    for (var i = 0; i < semua.length; i++) ATRIBUT.forEach(function(a){
      var v = semua[i].getAttribute(a); if (!v) return;
      var t = cari(rapi(v).trim()); if (t != null) semua[i].setAttribute(a, t); else if (/\S/.test(v)) belum.push('@' + v);
    });
    return belum;
  }

  /* pemilih bahasa: tautan biasa (?lang=…) — bekerja juga tanpa JS lanjutan; posisi baca dipertahankan lewat #section */
  function pemilih(kelas){
    var nav = document.createElement('div');   // grup, bukan landmark (dua pemilih di halaman → landmark ganda)
    nav.className = 'bahasa ' + (kelas || '');
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'Bahasa · Language · اللغة');
    nav.setAttribute('data-i18n-lewati', '');
    nav.innerHTML = BAHASA.map(function(b){
      return '<a href="?lang=' + b + '" hreflang="' + b + '" lang="' + b + '"' + (b === lang ? ' aria-current="true"' : '')
        + ' title="' + NAMA[b] + '"><span aria-hidden="true">' + PENDEK[b] + '</span><span class="sr-only">' + NAMA[b] + '</span></a>';
    }).join('');
    nav.addEventListener('click', function(e){
      var a = e.target.closest('a'); if (!a) return;
      var b = a.getAttribute('hreflang');
      try { localStorage.setItem('lcdu-bahasa', b); } catch (err) {}
      if (b === lang){ e.preventDefault(); return; }
      /* section yang sedang dibaca → hash, supaya setelah muat ulang tidak kembali ke atas */
      var y = innerHeight * .35, sec = null;
      document.querySelectorAll('main section[id]').forEach(function(s){ var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) sec = s; });
      a.href = '?lang=' + b + (sec && sec.id !== 'hero' ? '#' + sec.id : '');
    });
    return nav;
  }

  window.LCDU_I18N = {
    lang: lang,
    T: T,
    rekam: function(){ return rekam ? Object.keys(rekam) : []; },
    /* alat pengembang (tools/i18n-cek.py): semua kunci satuan & atribut di halaman Indonesia */
    kumpulkan: function(){
      var out = [], lihat = {};
      var simpan_ = K; K = { k: {} }; var b = terjemahkan(document.body); K = simpan_;
      b.forEach(function(k){ if (!lihat[k]){ lihat[k] = 1; out.push(k); } });
      return out;
    },
    terapkan: function(){
      var html = document.documentElement;
      if (rekam && lang === 'id') this.statis = this.kumpulkan();   // alat pengembang: kunci HTML statis (sebelum skrip utama)
      K = lang !== 'id' && window.LCDU_KAMUS && window.LCDU_KAMUS[lang] ? window.LCDU_KAMUS[lang] : null;
      if (lang !== 'id' && !K){ lang = this.lang = 'id'; }
      html.lang = lang;
      if (K){
        this.belum = terjemahkan(document.body);
        if (K.meta){
          if (K.meta.title) document.title = K.meta.title;
          var d = document.querySelector('meta[name="description"]'); if (d && K.meta.description) d.setAttribute('content', K.meta.description);
        }
      }
      /* pemilih: di navbar (sebelum tombol Daftar); navbar kini tampil juga di atas hero */
      var navBtn = document.querySelector('.nav-bar > .btn'); if (navBtn) navBtn.parentNode.insertBefore(pemilih('bahasa-nav'), navBtn);
      html.classList.remove('i18n-tunggu');
    }
  };
})();
