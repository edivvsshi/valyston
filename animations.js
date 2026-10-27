'use strict';
(() => {
const root = document.documentElement;
root.classList.add('js');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const conn = navigator.connection || {};
const saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const onIdle = (fn, wait = 0) => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : fn()), wait);

const yearsBaking = new Date().getFullYear() - 2006;
$('#year').textContent = new Date().getFullYear();
const hero = $('.hero');
const topBar = $('.top');
const bar = $('.callbar');

/* ---------- Load sequence: the name rises letter by letter ---------- */
$$('.monument .mask > span').forEach((s, i) => s.style.setProperty('--i', i));
$$('.giant span').forEach((s, i) => s.style.setProperty('--i', i));
const start = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('loaded')));
if (document.fonts && document.fonts.ready) {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 700))]).then(start);
} else start();

/* ---------- Second hero photo: fetched only after the page has loaded, then a slow crossfade ---------- */
const heroA = $('.hero-a');
const heroB = $('.hero-b');
const crossfade = () => {
  const imgs = [heroA, heroB];
  let k = 0;
  let timer = null;
  const next = () => {
    imgs[k].classList.remove('is-on');
    k = (k + 1) % imgs.length;
    imgs[k].classList.add('is-on');
  };
  const run = () => { if (!timer) timer = setInterval(next, 6000); };
  const stop = () => { clearInterval(timer); timer = null; };
  run();
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
};
if (!calm && !saveData && heroA && heroB) {
  const fetchSecond = () => {
    heroB.closest('picture').querySelectorAll('source[data-srcset]').forEach((s) => { s.srcset = s.dataset.srcset; });
    heroB.src = heroB.dataset.src;
    const ready = heroB.decode ? heroB.decode() : new Promise((r) => heroB.addEventListener('load', r, { once: true }));
    ready.then(crossfade).catch(() => {});
  };
  if (document.readyState === 'complete') onIdle(fetchSecond, 1500);
  else addEventListener('load', () => onIdle(fetchSecond, 1500), { once: true });
}

/* ---------- Bars: the top bar turns solid after the hero and hides on the way down;
   on a phone the call bar takes its place, except over the hero, the contact rows and the footer ---------- */
const zones = new Map();
const updateBar = () => {
  if (!bar) return;
  const inZone = [...zones.values()].some(Boolean);
  bar.classList.toggle('show', topBar.classList.contains('away') && !inZone);
};
if (bar && 'IntersectionObserver' in window) {
  bar.hidden = false;
  const zio = new IntersectionObserver((entries) => {
    entries.forEach((e) => zones.set(e.target, e.isIntersecting));
    updateBar();
  });
  [hero, $('#contact'), $('.closing')].forEach((z) => z && zio.observe(z));
}

let heroH = hero.offsetHeight;
addEventListener('resize', () => { heroH = hero.offsetHeight; }, { passive: true });
let lastY = scrollY;
let boost = 0;
let scrollDir = 1;
let ticking = false;
const onScroll = () => {
  const y = scrollY;
  const dy = y - lastY;
  topBar.classList.toggle('solid', y > heroH - 80);
  if (y > heroH && dy > 4) topBar.classList.add('away');
  if (dy < -4 || y < heroH) topBar.classList.remove('away');
  if (dy) { boost = Math.min(boost + Math.abs(dy) * 0.08, 14); scrollDir = dy > 0 ? 1 : -1; }
  updateBar();
  lastY = y;
  ticking = false;
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ---------- Marquees: drift on their own, speed up with the scroll, wrap seamlessly at any width ---------- */
if (!calm) {
  const bands = $$('.marquee').map((m) => {
    const track = $('.marquee-track', m);
    const group = [...track.children];
    const state = { m, track, group, w: 0, x: 0, dir: Number(m.dataset.dir) || 1, visible: false };
    const fill = () => {
      // keep one original group plus enough copies to cover the screen
      [...track.children].slice(group.length).forEach((n) => n.remove());
      state.w = track.scrollWidth;
      if (!state.w) return;
      const copies = Math.ceil(innerWidth / state.w) + 1;
      for (let c = 0; c < copies; c++) group.forEach((n) => track.append(n.cloneNode(true)));
      state.x = state.dir > 0 ? 0 : -state.w;
    };
    fill();
    let rw = innerWidth;
    addEventListener('resize', () => { if (Math.abs(innerWidth - rw) > 40) { rw = innerWidth; fill(); } }, { passive: true });
    if (document.fonts) document.fonts.ready.then(fill);
    new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }).observe(m);
    return state;
  });
  const loop = () => {
    if (!document.hidden) {
      bands.forEach((b) => {
        if (!b.visible || !b.w) return;
        b.x -= (0.55 + boost) * b.dir * scrollDir;
        if (b.x <= -b.w) b.x += b.w;
        if (b.x > 0) b.x -= b.w;
        b.track.style.transform = `translate3d(${b.x.toFixed(2)}px,0,0)`;
      });
      boost *= 0.92;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- Words that fill with ink as they rise (only where scroll timelines exist) ---------- */
if (!calm && window.CSS && CSS.supports('animation-timeline: view()')) {
  $$('[data-fill], [data-words]').forEach((el) => {
    [...el.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(part);
        else { const s = document.createElement('span'); s.textContent = part; frag.append(s); }
      });
      n.replaceWith(frag);
    });
    el.classList.add('is-filling');
  });
}

/* ---------- Entrances, choreographed per section ---------- */
const roll = $('[data-roll]');
const rollUp = () => {
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / 1400, 1);
    roll.textContent = Math.round(yearsBaking * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if (!calm && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if (e.target.hasAttribute('data-roll-host')) rollUp();
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  const stagger = (sel, step = 80, cls = 'rise') => {
    $$(sel).forEach((el, i) => {
      if (cls) el.classList.add(cls);
      el.style.setProperty('--d', `${Math.min(i, 7) * step}ms`);
      io.observe(el);
    });
  };
  stagger('.how .section-title, .how-note');
  stagger('.apply-form > *', 70);
  stagger('.phone');
  $('.facts > p').setAttribute('data-roll-host', '');
  stagger('.facts > p', 90);
  stagger('.about-text .section-title, .text-link');
  stagger('.contact .section-title');
  stagger('.crow', 70, '');
  stagger('.invite, .closing .btn, .closing-links li', 70);
  io.observe($('.giant'));
  roll.textContent = '0';
} else {
  roll.textContent = yearsBaking;
}

/* ---------- Pointer niceties (mouse only) ---------- */
if (fine && !calm) {
  const pan = $('.hero-pan');
  hero.addEventListener('pointermove', (e) => {
    pan.style.transform = `translate(${(e.clientX / innerWidth - 0.5) * -18}px, ${(e.clientY / innerHeight - 0.5) * -12}px)`;
  });
  hero.addEventListener('pointerleave', () => { pan.style.transform = ''; });
  $$('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 10}px, ${((e.clientY - r.top) / r.height - 0.5) * 8}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------- The live thing: an application message that writes itself ---------- */
const form = $('.apply-form');
const bubble = $('#mesaj');
const announce = $('#mesaj-anunt');
const send = $('#trimite');
const copyBtn = $('#copiaza');
const nameInput = form.querySelector('input[name="nume"]');
const build = () => {
  const sat = (form.querySelector('input[name="sat"]:checked') || {}).value || 'Răcăciuni';
  const exp = (form.querySelector('input[name="exp"]:checked') || {}).value || 'da';
  const nume = nameInput.value.trim().replace(/\s+/g, ' ');
  const cine = nume ? `Sunt ${nume} din ${sat}` : `Sunt din ${sat}`;
  const lucru = exp === 'da'
    ? 'Am mai lucrat într-o brutărie.'
    : 'N-am mai lucrat într-o brutărie, dar vreau să învăț.';
  return `Bună ziua! ${cine} și am văzut pe site că angajați. ${lucru} Mă puteți suna la acest număr?`;
};
let typing = null;
let said = null;
const render = (animate) => {
  const text = build();
  send.href = `sms:+40764154996?&body=${encodeURIComponent(text)}`;
  clearInterval(typing);
  clearTimeout(said);
  said = setTimeout(() => { announce.textContent = `Mesajul tău: ${text}`; }, 800);
  if (!animate || calm) { bubble.textContent = text; return; }
  bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  let i = Math.max(0, text.indexOf('Sunt'));
  bubble.textContent = text.slice(0, i);
  typing = setInterval(() => {
    i += 3;
    bubble.textContent = text.slice(0, i);
    if (i >= text.length) { bubble.textContent = text; clearInterval(typing); }
  }, 16);
};
form.addEventListener('change', (e) => { if (e.target !== nameInput) render(true); });
nameInput.addEventListener('input', () => render(false));
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameInput.blur(); } });
bubble.textContent = build();
send.href = `sms:+40764154996?&body=${encodeURIComponent(build())}`;
copyBtn.addEventListener('click', async () => {
  const text = build();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    // older phones: copy through a temporary field
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.append(t); t.select();
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    t.remove();
  }
  copyBtn.textContent = ok ? 'Copiat!' : 'Nu s-a putut copia';
  setTimeout(() => { copyBtn.textContent = 'Copiază textul'; }, 1800);
});
})();
