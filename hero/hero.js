/* Pengendali hero: scroll → progres 0..1, kursor, teks per babak, dan pemuat varian.
   Setiap varian adalah modul dengan export default { mount(container, state) → { frame(state, now), resize(), destroy() } }. */

const hero = document.getElementById('hero');
const holder = document.getElementById('hero-canvas');
const beats = [...hero.querySelectorAll('.beat')];
const cue = document.getElementById('scroll-cue');
const sw = document.getElementById('hero-switch');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

const VARIANTS = { lentera: './lentera.js', diorama: './diorama.js' };
const NEEDS_WEBGL = { diorama: true };
const hasWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const CENTERS = [0, .5, 1];

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

/* ---------- kursor / sentuhan ---------- */
function setPointer(e) {
  const r = holder.getBoundingClientRect();
  state.pointer.x = e.clientX - r.left; state.pointer.y = e.clientY - r.top; state.pointer.active = true;
}
hero.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) setPointer(e); });
hero.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') setPointer(e); });
hero.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(() => state.pointer.active = false, 700); });
hero.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') state.pointer.active = false; });

/* ---------- teks per babak ---------- */
function smooth(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }
function updateCopy(p) {
  beats.forEach((b, i) => {
    const d = Math.abs(p - CENTERS[i]);
    const o = 1 - smooth((d - .12) / .14);
    b.style.opacity = o.toFixed(3);
    b.style.transform = `translateY(${((CENTERS[i] - p) * 90).toFixed(1)}px)`;
    b.setAttribute('aria-hidden', o > .5 ? 'false' : 'true');
  });
  hero.style.setProperty('--p', p.toFixed(4));
  hero.querySelector('.hero-meter').style.setProperty('--p', p.toFixed(4));
  cue.style.opacity = p > .03 ? 0 : 1;
}

/* ---------- varian ---------- */
let current = null, currentName = '', loadToken = 0;
async function load(name) {
  if (!VARIANTS[name]) name = 'lentera';
  if (NEEDS_WEBGL[name] && !hasWebGL) name = 'lentera';
  if (name === currentName) return;
  const token = ++loadToken;
  sw.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === name));
  try { localStorage.setItem('lcdu-hero', name); } catch (e) {}
  const url = new URL(location.href); url.searchParams.set('hero', name); history.replaceState(null, '', url);
  const note = document.createElement('div'); note.className = 'hero-loading'; note.textContent = 'Memuat…';
  if (name === 'diorama') holder.appendChild(note);
  let mod;
  try { mod = await import(VARIANTS[name]); }
  catch (err) { note.textContent = 'Varian ini gagal dimuat.'; console.error(err); return; }
  if (token !== loadToken) return;
  if (current) { current.destroy(); current = null; }
  holder.innerHTML = '';
  resize();
  current = mod.default.mount(holder, state);
  currentName = name;
}
/* varian boleh meminta pindah (mis. 3D terlalu berat di perangkat ini) */
state.fallback = name => { console.info('Hero: pindah otomatis ke', name); load(name); };
sw.addEventListener('click', e => { const b = e.target.closest('button'); if (b) load(b.dataset.v); });

/* ---------- ukuran & loop ---------- */
function resize() { const r = holder.getBoundingClientRect(); state.w = r.width; state.h = r.height; }
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); readScroll(); current && current.resize(); }, 150); });

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
if (!first) { try { first = localStorage.getItem('lcdu-hero'); } catch (e) {} }
resize(); readScroll();
load(first || 'lentera').then(start);
