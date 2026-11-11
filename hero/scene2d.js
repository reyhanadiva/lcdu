/* Ilustrasi kompleks Al-Aqsa (kanvas 2D) dalam dua palet: malam dan fajar.
   Koordinat dunia: 1600 x 900, Kubah Shakhrah berpusat di x = 1000. Dipakai oleh varian lentera. */

export const NIGHT = {dir:-1, dome:'#2E3A5E', domeHi:'#56679A', domeLo:'#1B2442', tile:'#18244F', tileSide:'#101a3c', tileLine:'rgba(120,150,220,.10)', band:'#121c44',
  marble:'#2C3555', marbleSide:'#222a47', stone:'#222A4C', stoneSide:'#191f3d', silver:'#2F3A5C', silverHi:'#4B5A88', win:'#0E1430', arch:'#0A1030',
  tree:'#0C1630', tree2:'#0A1228', hillFar:'#0A1236', hillNear:'#0E1842', ground:'#0B1232', groundHi:'#121b42', fore:'#02040F', rim:'rgba(150,178,240,.45)'};
export const DAWN = {dir:1, dome:'#E9B23E', domeHi:'#FFE7A6', domeLo:'#9E6D1C', tile:'#2C66D3', tileSide:'#1C46A0', tileLine:'rgba(255,255,255,.16)', band:'#183C8E',
  marble:'#EFE7D6', marbleSide:'#C8BBA0', stone:'#D8BE93', stoneSide:'#A98C66', silver:'#8E98AA', silverHi:'#E2E7EF', win:'#2A2F4A', arch:'#5E4B3A',
  tree:'#2E6A4A', tree2:'#21523A', hillFar:'#8A5E78', hillNear:'#B47467', ground:'#C9A57A', groundHi:'#E2C091', fore:'#0F1A14', rim:'rgba(255,214,150,.7)'};

export const SKY_N = [[3,6,26],[8,14,52],[18,26,80]];
export const SKY_D = [[46,62,128],[205,118,120],[255,196,128]];
export const mix = (a, b, t) => [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t];
export const rgb = (c, a = 1) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
export const smooth = t => { t = Math.min(1, Math.max(0, t)); return t*t*(3 - 2*t); };

function lin(c, x0, x1, a, b){ const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function shadeX(c, P, x0, x1, lo, hi){ return P.dir > 0 ? lin(c, x0, x1, lo, hi) : lin(c, x0, x1, hi, lo); }
function arch(c, x, y, w, h){ c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w*.6); c.quadraticCurveTo(x, y, x + w/2, y - w*.15); c.quadraticCurveTo(x + w, y, x + w, y + w*.6); c.lineTo(x + w, y + h); c.closePath(); c.fill(); }
function cypress(c, x, y, w, h, col){ c.fillStyle = col; c.beginPath(); c.moveTo(x, y - h); c.bezierCurveTo(x + w*1.1, y - h*.6, x + w, y - h*.1, x + w*.3, y); c.lineTo(x - w*.3, y); c.bezierCurveTo(x - w, y - h*.1, x - w*1.1, y - h*.6, x, y - h); c.fill(); }
function olive(c, x, y, r, col, col2){
  c.fillStyle = col2; c.fillRect(x - r*.08, y - r*.6, r*.16, r*.7);
  c.fillStyle = col; [[0,-1,1],[-.7,-.8,.75],[.75,-.75,.8],[-.3,-1.45,.7],[.4,-1.4,.65],[0,-.6,.7]].forEach(b => { c.beginPath(); c.arc(x + b[0]*r, y + b[1]*r, b[2]*r*.75, 0, 7); c.fill(); });
}
function tiles(c, P, x, y, w, h){
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = P.tileLine; c.lineWidth = 1;
  for (let i = -h; i < w; i += 9){ c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i + h, y + h); c.moveTo(x + i + h, y); c.lineTo(x + i, y + h); c.stroke(); }
  c.restore();
}
function hills(c, P){
  const ridge = (pts, base) => { c.beginPath(); c.moveTo(-400, base); pts.forEach((p, i, a) => { if (i) c.quadraticCurveTo((a[i-1][0] + p[0])/2, a[i-1][1] - 18, p[0], p[1]); else c.lineTo(p[0], p[1]); }); c.lineTo(2000, base); c.fill(); };
  c.fillStyle = P.hillFar; ridge([[-400,600],[-100,560],[200,590],[520,548],[860,582],[1180,540],[1480,575],[1800,548],[2000,580]], 700);
  c.fillStyle = P.hillNear; ridge([[-400,640],[0,628],[340,650],[700,622],[1100,650],[1500,618],[2000,646]], 720);
  for (let k = 0; k < 38; k++){ const bx = -380 + k*62 + (k*37 % 23), bw = 34 + (k*13 % 26), bh = 18 + (k*29 % 30); c.fillRect(bx, 650 - bh, bw, bh + 40); }
}
function city(c, P){
  let i, x;
  [[250,690,16,120],[285,694,13,96],[1235,688,15,118],[1268,692,12,92],[1460,690,16,124],[760,692,14,104]].forEach(t => cypress(c, t[0], t[1], t[2], t[3], P.tree2));
  olive(c, 150, 700, 52, P.tree2, P.stoneSide); olive(c, 1550, 700, 56, P.tree2, P.stoneSide);
  /* menara kiri */
  c.fillStyle = shadeX(c, P, 330, 352, P.stoneSide, P.stone); c.fillRect(330, 505, 22, 195); c.fillRect(324, 560, 34, 7); c.fillRect(333, 486, 16, 20);
  c.fillStyle = P.silver; c.beginPath(); c.moveTo(331, 487); c.quadraticCurveTo(341, 462, 351, 487); c.fill();
  c.fillStyle = P.win; c.fillRect(338, 520, 6, 14); c.fillRect(338, 590, 6, 14);
  /* Masjid Qibli */
  c.fillStyle = shadeX(c, P, 430, 700, P.stoneSide, P.stone); c.fillRect(430, 612, 270, 88);
  c.fillStyle = P.stoneSide; c.fillRect(430, 606, 270, 7);
  c.fillStyle = P.arch; for (i = 0; i < 7; i++) arch(c, 446 + i*36, 640, 22, 60);
  c.fillStyle = shadeX(c, P, 570, 630, P.stoneSide, P.stone); c.fillRect(570, 584, 60, 24);
  c.fillStyle = shadeX(c, P, 564, 636, P.silver, P.silverHi); c.beginPath(); c.moveTo(564, 587); c.bezierCurveTo(565, 540, 635, 540, 636, 587); c.closePath(); c.fill();
  c.fillStyle = P.silverHi; c.fillRect(599, 530, 2.5, 16);
  /* menara kanan */
  c.fillStyle = shadeX(c, P, 1318, 1344, P.stoneSide, P.stone); c.fillRect(1318, 468, 26, 232); c.fillRect(1310, 538, 42, 8); c.fillRect(1322, 448, 18, 21);
  c.fillStyle = P.silver; c.beginPath(); c.moveTo(1320, 450); c.quadraticCurveTo(1331, 420, 1342, 450); c.fill();
  c.fillStyle = P.win; c.fillRect(1327, 488, 8, 16); c.fillRect(1327, 576, 8, 16); c.fillRect(1327, 632, 8, 16);
  /* qanatir */
  [[808,70],[1122,70]].forEach(q => { c.fillStyle = shadeX(c, P, q[0], q[0] + q[1], P.stoneSide, P.stone); c.fillRect(q[0], 650, q[1], 50); c.fillStyle = P.arch; for (let j = 0; j < 3; j++) arch(c, q[0] + 6 + j*22, 662, 14, 38); });
  c.fillStyle = shadeX(c, P, 840, 1160, P.stoneSide, P.stone); c.fillRect(840, 688, 320, 14);
  /* Kubah Shakhrah */
  c.fillStyle = shadeX(c, P, 860, 920, P.tileSide, P.tile); c.beginPath(); c.moveTo(860, 526); c.lineTo(920, 520); c.lineTo(920, 640); c.lineTo(860, 640); c.fill();
  c.fillStyle = shadeX(c, P, 1080, 1140, P.tile, P.tileSide); c.beginPath(); c.moveTo(1080, 520); c.lineTo(1140, 526); c.lineTo(1140, 640); c.lineTo(1080, 640); c.fill();
  c.fillStyle = P.tile; c.fillRect(920, 520, 160, 120);
  tiles(c, P, 860, 520, 280, 120);
  c.fillStyle = P.dir > 0 ? P.tileSide : P.tile; c.globalAlpha = .55; c.fillRect(860, 520, 60, 120); c.globalAlpha = 1;
  c.fillStyle = P.win;
  for (i = 0; i < 5; i++) arch(c, 932 + i*29, 562, 15, 48);
  arch(c, 872, 566, 11, 42); arch(c, 896, 564, 11, 44); arch(c, 1093, 564, 11, 44); arch(c, 1117, 566, 11, 42);
  c.fillStyle = shadeX(c, P, 860, 1140, P.marbleSide, P.marble); c.fillRect(860, 640, 280, 50);
  c.strokeStyle = P.marbleSide; c.lineWidth = 1.2; for (i = 0; i < 7; i++) c.strokeRect(868 + i*39, 648, 30, 34);
  c.fillStyle = P.marbleSide; c.globalAlpha = .6; c.fillRect(860, 640, 60, 50); c.globalAlpha = 1;
  c.fillStyle = P.band; c.fillRect(856, 510, 288, 12);
  c.fillStyle = P.dome; c.fillRect(856, 514, 288, 2.2);
  c.fillStyle = P.band; for (x = 858; x < 1142; x += 9) c.fillRect(x, 504, 5, 7);
  c.fillStyle = shadeX(c, P, 934, 1066, P.tileSide, P.tile); c.fillRect(934, 458, 132, 48);
  tiles(c, P, 934, 458, 132, 48);
  c.fillStyle = P.win; for (i = 0; i < 8; i++) arch(c, 942 + i*15.5, 470, 7, 26);
  c.fillStyle = P.band; c.fillRect(930, 454, 140, 6);
  const dome = new Path2D(); dome.moveTo(921, 458); dome.bezierCurveTo(916, 386, 956, 334, 1000, 330); dome.bezierCurveTo(1044, 334, 1084, 386, 1079, 458); dome.closePath();
  c.fillStyle = shadeX(c, P, 921, 1079, P.domeLo, P.dome); c.fill(dome);
  c.save(); c.clip(dome);
  const hx = P.dir > 0 ? 1035 : 965, rg = c.createRadialGradient(hx, 372, 4, hx, 372, 80);
  rg.addColorStop(0, P.domeHi); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.globalAlpha = P.dir > 0 ? .9 : .5; c.fillRect(900, 320, 200, 150);
  c.globalAlpha = 1; c.strokeStyle = P.rim; c.lineWidth = 3; c.beginPath();
  if (P.dir > 0){ c.moveTo(1079, 458); c.bezierCurveTo(1084, 386, 1044, 334, 1000, 330); } else { c.moveTo(921, 458); c.bezierCurveTo(916, 386, 956, 334, 1000, 330); }
  c.stroke(); c.restore();
  c.fillStyle = P.dome; c.fillRect(998.5, 300, 3, 32); c.beginPath(); c.arc(1000, 318, 4, 0, 7); c.fill();
  c.beginPath(); c.arc(1000, 290, 9, 0, 7); c.arc(1004, 287, 8, 0, 7, true); c.fill('evenodd');
  /* tembok kota & pelataran */
  c.fillStyle = shadeX(c, P, -300, 1900, P.stoneSide, P.stone); c.fillRect(-400, 700, 2400, 62);
  c.fillStyle = P.stone; for (x = -400; x < 2000; x += 24) c.fillRect(x, 692, 14, 9);
  c.strokeStyle = P.stoneSide; c.lineWidth = 1; c.globalAlpha = .6;
  for (let row = 0; row < 4; row++){ const yy = 712 + row*13; c.beginPath(); c.moveTo(-400, yy); c.lineTo(2000, yy); c.stroke(); }
  c.globalAlpha = 1;
  c.fillStyle = P.ground; c.fillRect(-400, 762, 2400, 400);
  c.fillStyle = P.groundHi; c.globalAlpha = .35; c.fillRect(-400, 762, 2400, 6); c.globalAlpha = 1;
  [[720,700,18,132],[1192,700,17,126],[1400,702,15,110]].forEach(t => cypress(c, t[0], t[1], t[2], t[3], P.tree));
  olive(c, 560, 708, 40, P.tree, P.stoneSide); olive(c, 1600, 712, 48, P.tree, P.stoneSide);
}
function fore(c, P){
  const branch = (x0, y0, x1, y1, cx, cy, n, flip) => {
    c.strokeStyle = P.fore; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
    c.fillStyle = P.fore;
    for (let i = 1; i <= n; i++){
      const t = i/(n + 1), x = (1-t)*(1-t)*x0 + 2*(1-t)*t*cx + t*t*x1, y = (1-t)*(1-t)*y0 + 2*(1-t)*t*cy + t*t*y1, ang = Math.atan2(y1 - y0, x1 - x0);
      for (let s = -1; s <= 1; s += 2){ c.save(); c.translate(x, y); c.rotate(ang + s*(0.7 + (i%3)*.12)*flip); c.beginPath(); c.ellipse(26, 0, 28 - t*8, 6.5, 0, 0, 7); c.fill(); c.restore(); }
    }
  };
  branch(1720, -40, 1300, 150, 1560, 40, 9, -1);
}

/* Tampilan: skala & posisi dunia di layar. focus = posisi kubah horizontal (0..1). */
export function computeView(W, H, wide, zoom = 1, focus = .66){
  let s, ox, oy;
  if (wide){ s = Math.max(W/1600, H/900)*zoom; ox = W*focus - 1000*s; oy = H - 900*s + 80*s; }
  else { s = Math.max(W/760, H/1150)*zoom; ox = W*.5 - 1000*s; oy = H - 900*s - H*.02; }
  return { s, ox, oy };
}

/* Gambar dunia (tanpa langit) ke kanvas baru. */
export function renderWorld(W, H, view, P, withFore = true){
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.setTransform(view.s, 0, 0, view.s, view.ox, view.oy);
  hills(g, P); city(g, P); if (withFore) fore(g, P);
  return c;
}

/* Langit: gradasi, bintang, bulan, matahari. sun 0..1 */
export function paintSky(ctx, W, H, view, sun, stars, time = 0, warm = 0){
  const g = ctx.createLinearGradient(0, 0, 0, H*.82);
  const lift = (c) => mix(c, [c[0] + 24, c[1] + 16, c[2] + 10], warm);
  g.addColorStop(0, rgb(lift(mix(SKY_N[0], SKY_D[0], sun)))); g.addColorStop(.55, rgb(lift(mix(SKY_N[1], SKY_D[1], sun)))); g.addColorStop(1, rgb(lift(mix(SKY_N[2], SKY_D[2], sun))));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (stars && sun < 1){
    ctx.fillStyle = '#fff';
    for (const s of stars){ ctx.globalAlpha = (.3 + .45*Math.abs(Math.sin(time*.4 + s[2])))*s[3]*(1 - sun); ctx.fillRect(s[0], s[1], s[4], s[4]); }
    ctx.globalAlpha = 1;
  }
  const mx = view.ox + 1290*view.s, my = view.oy + 190*view.s;
  if (sun < 1){
    ctx.save(); ctx.globalAlpha = 1 - sun;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 90*view.s); mg.addColorStop(0, 'rgba(200,215,255,.2)'); mg.addColorStop(1, 'rgba(200,215,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx - 90*view.s, my - 90*view.s, 180*view.s, 180*view.s);
    ctx.beginPath(); ctx.arc(mx, my, 20*view.s, 0, 7); ctx.clip(); ctx.fillStyle = '#E9EEFF'; ctx.fill();
    ctx.fillStyle = rgb(mix(SKY_N[0], SKY_D[0], sun)); ctx.beginPath(); ctx.arc(mx + 9*view.s, my - 6*view.s, 18*view.s, 0, 7); ctx.fill();
    ctx.restore();
  }
  if (sun > 0){
    const sx = view.ox + 1240*view.s, sy = view.oy + (690 - sun*230)*view.s, sr = 60*view.s;
    const sg = ctx.createRadialGradient(sx, sy, sr*.2, sx, sy, sr*6); sg.addColorStop(0, `rgba(255,222,150,${.85*sun})`); sg.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx - sr*6, sy - sr*6, sr*12, sr*12);
    ctx.fillStyle = `rgba(255,236,190,${sun})`; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
  }
}

export function makeStars(W, H, n, dpr){
  const s = []; for (let i = 0; i < n; i++) s.push([Math.random()*W, Math.random()*H*.62, Math.random()*6.3, .3 + Math.random()*.7, (Math.random() < .08 ? 1.8 : 1)*dpr]); return s;
}

/* Titik-titik cahaya "kontribusi" (koordinat dunia), urutannya diacak tetap. */
export function lightSpots(){
  let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
  const out = [], add = (x, y, r) => out.push([x, y, r]);
  for (let i = 0; i < 7; i++) add(457 + i*36, 672, 24);
  for (let i = 0; i < 5; i++) add(939.5 + i*29, 590, 26);
  [877.5, 901.5, 1098.5, 1122.5].forEach(x => add(x, 592, 22));
  for (let i = 0; i < 8; i++) add(945.5 + i*15.5, 486, 18);
  [[341,527],[341,597],[1331,496],[1331,584],[1331,640],[600,600]].forEach(p => add(p[0], p[1], 22));
  for (let x = 10; x < 1600; x += 42) add(x + rnd()*10, 690 + rnd()*6, 28);
  for (let i = 0; i < 22; i++) add(850 + rnd()*300, 694 + rnd()*4, 24);
  for (let i = 0; i < 90; i++) add(rnd()*1640 - 20, 780 + rnd()*100, 18 + rnd()*8);
  for (let i = out.length - 1; i > 0; i--){ const j = (rnd()*(i + 1))|0; [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
