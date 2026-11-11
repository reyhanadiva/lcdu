/* Optimasi model 3D hero (dome.glb, qibli.glb hasil TRELLIS.2) untuk web.
   Pemakaian (dari folder tools/):  npm install  →  python3 prep-model-textures.py  →  npm run models
   Masukan : assets/models/<nama>.glb (TIDAK ditimpa) + assets/models/optimized/src/<nama>-{base,emissive}.png
   Keluaran: assets/models/optimized/<nama>.glb (desktop, tekstur ≤2048) dan <nama>-mobile.glb (tekstur ≤1024)
   Langkah: titik pusat ke dasar-tengah, dedup, weld, simplify (meshoptimizer), kompres Meshopt, tekstur WebP. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { center, dedup, weld, simplify, prune, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets/models'), OUT = path.join(SRC, 'optimized'), PREP = path.join(OUT, 'src');

/* ratio = sisa segitiga relatif terhadap asli; error = batas penyimpangan bentuk (relatif terhadap ukuran model) */
const MODELS = { dome: { ratio: .2, error: .0012 }, qibli: { ratio: .2, error: .0012 } };
const VARIANTS = [{ suffix: '', tex: 2048, ratio: 1 }, { suffix: '-mobile', tex: 1024, ratio: .6 }];
/* warna dasar lapisan emissive jendela; kecerahannya diatur dari kode (0 di siang hari) */
const WINDOW_GLOW = [1, .62, .3];

await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const triangles = doc => doc.getRoot().listMeshes().flatMap(m => m.listPrimitives()).reduce((n, p) => n + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount())/3, 0);

let total = { '': 0, '-mobile': 0 };
for (const [name, cfg] of Object.entries(MODELS)){
  for (const v of VARIANTS){
    const doc = await io.read(path.join(SRC, `${name}.glb`));
    const before = triangles(doc);
    const mat = doc.getRoot().listMaterials()[0];
    /* tekstur warna yang sudah di-grade (dan pita kaligrafi dinetralkan) + masker jendela sebagai emissive */
    mat.getBaseColorTexture().setImage(fs.readFileSync(path.join(PREP, `${name}-base.png`))).setMimeType('image/png');
    const em = doc.createTexture(`${name}-jendela`).setImage(fs.readFileSync(path.join(PREP, `${name}-emissive.png`))).setMimeType('image/png');
    mat.setEmissiveTexture(em).setEmissiveFactor(WINDOW_GLOW).setName(`${name}-material`);
    await doc.transform(
      center({ pivot: 'below' }),
      dedup(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: cfg.ratio*v.ratio, error: cfg.error/v.ratio }),
      prune(),
      /* tekstur warna paling menentukan tampilan; metal/roughness & masker jendela cukup setengahnya */
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [v.tex, v.tex], quality: 76, slots: /^baseColor/ }),
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [v.tex/2, v.tex/2], quality: 70, slots: /^(metallicRoughness|emissive)/ }),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    );
    const file = path.join(OUT, `${name}${v.suffix}.glb`);
    await io.write(file, doc);
    const size = fs.statSync(file).size; total[v.suffix] += size;
    console.log(`${name}${v.suffix}.glb: ${before} → ${triangles(doc)} segitiga, ${(size/1024).toFixed(0)} KB`);
  }
}
console.log(`total desktop ${(total['']/1048576).toFixed(2)} MB, HP ${(total['-mobile']/1048576).toFixed(2)} MB`);
