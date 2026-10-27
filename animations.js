'use strict';
document.documentElement.classList.add('js');
document.getElementById('year').textContent = new Date().getFullYear();

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Tear-off strips: each one tears away when tapped, and the call goes through. */
const strips = [...document.querySelectorAll('.strip')];
const note = document.querySelector('.strips-note');
strips.forEach((strip) => {
  strip.addEventListener('click', () => {
    if (calm) return;
    strip.classList.add('torn');
    const left = strips.filter((s) => !s.classList.contains('torn')).length;
    if (left === 0) {
      note.textContent = 'Le-ai rupt pe toate! Punem bilețele noi.';
      setTimeout(() => {
        strips.forEach((s) => s.classList.remove('torn'));
        note.textContent = 'Rupe un bilețel și ne suni direct.';
      }, 1600);
    } else {
      note.textContent = left === 1 ? 'A mai rămas un bilețel.' : `Au mai rămas ${left} bilețele.`;
    }
  });
});

/* Entrances: the parts of each section rise in, staggered, once. */
if (!calm && 'IntersectionObserver' in window) {
  const groups = [
    ['.how-intro h2', '.how-intro > p', '.how-photo', '.slip'],
    ['.letter-sheet', '.letter-stub'],
    ['.place-intro h2', '.place-intro p', '.row'],
    ['.coupon-left h2', '.coupon-left p', '.field', '.submit'],
    ['.postcard'],
  ];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  groups.forEach((sels) => {
    let i = 0;
    sels.forEach((sel) => document.querySelectorAll(sel).forEach((el) => {
      el.classList.add('rise');
      el.style.setProperty('--d', `${Math.min(i++, 6) * 75}ms`);
      io.observe(el);
    }));
  });
}

/* Index with preview: pointing at a row shows its picture in the frame. */
const frameImg = document.querySelector('.frame img');
if (frameImg) {
  let current = frameImg.getAttribute('src');
  const show = (row) => {
    const src = row.dataset.img;
    if (src === current) return;
    current = src;
    frameImg.classList.add('swap');
    setTimeout(() => {
      frameImg.src = src;
      frameImg.alt = '';
      frameImg.classList.remove('swap');
    }, calm ? 0 : 160);
  };
  document.querySelectorAll('.row').forEach((row) => {
    row.addEventListener('mouseenter', () => show(row));
    row.addEventListener('focus', () => show(row));
  });
}

/* On a phone, a call bar appears once the notice has scrolled away. */
const bar = document.querySelector('.callbar');
const hero = document.querySelector('.hero');
if (bar && hero && 'IntersectionObserver' in window) {
  bar.hidden = false;
  new IntersectionObserver(([e]) => {
    bar.classList.toggle('show', !e.isIntersecting);
  }).observe(hero);
}
