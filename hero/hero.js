/* Pengendali hero: scroll → progres 0..1, kursor, dan teks per babak. Visual = hero Foto (lentera-hd.js), modul dengan
   export default { mount(container, state) → { frame(state, now), resize(), destroy() } }, opsional `supports(state)`
   (boleh async) → false bila aset orientasi layar ini belum ada. Varian 3D diarsipkan di repo reyhanadiva/lcdu-3d. */
import photo from './lentera-hd.js';

const hero = document.getElementById('hero');
const holder = document.getElementById('hero-canvas');
const beats = [...hero.querySelectorAll('.beat')];
const meter = hero.querySelector('.hero-meter');
const cue = document.getElementById('scroll-cue');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const CENTERS = [0, .5, 1];
/* segmen "tahan fajar" di ujung hero (bagian dari tinggi hero 190vh, bukan tambahan): p sudah 1, panggung masih menempel.
   Peta babak memakai sisa scroll di depannya (90vh − 13vh = 77vh). */
const HOLD_VH = 13;

const state = {
  p: 0, target: 0,
  pointer: { x: 0, y: 0, active: false },
  w: 0, h: 0, reduce, coarse, visible: true,
};

/* ---------- scroll ---------- */
/* s = posisi scroll di hero 0..1 (termasuk segmen tahan); map = bagian s yang dipakai peta babak; heroTop untuk Lenis */
let s = 0, map = 1, total = 1, heroTop = 0;
function readScroll() {
  const r = hero.getBoundingClientRect();
  total = Math.max(1, hero.offsetHeight - innerHeight);
  heroTop = scrollY + r.top;
  map = Math.max(.5, (total - HOLD_VH / 100 * innerHeight) / total);
  s = Math.min(1.2, Math.max(0, -r.top / total));
  state.target = Math.min(1, s / map);
}

/* ---------- kursor / sentuhan: cahaya mengikuti mouse; di HP mengikuti jari (juga saat menggeser) ---------- */
let releaseT = 0;
function setPointer(x, y) {
  const r = holder.getBoundingClientRect();
  state.pointer.x = x - r.left; state.pointer.y = y - r.top; state.pointer.active = true; clearTimeout(releaseT);
}
hero.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') setPointer(e.clientX, e.clientY); });
hero.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') state.pointer.active = false; });
const onTouch = e => { const t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); };
hero.addEventListener('touchstart', onTouch, { passive: true });
hero.addEventListener('touchmove', onTouch, { passive: true });
hero.addEventListener('touchend', () => { releaseT = setTimeout(() => state.pointer.active = false, 900); }, { passive: true });

/* ---------- teks per babak ---------- */
function smooth(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }
function updateCopy(p) {
  beats.forEach((b, i) => {
    const d = Math.abs(p - CENTERS[i]);
    const o = 1 - smooth((d - .12) / .14);
    b.style.opacity = o.toFixed(3);
    b.setAttribute('aria-hidden', o > .5 ? 'false' : 'true');
  });
  hero.style.setProperty('--p', p.toFixed(4));
  meter.style.setProperty('--p', p.toFixed(4));
  cue.style.opacity = p > .03 ? 0 : 1;
}

/* ---------- visual ---------- */
let current = null;
async function mountPhoto() {
  resize();
  if (photo.supports && !(await photo.supports(state))) { console.warn('Hero: aset foto untuk layar ini belum ada'); return; }
  if (current) { current.destroy(); current = null; }
  holder.innerHTML = '';
  current = photo.mount(holder, state);
}
/* setelah layar diputar: pasang ulang bila dukungan orientasi berubah (mis. aset wide/tall) */
async function recheck() {
  const ok = !photo.supports || await photo.supports(state);
  if (ok && !current) mountPhoto();
  else if (!ok && current) { current.destroy(); current = null; holder.innerHTML = ''; }
}

/* ---------- ukuran & loop ---------- */
function resize() { const r = holder.getBoundingClientRect(); state.w = r.width; state.h = r.height; }
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); readScroll(); current && current.resize(); recheck(); }, 150); });

/* p mengikuti target lewat pegas teredam kritis (K) dengan batas kecepatan MAX_RATE: satu putaran roda atau usapan pendek
   tetap halus. Supaya geser kencang tidak melewatkan fajar, ada dua lapis (lihat CLAUDE.md, angka dari simulasi):
   1. Panduan: bila scroll diperkirakan melewati titik jaminan B (60% segmen tahan fajar), p dipercepat dengan hukum
      kendali a = 6D/T² − 4v/T (D = jarak ke 1, T = waktu sampai scroll tiba di B): kontinu, mengerem sendiri di ujung.
      Titik henti diperkirakan dari Lenis (targetScroll) atau, untuk scroll native, dari kecepatan × TAU (momentum).
   2. Lantai: ketertinggalan p yang diizinkan menyusut dari L_MAKS ke 0 antara s = .6 dan B. Hanya mengikat pada lompatan
      yang memang tidak menyisakan waktu (scrollTo instan, roda 3000px dalam 100 ms); tanpa menahan scroll pengunjung. */
const K = 70, DAMP = 2 * Math.sqrt(K), MAX_RATE = .45;
const T_PANDU = 1.2, A_MAKS = 40, L_MAKS = .45, TAU = .5;
let raf = 0, lastT = 0, vel = 0, sPrev = -1, vS = 0;
function step(dt) {
  const target = state.target;
  if (sPrev >= 0) vS += ((s - sPrev) / dt - vS) * Math.min(1, dt * 20);
  sPrev = s;
  const ln = window.lenis;
  const sEnd = ln && ln.isScrolling === 'smooth' ? (ln.targetScroll - heroTop) / total : s + Math.max(0, vS) * TAU;
  const B = map + .6 * (1 - map);
  const lag = target - state.p;
  let acc = K * lag - DAMP * vel, lim = MAX_RATE + Math.max(0, Math.abs(lag) - .25) * 1.6;
  const ikut = smooth((sEnd - B + .04) / .08);
  if (ikut > 0 && vS > .05 && s < B) {
    const T = (B - s) / vS;
    if (T < T_PANDU) {
      const aG = Math.min(A_MAKS, 6 * (1 - state.p) / (T * T) - 4 * vel / T);
      const w = ikut * smooth((T_PANDU - T) / (T_PANDU * .4));
      if (aG > acc) acc += (aG - acc) * w;
      lim = Math.max(lim, 6 * w);
    }
  }
  vel = Math.max(-lim, Math.min(lim, vel + acc * dt));
  const before = state.p;
  state.p += vel * dt;
  const floor = target - L_MAKS * (1 - smooth((s - .6) / (B - .6)));
  if (state.p < floor) { state.p = floor; vel = Math.max(vel, (state.p - before) / dt); }
  if (state.p > 1) { state.p = 1; vel = Math.min(vel, 0); }
  if (state.p < 0) { state.p = 0; vel = Math.max(vel, 0); }
  if (Math.abs(target - state.p) < .0005 && Math.abs(vel) < .01) { state.p = target; vel = 0; }
}
function frame(now) {
  raf = 0;
  readScroll();   // dibaca tiap frame (bukan dari event scroll yang tertinggal satu frame dari Lenis)
  const dt = lastT ? Math.min(.1, (now - lastT)/1000) : 0; lastT = now;
  if (reduce) { state.p = state.target; vel = 0; }
  else if (dt) step(dt);
  updateCopy(state.p);
  if (current) current.frame(state, now);
  if (state.visible) raf = requestAnimationFrame(frame);
}
function start() { if (!raf && state.visible){ lastT = 0; vel = 0; sPrev = -1; vS = 0; raf = requestAnimationFrame(frame); } }
new IntersectionObserver(en => { state.visible = en[0].isIntersecting && !document.hidden; start(); }, { rootMargin: '60px' }).observe(hero);
document.addEventListener('visibilitychange', () => { state.visible = !document.hidden; start(); });

resize(); readScroll();
/* dibuka di tengah/di bawah hero (refresh, #anchor): langsung pada keadaan yang benar, tanpa animasi mengejar */
state.p = state.target;
mountPhoto().then(start);
