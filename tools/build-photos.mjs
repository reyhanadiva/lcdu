// Foto stok sementara → assets/photos/<nama>-<lebar>.avif|webp (lihat assets/photos/CREDITS.md).
// Pemakaian: node build-photos.mjs <folder-berisi-jpg-asli>   (nama berkas = kunci di FOTO, mis. zaitun.jpg)
// Tidak pernah memperbesar melampaui resolusi asli. Potongan (crop) dalam pecahan lebar/tinggi asli.
//
// Potret ASLI (Testimoni / Tim) — hanya foto yang sudah disetujui pemiliknya (izin tertulis; wali bila < 18 tahun):
//   node build-photos.mjs --potret <folder-jpg> stories   → assets/stories/<slug>-480.avif|webp + manifest.json
//   node build-photos.mjs --potret <folder-jpg> team      → assets/team/<slug>-480.avif|webp + manifest.json
// Nama berkas = slug (huruf kecil, tanda hubung), mis. aninda-salma.jpg. Dipotong 4:5 di tengah (atur dengan
// <slug>.jpg yang sudah dipotong bila wajah tidak di tengah), lebar 480 (tidak diperbesar), kualitas diturunkan
// bertahap sampai ≤ 60 KB per berkas. Halaman hanya memakai slug yang tercantum di manifest.json.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

if (process.argv[2] === '--potret') {
  const [, , , src, folder] = process.argv;
  if (!src || !['stories', 'team'].includes(folder)) { console.error('Pakai: node build-photos.mjs --potret <folder-jpg> stories|team'); process.exit(1); }
  const out = new URL(`../assets/${folder}/`, import.meta.url).pathname, BATAS = 60 * 1024;
  fs.mkdirSync(out, { recursive: true });
  const manifestPath = path.join(out, 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  for (const f of fs.readdirSync(src).filter(f => /\.(jpe?g|png)$/i.test(f))) {
    const slug = f.replace(/\.[^.]+$/, '').toLowerCase();
    const meta = await sharp(path.join(src, f)).rotate().metadata();
    const w = Math.min(480, meta.width, Math.floor(meta.height * 4 / 5));
    const base = () => sharp(path.join(src, f)).rotate().resize({ width: w, height: Math.round(w * 5 / 4), fit: 'cover', position: 'attention' });
    for (const [ext, enc] of [['avif', q => ({ quality: q, effort: 6 })], ['webp', q => ({ quality: q })]]) {
      let q = ext === 'avif' ? 55 : 78, buf;
      do { buf = await base()[ext](enc(q)).toBuffer(); q -= 6; } while (buf.length > BATAS && q > 20);
      fs.writeFileSync(path.join(out, `${slug}-${w}.${ext}`), buf);
      console.log(`${folder}/${slug}-${w}.${ext}`, Math.round(buf.length / 1024) + ' KB');
    }
    manifest[slug] = { widths: [w] };
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  process.exit(0);
}

const SRC = process.argv[2];
const OUT = new URL('../assets/photos/', import.meta.url).pathname;
const LEBAR = [480, 960, 1600];

const FOTO = {
  menulis: {},
  'kelas-online': { crop: [0, 0, 1, 0.5] },   // buang bagian keyboard (logo tombol Windows)
  'quran-rehal': {},
  kaligrafi: {},
  zaitun: {},
  aqsa: { crop: [0, 0.28, 1, 1] },           // buang cakrawala kota modern, sisakan Al-Aqsa, Kubah & tembok
  keffiyeh: {},
  'guru-papan': {},
};

if (!SRC) { console.error('Pakai: node build-photos.mjs <folder-jpg-asli>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const [nama, cfg] of Object.entries(FOTO)) {
  const file = path.join(SRC, nama + '.jpg');
  if (!fs.existsSync(file)) { console.warn('lewati (tidak ada):', file); continue; }
  const meta = await sharp(file).metadata();
  const [x0, y0, x1, y1] = cfg.crop || [0, 0, 1, 1];
  const area = { left: Math.round(x0 * meta.width), top: Math.round(y0 * meta.height),
    width: Math.round((x1 - x0) * meta.width), height: Math.round((y1 - y0) * meta.height) };
  const widths = LEBAR.filter(w => w <= area.width);
  manifest[nama] = { w: area.width, h: area.height, widths };
  for (const w of widths) {
    const base = sharp(file).rotate().extract(area).resize({ width: w });
    await base.clone().avif({ quality: 50, effort: 6 }).toFile(path.join(OUT, `${nama}-${w}.avif`));
    await base.clone().webp({ quality: 72 }).toFile(path.join(OUT, `${nama}-${w}.webp`));
  }
  console.log(nama, area.width + '×' + area.height, widths.join(','));
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
