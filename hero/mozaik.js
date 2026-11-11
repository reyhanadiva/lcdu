/* Varian 2 — Mozaik: layar penuh ubin glasir. Awalnya gelap; saat scroll, ubin berbalik satu per satu
   (setiap ubin = satu kontribusi) sampai membentuk Al-Aqsa saat fajar. Kursor membalik ubin di sekitarnya sementara. */
import { NIGHT, DAWN, computeView, renderWorld, paintSky, smooth } from './scene2d.js';

function bevelSprite(n){
  const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
  const e = Math.max(2, n*.09);
  g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(n, 0); g.lineTo(n - e, e); g.lineTo(e, e); g.lineTo(e, n - e); g.lineTo(0, n); g.fill();
  g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.moveTo(n, n); g.lineTo(0, n); g.lineTo(e, n - e); g.lineTo(n - e, n - e); g.lineTo(n - e, e); g.lineTo(n, 0); g.fill();
  /* bintang delapan timbul */
  g.save(); g.translate(n/2, n/2); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = Math.max(1, n*.035);
  const r = n*.3; g.strokeRect(-r*.72, -r*.72, r*1.44, r*1.44); g.rotate(Math.PI/4); g.strokeRect(-r*.72, -r*.72, r*1.44, r*1.44); g.restore();
  /* kilau glasir */
  const lg = g.createLinearGradient(0, 0, n, n); lg.addColorStop(0, 'rgba(255,255,255,.18)'); lg.addColorStop(.45, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(e, e, n - 2*e, n - 2*e);
  return c;
}

export default {
  mount(holder, state){
    const cv = document.createElement('canvas'); holder.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W, H, DPR, cell, cols, rows, N, X, Y, thr, hov, dawnC, nightC, sprite, lastKey = '';

    function sample(src){
      const c = document.createElement('canvas'); c.width = cols; c.height = rows; const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, cols*cell, rows*cell, 0, 0, cols, rows);
      return g.getImageData(0, 0, cols, rows).data;
    }
    function layout(){
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = Math.round(state.w*DPR); H = Math.round(state.h*DPR); cv.width = W; cv.height = H;
      const wide = state.w >= 900;
      cell = Math.round((wide ? 15 : 11)*DPR);
      cols = Math.ceil(W/cell); rows = Math.ceil(H/cell); N = cols*rows;
      const view = computeView(cols*cell, rows*cell, wide, wide ? 1.3 : 1.12, wide ? .68 : .5);
      const mk = (P, sun) => { const c = document.createElement('canvas'); c.width = cols*cell; c.height = rows*cell; const g = c.getContext('2d'); paintSky(g, c.width, c.height, view, sun, null); g.drawImage(renderWorld(c.width, c.height, view, P, false), 0, 0); return c; };
      const d = sample(mk(DAWN, 1)), nn = sample(mk(NIGHT, 0));
      X = new Float32Array(N); Y = new Float32Array(N); thr = new Float32Array(N); hov = new Float32Array(N);
      dawnC = new Array(N); nightC = new Array(N);
      const dcx = view.ox + 1000*view.s, dcy = view.oy + 420*view.s, maxD = Math.hypot(Math.max(dcx, W - dcx), Math.max(dcy, H - dcy));
      let seed = 11; const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
      for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++){
        X[i] = c*cell; Y[i] = r*cell;
        const k = i*4, v = .92 + rnd()*.16;
        dawnC[i] = `rgb(${Math.min(255, d[k]*v)|0},${Math.min(255, d[k+1]*v)|0},${Math.min(255, d[k+2]*v)|0})`;
        const nv = .8 + rnd()*.2;
        nightC[i] = `rgb(${nn[k]*nv|0},${nn[k+1]*nv|0},${(nn[k+2]*nv + 6)|0})`;
        const dist = Math.hypot(X[i] + cell/2 - dcx, Y[i] + cell/2 - dcy)/maxD;
        thr[i] = .04 + .7*(.5*rnd() + .5*dist);
      }
      sprite = bevelSprite(cell);
      lastKey = '';
    }
    layout();

    let px = -9999, py = -9999;
    function frame(st, now){
      const p = st.p;
      if (st.pointer.active){ px = st.pointer.x*DPR; py = st.pointer.y*DPR; } else { px = py = -9999; }
      const R = 110*DPR, R2 = R*R;
      let hovering = false;
      const key = p.toFixed(4) + '|' + (px|0) + ',' + (py|0);
      for (let i = 0; i < N; i++) if (hov[i] > .001){ hovering = true; break; }
      if (key === lastKey && !hovering) return;
      lastKey = key;

      ctx.fillStyle = '#060a1d'; ctx.fillRect(0, 0, W, H);
      const g = Math.max(1, Math.round(DPR)), half = cell/2;
      for (let i = 0; i < N; i++){
        const cx = X[i] + half, cy = Y[i] + half;
        if (px > -9000){ const dx = cx - px, dy = cy - py, d2 = dx*dx + dy*dy; if (d2 < R2) hov[i] = Math.max(hov[i], 1 - Math.sqrt(d2)/R*.6); }
        if (hov[i] > 0){ hov[i] = st.reduce ? 0 : hov[i]*.93; if (hov[i] < .002) hov[i] = 0; }
        const f = smooth((p - thr[i])/.06), v = Math.max(f, hov[i] > .35 ? Math.min(1, (hov[i] - .35)*2.5) : 0);
        const sx = Math.abs(Math.cos(v*Math.PI)), w = (cell - g)*Math.max(.06, sx);
        const x0 = cx - w/2, y0 = Y[i] + g/2, h = cell - g;
        ctx.fillStyle = v < .5 ? nightC[i] : dawnC[i];
        ctx.fillRect(x0, y0, w, h);
        ctx.drawImage(sprite, x0, y0, w, h);
      }
    }
    return { frame, resize: layout, destroy(){ cv.remove(); } };
  }
};
