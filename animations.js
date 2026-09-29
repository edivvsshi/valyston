'use strict';
document.getElementById('year').textContent = new Date().getFullYear();
// Content remains visible even when scripting or motion is disabled.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.about-content, .section-number, .contact-inner > div').forEach((element) => observer.observe(element));
}
