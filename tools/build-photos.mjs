// Foto stok sementara → assets/photos/<nama>-<lebar>.avif|webp (lihat assets/photos/CREDITS.md).
// Pemakaian: node build-photos.mjs <folder-berisi-jpg-asli>   (nama berkas = kunci di FOTO, mis. zaitun.jpg)
// Tidak pernah memperbesar melampaui resolusi asli. Potongan (crop) dalam pecahan lebar/tinggi asli.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

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
