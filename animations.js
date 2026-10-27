'use strict';
(() => {
const root = document.documentElement;
root.classList.add('js');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const yearsBaking = new Date().getFullYear() - 2006;
$('#year').textContent = new Date().getFullYear();

/* ---------- Load sequence: the name rises letter by letter ---------- */
$$('.monument .mask > span').forEach((s, i) => s.style.setProperty('--i', i));
$$('.giant span').forEach((s, i) => s.style.setProperty('--i', i));
const start = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('loaded')));
if (document.fonts && document.fonts.ready) {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(start);
} else start();

/* ---------- Hero photographs crossfade slowly ---------- */
const heroImgs = $$('.hero-img');
if (!calm && heroImgs.length > 1) {
  let k = 0;
  let timer = null;
  const next = () => {
    heroImgs[k].classList.remove('is-on');
    k = (k + 1) % heroImgs.length;
    heroImgs[k].classList.add('is-on');
  };
  const run = () => { if (!timer) timer = setInterval(next, 6000); };
  const stop = () => { clearInterval(timer); timer = null; };
  run();
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
}

/* ---------- Top bar: solid after the hero, hides on the way down ---------- */
const topBar = $('.top');
const hero = $('.hero');
let lastY = scrollY;

/* ---------- Marquee: drifts on its own, speeds up with the scroll ---------- */
const track = $('.marquee-track');
let mx = 0;
let boost = 0;
let dir = 1;

/* ---------- One scroll loop for everything that follows the page ---------- */
let ticking = false;
const onScroll = () => {
  const y = scrollY;
  const dy = y - lastY;
  const heroH = hero.offsetHeight;
  topBar.classList.toggle('solid', y > heroH - 80);
  topBar.classList.toggle('away', y > heroH && dy > 4);
  if (dy < -4 || y < heroH) topBar.classList.remove('away');
  if (Math.abs(dy) > 0) { boost = Math.min(boost + Math.abs(dy) * 0.08, 14); dir = dy >= 0 ? 1 : -1; }
  lastY = y;
  ticking = false;
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

if (track && !calm) {
  let half = track.scrollWidth / 2;
  addEventListener('resize', () => { half = track.scrollWidth / 2; });
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(track);
  const loop = () => {
    if (visible && !document.hidden) {
      mx -= (0.6 + boost) * dir;
      boost *= 0.92;
      if (mx <= -half) mx += half;
      if (mx > 0) mx -= half;
      track.style.transform = `translate3d(${mx}px,0,0)`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- Words that fill with ink as they rise (needs scroll timelines) ---------- */
if (!calm && CSS.supports && CSS.supports('animation-timeline: view()')) {
  $$('[data-fill], [data-words]').forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else { const s = document.createElement('span'); s.textContent = part; frag.append(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName === 'STRONG') {
          n.style.display = 'inline';
        }
      });
    };
    walk(el);
    el.classList.add('is-filling');
  });
}

/* ---------- Entrances, choreographed per section ---------- */
if (!calm && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if (e.target.matches('[data-roll-host]')) rollUp(e.target.querySelector('[data-roll]'));
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

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
  stagger('.gallery .section-title, .gallery-intro');
  stagger('.ph', 0, '');
  stagger('.contact .section-title');
  stagger('.crow', 70, '');
  stagger('.invite, .closing .btn, .closing-links li', 70);
  io.observe($('.giant'));
  $('[data-roll]').textContent = '0';
} else {
  $('[data-roll]').textContent = yearsBaking;
}

/* ---------- Rolling figure: years of baking count up once ---------- */
function rollUp(el) {
  if (!el) return;
  const end = yearsBaking;
  const t0 = performance.now();
  const dur = 1400;
  const step = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(end * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Gallery speeds ---------- */
$$('.ph').forEach((ph) => ph.style.setProperty('--sp', ph.dataset.speed || 0));

/* ---------- The hero photo leans toward the pointer ---------- */
const pan = $('.hero-pan');
if (fine && !calm && pan) {
  hero.addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    pan.style.transform = `translate(${x * -18}px, ${y * -12}px)`;
  });
  hero.addEventListener('pointerleave', () => { pan.style.transform = ''; });
}

/* ---------- Magnetic buttons ---------- */
if (fine && !calm) {
  $$('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      b.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------- The live thing: an application message that writes itself ---------- */
const form = $('.apply-form');
const bubble = $('#mesaj');
const send = $('#trimite');
const copyBtn = $('#copiaza');
const build = () => {
  const sat = (form.querySelector('input[name="sat"]:checked') || {}).value || 'Răcăciuni';
  const exp = (form.querySelector('input[name="exp"]:checked') || {}).value || 'da';
  const nume = (form.querySelector('input[name="nume"]').value || '').trim();
  const cine = nume ? `Sunt ${nume} din ${sat}` : `Sunt din ${sat}`;
  const lucru = exp === 'da'
    ? 'Am mai lucrat într-o brutărie.'
    : 'N-am mai lucrat într-o brutărie, dar vreau să învăț.';
  return `Bună ziua! ${cine} și am văzut pe site că angajați. ${lucru} Mă puteți suna la acest număr?`;
};
let typing = null;
const render = (animate) => {
  const text = build();
  send.href = `sms:+40764154996?&body=${encodeURIComponent(text)}`;
  clearInterval(typing);
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
form.addEventListener('change', () => render(true));
form.querySelector('input[name="nume"]').addEventListener('input', () => render(false));
render(false);
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(build());
    copyBtn.textContent = 'Copiat!';
  } catch (e) {
    copyBtn.textContent = 'Nu s-a putut copia';
  }
  setTimeout(() => { copyBtn.textContent = 'Copiază mesajul'; }, 1800);
});

/* ---------- Phone call bar once the hero is gone ---------- */
const bar = $('.callbar');
if (bar && 'IntersectionObserver' in window) {
  bar.hidden = false;
  new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting)).observe(hero);
}
})();
