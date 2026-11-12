// Pustaka ornamen → assets/ornaments/*.svg   (node tools/make-ornaments.mjs)
// - <nama>.svg            : satu warna hitam di latar transparan = MASKER (CSS mewarnainya dengan currentColor/token)
// - <nama>-<warna>.svg    : versi siap pakai dua warna (putih + hitam/merah/hijau) untuk desainer & border-image
// - semangka-*.svg        : warna semangka tertanam (datar, tanpa gradasi, tanpa wajah)
// Semua pola berulang tanpa sambungan: ukuran ubin = periode pola.
import fs from 'node:fs';

const OUT = new URL('../assets/ornaments/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const WARNA = { hitam: '#111111', merah: '#B3202E', hijau: '#1E6B3A' };   // = --keffiyeh, --semangka-tua, --kulit
const PUTIH = '#FFFFFF';
const S = { kulit: '#1E6B3A', muda: '#7FA33F', putih: '#FFFFFF', daging: '#E23B4A', biji: '#111111' };

const svg = (w, h, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>${body}</svg>\n`;
const r = n => +n.toFixed(2);

// ---------- pola kain keffiyeh ----------
// Jaring (fishnet) bagian tengah kain: garis diagonal dua arah, simpul berlian di persilangan, titik di tengah mata jaring.
const jaring = (c = '#000') => svg(24, 24,
  `<path d="M0 0L24 24M24 0L0 24" stroke="${c}" stroke-width="1.6"/>` +
  `<path d="M12 9.2L14.8 12 12 14.8 9.2 12ZM0 -2.8L2.8 0 0 2.8-2.8 0ZM24 -2.8L26.8 0 24 2.8 21.2 0ZM0 21.2L2.8 24 0 26.8-2.8 24ZM24 21.2L26.8 24 24 26.8 21.2 24Z" fill="${c}"/>` +
  `<circle cx="12" cy="3" r="1" fill="${c}"/><circle cx="12" cy="21" r="1" fill="${c}"/><circle cx="3" cy="12" r="1" fill="${c}"/><circle cx="21" cy="12" r="1" fill="${c}"/>`);

// Kotak houndstooth (ubin 8×8): kuadran kanan-bawah penuh + dua pita diagonal di kanan-atas & kiri-bawah.
const kotak = (c = '#000') => svg(8, 8,
  `<path fill="${c}" d="M4 4H8V8H4ZM4 2L6 0H8L4 4ZM6 4L8 2V4ZM0 6L2 4H4L0 8ZM2 8L4 6V8Z"/>`);

// Pita tepi kain (ubin 48×48): garis tebal, garis tipis, deret daun zaitun, garis gelombang, zigzag jaring, garis.
const daun = (cx, cy, rot, c) =>
  `<path transform="translate(${cx} ${cy}) rotate(${rot})" d="M-7 0C-4-3.6 4-3.6 7 0 4 3.6-4 3.6-7 0Z" fill="${c}"/>`;
// Ranting zaitun: tangkai mendatar, daun berselang atas–bawah tiap 6 unit (lebar ubin harus kelipatan 12 supaya tanpa sambungan), condong ke kanan.
const ranting = (w, y, c, k = 1) => {
  let s = `<rect y="${y - .45 * k}" width="${w}" height="${.9 * k}" fill="${c}"/>`;
  for (let x = 0, i = 0; x < w; x += 6, i++) {
    const atas = i % 2 === 0;
    s += `<path transform="translate(${x + 3.6 * k} ${y + (atas ? -2.6 : 2.6) * k}) rotate(${atas ? -32 : 32}) scale(${.62 * k})" d="M-7 0C-4-3.6 4-3.6 7 0 4 3.6-4 3.6-7 0Z" fill="${c}"/>`;
  }
  return s;
};
const pita = (c = '#000') => svg(48, 48,
  `<rect y="1" width="48" height="4" fill="${c}"/><rect y="8" width="48" height="1.2" fill="${c}"/>` +
  ranting(48, 17, c) +
  `<path d="M-12 30Q-6 35 0 30T12 30T24 30T36 30T48 30T60 30" fill="none" stroke="${c}" stroke-width="1.6"/>` +
  `<path d="M-4 36L0 40 4 36 8 40 12 36 16 40 20 36 24 40 28 36 32 40 36 36 40 40 44 36 48 40 52 36" fill="none" stroke="${c}" stroke-width="1.2"/>` +
  `<rect y="43" width="48" height="1.2" fill="${c}"/><rect y="46" width="48" height="2" fill="${c}"/>`);

// Pita sempit (ubin 24×24): dua garis + daun berselang + zigzag.
const pitaSempit = (c = '#000') => svg(24, 24,
  `<rect y="1" width="24" height="2" fill="${c}"/>` + ranting(24, 9.5, c, .75) +
  `<path d="M-3 16L0 19 3 16 6 19 9 16 12 19 15 16 18 19 21 16 24 19 27 16" fill="none" stroke="${c}" stroke-width="1.1"/>` +
  `<rect y="22" width="24" height="1.4" fill="${c}"/>`);

// Tepi bingkai: 9-slice 60×60 (potongan 20). Sudut = kotak dengan berlian; sisi = zigzag di antara dua garis.
const bingkai = (c = '#000') => svg(60, 60,
  `<g fill="none" stroke="${c}">` +
  // sisi atas, bawah, kiri, kanan
  `<path stroke-width="1.4" d="M20 3H40M20 17H40M20 43H40M20 57H40M3 20V40M17 20V40M43 20V40M57 20V40"/>` +
  `<path stroke-width="1.2" d="M20 14L25 6 30 14 35 6 40 14M20 54L25 46 30 54 35 46 40 54M14 20L6 25 14 30 6 35 14 40M54 20L46 25 54 30 46 35 54 40"/>` +
  // sudut
  `<path stroke-width="1.4" d="M3 3H17V17H3ZM43 3H57V17H43ZM3 43H17V57H3ZM43 43H57V57H43Z"/></g>` +
  `<path fill="${c}" d="M10 6L14 10 10 14 6 10ZM50 6L54 10 50 14 46 10ZM10 46L14 50 10 54 6 50ZM50 46L54 50 50 54 46 50Z"/>`);

const POLA = { 'kain-jaring': jaring, 'kain-kotak': kotak, pita, 'pita-sempit': pitaSempit, bingkai };
for (const [nama, f] of Object.entries(POLA)) {
  fs.writeFileSync(OUT + nama + '.svg', f());
  for (const [w, hex] of Object.entries(WARNA)) {
    let s = f(hex);
    // versi siap pakai: latar putih di bawah pola (bingkai tetap transparan supaya bisa dipakai sebagai border-image)
    if (nama !== 'bingkai') s = s.replace(/(<svg[^>]*>)/, `$1<rect width="100%" height="100%" fill="${PUTIH}"/>`);
    fs.writeFileSync(OUT + `${nama}-${w}.svg`, s);
  }
}

// pita tegak (untuk garis pembagi vertikal): pita sempit dicerminkan terhadap diagonal (x ↔ y), ubin tetap 24×24
{
  const isi = pitaSempit().replace(/^<svg[^>]*>|<\/svg>\n$/g, '');
  fs.writeFileSync(OUT + 'pita-sempit-tegak.svg', svg(24, 24, `<g transform="matrix(0 1 1 0 0 0)">${isi}</g>`));
}

// ---------- semangka ----------
// biji = tetesan (ujung lancip ke arah pusat irisan)
const biji = (x, y, rot, k = 1) =>
  `<path transform="translate(${r(x)} ${r(y)}) rotate(${r(rot)}) scale(${k})" d="M0-6C2.6-2.4 3.6 .4 3.6 2.4A3.6 3.6 0 0 1-3.6 2.4C-3.6 .4-2.6-2.4 0-6Z" fill="${S.biji}"/>`;

// Irisan setengah lingkaran (200×104): kulit tua, kulit muda, putih, daging, biji di dua busur.
{
  const cx = 100, cy = 2, R = [100, 93, 88, 83];
  const half = (rad, fill) => `<path d="M${cx - rad} ${cy}A${rad} ${rad} 0 0 0 ${cx + rad} ${cy}Z" fill="${fill}"/>`;
  let seeds = '';
  for (const [rad, n, k] of [[58, 7, 1], [34, 4, .9]]) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (i + .5) / n;                       // 0..π di bawah garis potong
      const x = cx + rad * Math.cos(a), y = cy + rad * Math.sin(a);
      seeds += biji(x, y, a * 180 / Math.PI - 90, k);  // ujung lancip menghadap pusat
    }
  }
  fs.writeFileSync(OUT + 'semangka-setengah.svg', svg(200, 104,
    half(R[0], S.kulit) + half(R[1], S.muda) + half(R[2], S.putih) + half(R[3], S.daging) + seeds));
}

// Irisan segitiga (120×140): busur kulit di atas, ujung lancip di bawah.
{
  const cx = 60, cy = 136, Rr = 132, sudut = 26;            // sudut paruh irisan (derajat)
  const titik = rad => {
    const a = (90 + sudut) * Math.PI / 180, b = (90 - sudut) * Math.PI / 180;
    return [cx + rad * Math.cos(a), cy - rad * Math.sin(a), cx + rad * Math.cos(b), cy - rad * Math.sin(b)];
  };
  const baji = (rad, fill) => {
    const [x1, y1, x2, y2] = titik(rad);
    return `<path d="M${cx} ${cy}L${r(x1)} ${r(y1)}A${rad} ${rad} 0 0 1 ${r(x2)} ${r(y2)}Z" fill="${fill}"/>`;
  };
  let seeds = '';
  for (const [rad, angs] of [[92, [-12, 0, 12]], [62, [-7, 7]], [36, [0]]]) {
    for (const d of angs) {
      const a = (90 + d) * Math.PI / 180;
      seeds += biji(cx + rad * Math.cos(a), cy - rad * Math.sin(a), -d + 180, .9);
    }
  }
  fs.writeFileSync(OUT + 'semangka-segitiga.svg', svg(120, 140,
    baji(Rr, S.kulit) + baji(Rr - 8, S.muda) + baji(Rr - 14, S.putih) + baji(Rr - 19, S.daging) + seeds));
}

// Sebaran biji (ubin 160×160, masker satu warna): posisi & rotasi tetap (bukan acak) supaya hasil stabil.
{
  const B = [[18, 22, 20, 1], [70, 12, -35, .85], [122, 30, 60, 1.1], [40, 70, 150, .9], [96, 64, -110, 1],
    [146, 92, 15, .8], [16, 118, -60, 1.05], [70, 120, 95, .9], [118, 142, -20, 1], [140, 4, 170, .75]];
  const body = B.map(([x, y, a, k]) => biji(x, y, a, k * 1.3)).join('').replaceAll(S.biji, '#000');
  fs.writeFileSync(OUT + 'semangka-biji.svg', svg(160, 160, body));
}

// ---------- bingkai lengkung (400×500): masker isi foto + garis ganda ----------
// d = jarak masuk dari tepi. Lengkung bulat = arkade Al-Aqsa; lancip = mihrab (dua pusat, R = 0,8 × lebar).
const bulat = d => {
  const w = 400 - 2 * d, rad = w / 2, s = d + rad;
  return `M${d} ${500 - d}V${s}A${rad} ${rad} 0 0 1 ${400 - d} ${s}V${500 - d}Z`;
};
const lancip = d => {
  const w = 400 - 2 * d, R = .8 * w, h = w * Math.sqrt(.64 - .09), s = d + h;
  return `M${d} ${500 - d}V${r(s)}A${r(R)} ${r(R)} 0 0 1 200 ${d}A${r(R)} ${r(R)} 0 0 1 ${400 - d} ${r(s)}V${500 - d}Z`;
};
for (const [nama, f] of Object.entries({ bulat, lancip })) {
  fs.writeFileSync(OUT + `lengkung-${nama}-isi.svg`, svg(400, 500, `<path d="${f(16)}"/>`, ' preserveAspectRatio="none"'));
  fs.writeFileSync(OUT + `lengkung-${nama}-garis.svg`, svg(400, 500,
    `<g fill="none" stroke="#000" vector-effect="non-scaling-stroke"><path d="${f(1.5)}" stroke-width="2" vector-effect="non-scaling-stroke"/>` +
    `<path d="${f(9)}" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`, ' preserveAspectRatio="none"'));
}
console.log('ornamen →', OUT, fs.readdirSync(OUT).length, 'berkas');
