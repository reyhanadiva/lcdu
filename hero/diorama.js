/* Varian 3 — Diorama 3D (three.js): kompleks Al-Aqsa sebagai maket. Scroll menggerakkan kamera dan waktu,
   dari malam gelap → ratusan lentera menyala → matahari terbit. Kursor sedikit menggeser sudut pandang. */
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';

const smooth = t => { t = Math.min(1, Math.max(0, t)); return t*t*(3 - 2*t); };
const lerp = (a, b, t) => a + (b - a)*t;
const C = h => new THREE.Color(h);
const lerpC = (a, b, t, out) => out.copy(a).lerp(b, t);
const hex3 = h => { const c = new THREE.Color(h); return new THREE.Vector3(...c.toArray()); };

/* tekstur dinding ubin: biru, pola jaring, pita emas, jendela lengkung */
function tileTextures(panels, wins, w, h, opt = {}){
  const make = (emissive) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = emissive ? '#000' : '#2A5FC8'; g.fillRect(0, 0, w, h);
    const pw = w/panels;
    if (!emissive){
      g.strokeStyle = 'rgba(160,200,255,.22)'; g.lineWidth = 2;
      for (let x = -h; x < w; x += 22){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke(); }
      g.fillStyle = '#163E95'; for (let i = 0; i <= panels; i++) g.fillRect(i*pw - 5, 0, 10, h);
      if (opt.band){ g.fillStyle = '#163E95'; g.fillRect(0, 0, w, h*.14); g.fillStyle = '#E9B94A'; for (let x = 6; x < w; x += 26) g.fillRect(x, h*.04, 14, h*.06); }
    }
    for (let i = 0; i < panels; i++){
      for (let j = 0; j < wins; j++){
        const ww = pw/(wins*2 + 1), x = i*pw + ww*(1 + j*2), top = h*(opt.band ? .3 : .22), bh = h*.5;
        g.fillStyle = emissive ? '#FFB45E' : '#0B1638';
        g.beginPath(); g.moveTo(x, top + bh); g.lineTo(x, top + ww*.5); g.quadraticCurveTo(x, top - ww*.2, x + ww/2, top - ww*.35); g.quadraticCurveTo(x + ww, top - ww*.2, x + ww, top + ww*.5); g.lineTo(x + ww, top + bh); g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  };
  return { map: make(false), emissive: make(true) };
}
function glowSprite(){
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,245,220,1)'); rg.addColorStop(.18, 'rgba(255,200,120,.9)'); rg.addColorStop(.5, 'rgba(255,160,80,.25)'); rg.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default {
  mount(holder, state){
    const mobile = state.w < 900;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    holder.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 500);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
    scene.environment = env;
    const mats = [];
    const std = (o) => { const m = new THREE.MeshStandardMaterial(o); mats.push(m); return m; };

    /* ---------- langit ---------- */
    const skyU = { top: { value: new THREE.Vector3() }, mid: { value: new THREE.Vector3() }, hor: { value: new THREE.Vector3() }, sunDir: { value: new THREE.Vector3(0, 0, 1) }, sunAmt: { value: 0 } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: skyU,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform vec3 top, mid, hor, sunDir; uniform float sunAmt; varying vec3 vD;
        void main(){ float h = vD.y; vec3 c = mix(hor, mid, smoothstep(-.02, .18, h)); c = mix(c, top, smoothstep(.18, .7, h));
          float s = max(dot(vD, normalize(sunDir)), 0.); c += vec3(1., .82, .55)*(pow(s, 900.)*3. + pow(s, 14.)*.35 + pow(s, 3.)*.12)*sunAmt;
          gl_FragColor = vec4(c, 1.); }`
    }));
    scene.add(sky);
    const SKY = { n: [hex3('#040820'), hex3('#0B1546'), hex3('#1A2766')], d: [hex3('#3E5DAA'), hex3('#D9907E'), hex3('#FFCB8E')] };
    const starGeo = new THREE.BufferGeometry(), sp = [];
    for (let i = 0; i < 1400; i++){ const u = Math.random()*Math.PI*2, v = .08 + Math.random()*.9; const r = 280; sp.push(Math.cos(u)*Math.cos(v)*r, Math.sin(v)*r, Math.sin(u)*Math.cos(v)*r); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false });
    scene.add(new THREE.Points(starGeo, starMat));
    scene.fog = new THREE.Fog(0x1A2766, 55, 210);

    /* ---------- cahaya ---------- */
    const hemi = new THREE.HemisphereLight(0x3a4d9a, 0x0b0f22, .5); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0x9fb4ff, .6); sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
    scene.add(sun, sun.target);
    const warm = []; [[0, 2.2, 7], [-9, 2, 4], [7, 2, 3], [0, 2, -7]].forEach(p => { const l = new THREE.PointLight(0xffa860, 0, 16, 1.6); l.position.set(...p); scene.add(l); warm.push(l); });

    /* ---------- tanah & pelataran ---------- */
    const Y0 = .9;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 48), std({ color: 0x9c7d5a, roughness: 1 }));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
    const plat = new THREE.Mesh(new THREE.BoxGeometry(40, Y0, 30), std({ color: 0xd9c49c, roughness: .92 }));
    plat.position.y = Y0/2; plat.receiveShadow = true; plat.castShadow = true; scene.add(plat);
    const wallMat = std({ color: 0xc8ae84, roughness: .95 });
    [[0, 15.4, 40.8, .8], [0, -15.4, 40.8, .8], [20.4, 0, .8, 30], [-20.4, 0, .8, 30]].forEach(w => { const m = new THREE.Mesh(new THREE.BoxGeometry(w[2], 1.4, w[3]), wallMat); m.position.set(w[0], .7, w[1]); m.castShadow = m.receiveShadow = true; scene.add(m); });
    const upper = new THREE.Mesh(new THREE.BoxGeometry(16, .5, 16), std({ color: 0xe6d6b4, roughness: .85 }));
    upper.position.y = Y0 + .25; upper.receiveShadow = true; scene.add(upper);
    const Y1 = Y0 + .5;

    /* ---------- Kubah Shakhrah ---------- */
    const dor = new THREE.Group(); dor.position.y = Y1; scene.add(dor);
    const oct = (rt, rb, h, seg, mat, y) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.rotateY(Math.PI/seg); const m = new THREE.Mesh(g, mat); m.position.y = y; m.castShadow = m.receiveShadow = true; dor.add(m); return m; };
    oct(4.3, 4.3, 1.1, 8, std({ color: 0xefe7d6, roughness: .55 }), .55);
    const wallT = tileTextures(8, 5, 2048, 512, { band: true });
    const wallMatT = std({ map: wallT.map, emissive: 0xffffff, emissiveMap: wallT.emissive, emissiveIntensity: 0, roughness: .45, metalness: .05 });
    oct(4.22, 4.22, 2.7, 8, wallMatT, 2.45);
    oct(4.38, 4.38, .32, 8, std({ color: 0x163e95, roughness: .5 }), 3.96);
    oct(2.5, 4.15, .55, 8, std({ color: 0x8b95a6, roughness: .5, metalness: .5 }), 4.39);
    const drumT = tileTextures(16, 1, 2048, 256);
    const drumMat = std({ map: drumT.map, emissive: 0xffffff, emissiveMap: drumT.emissive, emissiveIntensity: 0, roughness: .45 });
    oct(2.45, 2.45, 1.7, 32, drumMat, 5.5);
    oct(2.55, 2.55, .18, 32, std({ color: 0xE9B94A, metalness: .9, roughness: .3 }), 6.38);
    const goldMat = std({ color: 0xE0AE3A, metalness: 1, roughness: .26 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 96, 48, 0, Math.PI*2, 0, Math.PI/2), goldMat);
    dome.scale.y = 1.2; dome.position.y = 6.45; dome.castShadow = true; dor.add(dome);
    const fin = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 1.1, 8), goldMat); fin.position.y = 9.95; dor.add(fin);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), goldMat); ball.position.y = 9.7; dor.add(ball);
    const cres = new THREE.Mesh(new THREE.TorusGeometry(.3, .055, 8, 32, Math.PI*1.45), goldMat); cres.position.y = 10.7; cres.rotation.z = Math.PI*.78; dor.add(cres);

    /* ---------- Masjid Qibli ---------- */
    const stoneMat = std({ color: 0xd6bf94, roughness: .9 });
    const qibli = new THREE.Group(); qibli.position.set(-13, Y0, -8); qibli.rotation.y = .5; scene.add(qibli);
    const qb = new THREE.Mesh(new THREE.BoxGeometry(14, 3.2, 5.5), stoneMat); qb.position.y = 1.6; qb.castShadow = qb.receiveShadow = true; qibli.add(qb);
    const archMat = std({ color: 0x3a2c22, roughness: 1, emissive: 0xffa050, emissiveIntensity: 0 });
    for (let i = 0; i < 7; i++){ const a = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, .1), archMat); a.position.set(-5.4 + i*1.8, 1.25, 2.78); qibli.add(a); const t = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .1, 16, 1, false, 0, Math.PI), archMat); t.rotation.x = Math.PI/2; t.rotation.z = Math.PI/2; t.rotation.y = 0; t.position.set(-5.4 + i*1.8, 2.25, 2.78); qibli.add(t); }
    const qd = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .8, 24), stoneMat); qd.position.set(0, 3.6, 0); qd.castShadow = true; qibli.add(qd);
    const qdome = new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 24, 0, Math.PI*2, 0, Math.PI/2), std({ color: 0x9aa3b4, metalness: .7, roughness: .32 }));
    qdome.position.set(0, 4, 0); qdome.scale.y = 1.15; qdome.castShadow = true; qibli.add(qdome);

    /* ---------- menara ---------- */
    const minaret = (x, z, h) => {
      const g = new THREE.Group(); g.position.set(x, Y0, z); scene.add(g);
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, h, 1.1), stoneMat); b.position.y = h/2; b.castShadow = true; g.add(b);
      const bal = new THREE.Mesh(new THREE.BoxGeometry(1.7, .22, 1.7), stoneMat); bal.position.y = h*.72; g.add(bal);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.2, 12), stoneMat); top.position.y = h + .6; g.add(top);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 8, 0, Math.PI*2, 0, Math.PI/2), std({ color: 0x8b95a6, metalness: .6, roughness: .35 })); cap.position.y = h + 1.2; cap.scale.y = 1.4; g.add(cap);
    };
    minaret(15, -10, 10); minaret(-17, -6, 9);

    /* ---------- qanatir (arkade tangga) ---------- */
    const arcade = (x, z) => {
      for (let i = 0; i < 4; i++){ const c = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 2.4, 10), stoneMat); c.position.set(x - 2.1 + i*1.4, Y1 + 1.2, z); c.castShadow = true; scene.add(c); }
      const l = new THREE.Mesh(new THREE.BoxGeometry(4.8, .5, .45), stoneMat); l.position.set(x, Y1 + 2.6, z); l.castShadow = true; scene.add(l);
    };
    arcade(0, 8.1); arcade(8.1, 0); arcade(-8.1, 0); arcade(0, -8.1);

    /* ---------- pohon ---------- */
    const leaf = std({ color: 0x3d6b48, roughness: .85, flatShading: true }), leafD = std({ color: 0x24432f, roughness: .9, flatShading: true }), bark = std({ color: 0x5b4634, roughness: 1 });
    const oliveTree = (x, z, s) => {
      const g = new THREE.Group(); g.position.set(x, Y0, z); g.scale.setScalar(s); scene.add(g);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(.14, .24, 1.3, 7), bark); t.position.y = .65; t.rotation.z = .15; t.castShadow = true; g.add(t);
      [[0, 1.7, 0, .9], [.6, 1.5, .2, .7], [-.6, 1.55, -.1, .72], [.1, 2.15, -.3, .65], [-.2, 1.4, .5, .6]].forEach(b => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(b[3], 1), leaf); m.position.set(b[0], b[1], b[2]); m.castShadow = true; g.add(m); });
    };
    const cypress = (x, z, h) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 12), leafD); m.scale.set(1, h, 1); m.position.set(x, Y0 + h*.5, z); m.castShadow = true; scene.add(m); };
    [[-13, 6, 1.2], [12, 7, 1.1], [-15, -11, 1.3], [17, 9, 1.25], [6, -12, 1.1], [-7, -12, 1.0], [11, -4, .9], [-11, 1, .95]].forEach(o => oliveTree(...o));
    [[-18.5, 12], [-17, 12.6], [18.6, -13], [17.4, -13.5], [10, 13.5], [-6.5, 13.6], [18.7, 4], [-18.7, -2]].forEach(o => cypress(o[0], o[1], 3.2 + Math.random()));

    /* ---------- kota tua di sekeliling (instanced) ---------- */
    const cityGeo = new THREE.BoxGeometry(1, 1, 1); cityGeo.translate(0, .5, 0);
    const cityN = mobile ? 380 : 700, cityMesh = new THREE.InstancedMesh(cityGeo, std({ color: 0xc9b48c, roughness: .95 }), cityN);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    for (let i = 0; i < cityN; i++){
      let x, z; do { x = (Math.random() - .5)*150; z = (Math.random() - .5)*150; } while (Math.abs(x) < 23 && Math.abs(z) < 19 || (z > 15 && Math.abs(x) < 34));
      const w = 2 + Math.random()*4, d = 2 + Math.random()*4, h = 1.5 + Math.random()*4.5;
      ps.set(x, 0, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random()*.3); sc.set(w, h, d); mtx.compose(ps, q, sc); cityMesh.setMatrixAt(i, mtx);
    }
    cityMesh.castShadow = cityMesh.receiveShadow = true; scene.add(cityMesh);
    /* bukit jauh */
    const hillMat = std({ color: 0x6d5a64, roughness: 1, flatShading: true });
    for (let i = 0; i < 14; i++){ const a = i/14*Math.PI*2, r = 120 + Math.random()*30; const m = new THREE.Mesh(new THREE.ConeGeometry(30 + Math.random()*25, 12 + Math.random()*14, 6), hillMat); m.position.set(Math.cos(a)*r, 0, Math.sin(a)*r); scene.add(m); }

    /* ---------- lentera kontribusi ---------- */
    const LN = mobile ? 260 : 420, lp = [];
    for (let i = 0; i < LN; i++){
      let x, y, z; const k = Math.random();
      if (k < .45){ x = (Math.random() - .5)*38; z = (Math.random() - .5)*28; y = Y0 + .35; if (Math.abs(x) < 8 && Math.abs(z) < 8){ y = Y1 + .35; } }
      else if (k < .6){ const a = Math.random()*Math.PI*2; x = Math.cos(a)*4.6; z = Math.sin(a)*4.6; y = Y1 + 2.4 + (Math.random() < .5 ? 0 : 1); }
      else { x = (Math.random() - .5)*110; z = (Math.random() - .5)*110; if (Math.abs(x) < 22 && Math.abs(z) < 17) { i--; continue; } y = 2 + Math.random()*5; }
      lp.push(x, y, z);
    }
    for (let i = lp.length/3 - 1; i > 0; i--){ const j = (Math.random()*(i + 1))|0; for (let a = 0; a < 3; a++){ const t = lp[i*3 + a]; lp[i*3 + a] = lp[j*3 + a]; lp[j*3 + a] = t; } }
    const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lgeo.setDrawRange(0, 0);
    const lmat = new THREE.PointsMaterial({ map: glowSprite(), size: mobile ? 1.5 : 1.3, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
    scene.add(new THREE.Points(lgeo, lmat));

    /* ---------- palet waktu ---------- */
    const P = {
      hemiSky: [C('#2a3a80'), C('#ffd2a8')], hemiGround: [C('#090c1e'), C('#5c4334')], hemiI: [.1, .75],
      sunCol: [C('#8ea6ff'), C('#ffb46b')], sunI: [.22, 2.4], fog: [C('#0d1440'), C('#d9a383')],
      ground: [C('#2a2440'), C('#9c7d5a')],
    };
    const tmpC = new THREE.Color(), target = new THREE.Vector3(0, 4, 2);
    let yaw = 0, pitch = 0, lastKey = '';

    function resize(){
      const w = state.w, h = state.h; renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w/h;
      if (w >= 900) camera.setViewOffset(w*1.34, h, 0, 0, w, h); else camera.setViewOffset(w, h*1.5, 0, 0, w, h);
      camera.updateProjectionMatrix(); lastKey = '';
    }
    resize();

    function frame(st){
      const p = st.p, lit = smooth(p/.62), dawn = smooth((p - .5)/.5);
      if (st.pointer.active && !st.reduce){ yaw += ((st.pointer.x/st.w - .5)*.06 - yaw)*.06; pitch += ((st.pointer.y/st.h - .5)*.03 - pitch)*.06; }
      else { yaw *= .94; pitch *= .94; }
      const key = p.toFixed(4) + '|' + yaw.toFixed(4) + '|' + pitch.toFixed(4);
      if (key === lastKey) return; lastKey = key;

      /* kamera: mengitari pelan sambil mendekat */
      const aspect = st.w/st.h, far = aspect < 1 ? 1 + (1 - aspect)*1.25 : 1;
      const az = lerp(-.55, .38, smooth(p)) + yaw, el = lerp(.3, .2, smooth(p)) + pitch, rad = lerp(52, 36, smooth(p))*far;
      camera.position.set(Math.sin(az)*Math.cos(el)*rad, Math.sin(el)*rad + 1.5, Math.cos(az)*Math.cos(el)*rad);
      camera.lookAt(target);

      /* langit & cahaya */
      for (let i = 0; i < 3; i++){ const k = ['top', 'mid', 'hor'][i]; skyU[k].value.copy(SKY.n[i]).lerp(SKY.d[i], dawn); }
      skyU.hor.value.addScalar(lit*.04*(1 - dawn));
      const sunAng = lerp(-.12, .2, dawn); const sd = new THREE.Vector3(Math.sin(.9)*Math.cos(sunAng), Math.sin(sunAng), Math.cos(.9)*Math.cos(sunAng));
      skyU.sunDir.value.copy(sd); skyU.sunAmt.value = smooth((p - .55)/.3);
      starMat.opacity = 1 - dawn;
      lerpC(P.hemiSky[0], P.hemiSky[1], dawn, hemi.color); lerpC(P.hemiGround[0], P.hemiGround[1], dawn, hemi.groundColor); hemi.intensity = lerp(P.hemiI[0], P.hemiI[1], dawn) + lit*.15;
      lerpC(P.sunCol[0], P.sunCol[1], dawn, sun.color); sun.intensity = lerp(P.sunI[0], P.sunI[1], dawn);
      if (dawn < .02) sun.position.set(-30, 50, -25); else sun.position.copy(sd).multiplyScalar(70);
      lerpC(P.fog[0], P.fog[1], dawn, scene.fog.color); lerpC(P.ground[0], P.ground[1], dawn, ground.material.color);
      renderer.toneMappingExposure = lerp(.9, .92, dawn);
      const envI = lerp(.1, .7, dawn) + lit*.1; mats.forEach(m => m.envMapIntensity = envI);
      const win = lit*(1 - dawn*.75); wallMatT.emissiveIntensity = win*1.6; drumMat.emissiveIntensity = win*1.8; archMat.emissiveIntensity = win*.35;
      warm.forEach(l => l.intensity = lit*(1 - dawn*.8)*22);
      lgeo.setDrawRange(0, Math.round(lit*LN)); lmat.opacity = 1 - dawn*.65;
      renderer.render(scene, camera);
    }

    return {
      frame, resize,
      destroy(){
        renderer.dispose(); pmrem.dispose(); env.dispose();
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material){ [].concat(o.material).forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); } });
        renderer.domElement.remove();
      }
    };
  }
};
