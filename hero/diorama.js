/* Varian 3 — Diorama 3D (three.js): kompleks Al-Aqsa sebagai maket. Scroll menggerakkan kamera dan waktu,
   dari malam gelap → ratusan lentera menyala → matahari terbit. Kursor/jari = cahaya hangat di titik yang ditunjuk
   (kamera tidak ikut bergerak — tanpa parallax).
   Semua tekstur dibuat prosedural (canvas) — tidak ada aset luar. Pita kaligrafi hanyalah ornamen abstrak,
   bukan tulisan ayat, supaya tidak ada teks Al-Qur'an yang keliru. */
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { EffectComposer } from '../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

/* GSAP (UMD) dimuat sekali; kalau gagal, kamera tetap jalan tanpa easing tambahan */
let gsap = null;
try { await import('../vendor/gsap/gsap.min.js'); gsap = window.gsap || null; } catch (e) {}

/* acak yang bisa diulang (penempatan lentera sama setiap kali dimuat) */
const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
const smooth = t => { t = Math.min(1, Math.max(0, t)); return t*t*(3 - 2*t); };
const lerp = (a, b, t) => a + (b - a)*t;
const C = h => new THREE.Color(h);
const lerpC = (a, b, t, out) => out.copy(a).lerp(b, t);
const hex3 = h => { const c = new THREE.Color(h); return new THREE.Vector3(...c.toArray()); };

/* ================= tekstur prosedural ================= */
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* noise nilai yang bisa diulang (tileable) + fbm */
function makeNoise(period){
  const r = new Float32Array(period*period).map(Math.random);
  const at = (i, j) => r[((j%period + period)%period)*period + ((i%period + period)%period)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf);
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), u), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u), v);
  };
}
function makeFbm(base, oct){
  const ns = Array.from({ length: oct }, (_, o) => makeNoise(base << o));
  return (u, v) => { let s = 0, a = .5; ns.forEach((n, o) => { const f = base << o; s += n(u*f, v*f)*a; a *= .5; }); return s; };
}
/* peta tinggi (kanal merah) → normal map ruang tangen */
function toNormal(src, strength){
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const c = canvas(w, h), g = c.getContext('2d'), o = g.createImageData(w, h);
  const H = (x, y) => d[(((y + h)%h)*w + ((x + w)%w))*4]/255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const dx = (H(x + 1, y) - H(x - 1, y))*strength, dy = (H(x, y + 1) - H(x, y - 1))*strength;
    const l = Math.hypot(dx, dy, 1), i = (y*w + x)*4;
    o.data[i] = (-dx/l*.5 + .5)*255; o.data[i + 1] = (dy/l*.5 + .5)*255; o.data[i + 2] = (1/l*.5 + .5)*255; o.data[i + 3] = 255;
  }
  g.putImageData(o, 0, 0); return c;
}
function texFrom(c, srgb, rep){
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t;
}
/* satu fungsi gambar menghasilkan peta warna + peta tinggi → { map, normalMap } */
function pattern(w, h, draw, { rep = [1, 1], strength = 2 } = {}){
  const col = canvas(w, h), hei = canvas(w, h);
  draw(col.getContext('2d'), w, h, false); draw(hei.getContext('2d'), w, h, true);
  return { map: texFrom(col, true, rep), normalMap: texFrom(toNormal(hei, strength), false, rep) };
}
/* isi per piksel: f(u, v) → [r, g, b] atau tinggi 0..1 */
function pixels(g, w, h, f){
  const o = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const v = f(x/w, y/h), i = (y*w + x)*4;
    if (typeof v === 'number'){ o.data[i] = o.data[i + 1] = o.data[i + 2] = v*255; } else { o.data[i] = v[0]; o.data[i + 1] = v[1]; o.data[i + 2] = v[2]; }
    o.data[i + 3] = 255;
  }
  g.putImageData(o, 0, 0);
}

function makeTextures(S){
  /* marmer putih berurat */
  const fm = makeFbm(4, 4);
  const marble = pattern(S, S, (g, w, h, height) => pixels(g, w, h, (u, v) => {
    const n = fm(u, v), vein = Math.pow(Math.abs(Math.sin((u*2 + v + n*3.2)*Math.PI*2)), .18);
    if (height) return .55 + vein*.3 + n*.15;
    const k = 196 + vein*52 + n*10; return [k, k - 4, k - 12];
  }), { rep: [.45, .45], strength: 1.2 });

  /* batu kapur Yerusalem: blok berlapis, nat, bintik */
  const fs = makeFbm(8, 3);
  const tint = Array.from({ length: 64 }, () => Math.random());
  const stone = pattern(S, S, (g, w, h, height) => pixels(g, w, h, (u, v) => {
    const rows = 4, row = Math.floor(v*rows), off = row%2 ? .25 : 0, cols = 2, col = Math.floor((u + off)*cols)%cols;
    const fu = ((u + off)*cols)%1, fv = (v*rows)%1, edge = Math.min(fu, 1 - fu, fv*2, (1 - fv)*2);
    const mortar = smooth(edge/.035), n = fs(u, v), t = tint[(row*cols + col)%64];
    if (height) return mortar*(.75 + n*.25);
    const k = mortar*(.86 + t*.14) + (1 - mortar)*.62;
    return [(226 + n*24)*k, (206 + n*22)*k, (168 + n*18)*k];
  }), { rep: [.7, .9], strength: 2.4 });

  /* ubin biru: bintang delapan (dua bujur sangkar bertumpuk) di grid, nat tipis */
  const tile = pattern(S, S, (g, w, h, height) => {
    const cell = w/2;
    g.fillStyle = height ? '#555' : '#1F4FB4'; g.fillRect(0, 0, w, h);
    const star = (cx, cy, r, fill) => {
      g.fillStyle = fill;
      [0, Math.PI/4].forEach(a0 => { g.beginPath(); for (let i = 0; i < 4; i++){ const a = a0 + i*Math.PI/2; g.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r); } g.closePath(); g.fill(); });
    };
    for (let y = 0; y <= 2; y++) for (let x = 0; x <= 2; x++){
      star(x*cell, y*cell, cell*.42, height ? '#bbb' : '#F2F5FB');
      star(x*cell, y*cell, cell*.3, height ? '#999' : '#1BA39C');
      star(x*cell, y*cell, cell*.12, height ? '#ddd' : '#E9B94A');
      if (x < 2 && y < 2){ star((x + .5)*cell, (y + .5)*cell, cell*.2, height ? '#888' : '#163E95'); }
    }
    g.strokeStyle = height ? '#000' : 'rgba(10,25,70,.55)'; g.lineWidth = 2;
    for (let i = 0; i <= 8; i++){ g.beginPath(); g.moveTo(i*w/8, 0); g.lineTo(i*w/8, h); g.moveTo(0, i*h/8); g.lineTo(w, i*h/8); g.stroke(); }
  }, { rep: [1.25, 1.25], strength: 1.6 });

  /* pita "kaligrafi": ornamen sapuan abstrak putih-emas di atas biru tua (bukan huruf/ayat) */
  const band = pattern(S*2, S/4, (g, w, h, height) => {
    g.fillStyle = height ? '#333' : '#132F7A'; g.fillRect(0, 0, w, h);
    g.fillStyle = height ? '#000' : '#E9B94A'; g.fillRect(0, 0, w, h*.08); g.fillRect(0, h*.92, w, h*.08);
    g.strokeStyle = height ? '#fff' : '#F3F1E8'; g.lineCap = 'round'; g.lineJoin = 'round';
    const n = 18;
    for (let i = 0; i < n; i++){
      const x = (i + .5)*w/n, s = w/n;
      g.lineWidth = h*.07; g.beginPath(); g.moveTo(x - s*.32, h*.7); g.bezierCurveTo(x - s*.1, h*.86, x + s*.25, h*.82, x + s*.36, h*.62); g.stroke();
      g.lineWidth = h*.06; g.beginPath(); g.moveTo(x + (i%3 - 1)*s*.18, h*.68); g.lineTo(x + (i%3 - 1)*s*.18, h*.2); g.stroke();
      if (i%2){ g.beginPath(); g.arc(x - s*.12, h*.5, h*.09, 0, Math.PI*2); g.stroke(); }
      g.fillStyle = height ? '#fff' : '#E9B94A'; g.beginPath(); g.arc(x + s*.4, h*.3, h*.035, 0, Math.PI*2); g.fill();
    }
  }, { rep: [1/3.3, 1/.42], strength: 1.4 });

  /* rusuk emas kubah (normal map saja) */
  const ribH = canvas(512, 32);
  pixels(ribH.getContext('2d'), 512, 32, u => 1 - Math.pow(Math.abs(Math.sin(u*Math.PI*36)), .35));
  const ribs = texFrom(toNormal(ribH, 3), false, [1, 1]);

  /* paving pelataran: lempeng besar */
  const fp = makeFbm(4, 3);
  const paving = pattern(S, S, (g, w, h, height) => pixels(g, w, h, (u, v) => {
    const fu = (u*3)%1, fv = (v*3 + (Math.floor(u*3)%2)*.5)%1, e = smooth(Math.min(fu, 1 - fu, fv, 1 - fv)/.03), n = fp(u, v);
    if (height) return e*(.7 + n*.3);
    const k = (.8 + e*.2)*(.9 + n*.18); return [228*k, 212*k, 178*k];
  }), { rep: [.12, .12], strength: 2 });

  /* kulit kayu zaitun: alur memanjang berpilin, abu-abu kecokelatan (u = sepanjang batang, v = keliling) */
  const fb = makeFbm(4, 4);
  const bark = pattern(S/2, S/2, (g, w, h, height) => pixels(g, w, h, (u, v) => {
    const n = fb(u, v), ridge = Math.pow(Math.abs(Math.sin((v*7 + u*1 + n*1.6)*Math.PI)), .45);
    if (height) return ridge*.75 + n*.25;
    const k = .62 + ridge*.38 + n*.25; return [128*k, 122*k, 112*k];
  }), { rep: [1, 1], strength: 4 });

  return { marble, stone, tile, band, ribs, paving, bark };
}

/* UV sesuai ukuran dunia supaya tekstur tidak meregang */
function boxG(w, h, d){
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){ const i = f*4 + k; uv.setXY(i, uv.getX(i)*dims[f][0], uv.getY(i)*dims[f][1]); }
  return g;
}
function scaleUV(g, su, sv){ const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i)*su, uv.getY(i)*sv); return g; }

/* lengkung runcing khas Islam: persegi + dua kurva bertemu di puncak */
function arch(path, x, y, w, h){
  const r = w/2, spring = y + h - w*.62;
  path.moveTo(x - r, y); path.lineTo(x + r, y); path.lineTo(x + r, spring);
  path.quadraticCurveTo(x + r, y + h - w*.12, x, y + h);
  path.quadraticCurveTo(x - r, y + h - w*.12, x - r, spring); path.lineTo(x - r, y);
  return path;
}
/* panel dinding berlubang lengkung: lebar w, tinggi h, tebal d; lubang di posisi xs */
function archedWall(w, h, d, xs, aw, ah, ay){
  const s = new THREE.Shape(); s.moveTo(-w/2, 0); s.lineTo(w/2, 0); s.lineTo(w/2, h); s.lineTo(-w/2, h); s.lineTo(-w/2, 0);
  xs.forEach(x => s.holes.push(arch(new THREE.Path(), x, ay, aw, ah)));
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -d/2); return g;
}
/* bingkai lengkung (cincin) di sekitar jendela */
function archFrame(aw, ah, t, d){
  const s = arch(new THREE.Shape(), 0, -t, aw + t*2, ah + t*2.2); s.holes.push(arch(new THREE.Path(), 0, 0, aw, ah));
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 6 }); return g;
}

function glowSprite(){
  const c = canvas(64, 64), g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,248,230,1)'); rg.addColorStop(.15, 'rgba(255,205,130,.95)'); rg.addColorStop(.45, 'rgba(255,160,80,.28)'); rg.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ================= vegetasi: kartu daun, batang bengkok ================= */
/* tekstur kartu daun beralfa (dilukis di canvas): ranting + daun lonjong. kind 'zaitun' = hijau keperakan, 'cemara' = sisik rapat */
function leafCard(kind, rng){
  const S = 256, c = canvas(S, S), g = c.getContext('2d');
  if (kind === 'zaitun'){
    g.strokeStyle = '#5a4a38'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(S*.5, S*.98); g.quadraticCurveTo(S*.46, S*.55, S*.54, S*.06); g.stroke();
    for (let i = 0; i < 22; i++){
      const t = .1 + i/22*.85, side = i%2 ? 1 : -1, bx = S*(.5 + (.04 - t*.02)*side*.3 + (t - .5)*.06), by = S*(.98 - t*.92);
      const a = -Math.PI/2 + side*(.55 + rng()*.5), L = S*(.2 + rng()*.1), W = L*(.16 + rng()*.05);
      g.save(); g.translate(bx, by); g.rotate(a + Math.PI/2);
      const gr = g.createLinearGradient(-W, 0, W, 0), k = rng();
      gr.addColorStop(0, `rgb(${120 + k*30},${134 + k*26},${96 + k*20})`); gr.addColorStop(.5, `rgb(${84 + k*24},${102 + k*22},${64 + k*16})`); gr.addColorStop(1, `rgb(${70 + k*20},${88 + k*20},${54 + k*14})`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(W, -L*.45, 0, -L); g.quadraticCurveTo(-W, -L*.45, 0, 0); g.fill();
      g.strokeStyle = 'rgba(200,210,180,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -2); g.lineTo(0, -L*.92); g.stroke();
      g.restore();
    }
  } else {
    /* cemara: ranting bersisik rapat berbentuk lidah api (ujung lebih terang), tepi bergerigi */
    for (let i = 0; i < 1400; i++){
      const t = rng(), y = S*(.98 - t*.94), half = S*.42*Math.sin(Math.PI*Math.pow(t, .7))*(1 - t*.35), x = S/2 + (rng()*2 - 1)*half, k = rng(), lift = t*.6 + rng()*.4;
      g.fillStyle = `rgb(${30 + k*18 + lift*28},${52 + k*22 + lift*34},${32 + k*12 + lift*14})`;
      g.beginPath(); g.ellipse(x, y, 2 + rng()*2.5, 6 + rng()*7, (x - S/2)/S*.9, 0, Math.PI*2); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/* tajuk dari kartu: tiap kartu = satu segi empat acak di dalam gumpalan elipsoid. Normal dibuat "membulat" (dari pusat
   gumpalan ke luar) supaya tajuk diterangi seperti satu volume lembut, bukan kartu-kartu datar. */
function cardCanopy(rng, clumps, n, size, center, upright = false){
  const pos = [], nor = [], uv = [], idx = [], v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), nn = new THREE.Vector3();
  const vol = clumps.map(c => c.r[0]*c.r[1]*c.r[2]), tot = vol.reduce((a, b) => a + b, 0);
  const corners = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]];
  for (let i = 0; i < n; i++){
    let pick = rng()*tot, c = clumps[0]; for (let j = 0; j < clumps.length; j++){ pick -= vol[j]; if (pick <= 0){ c = clumps[j]; break; } }
    /* titik di elipsoid, condong ke kulit luar supaya siluet terisi */
    let x, y, z; do { x = rng()*2 - 1; y = rng()*2 - 1; z = rng()*2 - 1; } while (x*x + y*y + z*z > 1);
    const l = Math.hypot(x, y, z) || 1, sh = .55 + .45*Math.pow(l, .5); x = x/l*sh*(l > .2 ? 1 : .5); y = y/l*sh; z = z/l*sh;
    const px = c.p[0] + x*c.r[0], py = c.p[1] + y*c.r[1], pz = c.p[2] + z*c.r[2];
    nn.set(px - center[0], (py - center[1])*1.4 + .35, pz - center[2]).normalize();
    /* upright: kartu berdiri menghadap keluar dari sumbu batang (cemara); selain itu arah acak (zaitun) */
    if (upright) q.setFromEuler(e.set((rng() - .5)*.7, Math.atan2(px - center[0], pz - center[2]) + (rng() - .5)*1.3, (rng() - .5)*.5, 'YXZ'));
    else q.setFromEuler(e.set(rng()*6.28, rng()*6.28, rng()*6.28));
    const s = size*(.7 + rng()*.6), b = pos.length/3;
    for (const [cu, cv] of corners){
      v.set(cu*s, cv*s, 0).applyQuaternion(q); pos.push(px + v.x, py + v.y, pz + v.z); nor.push(nn.x, nn.y, nn.z); uv.push(cu + .5, cv + .5);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
/* tabung bengkok: jari-jari mengecil ke ujung, permukaan beralur memilin (khas batang zaitun tua) */
function gnarledTube(points, r0, r1, seg, rad, twist, groove){
  const curve = new THREE.CatmullRomCurve3(points), g = new THREE.TubeGeometry(curve, seg, 1, rad, false), p = g.attributes.position, c = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i <= seg; i++){
    const t = i/seg; curve.getPointAt(t, c); const r = lerp(r0, r1, Math.pow(t, .8));
    for (let j = 0; j <= rad; j++){
      const k = i*(rad + 1) + j, a = j/rad*Math.PI*2;
      d.fromBufferAttribute(p, k).sub(c);
      d.multiplyScalar(r*(1 + groove*Math.sin(a*3 + t*twist) + groove*.5*Math.sin(a*5 - t*twist*1.7)));
      p.setXYZ(k, c.x + d.x, c.y + d.y, c.z + d.z);
    }
  }
  g.deleteAttribute('tangent'); g.computeVertexNormals(); scaleUV(g, 3, 1); return g;
}
/* materi daun: alfa terpotong (bayangan ikut berlubang), dua sisi, sisi bawah keperakan, ayunan angin halus */
function foliageMaterial(map, windU, sway, under){
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: .5, side: THREE.DoubleSide, roughness: .78 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = windU.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = instanceMatrix[3].xyz;
      #else
        vec3 ip = vec3(0.);
      #endif
      float sw = max(position.y - ${sway[0].toFixed(2)}, 0.)*${sway[1].toFixed(3)}, ph = ip.x*.37 + ip.z*.23;
      transformed.x += (sin(uTime*1.3 + ph + position.y*.8) + .35*sin(uTime*3.1 + ph*2. + position.x*3.))*sw;
      transformed.z += cos(uTime*1.1 + ph*1.3 + position.z)*sw*.8;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''))
      .replace('#include <color_fragment>', `#include <color_fragment>
      if (!gl_FrontFacing) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${under}), .5);`);
  };
  m.customProgramCacheKey = () => 'daun' + under;
  return m;
}

/* ================= tingkat kualitas ================= */
const TIERS = [
  { dpr: 1, shadow: 0, bloom: 0 },        // darurat: tanpa bayangan & bloom
  { dpr: 1.25, shadow: 1024, bloom: .5 }, // HP: bloom setengah resolusi
  { dpr: 1.75, shadow: 2048, bloom: 1 },  // laptop
];

export default {
  mount(holder, state){
    const mobile = state.w < 900 || state.coarse;
    const renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    holder.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 600);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
    scene.environment = env;
    const mats = [];
    const std = o => { const m = new THREE.MeshStandardMaterial(o); mats.push(m); return m; };
    const T = makeTextures(mobile ? 256 : 512);
    const add = (parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m;
    };

    /* ---------- langit: gradasi, hamburan fajar di sekitar matahari, cakram matahari ---------- */
    const skyU = { top: { value: new THREE.Vector3() }, mid: { value: new THREE.Vector3() }, hor: { value: new THREE.Vector3() }, sunDir: { value: new THREE.Vector3(0, 0, 1) }, sunAmt: { value: 0 }, moonDir: { value: new THREE.Vector3(0, .3, -1) }, moonAmt: { value: 1 } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform vec3 top, mid, hor, sunDir, moonDir; uniform float sunAmt, moonAmt; varying vec3 vD;
        void main(){ float h = vD.y; vec3 sd = normalize(sunDir);
          vec3 c = mix(hor, mid, smoothstep(-.02, .2, h)); c = mix(c, top, smoothstep(.2, .75, h));
          float az = max(dot(normalize(vD.xz), normalize(sd.xz)), 0.);
          c += vec3(1., .5, .25)*pow(az, 5.)*(1. - smoothstep(-.05, .32, h))*.55*sunAmt;
          float s = max(dot(vD, sd), 0.);
          c += vec3(1., .88, .66)*smoothstep(.9991, .9994, s)*11.*sunAmt;          // cakram
          c += vec3(1., .62, .3)*(pow(s, 40.)*.55 + pow(s, 8.)*.07)*sunAmt;     // halo
          vec3 md = normalize(moonDir); float m = dot(vD, md);
          float crescent = smoothstep(.99955, .99975, m)*(1. - smoothstep(.99955, .99975, dot(vD, normalize(md + vec3(.006, .004, 0.)))));
          c += vec3(.92, .95, 1.)*crescent*3.*moonAmt + vec3(.35, .45, .8)*pow(max(m, 0.), 300.)*.35*moonAmt;   // bulan sabit + pendar
          gl_FragColor = vec4(c, 1.); }`
    }));
    scene.add(sky);
    const SKY = { n: [hex3('#030716'), hex3('#0A1442'), hex3('#16225E')], d: [hex3('#3A5AA6'), hex3('#D48C7C'), hex3('#F4B077')] };   // fajar dibuat lebih dalam supaya tidak memutih

    /* bintang berkelip (shader titik) */
    const starN = 1600, sp = [], sph = [];
    for (let i = 0; i < starN; i++){ const u = Math.random()*Math.PI*2, v = .06 + Math.pow(Math.random(), .8)*1.4; sp.push(Math.cos(u)*Math.cos(v)*380, Math.sin(v)*380, Math.sin(u)*Math.cos(v)*380); sph.push(Math.random()); }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); starGeo.setAttribute('aPh', new THREE.Float32BufferAttribute(sph, 1));
    const starU = { uTime: { value: 0 }, uOp: { value: 1 }, uPx: { value: 1 } };
    const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({
      uniforms: starU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: `attribute float aPh; uniform float uTime, uPx; varying float vA;
        void main(){ vA = (.55 + .45*sin(uTime*(.6 + aPh*1.8) + aPh*40.))*(.35 + aPh*.65); gl_PointSize = (1. + aPh*1.6)*uPx; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform float uOp; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1., .97, .9)*vA*uOp*smoothstep(.5, .1, d), 1.); }`
    }));
    scene.add(stars);

    /* kabut atmosfer + cincin kabut di cakrawala */
    scene.fog = new THREE.FogExp2(0x16225E, .006);
    const hazeU = { uCol: { value: new THREE.Color() }, uOp: { value: 0 } };
    const haze = new THREE.Mesh(new THREE.CylinderGeometry(170, 170, 60, 48, 1, true), new THREE.ShaderMaterial({
      uniforms: hazeU, transparent: true, depthWrite: false, side: THREE.BackSide, fog: false,
      vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uOp; varying float vY; void main(){ gl_FragColor = vec4(uCol, uOp*pow(1. - vY, 2.2)); }'
    }));
    haze.position.y = 28; scene.add(haze);

    /* ---------- cahaya ---------- */
    const hemi = new THREE.HemisphereLight(0x3a4d9a, 0x0b0f22, .5); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0x9fb4ff, .6); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 160 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
    scene.add(sun, sun.target);
    const moon = new THREE.DirectionalLight(0xa9c1ff, 0); scene.add(moon);   // cahaya bulan biru lembut dari samping-belakang (rim light)
    const warm = [];
    (mobile ? [[0, 2.4, 6.5], [-4, 2.4, -6.5]] : [[0, 2.4, 6.5], [-8.5, 2.2, 3], [8, 2.2, 2], [-4, 2.4, -6.5]]).forEach(p => { const l = new THREE.PointLight(0xffa860, 0, 18, 1.6); l.position.set(...p); scene.add(l); warm.push(l); });

    /* ---------- material ---------- */
    const stoneMat = std({ color: 0xffffff, map: T.stone.map, normalMap: T.stone.normalMap, roughness: .9 });
    const stoneLight = std({ color: 0xf4ead6, map: T.stone.map, normalMap: T.stone.normalMap, roughness: .88 });
    const marbleMat = std({ map: T.marble.map, normalMap: T.marble.normalMap, normalScale: new THREE.Vector2(.5, .5), roughness: .35 });
    const tileMat = std({ map: T.tile.map, normalMap: T.tile.normalMap, normalScale: new THREE.Vector2(.6, .6), roughness: .32, metalness: .05 });
    const bandMat = std({ map: T.band.map, normalMap: T.band.normalMap, roughness: .3 });
    const navy = std({ color: 0x163e95, roughness: .45 });
    const goldMat = std({ color: 0xE3B23C, metalness: 1, roughness: .24, normalMap: T.ribs, normalScale: new THREE.Vector2(.7, .7) });
    const goldTrim = std({ color: 0xE9B94A, metalness: .9, roughness: .3 });
    const leadMat = std({ color: 0x8f98a8, metalness: .55, roughness: .42 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x000000 });            // ruang dalam yang menyala lewat jendela
    const darkIn = std({ color: 0x1a140f, roughness: 1 });
    const pavMat = std({ map: T.paving.map, normalMap: T.paving.normalMap, roughness: .9 });

    /* ---------- tanah & pelataran (Haram al-Sharif) ---------- */
    const Y0 = .9, PX = 20, PZ0 = -23, PZ1 = 15, PW = PX*2, PD = PZ1 - PZ0, PZC = (PZ0 + PZ1)/2;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(260, 48), std({ color: 0x9c7d5a, roughness: 1 }));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
    const pg = boxG(PW, Y0, PD); add(scene, pg, [stoneMat, stoneMat, pavMat, stoneMat, stoneMat, stoneMat], 0, Y0/2, PZC);
    /* tembok keliling + parapet bergerigi (instanced) */
    const walls = [[0, PZ1 + .4, PW + .8, .8], [0, PZ0 - .4, PW + .8, .8], [PX + .4, PZC, .8, PD], [-PX - .4, PZC, .8, PD]];
    walls.forEach(w => add(scene, boxG(w[2], 1.6, w[3]), stoneMat, w[0], .8, w[1]));
    const merlonGeo = boxG(.42, .38, .5), merlonPts = [];
    walls.forEach(w => { const along = w[2] > w[3], len = along ? w[2] : w[3]; for (let t = -len/2 + .4; t <= len/2 - .4; t += .9) merlonPts.push([along ? [w[0] + t, 1.79, w[1]] : [w[0], 1.79, w[1] + t], along ? 0 : Math.PI/2]); });

    /* teras atas di sekitar Kubah Shakhrah */
    add(scene, boxG(17, .5, 17), [stoneLight, stoneLight, pavMat, stoneLight, stoneLight, stoneLight], 0, Y0 + .25, 0);
    const Y1 = Y0 + .5;

    /* ---------- Kubah Shakhrah ---------- */
    const dor = new THREE.Group(); dor.position.y = Y1; scene.add(dor);
    const R = 4.3, side = 2*R*Math.sin(Math.PI/8), apo = R*Math.cos(Math.PI/8);
    /* alas & dinding bawah marmer */
    const ring8 = (rt, rb, h, mat, y) => { const g = scaleUV(new THREE.CylinderGeometry(rt, rb, h, 8), side*8*.25, h*.5); g.rotateY(Math.PI/8); return add(dor, g, mat, 0, y); };
    ring8(R + .15, R + .25, .35, stoneLight, .175);
    const WIN = { n: 5, w: .34, h: .82, y: .5 }, xs = Array.from({ length: WIN.n }, (_, i) => (i - (WIN.n - 1)/2)*side/(WIN.n + .4));
    const lowerG = boxG(side + .02, 1.55, .32), upperG = archedWall(side + .02, 1.6, .32, xs, WIN.w, WIN.h, WIN.y);
    const bandG = boxG(side + .06, .42, .36), frameG = archFrame(WIN.w, WIN.h, .06, .05);
    const frames = new THREE.InstancedMesh(frameG, std({ color: 0x0f2a6e, roughness: .4 }), 8*WIN.n), fm = new THREE.Matrix4(), fo = new THREE.Object3D();
    let fi = 0;
    for (let i = 0; i < 8; i++){
      const a = i*Math.PI/4, face = new THREE.Group(); face.rotation.y = a; face.position.set(Math.sin(a)*apo, 0, Math.cos(a)*apo); dor.add(face);
      add(face, lowerG, marbleMat, 0, .35 + .775);
      add(face, upperG, [tileMat, navy], 0, 1.9);
      add(face, bandG, bandMat, 0, 3.71);
      face.updateMatrix(); xs.forEach(x => { fo.position.set(x, 1.9 + WIN.y, .16); fo.updateMatrix(); frames.setMatrixAt(fi++, fm.multiplyMatrices(face.matrix, fo.matrix)); });
      /* pilaster sudut */
      const va = a + Math.PI/8; add(dor, boxG(.22, 3.6, .22), marbleMat, Math.sin(va)*(R - .02), .35 + 1.8, Math.cos(va)*(R - .02)).rotation.y = va;
    }
    dor.add(frames); frames.castShadow = true;
    /* parapet bergerigi di atas pita */
    const parapetY = 3.92 + .1;
    for (let i = 0; i < 8; i++){
      const a = i*Math.PI/4;
      for (let k = 0; k < 7; k++){ const t = (k - 3)*side/7.2; add(dor, boxG(.2, .26, .14), marbleMat, Math.sin(a)*(apo + .08) + Math.cos(a)*t, parapetY + .13, Math.cos(a)*(apo + .08) - Math.sin(a)*t).rotation.y = a; }
    }
    /* ruang dalam yang menyala + arkade dalam berkolom (siluet di balik jendela) */
    add(dor, new THREE.CylinderGeometry(2.05, 2.05, 3.8, 16, 1, true), glowMat, 0, 2.1, 0, false);
    const colG = new THREE.CylinderGeometry(.09, .1, 1.6, 8), pierG = boxG(.36, 1.6, .36);
    for (let i = 0; i < 24; i++){
      const a = i/24*Math.PI*2 + Math.PI/24, r = 3.05, m = add(dor, i%3 === 0 ? pierG : colG, marbleMat, Math.sin(a)*r, .35 + 1.12, Math.cos(a)*r); m.rotation.y = a; m.scale.y = 1.4;
    }
    const innerArch = archedWall(1.0, .7, .2, [0], .62, .55, .02);
    for (let i = 0; i < 24; i++){ const a = (i + .5)/24*Math.PI*2 + Math.PI/24, r = 3.05*Math.cos(Math.PI/24); const m = add(dor, innerArch, marbleMat, Math.sin(a)*r, .35 + 2.24, Math.cos(a)*r); m.rotation.y = a; m.scale.x = .82; }
    /* 4 serambi pintu */
    const porchG = archedWall(1.9, 2.1, .7, [0], .9, 1.55, .02);
    for (let i = 0; i < 4; i++){
      const a = i*Math.PI/2, g = new THREE.Group(); g.rotation.y = a; g.position.set(Math.sin(a)*(apo + .45), .35, Math.cos(a)*(apo + .45)); dor.add(g);
      add(g, porchG, [marbleMat, stoneLight]); add(g, boxG(2.05, .16, .85), navy, 0, 2.18);
      add(g, new THREE.PlaneGeometry(.9, 1.6), darkIn, 0, .8, -.34, false);
    }
    /* atap miring timah, drum 16 jendela, cincin emas, kubah */
    add(dor, new THREE.CylinderGeometry(2.55, R - .05, .6, 8).rotateY(Math.PI/8), leadMat, 0, 4.3 + .1);
    const DR = 2.45, dSide = 2*DR*Math.sin(Math.PI/16), dApo = DR*Math.cos(Math.PI/16);
    const drumG = archedWall(dSide + .03, 1.25, .26, [0], .26, .62, .32), drumBand = boxG(dSide + .05, .32, .3);
    for (let i = 0; i < 16; i++){
      const a = i*Math.PI/8, g = new THREE.Group(); g.rotation.y = a; g.position.set(Math.sin(a)*dApo, 4.7, Math.cos(a)*dApo); dor.add(g);
      add(g, drumG, [tileMat, navy]); add(g, drumBand, bandMat, 0, 1.41);
    }
    add(dor, new THREE.CylinderGeometry(2.1, 2.1, 1.4, 16, 1, true), glowMat, 0, 5.35, 0, false);
    add(dor, new THREE.CylinderGeometry(2.62, 2.62, .14, 48), goldTrim, 0, 6.22);
    const dome = add(dor, new THREE.SphereGeometry(2.58, 96, 48, 0, Math.PI*2, 0, Math.PI/2), goldMat, 0, 6.28);
    dome.scale.y = 1.22;
    [[.07, .09, .5, 9.55], [.045, .06, .9, 10.15]].forEach(c => add(dor, new THREE.CylinderGeometry(c[0], c[1], c[2], 10), goldMat, 0, c[3]));
    [[.16, 9.42], [.12, 9.85], [.09, 10.3]].forEach(b => add(dor, new THREE.SphereGeometry(b[0], 16, 12), goldMat, 0, b[1]));
    add(dor, new THREE.TorusGeometry(.28, .05, 8, 32, Math.PI*1.45), goldMat, 0, 10.85).rotation.z = Math.PI*.78;

    /* ---------- Kubah Rantai (Qubbat al-Silsila) di timur ---------- */
    const chain = new THREE.Group(); chain.position.set(6.9, Y1, -4.2); scene.add(chain);
    for (let i = 0; i < 11; i++){ const a = i/11*Math.PI*2; add(chain, colG, marbleMat, Math.sin(a)*1.05, .8, Math.cos(a)*1.05); }
    add(chain, new THREE.CylinderGeometry(1.25, 1.25, .25, 11), stoneLight, 0, 1.72);
    add(chain, new THREE.CylinderGeometry(.62, .7, .4, 6), tileMat, 0, 2.05);
    add(chain, new THREE.SphereGeometry(.68, 32, 16, 0, Math.PI*2, 0, Math.PI/2), leadMat, 0, 2.25).scale.y = 1.1;

    /* ---------- qanatir: arkade di puncak tangga teras ---------- */
    const qanG = archedWall(4.9, 1.25, .45, [-1.6, 0, 1.6], 1.25, 1.05, .02);
    const qanatir = (x, z, ry, dir) => {
      const g = new THREE.Group(); g.position.set(x, Y1, z); g.rotation.y = ry; scene.add(g);
      for (let i = 0; i < 4; i++) add(g, colG, marbleMat, -2.4 + i*1.6, .8);
      add(g, qanG, [stoneLight, stoneLight], 0, 1.55); add(g, boxG(5, .14, .55), stoneLight, 0, 2.86);
      /* tangga turun ke pelataran */
      for (let i = 0; i < 3; i++){ const top = -(i + 1)*.125; add(g, boxG(4.6, .5 + top, .45), stoneLight, 0, (top - .5)/2, dir*(.2 + (i + .5)*.45)); }
    };
    qanatir(0, 8.3, 0, 1); qanatir(8.3, 0, Math.PI/2, 1); qanatir(-8.3, 0, Math.PI/2, -1); qanatir(0, -8.3, 0, -1);

    /* ---------- Masjid Qibli (selatan) ---------- */
    const qibli = new THREE.Group(); qibli.position.set(-7.5, Y0, -11.6); qibli.rotation.y = .06; scene.add(qibli);
    const QW = 9.6, QH = 3.1, QD = 11;
    /* serambi depan 7 lengkung — lengkung tengah lebih besar */
    const qxs = [-3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9];
    const porch = new THREE.Shape(); porch.moveTo(-QW/2, 0); porch.lineTo(QW/2, 0); porch.lineTo(QW/2, QH); porch.lineTo(-QW/2, QH); porch.lineTo(-QW/2, 0);
    qxs.forEach(x => porch.holes.push(arch(new THREE.Path(), x, .02, x === 0 ? 1.05 : .86, x === 0 ? 2.3 : 1.95)));
    const porchQ = new THREE.ExtrudeGeometry(porch, { depth: .55, bevelEnabled: false, curveSegments: 6 });
    add(qibli, porchQ, [stoneMat, stoneLight], 0, 0, 1.6);
    add(qibli, boxG(QW + .1, .18, .7), stoneLight, 0, QH + .09, 1.88);
    add(qibli, boxG(2.2, .9, .62), stoneMat, 0, QH + .55, 1.88);                   // bagian tengah lebih tinggi
    for (let i = 0; i < 17; i++) add(qibli, boxG(.26, .3, .3), stoneMat, -QW/2 + .3 + i*(QW - .6)/16, QH + .33, 2.05);
    for (let i = 0; i < 4; i++) add(qibli, boxG(.26, .3, .3), stoneMat, -.82 + i*.55, QH + 1.15, 2.05);
    /* dinding fasad di balik serambi + pintu menyala */
    add(qibli, boxG(QW, QH + .4, .4), stoneMat, 0, (QH + .4)/2, 0);
    const doorMat = std({ color: 0x241a12, roughness: 1, emissive: 0xffa050, emissiveIntensity: 0 });
    qxs.forEach(x => { const s = arch(new THREE.Shape(), 0, 0, .55, 1.35); add(qibli, new THREE.ShapeGeometry(s), doorMat, x, 0, .21, false); });
    /* ruang utama: badan memanjang, nave tengah lebih tinggi beratap pelana */
    add(qibli, boxG(QW, QH + .2, QD), stoneMat, 0, (QH + .2)/2, -QD/2 - .2);
    add(qibli, boxG(3.4, 1.2, QD - 2.5), stoneMat, 0, QH + .8, -QD/2 + .6);
    const gable = new THREE.Shape(); gable.moveTo(-1.85, 0); gable.lineTo(1.85, 0); gable.lineTo(0, 1.1); gable.lineTo(-1.85, 0);
    const gG = new THREE.ExtrudeGeometry(gable, { depth: QD - 2.5, bevelEnabled: false }); gG.translate(0, 0, -(QD - 2.5)/2);
    add(qibli, gG, leadMat, 0, QH + 1.4, -QD/2 + .6);
    for (let i = 0; i < 2; i++) add(qibli, boxG(.35, .5, QD - 1), stoneLight, i ? QW/2 - .2 : -QW/2 + .2, QH + .45, -QD/2 - .2);
    /* drum & kubah perak di atas mihrab */
    add(qibli, new THREE.CylinderGeometry(1.35, 1.45, 2.5, 16).rotateY(.1), stoneMat, 0, QH + 1.45, -QD + 1.6);
    const qdome = add(qibli, new THREE.SphereGeometry(1.42, 48, 24, 0, Math.PI*2, 0, Math.PI/2), leadMat, 0, QH + 2.7, -QD + 1.6); qdome.scale.y = 1.12;
    add(qibli, new THREE.CylinderGeometry(.03, .05, .7, 8), goldMat, 0, QH + 4.6, -QD + 1.6);

    /* ---------- menara: ramping, balkon bermuqarnas, paviliun silinder ---------- */
    const minaret = (x, z, h, round) => {
      const g = new THREE.Group(); g.position.set(x, Y0, z); scene.add(g);
      add(g, boxG(1.1, 1.4, 1.1), stoneMat, 0, .7);
      add(g, round ? scaleUV(new THREE.CylinderGeometry(.33, .36, h - 1.4, 16), 2, h) : boxG(.68, h - 1.4, .68), stoneMat, 0, 1.4 + (h - 1.4)/2);
      [[.86, .1, h*.72 - .2], [1.02, .1, h*.72 - .1], [1.18, .16, h*.72 + .03]].forEach(b => add(g, round ? new THREE.CylinderGeometry(b[0]*.6, b[0]*.5, b[1], 16) : boxG(b[0], b[1], b[0]), stoneLight, 0, b[2]));
      for (let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; add(g, boxG(.06, .3, .06), stoneLight, Math.sin(a)*.52, h*.72 + .26, Math.cos(a)*.52, false); }
      add(g, new THREE.CylinderGeometry(.3, .3, 1.0, 12), stoneLight, 0, h + .5);
      const lamp = add(g, new THREE.CylinderGeometry(.31, .31, .38, 12, 1, true), glowMat, 0, h + .55, 0, false); lamp.scale.setScalar(1.01);
      add(g, new THREE.SphereGeometry(.34, 16, 8, 0, Math.PI*2, 0, Math.PI/2), leadMat, 0, h + 1).scale.y = 1.5;
      add(g, new THREE.CylinderGeometry(.02, .03, .6, 6), goldMat, 0, h + 1.75);
    };
    minaret(-PX + .2, -1.5, 9.5, false); minaret(-PX + .2, PZ1 - .2, 10.5, false); minaret(14.5, PZ1 - .2, 10, true); minaret(-15, PZ0 + .2, 9, false);

    /* ---------- kamera: tiga titik kunci, satu per babak, jalur pendek ----------
       framing() dan pose() dipakai bersama oleh kamera sungguhan dan oleh pemeriksaan zona larangan vegetasi */
    const KEYS = new THREE.CatmullRomCurve3([new THREE.Vector3(-.62, .33, 58), new THREE.Vector3(-.12, .22, 43), new THREE.Vector3(.36, .13, 35)]);
    const LOOK = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 3.4, 1), new THREE.Vector3(0, 3.9, 0), new THREE.Vector3(0, 4.6, -1.5)]);
    const _k = new THREE.Vector3(), _l = new THREE.Vector3();
    function framing(c, w, h){
      /* teks di kiri-bawah: desktop → kubah di kanan; HP → kubah di tengah, di atas teks */
      const wide = w >= 900;
      c.aspect = w/h; c.setViewOffset(wide ? w*1.34 : w, h*(wide ? 1.1 : 1.5), 0, h*(wide ? .06 : .3), w, h); c.updateProjectionMatrix();
    }
    function pose(c, cp, w, h){
      const aspect = w/h, far = aspect < 1 ? 1 + (1 - aspect)*1.25 : 1;
      KEYS.getPoint(cp, _k); LOOK.getPoint(cp, _l);
      const az = _k.x, el = _k.y, rad = _k.z*far;
      c.position.set(Math.sin(az)*Math.cos(el)*rad, Math.sin(el)*rad + 1.5, Math.cos(az)*Math.cos(el)*rad);
      c.lookAt(_l); c.updateMatrixWorld();
    }

    /* ---------- zona larangan vegetasi ----------
       WAJIB dipakai semua vegetasi (pohon prosedural, pohon 3D, sprite, cemara, semak — juga yang ditambahkan nanti):
       plant(kind, x, z, size, make) memeriksa posisi terhadap jalur kamera di semua babak untuk layar desktop & HP;
       bila melanggar, mencari posisi pengganti di dekatnya, dan bila tidak ada, pohon tidak ditanam. */
    const VEG_MIN_DIST = 12;                                   // jarak minimum ke kamera (unit dunia)
    const VEG_FADE = [9, 15];                                  // cadangan: di bawah 15 unit mulai mengecil, < 9 unit hilang
    const VEG_MAX_SIZE = .22, VEG_EDGE_SIZE = .16, VEG_TEXT_SIZE = .12;   // batas tinggi tampak pohon (bagian dari tinggi layar)
    const TEXT_ZONE = { wide: [.02, .5, .56, .92], tall: [0, .55, 1, .92] };   // area judul (x0, y0, x1, y1), varian 3D: kiri-bawah / bawah
    const VIEWS = [];
    for (const [w, h] of [[1440, 900], [1280, 720], [390, 844], [360, 740]]){
      for (let i = 0; i <= 12; i++){ const c = new THREE.PerspectiveCamera(34, 1, .1, 600); framing(c, w, h); pose(c, smooth(i/12), w, h); VIEWS.push({ c, wide: w >= 900, p: i/12 }); }
    }
    const _v = new THREE.Vector3(), _u = new THREE.Vector3();
    function vegViolation(x, z, radius, height){
      _v.set(x, Y0 + height/2, z);
      for (const V of VIEWS){
        const d = _v.distanceTo(V.c.position) - Math.max(radius, height/2);
        if (d < VEG_MIN_DIST) return `terlalu dekat kamera (${d.toFixed(1)} unit, ${V.wide ? 'desktop' : 'HP'}, p=${V.p.toFixed(2)})`;
        const q = _u.copy(_v).project(V.c);
        if (q.z > 1) continue;
        const top = _u.set(x, Y0 + height, z).project(V.c).y, bot = _v.clone().setY(Y0).project(V.c).y;
        const size = Math.abs(top - bot)/2, cx = (q.x + 1)/2, cy = (1 - q.y)/2, hw = size*.5;
        if (cx + hw < 0 || cx - hw > 1 || cy - size/2 > 1 || cy + size/2 < 0) continue;      // di luar layar
        if (size > VEG_MAX_SIZE) return `terlalu besar di layar (${(size*100).toFixed(0)}% tinggi, ${V.wide ? 'desktop' : 'HP'}, p=${V.p.toFixed(2)})`;
        if (size > VEG_EDGE_SIZE && (cx - hw < .02 || cx + hw > .98)) return `menutupi tepi layar (${V.wide ? 'desktop' : 'HP'}, p=${V.p.toFixed(2)})`;
        const T = TEXT_ZONE[V.wide ? 'wide' : 'tall'];
        if (size > VEG_TEXT_SIZE && cx + hw > T[0] && cx - hw < T[2] && cy + size/2 > T[1] && cy - size/2 < T[3]) return `menimpa area teks (${V.wide ? 'desktop' : 'HP'}, p=${V.p.toFixed(2)})`;
      }
      return null;
    }
    const onPlatform = (x, z) => Math.abs(x) < PX - 1 && z > PZ0 + 1 && z < PZ1 - 1 && !(Math.abs(x) < 9 && Math.abs(z) < 9) && !(x > -12.5 && x < -2.5 && z < -8.8);
    const vegReport = [], vegetation = [];
    function plant(kind, x, z, size, radius, height, make){
      let why = vegViolation(x, z, radius, height), at = [x, z];
      if (why){
        at = null;
        for (let r = 1.5; r <= 6 && !at; r += 1.5) for (let a = 0; a < 12 && !at; a++){
          const nx = x + Math.cos(a/12*Math.PI*2)*r, nz = z + Math.sin(a/12*Math.PI*2)*r;
          if (onPlatform(nx, nz) && !vegViolation(nx, nz, radius, height)) at = [nx, nz];
        }
        vegReport.push({ jenis: kind, posisi: `${x}, ${z}`, alasan: why, tindakan: at ? `dipindah ke ${at[0].toFixed(1)}, ${at[1].toFixed(1)}` : 'dihapus' });
        if (!at) return null;
      }
      const o = make(at[0], at[1], size); vegetation.push({ o, base: o.scale.clone() }); return o;
    }

    /* ---------- pohon zaitun & cemara (lewat plant(), jadi mematuhi zona larangan) ----------
       Tiap jenis punya 2–3 varian bentuk; semua pohon satu varian digambar sebagai InstancedMesh (batang + tajuk).
       make() hanya membuat "slot" (Object3D tak tampak); matriksnya disalin ke instance setelah semua ditanam. */
    const windU = { uTime: { value: 0 } };
    const rv = mulberry32(21);
    const barkMat = std({ map: T.bark.map, normalMap: T.bark.normalMap, normalScale: new THREE.Vector2(1.4, 1.4), roughness: .95, color: 0xd8d0c4 });
    const oliveLeaf = foliageMaterial(leafCard('zaitun', mulberry32(3)), windU, [1.2, .022], '.40,.45,.36'); mats.push(oliveLeaf);
    const cypLeaf = foliageMaterial(leafCard('cemara', mulberry32(4)), windU, [.6, .006], '.07,.12,.07'); mats.push(cypLeaf);
    const cypCore = std({ color: 0x1d3322, roughness: 1 });
    const vegKinds = {};
    /* zaitun: batang pendek bengkok yang bercabang 3–4, tajuk lebar tak beraturan di ujung cabang */
    function oliveVariant(seed){
      const r = mulberry32(seed), lean = (r() < .5 ? -1 : 1)*(.35 + r()*.35), fork = .95 + r()*.3, top = [lean*.4, fork, (r() - .5)*.3];
      const geos = [gnarledTube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean*.2 + (r() - .5)*.12, fork*.35, (r() - .5)*.12), new THREE.Vector3(lean*.3, fork*.7, (r() - .5)*.15), new THREE.Vector3(...top)],
        .36, .18, mobile ? 10 : 18, mobile ? 7 : 10, 7, .11)];
      const clumps = [], nb = 3 + Math.floor(r()*2);
      for (let i = 0; i < nb; i++){
        const a = i/nb*Math.PI*2 + r()*.8, out = .6 + r()*.6, up = .35 + r()*.7;
        const end = [top[0] + Math.cos(a)*out, top[1] + up, top[2] + Math.sin(a)*out];
        geos.push(gnarledTube([new THREE.Vector3(...top), new THREE.Vector3(top[0] + Math.cos(a)*out*.45, top[1] + up*.55, top[2] + Math.sin(a)*out*.45), new THREE.Vector3(...end)], .14, .04, mobile ? 6 : 10, 5, 4, .06));
        clumps.push({ p: [end[0], end[1] + .1, end[2]], r: [.55 + r()*.3, .36 + r()*.18, .55 + r()*.3] });
      }
      clumps.push({ p: [top[0], top[1] + .95, top[2]], r: [.7, .45, .7] });
      const crown = cardCanopy(r, clumps, mobile ? 440 : 1100, .34, [top[0], top[1] + .8, top[2]]);
      return [[mergeGeometries(geos), barkMat], [crown, oliveLeaf]];
    }
    /* cemara: inti kerucut gelap + kartu sisik daun membentuk gelendong ramping (tinggi satuan, diskala per pohon) */
    function cypressVariant(seed){
      const r = mulberry32(seed), clumps = [], n = 14, bend = (r() - .5)*.12;
      for (let i = 0; i < n; i++){
        const t = (i + .5)/n, rad = .42*Math.sin(Math.PI*Math.pow(t, .7))*(1 - t*.3) + .04;
        clumps.push({ p: [bend*t*t + (r() - .5)*.04, .25 + t*3.4, (r() - .5)*.04], r: [rad, .3, rad] });
      }
      const core = new THREE.CylinderGeometry(.02, .3, 3.2, 7, 1); core.translate(0, 1.85, 0);
      const trunk = new THREE.CylinderGeometry(.05, .08, .5, 6); trunk.translate(0, .25, 0);
      return [[mergeGeometries([core, trunk]), cypCore], [cardCanopy(r, clumps, mobile ? 130 : 330, .4, [0, 1.8, 0], true), cypLeaf]];
    }
    [['zaitun', oliveVariant, [101, 202, 303]], ['cemara', cypressVariant, [404, 505]]].forEach(([k, f, seeds]) => vegKinds[k] = seeds.map(sd => ({ parts: f(sd), slots: [] })));
    const vegSlot = (kind, sx, sy) => (x, z, s) => {
      const o = new THREE.Object3D(), vs = vegKinds[kind], v = vs[Math.floor(rv()*vs.length)];
      o.position.set(x, Y0, z); o.rotation.y = rv()*6.28; o.scale.set(s*sx, s*sy, s*sx); o.updateMatrix(); v.slots.push(o); return o;
    };
    [[-13, 6, 1.2], [12, 7, 1.1], [-15, -9, 1.2], [16.5, 9, 1.25], [9, -12, 1.1], [-16, -16, 1.0], [11.5, -4, .9], [-12, 1, .95], [14, -17, 1.05], [4.5, -16, .95], [6.5, -20, 1], [13, -9.5, .95], [-1, -20, .9], [17, -2, 1.1], [-16.5, -20.5, 1]]
      .forEach(([x, z, s]) => plant('zaitun', x, z, s, 1.8*s, 3.1*s, vegSlot('zaitun', 1, 1)));
    [[-18.5, 12], [-17.2, 12.6], [18.6, -13], [17.4, -13.5], [10, 13.5], [-6.5, 13.6], [18.7, 4], [-18.7, -6], [18.6, -19], [-18.6, -19.5]]
      .forEach(([x, z]) => { const h = 3.2 + rv(); plant('cemara', x, z, h, .55, h, (x, z) => vegSlot('cemara', 1, h/3.7)(x, z, 1)); });
    /* InstancedMesh per varian & bagian; tiap slot ingat (mesh, indeks) agar cadangan "mengecil" bisa menyalin matriksnya */
    const vegMeshes = [];
    for (const vs of Object.values(vegKinds)) for (const v of vs){
      if (!v.slots.length) continue;
      v.parts.forEach(([geo, mat]) => {
        const im = new THREE.InstancedMesh(geo, mat, v.slots.length); im.castShadow = im.receiveShadow = true;
        v.slots.forEach((o, i) => { im.setMatrixAt(i, o.matrix); (o.userData.inst ||= []).push([im, i]); });
        im.computeBoundingSphere(); scene.add(im); vegMeshes.push(im);
      });
    }
    if (new URL(location.href).searchParams.has('debug-veg')){ window.__vegReport = vegReport; console.table(vegReport.length ? vegReport : [{ hasil: 'semua vegetasi aman' }]); }

    /* ---------- kota tua di sekeliling (instanced) ----------
       Rumah batu bervolume: badan (kadang bertumpuk dua), parapet di atap datar, rumah tangga di atap, kubah kecil,
       atap lengkung (barrel vault), tangga luar. Tekstur batu dipetakan menurut posisi dunia (kepadatan sama di semua
       ukuran rumah). Jendela kecil emissive prosedural di dinding badan rumah, menyala bertahap bersama babak 2.
       Rumah jauh (> 72 unit) cukup badan saja (LOD sederhana); kabut menyamarkan sisanya. */
    const cityU = { uWinLit: { value: 0 }, uWinI: { value: 0 } };
    function cityMaterial(windows, opts){
      const m = std({ map: T.stone.map, normalMap: T.stone.normalMap, normalScale: new THREE.Vector2(.8, .8), roughness: .93, ...opts });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, cityU);
        sh.vertexShader = 'attribute float aRnd;\nvarying vec4 vCity;\n' + sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
          vec4 cw = modelMatrix*instanceMatrix*vec4(position, 1.);
          vec3 cn = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
          vec2 cuv = abs(cn.y) > .6 ? cw.xz : (abs(cn.x) > abs(cn.z) ? cw.zy : cw.xy);
          vMapUv = cuv*.34; vNormalMapUv = vMapUv;
          vCity = vec4(cuv, abs(cn.y) < .3 ? 1. : 0., aRnd);`);
        sh.fragmentShader = 'uniform float uWinLit, uWinI;\nvarying vec4 vCity;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          ${windows ? `if (vCity.z > .5 && vCity.y > .6){
            vec2 cell = vCity.xy*vec2(.62, .46) + vCity.w*13.;
            vec2 id = floor(cell), f = fract(cell);
            float h = fract(sin(dot(id, vec2(12.9898, 78.233)) + vCity.w*43.7)*43758.5453);
            float win = step(.4, f.x)*step(f.x, .6)*step(.32, f.y)*step(f.y, .7)*step(.35, h);
            diffuseColor.rgb *= 1. - win*.6;
            totalEmissiveRadiance += vec3(1., .6, .28)*win*step(fract(h*7.31), uWinLit)*uWinI*(.55 + .45*fract(h*3.7));
          }` : ''}`);
      };
      m.customProgramCacheKey = () => 'kota' + windows;
      return m;
    }
    const cityBody = cityMaterial(true, { color: 0xffffff }), cityTrim = cityMaterial(false, { color: 0xffffff });
    const plaster = std({ color: 0xffffff, roughness: .82 });
    const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0);
    /* parapet: cincin 4 dinding tipis di tepi atap (tinggi tetap .32, diskala lebar-panjang saja) */
    const parapetG = mergeGeometries([[0, .475, 1, .05], [0, -.475, 1, .05], [.475, 0, .05, .9], [-.475, 0, .05, .9]].map(([x, z, w, d]) => new THREE.BoxGeometry(w, .32, d).translate(x, .16, z)));
    const hutG = mergeGeometries([new THREE.BoxGeometry(1.3, 1.1, 1.3).translate(0, .55, 0), new THREE.BoxGeometry(1.5, .08, 1.5).translate(0, 1.14, 0)]);
    const domeG = mergeGeometries([new THREE.CylinderGeometry(1, 1, .3, 14).translate(0, .15, 0), new THREE.SphereGeometry(1, 14, 7, 0, Math.PI*2, 0, Math.PI/2).translate(0, .3, 0)]);
    const vaultG = new THREE.CylinderGeometry(.5, .5, 1, 12, 1, false, 0, Math.PI).rotateZ(Math.PI/2);   // poros sepanjang x, setengah atas
    const stairG = mergeGeometries(Array.from({ length: 6 }, (_, i) => new THREE.BoxGeometry(1/6, (i + 1)/6, .9).translate(-.5 + (i + .5)/6, (i + 1)/12, 0)));
    const rcity = mulberry32(31), cityN = mobile ? 420 : 760, items = { body: [], parapet: [], hut: [], dome: [], vault: [], stair: [] };
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), off = new THREE.Vector3();
    const put = (k, x, y, z, rot, sx, sy, sz, col) => items[k].push({ x, y, z, rot, sx, sy, sz, col });
    for (let i = 0; i < cityN; i++){
      let x, z; do { x = (rcity() - .5)*170; z = (rcity() - .5)*170; } while ((Math.abs(x) < PX + 3 && z > PZ0 - 3 && z < PZ1 + 3) || (z > PZ1 && Math.abs(x) < 34 && z < PZ1 + 22));
      const w = 2 + rcity()*4, d = 2 + rcity()*4, h = 1.5 + rcity()*4, rot = (rcity() - .5)*.3, far = Math.hypot(x, z) > 72, col = rcity();
      put('body', x, 0, z, rot, w, h, d, col);
      if (far) continue;
      const at = (lx, lz) => off.set(lx, 0, lz).applyAxisAngle(up, rot);
      const r = rcity();
      if (r < .3){                                   // bertumpuk: lantai atas lebih kecil, menepi ke satu sudut
        const w2 = w*(.45 + rcity()*.25), d2 = d*(.45 + rcity()*.25), h2 = 1.3 + rcity()*1.6, o = at((w - w2)/2*(rcity() < .5 ? -1 : 1), (d - d2)/2*(rcity() < .5 ? -1 : 1));
        put('parapet', x, h, z, rot, w, 1, d, col); put('body', x + o.x, h, z + o.z, rot, w2, h2, d2, col); put('parapet', x + o.x, h + h2, z + o.z, rot, w2, 1, d2, col);
      } else if (r < .58){                           // kubah kecil di atas drum
        const s = Math.min(w, d)*(.26 + rcity()*.08); put('parapet', x, h, z, rot, w, 1, d, col); put('dome', x, h, z, rot, s, s*(.8 + rcity()*.3), s, col);
      } else if (r < .74){                           // atap lengkung
        put('vault', x, h, z, rot, w, Math.min(w, d)*.55, d, col);
      } else {                                       // atap datar berparapet + rumah tangga
        put('parapet', x, h, z, rot, w, 1, d, col);
        if (rcity() < .6){ const o = at((w/2 - .8)*(rcity() < .5 ? -1 : 1), (d/2 - .8)*(rcity() < .5 ? -1 : 1)); put('hut', x + o.x, h, z + o.z, rot, 1, 1, 1, col); }
      }
      if (rcity() < .18 && h < 4){ const o = at(w/2 + .45, 0); put('stair', x + o.x, 0, z + o.z, rot + Math.PI/2, Math.min(d*.8, h*1.1), h, 1, col); }
    }
    const mtx = new THREE.Matrix4(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), cc = new THREE.Color();
    const cityMeshes = [['body', unitBox, cityBody], ['parapet', parapetG, cityTrim], ['hut', hutG, cityTrim], ['dome', domeG, plaster], ['vault', vaultG, plaster], ['stair', stairG, cityTrim]].map(([k, geo, mat]) => {
      const list = items[k], im = new THREE.InstancedMesh(geo, mat, list.length), rnd = new Float32Array(list.length);
      list.forEach((it, i) => {
        q.setFromAxisAngle(up, it.rot); mtx.compose(ps.set(it.x, it.y, it.z), q, sc.set(it.sx, it.sy, it.sz)); im.setMatrixAt(i, mtx); rnd[i] = it.col;
        /* batu pasir hangat; kubah & lengkung plester krem pucat atau abu timah */
        if (mat === plaster) cc.setHSL(.09 + it.col*.02, it.col < .25 ? .06 : .3, it.col < .25 ? .62 : .8); else cc.setHSL(.085 + it.col*.025, .3 + it.col*.14, .64 + it.col*.12);
        im.setColorAt(i, cc);
      });
      geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 1));
      im.castShadow = im.receiveShadow = true; scene.add(im); return im;
    });
    /* parapet tembok pelataran */
    const merlons = new THREE.InstancedMesh(merlonGeo, stoneMat, merlonPts.length);
    merlonPts.forEach((m, i) => { ps.set(...m[0]); q.setFromAxisAngle(up, m[1]); sc.set(1, 1, 1); mtx.compose(ps, q, sc); merlons.setMatrixAt(i, mtx); });
    merlons.castShadow = true; scene.add(merlons);
    /* bukit jauh (Bukit Zaitun di timur) */
    const hillMat = std({ color: 0x6d5a64, roughness: 1, flatShading: true });
    for (let i = 0; i < 16; i++){ const a = i/16*Math.PI*2, r = 140 + Math.random()*30; add(scene, new THREE.ConeGeometry(30 + Math.random()*25, 8 + Math.random()*11, 6), hillMat, Math.cos(a)*r, 0, Math.sin(a)*r, false); }

    /* ---------- lentera kontribusi: titik di hero/lights3d.json (editor: ?edit-lights) + lampu kota acak ---------- */
    let alive = true, lights = [], editor = null;
    const EDIT_LIGHTS = new URL(location.href).searchParams.has('edit-lights');
    const CITY_N = mobile ? 90 : 160, cityPts = [], rc = mulberry32(11);
    while (cityPts.length < CITY_N){ const x = (rc() - .5)*130, z = (rc() - .5)*130; if (Math.abs(x) < PX + 3 && z > PZ0 - 3 && z < PZ1 + 3) continue; cityPts.push([x, 2 + rc()*5, z]); }
    /* penempatan awal otomatis (dipakai bila hero/lights3d.json belum ada atau kosong) */
    function autoLights(){
      const r = mulberry32(5), out = [];
      const inBuilding = (x, z) => Math.hypot(x, z) < 6.4 || (x > -12 && x < -3 && z < -9 && z > PZ0) || Math.hypot(x - 6.9, z + 4.2) < 1.6;
      while (out.length < 150){ const x = (r() - .5)*38, z = PZ0 + 1 + r()*(PD - 2); if (inBuilding(x, z)) continue; out.push([x, (Math.abs(x) < 8.5 && Math.abs(z) < 8.5 ? Y1 : Y0) + .35, z]); }
      for (let i = 0; i < 40; i++){ const a = i/40*Math.PI*2; out.push([Math.cos(a)*6.7, Y1 + .45, Math.sin(a)*6.7]); }   // cincin di sekitar Kubah
      for (let i = 0; i < 14; i++) out.push([-11 + i*.55, Y0 + .45, -8.9]);                                             // depan serambi Qibli
      for (let i = out.length - 1; i > 0; i--){ const k = Math.floor(r()*(i + 1)); [out[i], out[k]] = [out[k], out[i]]; }
      return out.map(q => q.map(v => +v.toFixed(2)));
    }
    const lU = { map: { value: glowSprite() }, uLit: { value: 0 }, uTime: { value: 0 }, uSize: { value: mobile ? 1.6 : 1.35 }, uScale: { value: 400 }, uOp: { value: 1 }, uN: { value: 1 } };
    const lanterns = new THREE.Points(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms: lU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aI, aPh; uniform float uLit, uTime, uSize, uScale, uN; varying float vA;
        void main(){ vec4 mv = modelViewMatrix*vec4(position, 1.);
          float on = clamp((uLit*(uN + 14.) - aI)/14., 0., 1.);
          float fl = .86 + .14*sin(uTime*(3. + aPh*2.) + aPh*30.)*sin(uTime*1.7 + aPh*11.);
          vA = on*fl; gl_PointSize = uSize*uScale/-mv.z*(.55 + .45*on); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D map; uniform float uOp; varying float vA;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(t.rgb*2.4*vA*uOp*t.a, 1.); }`
    }));
    lanterns.frustumCulled = false; scene.add(lanterns);
    /* urutan menyala: titik editor sesuai urutan di JSON, lampu kota diselipkan merata di antaranya */
    function buildLanterns(){
      const all = lights.map((q, i) => [q, (i + .5)/Math.max(1, lights.length)]).concat(cityPts.map((q, i) => [q, (i + .5)/CITY_N + .001]));
      all.sort((a, b) => a[1] - b[1]);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(all.flatMap(e => e[0]), 3));
      g.setAttribute('aI', new THREE.Float32BufferAttribute(all.map((e, i) => i), 1));
      g.setAttribute('aPh', new THREE.Float32BufferAttribute(all.map((e, i) => (i*9301 + 49297)%233280/233280), 1));
      lanterns.geometry.dispose(); lanterns.geometry = g; lU.uN.value = all.length;
    }
    lights = autoLights(); buildLanterns();
    fetch(new URL('./lights3d.json', import.meta.url)).then(r => r.ok ? r.json() : null).catch(() => null).then(d => {
      if (!alive) return;
      let draft = null;
      if (EDIT_LIGHTS){ try { draft = JSON.parse(localStorage.getItem('lcdu-lights3d-draft')); } catch (e) {} }
      const src = (draft && draft.lights) || (d && d.lights && d.lights.length ? d.lights : null);
      if (src){ lights = src; buildLanterns(); }
      if (editor) editor.refresh();
    });

    /* ---------- Kubah Shakhrah & Masjid Qibli dari model 3D (TRELLIS.2, dioptimasi tools/optimize-models.mjs).
       Dimuat hanya saat varian 3D dipilih; selama memuat, adegan malam prosedural tampil sebagai layar sementara.
       Bila model gagal dimuat, bangunan prosedural tetap dipakai (cadangan). ---------- */
    const models = { dome: null, qibli: null }, modelMats = [];
    const PLACE = {
      dome: { proc: dor, size: 11, axis: 'xz', pos: [0, Y1, 0], rot: 0 },           // lebar segi delapan + serambi (maket: sedikit diperbesar)
      qibli: { proc: qibli, size: 13, axis: 'z', pos: [-7.5, Y0, -15.8], rot: .06 },  // panjang; serambi menghadap utara (ke Kubah)
    };
    const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    for (const name of Object.keys(PLACE)){
      gltfLoader.loadAsync(new URL(`../assets/models/optimized/${name}${mobile ? '-mobile' : ''}.glb`, import.meta.url).href).then(g => {
        if (!alive) return;
        const m = g.scene, pl = PLACE[name], size = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
        m.scale.setScalar(pl.size/(pl.axis === 'z' ? size.z : Math.max(size.x, size.z)));
        m.position.set(...pl.pos); m.rotation.y = pl.rot;
        m.traverse(o => {
          if (!o.isMesh) return;
          o.castShadow = o.receiveShadow = true;
          o.material.emissiveIntensity = 0;            // lapisan jendela; kecerahannya diatur di frame()
          mats.push(o.material); modelMats.push(o.material);
        });
        scene.add(m); models[name] = m; pl.proc.visible = false;
      }).catch(err => console.warn('Model 3D gagal dimuat, memakai bangunan prosedural:', name, err));
    }

    /* ---------- cahaya kursor: lampu hangat + pendar lembut di titik yang ditunjuk ---------- */
    const cursorLight = new THREE.PointLight(0xffb066, 0, 16, 1.4); cursorLight.position.set(0, Y1 + 1.6, 0); scene.add(cursorLight);
    const cursorGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: 0xffc58a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    cursorGlow.scale.setScalar(8); cursorGlow.position.copy(cursorLight.position); scene.add(cursorGlow);
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y1), hit = new THREE.Vector3();
    let cursorAmt = 0;

    /* ---------- pascaproses: bloom halus untuk lentera, jendela, dan matahari ---------- */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .55, .82);
    composer.addPass(bloom); composer.addPass(new OutputPass());

    /* ---------- palet waktu ---------- */
    const P = {
      hemiSky: [C('#3b4f9e'), C('#ffd2a8')], hemiGround: [C('#141a3a'), C('#5c4334')], hemiI: [.15, .52],
      sunCol: [C('#8ea6ff'), C('#ffb46b')], sunI: [.05, 2.05], fog: [C('#0b1236'), C('#c98f78')], fogD: [.0115, .0045],
      ground: [C('#2c2f52'), C('#9c7d5a')], glow: C('#ffb15e'), haze: [C('#1b2a6b'), C('#d99a7a')],
    };

    /* ---------- kamera: tiga titik kunci, satu per babak, jalur pendek ---------- */
    const endAz = .36, vd = new THREE.Vector3(-Math.sin(endAz), 0, -Math.cos(endAz)), rgt = new THREE.Vector3(Math.cos(endAz), 0, -Math.sin(endAz));
    const sunH = new THREE.Vector3();   // matahari terbit di latar, sedikit ke kanan (di HP hampir tengah)
    const az0 = KEYS.points[0].x, vd0 = new THREE.Vector3(-Math.sin(az0), 0, -Math.cos(az0)), rgt0 = new THREE.Vector3(Math.cos(az0), 0, -Math.sin(az0));
    const moonSky = new THREE.Vector3(), moonLightDir = rgt0.clone().addScaledVector(vd0, .7).setY(.55).normalize();
    moon.position.copy(moonLightDir).multiplyScalar(90);
    const cam = { p: state.p };
    const toCam = gsap && !state.reduce ? gsap.quickTo(cam, 'p', { duration: .9, ease: 'power3.out' }) : null;
    const sd = new THREE.Vector3(), tmpC = new THREE.Color();
    let lastTarget = -1;

    /* ---------- kualitas otomatis: fps < 40 pada 2 detik pertama → pindah ke Lentera HD;
       setelah itu, fps rendah menurunkan bayangan/bloom/DPR bertahap ---------- */
    let tier = mobile ? 1 : 2, fpsN = 0, fpsT = 0, lastNow = 0, warmup = 20, gaveUp = false, firstCheck = true;
    function applyTier(){
      const t = TIERS[tier];
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, t.dpr));
      sun.castShadow = t.shadow > 0;
      if (t.shadow){ sun.shadow.mapSize.set(t.shadow, t.shadow); if (sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; } }
      mats.forEach(m => m.needsUpdate = true);
      resize();
    }
    function watchFps(now){
      if (state.reduce || gaveUp) return;
      const dt = now - lastNow; lastNow = now;
      if (dt <= 0 || dt > 250) return;                       // tab tersembunyi / baru kembali
      if (warmup > 0){ warmup--; return; }
      fpsN++; fpsT += dt;
      if (firstCheck ? fpsT < 2000 : fpsN < 90) return;
      const fps = 1000*fpsN/fpsT; fpsN = fpsT = 0;
      if (firstCheck){ firstCheck = false; if (fps < 40 && state.fallback && !DEBUG_PERF){ gaveUp = true; state.fallback('lentera-hd'); } return; }
      if (fps < 45 && tier > 0){ tier--; warmup = 40; applyTier(); }
    }

    function resize(){
      const w = state.w, h = state.h, t = TIERS[tier];
      renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
      bloom.resolution.set(w*Math.max(t.bloom, .25), h*Math.max(t.bloom, .25));
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      framing(camera, w, h);
      lU.uScale.value = h*renderer.getPixelRatio()/2; starU.uPx.value = renderer.getPixelRatio();
    }
    applyTier();

    /* ?debug-perf: draw call, segitiga, dan waktu render (gl.finish) per frame → window.__dioramaPerf (fallback otomatis mati) */
    const DEBUG_PERF = new URL(location.href).searchParams.has('debug-perf');
    /* ?debug-cam=x,y,z,tx,ty,tz: kamera bebas untuk memeriksa detail (hanya pengembangan) */
    const DEBUG_CAM = (new URL(location.href).searchParams.get('debug-cam') || '').split(',').map(Number).filter(n => !isNaN(n)).length === 6 ? new URL(location.href).searchParams.get('debug-cam').split(',').map(Number) : null;
    if (DEBUG_PERF){ renderer.info.autoReset = false; window.__dioramaPerf = { frames: [] }; }

    function frame(st, now){
      watchFps(now);
      const t0 = DEBUG_PERF ? (renderer.info.reset(), performance.now()) : 0;
      const p = st.p, lit = smooth(p/.62), dawn = smooth((p - .5)/.5), time = st.reduce ? 0 : now/1000;
      if (toCam){ if (p !== lastTarget){ toCam(p); lastTarget = p; } } else cam.p = p;

      /* kamera */
      const aspect = st.w/st.h;
      pose(camera, smooth(cam.p), st.w, st.h);
      if (DEBUG_CAM){ camera.position.set(DEBUG_CAM[0], DEBUG_CAM[1], DEBUG_CAM[2]); camera.lookAt(DEBUG_CAM[3], DEBUG_CAM[4], DEBUG_CAM[5]); camera.updateMatrixWorld(); }

      /* cadangan: vegetasi yang tetap terlalu dekat kamera mengecil halus (tidak pernah menyambar layar) */
      for (const v of vegetation){
        const d = DEBUG_CAM ? 99 : v.o.position.distanceTo(camera.position), k = smooth((d - VEG_FADE[0])/(VEG_FADE[1] - VEG_FADE[0]));
        if (k === v.k) continue; v.k = k;
        v.o.scale.copy(v.base).multiplyScalar(Math.max(k, .001)); v.o.visible = k > .01;
        if (v.o.userData.inst){ v.o.updateMatrix(); for (const [im, i] of v.o.userData.inst){ im.setMatrixAt(i, v.o.matrix); im.instanceMatrix.needsUpdate = true; } }
      }
      windU.uTime.value = st.reduce ? 0 : now/1000;

      /* cahaya kursor mengikuti titik di lantai pelataran */
      cursorAmt += ((st.pointer.active ? 1 : 0) - cursorAmt)*(st.reduce ? 1 : .08);
      if (st.pointer.active){
        camera.updateMatrixWorld(); ndc.set(st.pointer.x/st.w*2 - 1, 1 - st.pointer.y/st.h*2); ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectPlane(floor, hit)){ hit.y += 1.6; cursorLight.position.lerp(hit, st.reduce ? 1 : .2); cursorGlow.position.copy(cursorLight.position); }
      }

      /* langit, matahari terbit dari bawah cakrawala */
      for (let i = 0; i < 3; i++){ const k = ['top', 'mid', 'hor'][i]; skyU[k].value.copy(SKY.n[i]).lerp(SKY.d[i], dawn); }
      skyU.hor.value.addScalar(lit*.035*(1 - dawn));
      sunH.copy(vd).addScaledVector(rgt, aspect >= 1 ? .2 : .06).normalize();
      const sunEl = lerp(-.1, .2, smooth((p - .55)/.45));
      sd.copy(sunH).multiplyScalar(Math.cos(sunEl)); sd.y = Math.sin(sunEl);
      skyU.sunDir.value.copy(sd); skyU.sunAmt.value = smooth((p - .5)/.35);
      starU.uOp.value = 1 - smooth((p - .45)/.4); starU.uTime.value = time;
      const night = 1 - dawn;
      moonSky.copy(vd0).addScaledVector(rgt0, aspect >= 1 ? .24 : .08).normalize().multiplyScalar(Math.cos(.17)).setY(Math.sin(.17));
      skyU.moonDir.value.copy(moonSky); skyU.moonAmt.value = night;
      moon.intensity = 1.5*night;
      lerpC(P.hemiSky[0], P.hemiSky[1], dawn, hemi.color); lerpC(P.hemiGround[0], P.hemiGround[1], dawn, hemi.groundColor); hemi.intensity = lerp(P.hemiI[0], P.hemiI[1], dawn) + lit*.1;
      lerpC(P.sunCol[0], P.sunCol[1], dawn, sun.color); sun.intensity = lerp(P.sunI[0], P.sunI[1], dawn);
      if (dawn < .02) sun.position.set(-30, 50, -25); else sun.position.copy(sd).setY(Math.max(sd.y, .12)).normalize().multiplyScalar(90);
      lerpC(P.fog[0], P.fog[1], dawn, scene.fog.color); scene.fog.density = lerp(P.fogD[0], P.fogD[1], dawn);
      lerpC(P.haze[0], P.haze[1], dawn, hazeU.uCol.value); hazeU.uOp.value = .25 - dawn*.08;
      lerpC(P.ground[0], P.ground[1], dawn, ground.material.color);
      renderer.toneMappingExposure = lerp(.92, .76, dawn);
      const envI = lerp(.12, .52, dawn) + lit*.06; mats.forEach(m => m.envMapIntensity = envI);

      /* jendela: sebagian sudah menyala hangat sejak awal; lentera menyala bersama babak 2, meredup saat fajar */
      const win = Math.max(.4, lit)*(1 - dawn*.8), flick = 1 + (st.reduce ? 0 : Math.sin(time*7.3)*.03 + Math.sin(time*13.1)*.02);
      glowMat.color.copy(P.glow).multiplyScalar(win*3.2*flick);
      doorMat.emissiveIntensity = win*1.4;
      cityU.uWinLit.value = .12 + .3*lit; cityU.uWinI.value = win*2.6*flick;   // jendela kota menyala bertahap bersama lampu kota
      modelMats.forEach(m => m.emissiveIntensity = win*2.4*flick);
      warm.forEach(l => l.intensity = win*24*flick);
      cursorLight.intensity = cursorAmt*(1 - dawn*.5)*30; cursorGlow.material.opacity = cursorAmt*(.55 - dawn*.3);
      lU.uLit.value = lit; lU.uOp.value = 1 - dawn*.6; lU.uTime.value = time;
      bloom.strength = lerp(.62, .24, dawn); bloom.threshold = lerp(.8, 1.0, dawn);

      if (TIERS[tier].bloom) composer.render(); else renderer.render(scene, camera);
      if (DEBUG_PERF){
        renderer.getContext().finish();
        const f = window.__dioramaPerf.frames; f.push(performance.now() - t0); if (f.length > 120) f.shift();
        Object.assign(window.__dioramaPerf, { p: +p.toFixed(2), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
          ms: +(f.reduce((a, b) => a + b, 0)/f.length).toFixed(2), tier, dpr: renderer.getPixelRatio() });
      }
    }

    /* ---------- editor lentera 3D (?edit-lights): klik permukaan model/tanah untuk menambah, klik titik untuk menghapus ---------- */
    if (EDIT_LIGHTS) editor = makeLightEditor();
    function makeLightEditor(){
      const heroEl = document.getElementById('hero'); heroEl.classList.add('hd-editing');
      const markGeo = new THREE.SphereGeometry(.17, 10, 8), markMat = new THREE.MeshBasicMaterial({ color: 0xffc21a, depthTest: false, transparent: true, opacity: .9 });
      let marks = null;
      const panel = document.createElement('div'); panel.className = 'hd-edit-panel';
      panel.innerHTML = '<b>Editor lentera 3D</b><span class="hd-edit-info"></span><span>Klik bangunan atau tanah untuk menambah lentera, klik titik kuning untuk menghapus.</span>' +
        '<div><button type="button" data-a="copy">Salin JSON</button> <button type="button" data-a="auto">Isi otomatis</button> <button type="button" data-a="reset">Kembalikan ke berkas</button></div><span class="hd-edit-msg" role="status"></span>';
      document.body.appendChild(panel);
      const info = panel.querySelector('.hd-edit-info'), msg = panel.querySelector('.hd-edit-msg');
      const skip = new Set([sky, haze, lanterns, stars, cursorGlow]);
      const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
      function refresh(){
        if (marks){ scene.remove(marks); marks.dispose(); }
        marks = new THREE.InstancedMesh(markGeo, markMat, Math.max(1, lights.length)); marks.count = lights.length; marks.renderOrder = 999;
        const mm = new THREE.Matrix4(); lights.forEach((q, i) => marks.setMatrixAt(i, mm.makeTranslation(q[0], q[1], q[2])));
        scene.add(marks); skip.add(marks); info.textContent = `${lights.length} titik lentera (+${CITY_N} lampu kota otomatis)`;
      }
      function changed(){ buildLanterns(); refresh(); try { localStorage.setItem('lcdu-lights3d-draft', JSON.stringify({ lights })); } catch (e) {} }
      const onClick = e => {
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set((e.clientX - r.left)/r.width*2 - 1, 1 - (e.clientY - r.top)/r.height*2); camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera);
        const hm = marks && ray.intersectObject(marks)[0];
        if (hm){ lights.splice(hm.instanceId, 1); changed(); return; }
        const h = ray.intersectObjects(scene.children, true).find(x => x.object.isMesh && !skip.has(x.object) && shown(x.object));
        if (!h) return;
        const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
        const q = h.point.clone().addScaledVector(n, .25);
        lights.push([+q.x.toFixed(2), +q.y.toFixed(2), +q.z.toFixed(2)]); changed();
      };
      renderer.domElement.addEventListener('click', onClick);
      panel.addEventListener('click', async e => {
        const a = e.target.dataset && e.target.dataset.a; if (!a) return;
        if (a === 'auto'){ lights = autoLights(); changed(); msg.textContent = 'Diisi ulang otomatis.'; return; }
        if (a === 'reset'){
          try { localStorage.removeItem('lcdu-lights3d-draft'); } catch (err) {}
          const d = await fetch(new URL('./lights3d.json', import.meta.url)).then(r => r.ok ? r.json() : null).catch(() => null);
          lights = d && d.lights && d.lights.length ? d.lights : autoLights(); buildLanterns(); refresh(); msg.textContent = 'Dikembalikan ke hero/lights3d.json.'; return;
        }
        const json = '{\n  "lights": [\n' + lights.map(q => '    ' + JSON.stringify(q)).join(',\n') + '\n  ]\n}\n';
        try { await navigator.clipboard.writeText(json); msg.textContent = 'Tersalin. Tempel ke hero/lights3d.json.'; }
        catch (err){ const ta = document.createElement('textarea'); ta.value = json; panel.appendChild(ta); ta.select(); msg.textContent = 'Salin manual dari kotak ini (Cmd/Ctrl+C).'; }
      });
      refresh();
      return { refresh, destroy(){ renderer.domElement.removeEventListener('click', onClick); panel.remove(); heroEl.classList.remove('hd-editing'); } };
    }

    return {
      frame, resize,
      destroy(){
        alive = false; if (editor) editor.destroy();
        if (gsap) gsap.killTweensOf(cam);
        composer.dispose(); renderer.dispose(); pmrem.dispose(); env.dispose();
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material){ [].concat(o.material).forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); if (m.uniforms) for (const k in m.uniforms) if (m.uniforms[k].value && m.uniforms[k].value.isTexture) m.uniforms[k].value.dispose(); m.dispose(); }); } });
        renderer.domElement.remove();
      }
    };
  }
};
