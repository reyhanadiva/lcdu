/* Varian 3 — Diorama 3D (three.js): kompleks Al-Aqsa sebagai maket. Scroll menggerakkan kamera dan waktu,
   dari malam gelap → ratusan lentera menyala → matahari terbit. Kursor sedikit menggeser sudut pandang.
   Semua tekstur dibuat prosedural (canvas) — tidak ada aset luar. Pita kaligrafi hanyalah ornamen abstrak,
   bukan tulisan ayat, supaya tidak ada teks Al-Qur'an yang keliru. */
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { EffectComposer } from '../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/addons/postprocessing/OutputPass.js';

/* GSAP (UMD) dimuat sekali; kalau gagal, kamera tetap jalan tanpa easing tambahan */
let gsap = null;
try { await import('../vendor/gsap/gsap.min.js'); gsap = window.gsap || null; } catch (e) {}

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

  return { marble, stone, tile, band, ribs, paving };
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
    const skyU = { top: { value: new THREE.Vector3() }, mid: { value: new THREE.Vector3() }, hor: { value: new THREE.Vector3() }, sunDir: { value: new THREE.Vector3(0, 0, 1) }, sunAmt: { value: 0 } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform vec3 top, mid, hor, sunDir; uniform float sunAmt; varying vec3 vD;
        void main(){ float h = vD.y; vec3 sd = normalize(sunDir);
          vec3 c = mix(hor, mid, smoothstep(-.02, .2, h)); c = mix(c, top, smoothstep(.2, .75, h));
          float az = max(dot(normalize(vD.xz), normalize(sd.xz)), 0.);
          c += vec3(1., .5, .25)*pow(az, 5.)*(1. - smoothstep(-.05, .32, h))*.55*sunAmt;
          float s = max(dot(vD, sd), 0.);
          c += vec3(1., .9, .7)*smoothstep(.9991, .9994, s)*16.*sunAmt;          // cakram
          c += vec3(1., .62, .3)*(pow(s, 40.)*.9 + pow(s, 8.)*.14)*sunAmt;     // halo
          gl_FragColor = vec4(c, 1.); }`
    }));
    scene.add(sky);
    const SKY = { n: [hex3('#030716'), hex3('#0A1442'), hex3('#16225E')], d: [hex3('#3558A8'), hex3('#D98C7E'), hex3('#F7B77C')] };

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
    const chain = new THREE.Group(); chain.position.set(6.6, Y1, 0); scene.add(chain);
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

    /* ---------- pohon zaitun & cemara ---------- */
    const leaf = std({ color: 0x4b7352, roughness: .85, flatShading: true }), leafD = std({ color: 0x24432f, roughness: .9, flatShading: true }), bark = std({ color: 0x5b4634, roughness: 1 });
    const blobG = new THREE.IcosahedronGeometry(1, 1), trunkG = new THREE.CylinderGeometry(.14, .24, 1.3, 7);
    const oliveTree = (x, z, s) => {
      const g = new THREE.Group(); g.position.set(x, Y0, z); g.scale.setScalar(s); g.rotation.y = Math.random()*6; scene.add(g);
      add(g, trunkG, bark, 0, .65).rotation.z = .15;
      [[0, 1.7, 0, .9], [.6, 1.5, .2, .7], [-.6, 1.55, -.1, .72], [.1, 2.15, -.3, .65], [-.2, 1.4, .5, .6]].forEach(b => add(g, blobG, leaf, b[0], b[1], b[2]).scale.setScalar(b[3]));
    };
    const cypG = new THREE.SphereGeometry(.5, 10, 12);
    const cypress = (x, z, h) => add(scene, cypG, leafD, x, Y0 + h*.5, z).scale.set(1, h, 1);
    [[-13, 6, 1.2], [12, 7, 1.1], [-15, -9, 1.2], [16.5, 9, 1.25], [9, -12, 1.1], [-16, -16, 1.0], [11.5, -4, .9], [-12, 1, .95], [14, -17, 1.05], [4.5, -16, .95]].forEach(o => oliveTree(...o));
    [[-18.5, 12], [-17.2, 12.6], [18.6, -13], [17.4, -13.5], [10, 13.5], [-6.5, 13.6], [18.7, 4], [-18.7, -6], [18.6, -19], [-18.6, -19.5]].forEach(o => cypress(o[0], o[1], 3.2 + Math.random()));

    /* ---------- kota tua di sekeliling: rumah batu + kubah kecil di atap (instanced) ---------- */
    const cityGeo = new THREE.BoxGeometry(1, 1, 1); cityGeo.translate(0, .5, 0);
    const cityN = mobile ? 420 : 760, cityMesh = new THREE.InstancedMesh(cityGeo, std({ color: 0xffffff, roughness: .95 }), cityN);
    const roofN = Math.round(cityN*.35), roofMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.5, 12, 6, 0, Math.PI*2, 0, Math.PI/2), std({ color: 0xffffff, roughness: .9 }), roofN);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), cc = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
    let ri = 0;
    for (let i = 0; i < cityN; i++){
      let x, z; do { x = (Math.random() - .5)*170; z = (Math.random() - .5)*170; } while ((Math.abs(x) < PX + 3 && z > PZ0 - 3 && z < PZ1 + 3) || (z > PZ1 && Math.abs(x) < 34 && z < PZ1 + 22));
      const w = 2 + Math.random()*4, d = 2 + Math.random()*4, h = 1.5 + Math.random()*4.5, rot = Math.random()*.3;
      ps.set(x, 0, z); q.setFromAxisAngle(up, rot); sc.set(w, h, d); mtx.compose(ps, q, sc); cityMesh.setMatrixAt(i, mtx);
      cityMesh.setColorAt(i, cc.setHSL(.09 + Math.random()*.02, .32 + Math.random()*.12, .62 + Math.random()*.12));
      if (ri < roofN && Math.random() < .5){ const s = Math.min(w, d)*.6; ps.set(x, h, z); sc.set(s, s*.8, s); mtx.compose(ps, q, sc); roofMesh.setMatrixAt(ri, mtx); roofMesh.setColorAt(ri, cc.setHSL(.09, .2, .75)); ri++; }
    }
    roofMesh.count = ri;
    cityMesh.castShadow = cityMesh.receiveShadow = roofMesh.castShadow = true; scene.add(cityMesh, roofMesh);
    /* parapet tembok pelataran */
    const merlons = new THREE.InstancedMesh(merlonGeo, stoneMat, merlonPts.length);
    merlonPts.forEach((m, i) => { ps.set(...m[0]); q.setFromAxisAngle(up, m[1]); sc.set(1, 1, 1); mtx.compose(ps, q, sc); merlons.setMatrixAt(i, mtx); });
    merlons.castShadow = true; scene.add(merlons);
    /* bukit jauh (Bukit Zaitun di timur) */
    const hillMat = std({ color: 0x6d5a64, roughness: 1, flatShading: true });
    for (let i = 0; i < 16; i++){ const a = i/16*Math.PI*2, r = 140 + Math.random()*30; add(scene, new THREE.ConeGeometry(30 + Math.random()*25, 8 + Math.random()*11, 6), hillMat, Math.cos(a)*r, 0, Math.sin(a)*r, false); }

    /* ---------- lentera kontribusi: menyala satu per satu, berkedip seperti api ---------- */
    const LN = mobile ? 280 : 460, lp = [];
    const inBuilding = (x, z) => Math.hypot(x, z) < 5.2 || (x > -13 && x < -2 && z < -9 && z > PZ0) || Math.hypot(x - 6.6, z) < 1.4;
    while (lp.length < LN*3){
      let x, y, z; const k = Math.random();
      if (k < .5){ x = (Math.random() - .5)*38; z = PZ0 + 1 + Math.random()*(PD - 2); y = Y0 + .35; if (Math.abs(x) < 8.5 && Math.abs(z) < 8.5) y = Y1 + .35; if (inBuilding(x, z)) continue; }
      else if (k < .62){ const a = Math.random()*Math.PI*2; x = Math.cos(a)*5.1; z = Math.sin(a)*5.1; y = Y1 + .5 + Math.random()*.4; }
      else if (k < .68){ x = -7.5 + (Math.random() - .5)*9; z = -9.2; y = Y0 + .4 + Math.random()*.2; }
      else { x = (Math.random() - .5)*130; z = (Math.random() - .5)*130; if (Math.abs(x) < PX + 3 && z > PZ0 - 3 && z < PZ1 + 3) continue; y = 2 + Math.random()*5; }
      lp.push(x, y, z);
    }
    const order = Array.from({ length: LN }, (_, i) => i).sort(() => Math.random() - .5);
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lgeo.setAttribute('aI', new THREE.Float32BufferAttribute(order, 1));
    lgeo.setAttribute('aPh', new THREE.Float32BufferAttribute(Array.from({ length: LN }, Math.random), 1));
    const lU = { map: { value: glowSprite() }, uLit: { value: 0 }, uTime: { value: 0 }, uSize: { value: mobile ? 1.6 : 1.35 }, uScale: { value: 400 }, uOp: { value: 1 }, uN: { value: LN } };
    const lanterns = new THREE.Points(lgeo, new THREE.ShaderMaterial({
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

    /* ---------- pascaproses: bloom halus untuk lentera, jendela, dan matahari ---------- */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .55, .82);
    composer.addPass(bloom); composer.addPass(new OutputPass());

    /* ---------- palet waktu ---------- */
    const P = {
      hemiSky: [C('#2a3a80'), C('#ffd2a8')], hemiGround: [C('#090c1e'), C('#5c4334')], hemiI: [.05, .55],
      sunCol: [C('#8ea6ff'), C('#ffb46b')], sunI: [.1, 2.1], fog: [C('#070c2c'), C('#e2a985')], fogD: [.013, .0055],
      ground: [C('#2a2440'), C('#9c7d5a')], glow: C('#ffb15e'), haze: [C('#1b2a6b'), C('#ffbf8a')],
    };

    /* ---------- kamera: tiga titik kunci, satu per babak, jalur pendek ---------- */
    const KEYS = new THREE.CatmullRomCurve3([new THREE.Vector3(-.62, .33, 58), new THREE.Vector3(-.12, .22, 43), new THREE.Vector3(.36, .13, 35)]);
    const LOOK = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 4, 1), new THREE.Vector3(0, 4.6, 0), new THREE.Vector3(0, 5.4, -1.5)]);
    const endAz = .36, vd = new THREE.Vector3(-Math.sin(endAz), 0, -Math.cos(endAz)), rgt = new THREE.Vector3(Math.cos(endAz), 0, -Math.sin(endAz));
    const sunH = new THREE.Vector3();   // matahari terbit di latar, sedikit ke kanan (di HP hampir tengah)
    const cam = { p: state.p };
    const toCam = gsap && !state.reduce ? gsap.quickTo(cam, 'p', { duration: .9, ease: 'power3.out' }) : null;
    const k3 = new THREE.Vector3(), lk = new THREE.Vector3(), sd = new THREE.Vector3(), tmpC = new THREE.Color();
    let yaw = 0, pitch = 0, lastTarget = -1;

    /* ---------- kualitas otomatis: turun tingkat kalau fps rendah, terakhir pindah ke Lentera ---------- */
    let tier = mobile ? 1 : 2, fpsN = 0, fpsT = 0, lastNow = 0, warmup = 40, gaveUp = false;
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
      if (fpsN < 90) return;
      const fps = 1000*fpsN/fpsT; fpsN = fpsT = 0;
      if (fps < 45 && tier > 0){ tier--; warmup = 40; applyTier(); }
      else if (fps < 24 && tier === 0 && state.fallback){ gaveUp = true; state.fallback('lentera'); }
    }

    function resize(){
      const w = state.w, h = state.h, t = TIERS[tier];
      renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
      bloom.resolution.set(w*Math.max(t.bloom, .25), h*Math.max(t.bloom, .25));
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w/h;
      if (w >= 900) camera.setViewOffset(w*1.34, h, 0, 0, w, h); else camera.setViewOffset(w, h*1.5, 0, 0, w, h);
      camera.updateProjectionMatrix();
      lU.uScale.value = h*renderer.getPixelRatio()/2; starU.uPx.value = renderer.getPixelRatio();
    }
    applyTier();

    function frame(st, now){
      watchFps(now);
      const p = st.p, lit = smooth(p/.62), dawn = smooth((p - .5)/.5), time = st.reduce ? 0 : now/1000;
      if (toCam){ if (p !== lastTarget){ toCam(p); lastTarget = p; } } else cam.p = p;
      if (st.pointer.active && !st.reduce){ yaw += ((st.pointer.x/st.w - .5)*.06 - yaw)*.06; pitch += ((st.pointer.y/st.h - .5)*.03 - pitch)*.06; }
      else { yaw *= .94; pitch *= .94; }

      /* kamera */
      const cp = smooth(cam.p), aspect = st.w/st.h, far = aspect < 1 ? 1 + (1 - aspect)*1.25 : 1;
      KEYS.getPoint(cp, k3); LOOK.getPoint(cp, lk);
      const az = k3.x + yaw, el = k3.y + pitch, rad = k3.z*far;
      camera.position.set(Math.sin(az)*Math.cos(el)*rad, Math.sin(el)*rad + 1.5, Math.cos(az)*Math.cos(el)*rad);
      camera.lookAt(lk);

      /* langit, matahari terbit dari bawah cakrawala */
      for (let i = 0; i < 3; i++){ const k = ['top', 'mid', 'hor'][i]; skyU[k].value.copy(SKY.n[i]).lerp(SKY.d[i], dawn); }
      skyU.hor.value.addScalar(lit*.035*(1 - dawn));
      sunH.copy(vd).addScaledVector(rgt, aspect >= 1 ? .2 : .06).normalize();
      const sunEl = lerp(-.1, .2, smooth((p - .55)/.45));
      sd.copy(sunH).multiplyScalar(Math.cos(sunEl)); sd.y = Math.sin(sunEl);
      skyU.sunDir.value.copy(sd); skyU.sunAmt.value = smooth((p - .5)/.35);
      starU.uOp.value = 1 - smooth((p - .45)/.4); starU.uTime.value = time;
      lerpC(P.hemiSky[0], P.hemiSky[1], dawn, hemi.color); lerpC(P.hemiGround[0], P.hemiGround[1], dawn, hemi.groundColor); hemi.intensity = lerp(P.hemiI[0], P.hemiI[1], dawn) + lit*.1;
      lerpC(P.sunCol[0], P.sunCol[1], dawn, sun.color); sun.intensity = lerp(P.sunI[0], P.sunI[1], dawn);
      if (dawn < .02) sun.position.set(-30, 50, -25); else sun.position.copy(sd).setY(Math.max(sd.y, .12)).normalize().multiplyScalar(90);
      lerpC(P.fog[0], P.fog[1], dawn, scene.fog.color); scene.fog.density = lerp(P.fogD[0], P.fogD[1], dawn);
      lerpC(P.haze[0], P.haze[1], dawn, hazeU.uCol.value); hazeU.uOp.value = .25 + dawn*.3;
      lerpC(P.ground[0], P.ground[1], dawn, ground.material.color);
      renderer.toneMappingExposure = lerp(.8, .74, dawn);
      const envI = lerp(.03, .55, dawn) + lit*.06; mats.forEach(m => m.envMapIntensity = envI);

      /* lentera & jendela: menyala bersama babak 2, meredup saat fajar */
      const win = lit*(1 - dawn*.8), flick = 1 + (st.reduce ? 0 : Math.sin(time*7.3)*.03 + Math.sin(time*13.1)*.02);
      glowMat.color.copy(P.glow).multiplyScalar(win*3.2*flick);
      doorMat.emissiveIntensity = win*1.4;
      warm.forEach(l => l.intensity = win*24*flick);
      lU.uLit.value = lit; lU.uOp.value = 1 - dawn*.6; lU.uTime.value = time;
      bloom.strength = lerp(.62, .32, dawn); bloom.threshold = lerp(.8, .95, dawn);

      if (TIERS[tier].bloom) composer.render(); else renderer.render(scene, camera);
    }

    return {
      frame, resize,
      destroy(){
        if (gsap) gsap.killTweensOf(cam);
        composer.dispose(); renderer.dispose(); pmrem.dispose(); env.dispose();
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material){ [].concat(o.material).forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); if (m.uniforms) for (const k in m.uniforms) if (m.uniforms[k].value && m.uniforms[k].value.isTexture) m.uniforms[k].value.dispose(); m.dispose(); }); } });
        renderer.domElement.remove();
      }
    };
  }
};
