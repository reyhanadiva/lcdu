/* Pengendali hero: scroll → progres 0..1, kursor, teks per babak, dan pemuat varian.
   Setiap varian adalah modul dengan export default { mount(container, state) → { frame(state, now), resize(), destroy() } }.
   Opsional: `supports(state)` (boleh async) → false bila varian tidak bisa dipakai di layar ini (mis. aset orientasi itu
   belum ada), dan `text: 'top'` bila teks babak harus ditaruh di area langit (atas) alih-alih kiri-bawah. */

const hero = document.getElementById('hero');
const holder = document.getElementById('hero-canvas');
const beats = [...hero.querySelectorAll('.beat')];
const cue = document.getElementById('scroll-cue');
const sw = document.getElementById('hero-switch');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

const VARIANTS = { 'lentera-hd': './lentera-hd.js', lentera: './lentera.js', diorama: './diorama.js' };
const DEFAULT = 'lentera-hd';
const NEEDS_WEBGL = { diorama: true };
const hasWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const CENTERS = [0, .5, 1];
/* HP lemah (RAM ≤ 4 GB atau ≤ 4 inti) tidak membuka 3D dari preferensi tersimpan; 3D tetap bisa lewat ?hero=diorama atau tombol */
const weakDevice = coarse && ((navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4);

const state = {
  p: 0, target: 0,
  pointer: { x: 0, y: 0, active: false },
  w: 0, h: 0, reduce, coarse, visible: true,
};

/* ---------- scroll ---------- */
function readScroll() {
  const r = hero.getBoundingClientRect();
  const total = hero.offsetHeight - innerHeight;
  state.target = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
}
addEventListener('scroll', readScroll, { passive: true });

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
  hero.querySelector('.hero-meter').style.setProperty('--p', p.toFixed(4));
  cue.style.opacity = p > .03 ? 0 : 1;
}

/* ---------- varian ---------- */
/* wanted = pilihan pengunjung (disimpan); currentName = yang benar-benar tampil (bisa berbeda karena fallback) */
let current = null, currentMod = null, currentName = '', wanted = '', loadToken = 0;
async function load(name, auto = false) {
  if (NEEDS_WEBGL[name] && !hasWebGL) name = 'lentera-hd';   // 3D tidak bisa jalan → Lentera HD
  if (!VARIANTS[name]) name = 'lentera';
  if (!auto) {
    wanted = name;
    try { localStorage.setItem('lcdu-hero', name); } catch (e) {}
    const url = new URL(location.href); url.searchParams.set('hero', name); history.replaceState(null, '', url);
  }
  if (name === currentName) return;
  const token = ++loadToken;
  const note = document.createElement('div'); note.className = 'hero-loading'; note.textContent = 'Memuat…';
  if (name === 'diorama') holder.appendChild(note);
  let mod;
  try { mod = await import(VARIANTS[name]); }
  catch (err) { note.textContent = 'Varian ini gagal dimuat.'; console.error(err); return; }
  resize();
  if (mod.default.supports && !(await mod.default.supports(state))) {
    if (token !== loadToken) return;
    note.remove();
    return load(name === 'lentera-hd' ? 'lentera' : 'lentera-hd', true);   // mis. Lentera HD belum punya aset landscape
  }
  if (token !== loadToken) return;
  if (current) { current.destroy(); current = null; }
  holder.innerHTML = '';
  hero.dataset.text = mod.default.text || 'bottom';
  sw.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === name));
  current = mod.default.mount(holder, state);
  currentMod = mod.default; currentName = name;
}
/* varian boleh meminta pindah (mis. 3D terlalu berat di perangkat ini); tidak mengubah pilihan pengunjung */
state.fallback = name => { console.info('Hero: pindah otomatis ke', name); load(name, true); };
sw.addEventListener('click', e => { const b = e.target.closest('button'); if (b) load(b.dataset.v); });
/* setelah layar diputar/diubah ukurannya: coba lagi varian pilihan, atau mundur bila varian sekarang tak lagi didukung */
async function recheck() {
  if (wanted && wanted !== currentName) return load(wanted, true);
  if (currentMod && currentMod.supports && !(await currentMod.supports(state))) { const keep = currentName; currentName = ''; load(keep, true); }
}

/* ---------- ukuran & loop ---------- */
function resize() { const r = holder.getBoundingClientRect(); state.w = r.width; state.h = r.height; }
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); readScroll(); current && current.resize(); recheck(); }, 150); });

let raf = 0;
function frame(now) {
  raf = 0;
  state.p += (state.target - state.p) * (reduce ? 1 : window.lenis ? .22 : .12);   // Lenis sudah menghaluskan scroll
  if (Math.abs(state.target - state.p) < .0005) state.p = state.target;
  updateCopy(state.p);
  if (current) current.frame(state, now);
  if (state.visible) raf = requestAnimationFrame(frame);
}
function start() { if (!raf && state.visible) raf = requestAnimationFrame(frame); }
new IntersectionObserver(en => { state.visible = en[0].isIntersecting && !document.hidden; start(); }, { rootMargin: '60px' }).observe(hero);
document.addEventListener('visibilitychange', () => { state.visible = !document.hidden; start(); });

let first = new URL(location.href).searchParams.get('hero');
if (!first) { try { first = localStorage.getItem('lcdu-hero'); } catch (e) {} if (first === 'diorama' && weakDevice) first = DEFAULT; }
resize(); readScroll();
load(first || DEFAULT).then(start);
