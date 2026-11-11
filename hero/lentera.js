/* Varian 1 — Lentera: kota gelap; saat scroll, ratusan cahaya kecil menyala satu per satu dan menyingkap warna fajar,
   lalu matahari terbit. Kursor = cahaya lembut. Tanpa klik, tanpa parallax. */
import { NIGHT, DAWN, computeView, renderWorld, paintSky, makeStars, lightSpots, smooth } from './scene2d.js';

function dot(size, inner, outer){
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const rg = g.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  rg.addColorStop(0, inner); rg.addColorStop(.5, inner.replace(/[\d.]+\)$/, m => (parseFloat(m)*.55) + ')')); rg.addColorStop(1, outer);
  g.fillStyle = rg; g.fillRect(0, 0, size, size); return c;
}

export default {
  mount(holder, state){
    const cv = document.createElement('canvas'); holder.appendChild(cv);
    const ctx = cv.getContext('2d');
    const tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');
    const mask = document.createElement('canvas'), mctx = mask.getContext('2d');
    const MASK = dot(128, 'rgba(0,0,0,1)', 'rgba(0,0,0,0)');
    const GLOW = dot(128, 'rgba(255,196,110,.42)', 'rgba(255,170,90,0)');
    const SPOTS = lightSpots();
    let W, H, DPR, view, night, dawn, stars, spots, lx = -1, ly = -1, last = '';

    function layout(){
      DPR = Math.min(devicePixelRatio || 1, state.w > 1200 ? 1.25 : 1.6);
      W = Math.max(1, Math.round(state.w*DPR)); H = Math.max(1, Math.round(state.h*DPR)); cv.width = W; cv.height = H;
      tmp.width = W; tmp.height = H; mask.width = Math.ceil(W/4); mask.height = Math.ceil(H/4);
      const wide = state.w >= 900, center = state.layout === 'b';
      view = computeView(W, H, wide, 1, wide && !center ? .66 : .5, wide ? (center ? .24 : .04) : .2);
      night = renderWorld(W, H, view, NIGHT); dawn = renderWorld(W, H, view, DAWN);
      stars = makeStars(W, H, state.w >= 900 ? 200 : 110, DPR);
      spots = SPOTS.map(s => [view.ox + s[0]*view.s, view.oy + s[1]*view.s, s[2]*view.s]).filter(s => s[0] > -40 && s[0] < W + 40 && s[1] < H);
      last = '';
    }
    layout();

    function frame(st, now){
      const p = st.p, time = now/1000;
      const lit = smooth(p/.62)*spots.length;          // jumlah cahaya kontribusi
      const sun = smooth((p - .5)/.5);                 // fajar
      const pa = st.pointer.active;
      if (pa){ const tx = st.pointer.x*DPR, ty = st.pointer.y*DPR; lx = lx < 0 ? tx : lx + (tx - lx)*.22; ly = ly < 0 ? ty : ly + (ty - ly)*.22; }
      const key = p.toFixed(4) + (pa ? lx.toFixed(0) + ',' + ly.toFixed(0) : '-');
      if (key === last && st.reduce) return;
      last = key;

      paintSky(ctx, W, H, view, sun, stars, st.reduce ? 0 : time, smooth(lit/spots.length)*.6);
      ctx.drawImage(night, 0, 0);

      /* masker cahaya */
      const q = .25; mctx.clearRect(0, 0, mask.width, mask.height);
      if (sun > 0){ mctx.globalAlpha = sun; mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mask.width, mask.height); mctx.globalAlpha = 1; }
      const n = Math.ceil(lit);
      for (let i = 0; i < n; i++){
        const s = spots[i], a = Math.min(1, lit - i), r = Math.min(s[2]*2.1, 46*DPR)*(.6 + .4*a);
        mctx.globalAlpha = a; mctx.drawImage(MASK, (s[0] - r)*q, (s[1] - r)*q, 2*r*q, 2*r*q);
      }
      if (pa){ const r = 190*DPR; mctx.globalAlpha = .9; mctx.drawImage(MASK, (lx - r)*q, (ly - r)*q, 2*r*q, 2*r*q); }
      mctx.globalAlpha = 1;
      if (sun > 0 || n > 0 || pa){
        tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, W, H); tctx.drawImage(dawn, 0, 0);
        tctx.globalCompositeOperation = 'destination-in'; tctx.drawImage(mask, 0, 0, W, H);
        ctx.drawImage(tmp, 0, 0);
      }

      /* nyala lentera */
      const fade = 1 - sun*.75;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++){
        const s = spots[i], a = Math.min(1, lit - i), pop = a < 1 ? 1 + (1 - a)*.8 : 1;
        const fl = st.reduce ? 1 : .88 + .12*Math.sin(time*3 + i*1.7);
        const r = Math.min(s[2]*1.05, 24*DPR)*pop; ctx.globalAlpha = a*fade*fl*.8; ctx.drawImage(GLOW, s[0] - r, s[1] - r, 2*r, 2*r);
      }
      if (pa){ const r = 170*DPR; ctx.globalAlpha = .35; ctx.drawImage(GLOW, lx - r, ly - r, 2*r, 2*r); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FFF1D2';
      for (let i = 0; i < n; i++){ const s = spots[i], a = Math.min(1, lit - i); ctx.globalAlpha = a*fade; const d = 2.2*DPR*(.7 + view.s); ctx.fillRect(s[0] - d/2, s[1] - d/2, d, d); }
      ctx.globalAlpha = 1;
    }
    return { frame, resize: layout, destroy(){ cv.remove(); } };
  }
};
