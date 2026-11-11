/* Varian Lentera HD — foto asli malam & fajar yang sejajar (assets/hero/build, dibuat oleh tools/build-hero-images.py).
   Babak 1: malam penuh layar, bintang di foto berkelip halus.
   Babak 2: lampu menyala di sumber yang masuk akal (hero/spots.json: jendela, lentera arkade, tiang lampu, lentera jalan,
            rumah di bukit), bergelombang dari Kubah ke luar — seperti ilmu yang menyebar. Tiap lampu menyingkap warna fajar
            di sekitarnya lewat masker lembut beresolusi rendah dan memberi genangan cahaya di tanah. Padam lagi saat scroll naik.
   Babak 3: fajar menyapu dari arah matahari (bukan crossfade), haze hangat, sinar halus.
   Kursor/jari = cahaya lembut yang menyingkap fajar. Tanpa klik, tanpa parallax. ?edit-spots membuka editor titik cahaya. */

const BUILD = new URL('../assets/hero/build/', import.meta.url);
const SPOTS_URL = new URL('./spots.json', import.meta.url);
/* gambar 1×1 untuk mendeteksi dukungan format (dibuat dengan Pillow) */
const AVIF = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAIQAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAKW1kYXQSAAoIGAAGiAhoNCAyExlHh4Yhh5555oAAAJBAyRxhQr4=';
const WEBP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v02aAA=';

/* per orientasi (koordinat relatif gambar): titik fokus cover (kubah), matahari di foto fajar, garis cakrawala */
const ART = {
  tall: { focus: [.556, .3], sun: [.845, .602], horizon: .63, origin: [.556, .71] },
  wide: { focus: [.73, .4], sun: [.942, .389], horizon: .43, origin: [.735, .625] },
};
const MASK_Q = .25;   // resolusi masker = 1/4 kanvas
/* jenis titik cahaya (kolom ke-4 di spots.json):
   w jendela/pintu · a lentera gantung di arkade · l tiang lampu/lentera tembok · g lentera rendah di tanah · c lampu kota jauh
   reveal = besar area fajar yang tersingkap, pool = genangan cahaya di tanah (lebar, tinggi, jarak ke bawah) */
const KINDS = {
  w: { label: 'Jendela / pintu', reveal: .9, glow: [.45, .62], core: 0, pool: null, flicker: .04 },
  a: { label: 'Lentera arkade', reveal: .7, glow: [.85, .85], core: .3, pool: [1.5, .5, .95], flicker: .14 },
  l: { label: 'Tiang lampu / lentera tembok', reveal: .55, glow: [.8, .8], core: .28, pool: [1.7, .55, 1.05], flicker: .1 },
  g: { label: 'Lentera di tanah', reveal: .5, glow: [.6, .6], core: .24, pool: [1.4, .5, .1], flicker: .14 },
  c: { label: 'Lampu kota jauh', reveal: 0, glow: [.22, .22], core: 0, pool: null, flicker: .05 },
};

const smooth = t => { t = Math.min(1, Math.max(0, t)); return t*t*(3 - 2*t); };
const orientOf = st => st.h >= st.w ? 'tall' : 'wide';
const canvas = (w = 1, h = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

let manifestP, formatP, spotsP;
const manifest = () => manifestP || (manifestP = fetch(new URL('manifest.json', BUILD)).then(r => r.ok ? r.json() : {}).catch(() => ({})));
const decodes = src => new Promise(res => { const i = new Image(); i.onload = () => res(i.width > 0); i.onerror = () => res(false); i.src = src; });
const bestFormat = () => formatP || (formatP = (async () => (await decodes(AVIF)) ? 'avif' : (await decodes(WEBP)) ? 'webp' : 'jpg')());
const spotsFile = () => spotsP || (spotsP = fetch(SPOTS_URL).then(r => r.json()).catch(() => ({ tall: [], wide: [] })));
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

/* lebar turunan terkecil yang cukup tajam; rumus sama dengan preload di index.html (sizes: lebar gambar di layar) */
function pickWidth(e, st){
  const need = Math.max(st.w, st.h*e.w/e.h)*(devicePixelRatio || 1);
  return e.widths.find(w => w >= need) || e.widths[e.widths.length - 1];
}

/* sprite: masker lembut, pendar hangat bertekstur, sinar matahari, butiran film */
function maskSprite(){
  const c = canvas(128, 128), g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(.45, 'rgba(0,0,0,.75)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128); return c;
}
function glowSprite(){
  const c = canvas(96, 96), g = c.getContext('2d'), rg = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  rg.addColorStop(0, 'rgba(255,246,222,1)'); rg.addColorStop(.12, 'rgba(255,206,130,.9)'); rg.addColorStop(.4, 'rgba(255,160,80,.28)'); rg.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 96, 96);
  /* tekstur: bintik halus di dalam pendar supaya tidak terlihat seperti lingkaran digital */
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 260; i++){ const a = Math.random()*Math.PI*2, r = Math.random()*40; g.fillStyle = `rgba(0,0,0,${Math.random()*.35})`; g.fillRect(48 + Math.cos(a)*r, 48 + Math.sin(a)*r, 1.6, 1.6); }
  return c;
}
function raySprite(){
  const S = 512, c = canvas(S, S), g = c.getContext('2d'); g.translate(S/2, S/2);
  for (let i = 0; i < 22; i++){
    const a = i/22*Math.PI*2 + Math.random()*.12, w = .025 + Math.random()*.05, len = S*(.32 + Math.random()*.18);
    const lg = g.createLinearGradient(0, 0, Math.cos(a)*len, Math.sin(a)*len);
    lg.addColorStop(0, 'rgba(255,214,150,.55)'); lg.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, len, a - w, a + w); g.closePath(); g.fill();
  }
  return c;
}
function grainURL(){
  const c = canvas(160, 160), g = c.getContext('2d'), d = g.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4){ const v = 128 + (Math.random() - .5)*90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c.toDataURL('image/png');
}

export default {
  text: 'top',
  async supports(st){ const m = await manifest(); return !!m[orientOf(st)]; },

  mount(holder, state){
    const cv = canvas(); cv.className = 'hd-canvas'; holder.appendChild(cv);
    const ctx = cv.getContext('2d');
    const nightC = canvas(), dawnC = canvas(), tmp = canvas(), mask = canvas();
    const nctx = nightC.getContext('2d'), dctx = dawnC.getContext('2d'), tctx = tmp.getContext('2d'), mctx = mask.getContext('2d');
    const MASK = maskSprite(), GLOW = glowSprite(), RAYS = raySprite();
    const grain = document.createElement('div'); grain.className = 'hd-grain'; grain.style.backgroundImage = `url(${grainURL()})`; holder.appendChild(grain);

    let alive = true, token = 0, orient = '', entry = null, night = null, dawn = null, data = null;
    let W = 1, H = 1, DPR = 1, view = null, spots = [], stars = [], sun = [0, 0], horizonY = 0, base = 10, lx = -1, ly = -1, last = '';

    async function ensure(){
      const o = orientOf(state);
      if (o === orient && night) return layout();
      orient = o; const t = ++token;
      const m = await manifest(); entry = m[o];
      if (!entry || !alive || t !== token) return;
      const fmt = await bestFormat(), w = pickWidth(entry, state);
      const src = k => new URL(`${entry[k]}-${w}.${fmt}`, BUILD).href;
      const n = await loadImg(src('night'));                // malam dulu (sudah di-preload), langsung tampil
      if (!alive || t !== token) return;
      night = n; dawn = null; layout();
      const [d, sp] = await Promise.all([loadImg(src('dawn')), spotsFile()]);
      if (!alive || t !== token) return;
      dawn = d; data = sp; layout();
      if (EDIT) editor.refresh();
    }

    /* cover dengan titik fokus di kubah; semua posisi dihitung ulang ke piksel kanvas */
    function layout(){
      if (!night) return;
      DPR = Math.min(devicePixelRatio || 1, state.w > 1200 ? 1.25 : 1.5);
      W = Math.max(1, Math.round(state.w*DPR)); H = Math.max(1, Math.round(state.h*DPR));
      for (const c of [cv, nightC, dawnC, tmp]){ c.width = W; c.height = H; }
      mask.width = Math.ceil(W*MASK_Q); mask.height = Math.ceil(H*MASK_Q);
      const art = ART[orient], iw = night.naturalWidth, ih = night.naturalHeight;
      const s = Math.max(W/iw, H/ih), dw = iw*s, dh = ih*s;
      view = { s, dw, dh, ox: (W - dw)*art.focus[0], oy: (H - dh)*art.focus[1] };
      nctx.drawImage(night, view.ox, view.oy, dw, dh);
      if (dawn) dctx.drawImage(dawn, view.ox, view.oy, dw, dh);
      sun = toScreen(art.sun); horizonY = view.oy + art.horizon*dh;
      base = dw*.032;
      /* urutan menyala: dari Kubah ke luar (jarak di gambar), sedikit acak supaya tidak seperti cincin sempurna */
      const o = art.origin;
      spots = ((data && data[orient]) || [])
        .map((sp, i) => { const q = toScreen(sp); return [q[0], q[1], sp[2] || 1, KINDS[sp[3]] ? sp[3] : 'l', Math.hypot(sp[0] - o[0], (sp[1] - o[1])*1.4) + ((i*7919) % 97)/97*.05]; })
        .filter(q => q[0] > -40 && q[0] < W + 40 && q[1] > -40 && q[1] < H + 40)
        .sort((a, b) => a[4] - b[4]);
      findStars();
      /* butiran film hanya bila foto tampil lebih besar dari resolusi aslinya (layar retina) */
      grain.hidden = s*(devicePixelRatio || 1)/DPR <= 1.05;
      last = '';
    }
    const toScreen = ([x, y]) => [view.ox + x*view.dw, view.oy + y*view.dh];

    /* bintang = titik terang kecil di langit foto malam; berkelip dengan menambah cahaya tipis di atasnya */
    function findStars(){
      stars = [];
      const top = Math.max(0, Math.round(view.oy)), bottom = Math.min(H, Math.round(horizonY - H*.04));
      if (bottom - top < 10) return;
      const img = nctx.getImageData(0, top, W, bottom - top).data, step = Math.max(2, Math.round(3*DPR));
      for (let y = 2; y < bottom - top - 2; y += step) for (let x = 2; x < W - 2; x += step){
        const i = (y*W + x)*4, l = img[i] + img[i + 1] + img[i + 2];
        const sy = y + top, inText = orient === 'tall' ? sy < H*.47 : (x < W*.52 && sy < H*.58);   // jangan berkelip di belakang teks
        if (!inText && l > 330 && l > img[i - 4*W] + img[i - 4*W + 1] + img[i - 4*W + 2] + 60) stars.push([x, sy, Math.random()*6.28, .6 + Math.random()]);
      }
      stars.sort((a, b) => b[3] - a[3]); stars.length = Math.min(stars.length, 140);
    }

    function frame(st, now){
      if (!night) return;
      const p = st.p, t = st.reduce ? 0 : now/1000, n = spots.length;
      /* fajar dua lapis supaya terang bertahap: 'pre' = cahaya pagi merembes merata sejak tengah babak 2,
         'dawnT' = sapuan dari arah matahari yang menyelesaikannya */
      const lit = smooth(p/.62)*n, pre = dawn ? smooth((p - .36)/.6) : 0, dawnT = dawn ? smooth((p - .45)/.55) : 0;
      const pa = st.pointer.active;
      if (pa){ const tx = st.pointer.x*DPR, ty = st.pointer.y*DPR; lx = lx < 0 ? tx : lx + (tx - lx)*.2; ly = ly < 0 ? ty : ly + (ty - ly)*.2; }
      if (st.reduce){ const key = p.toFixed(4) + (pa ? `${lx | 0},${ly | 0}` : '-') + (dawn ? 'd' : ''); if (key === last) return; last = key; }

      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(nightC, 0, 0);

      /* bintang berkelip (memudar menjelang fajar) */
      const starA = 1 - smooth((p - .4)/.4);
      if (starA > 0 && stars.length){
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#dfe8ff';
        for (const s of stars){ ctx.globalAlpha = starA*(.18 + .22*Math.sin(t*(.7 + s[3]) + s[2]))*s[3]; const r = 1.2*DPR*s[3]; ctx.fillRect(s[0] - r/2, s[1] - r/2, r, r); }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }

      if (pre > 0){ ctx.globalAlpha = pre*.55; ctx.drawImage(dawnC, 0, 0); ctx.globalAlpha = 1; }   // langit & bangunan mulai terang merata

      if (dawn){
        /* masker: area mana yang sudah "fajar" */
        const q = MASK_Q; mctx.globalCompositeOperation = 'source-over'; mctx.clearRect(0, 0, mask.width, mask.height);
        if (dawnT > 0){
          /* sapuan dari matahari: lingkaran lembut yang membesar, tepinya diberi gelombang supaya tidak seperti wipe digital */
          const maxR = Math.hypot(Math.max(sun[0], W - sun[0]), Math.max(sun[1], H - sun[1]))*1.08;
          const R = dawnT*maxR*1.1, feather = maxR*.7;           // tepi sapuan lebar & lembut
          if (dawnT > .995){ mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mask.width, mask.height); }
          else {
            const rg = mctx.createRadialGradient(sun[0]*q, sun[1]*q, 0, sun[0]*q, sun[1]*q, (R + feather)*q);
            const edge = Math.max(0, R/(R + feather));
            rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(edge, 'rgba(0,0,0,1)'); rg.addColorStop(edge + (1 - edge)*.5, 'rgba(0,0,0,.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
            mctx.fillStyle = rg; mctx.fillRect(0, 0, mask.width, mask.height);
            for (let i = 0; i < 7; i++){                     // gelombang di tepi sapuan
              const a = Math.PI*(.75 + i*.12) + Math.sin(t*.3 + i)*.05, rr = R + feather*.35*Math.sin(i*2.3 + t*.4);
              const bx = (sun[0] + Math.cos(a)*rr)*q, by = (sun[1] + Math.sin(a)*rr)*q, br = feather*.7*q;
              mctx.globalAlpha = .55; mctx.drawImage(MASK, bx - br, by - br, br*2, br*2);
            }
            mctx.globalAlpha = 1;
          }
        }
        const k = Math.ceil(lit);
        for (let i = 0; i < k && i < n; i++){
          const s = spots[i], K = KINDS[s[3]], a = Math.min(1, lit - i), b = base*s[2];
          mctx.globalAlpha = a*(1 - dawnT*.5);
          if (K.reveal){ const r = b*K.reveal; mctx.drawImage(MASK, (s[0] - r)*q, (s[1] - r*1.15)*q, r*2*q, r*2.3*q); }
          if (K.pool){ const rx = b*K.pool[0], ry = b*K.pool[1], cy = s[1] + b*K.pool[2]; mctx.drawImage(MASK, (s[0] - rx)*q, (cy - ry)*q, rx*2*q, ry*2*q); }
        }
        if (pa){ const r = Math.min(W, H)*.22; mctx.globalAlpha = .85; mctx.drawImage(MASK, (lx - r)*q, (ly - r)*q, r*2*q, r*2*q); }
        mctx.globalAlpha = 1;
        if (dawnT > 0 || pre > 0 || k > 0 || pa){
          tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, W, H); tctx.drawImage(dawnC, 0, 0);
          tctx.globalCompositeOperation = 'destination-in'; tctx.drawImage(mask, 0, 0, W, H);
          ctx.drawImage(tmp, 0, 0);
        }
      }

      /* cahaya lampu: pendar di sumbernya, titik terang untuk lentera, genangan hangat di tanah; meredup saat fajar */
      ctx.globalCompositeOperation = 'lighter';
      const fade = 1 - dawnT*.85, k = Math.ceil(lit);
      for (let i = 0; i < k && i < n; i++){
        const s = spots[i], K = KINDS[s[3]], a = Math.min(1, lit - i), b = base*s[2];
        const fl = st.reduce ? 1 : 1 - K.flicker + K.flicker*Math.sin(t*(2.6 + (i % 5)*.3) + i*1.7);
        const A = a*fade*fl;
        if (K.pool){ const rx = b*K.pool[0], ry = b*K.pool[1]; ctx.globalAlpha = A*.3; ctx.drawImage(GLOW, s[0] - rx, s[1] + b*K.pool[2] - ry, rx*2, ry*2); }
        const gx = b*K.glow[0], gy = b*K.glow[1]; ctx.globalAlpha = A*(s[3] === 'w' ? .7 : .4); ctx.drawImage(GLOW, s[0] - gx, s[1] - gy, gx*2, gy*2);
        if (K.core){ const c = b*K.core; ctx.globalAlpha = A; ctx.drawImage(GLOW, s[0] - c, s[1] - c, c*2, c*2); }
      }
      if (pa){ const r = Math.min(W, H)*.2; ctx.globalAlpha = .32*(1 - dawnT*.5); ctx.drawImage(GLOW, lx - r, ly - r, r*2, r*2); }

      /* fajar: haze hangat di cakrawala, pendar matahari, sinar halus */
      if (dawnT > 0){
        const hz = ctx.createLinearGradient(0, horizonY - H*.22, 0, horizonY + H*.12);
        hz.addColorStop(0, 'rgba(255,170,110,0)'); hz.addColorStop(.6, 'rgba(255,178,120,.16)'); hz.addColorStop(1, 'rgba(255,170,110,0)');
        ctx.globalAlpha = dawnT; ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H);
        const sg = ctx.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], Math.max(W, H)*.45);
        sg.addColorStop(0, 'rgba(255,214,150,.45)'); sg.addColorStop(1, 'rgba(255,180,120,0)');
        ctx.globalAlpha = dawnT*.8; ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
        const rs = Math.max(W, H)*1.1;
        ctx.save(); ctx.translate(sun[0], sun[1]); ctx.rotate(t*.02); ctx.globalAlpha = dawnT*.2; ctx.drawImage(RAYS, -rs/2, -rs/2, rs, rs); ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }

    /* ---------- editor titik cahaya (?edit-spots) ---------- */
    const EDIT = new URL(location.href).searchParams.has('edit-spots');
    const editor = EDIT ? makeEditor() : { refresh(){}, destroy(){} };
    function makeEditor(){
      document.getElementById('hero').classList.add('hd-editing');
      const layer = document.createElement('div'); layer.className = 'hd-edit-layer'; holder.appendChild(layer);
      const panel = document.createElement('div'); panel.className = 'hd-edit-panel';
      panel.innerHTML = '<b>Editor titik cahaya</b><span class="hd-edit-info"></span><span>Pilih jenis, lalu klik untuk menambah titik; klik titik untuk menghapus.</span>' +
        '<label>Jenis <select class="hd-edit-kind">' + Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('') + '</select></label>' +
        '<div><button type="button" data-a="copy">Salin JSON</button> <button type="button" data-a="reset">Kembalikan ke berkas</button></div><span class="hd-edit-msg" role="status"></span>';
      document.body.appendChild(panel);
      const msg = panel.querySelector('.hd-edit-msg'), info = panel.querySelector('.hd-edit-info');
      const list = () => data[orient] || (data[orient] = []);
      function refresh(){
        if (!data || !view) return;
        layer.innerHTML = '';
        list().forEach((sp, i) => {
          const [x, y] = toScreen(sp), b = document.createElement('button');
          b.type = 'button'; b.className = 'hd-dot'; b.title = 'Hapus titik ' + (i + 1); b.style.left = x/DPR + 'px'; b.style.top = y/DPR + 'px';
          b.style.setProperty('--s', sp[2] || 1); b.dataset.kind = sp[3] || 'l'; b.title = `${(KINDS[sp[3]] || KINDS.l).label} — klik untuk menghapus`;
          b.addEventListener('click', e => { e.stopPropagation(); list().splice(i, 1); changed(); });
          layer.appendChild(b);
        });
        info.textContent = `${orient === 'tall' ? 'tegak (HP)' : 'melebar (desktop)'} · ${list().length} titik`;
      }
      function changed(){ layout(); refresh(); try { localStorage.setItem('lcdu-spots-draft', JSON.stringify(data)); } catch (e) {} }
      layer.addEventListener('click', e => {
        if (!view) return;
        const r = holder.getBoundingClientRect(), x = (e.clientX - r.left)*DPR, y = (e.clientY - r.top)*DPR;
        list().push([+((x - view.ox)/view.dw).toFixed(4), +((y - view.oy)/view.dh).toFixed(4), 1, panel.querySelector('.hd-edit-kind').value]); changed();
      });
      panel.addEventListener('click', async e => {
        const a = e.target.dataset && e.target.dataset.a; if (!a) return;
        if (a === 'reset'){ try { localStorage.removeItem('lcdu-spots-draft'); } catch (err) {} spotsP = null; data = await spotsFile(); layout(); refresh(); msg.textContent = 'Dikembalikan ke hero/spots.json.'; return; }
        const json = '{\n' + Object.keys(data).map(k => `  "${k}": [` + data[k].map(s => JSON.stringify(s)).join(', ') + ']').join(',\n') + '\n}\n';
        try { await navigator.clipboard.writeText(json); msg.textContent = 'Tersalin. Tempel ke hero/spots.json.'; }
        catch (err){ const ta = document.createElement('textarea'); ta.value = json; panel.appendChild(ta); ta.select(); msg.textContent = 'Salin manual dari kotak ini (Cmd/Ctrl+C).'; }
      });
      /* draf yang belum disalin tetap ada setelah muat ulang */
      try { const d = JSON.parse(localStorage.getItem('lcdu-spots-draft')); if (d && d.tall) spotsP = Promise.resolve(d); } catch (e) {}
      return { refresh, destroy(){ layer.remove(); panel.remove(); document.getElementById('hero').classList.remove('hd-editing'); } };
    }

    ensure();
    return {
      frame,
      resize(){ ensure().then(() => editor.refresh()); },
      destroy(){ alive = false; editor.destroy(); cv.remove(); grain.remove(); }
    };
  }
};
