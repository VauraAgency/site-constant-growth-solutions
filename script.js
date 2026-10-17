document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

const form = document.getElementById('contact-form');
if (form) {
  const status = form.querySelector('.form-status');
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sending...';
    status.hidden = true;
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      const data = await res.json();
      if (!res.ok || String(data.success) !== 'true') throw new Error('failed');
      form.reset();
      status.className = 'form-status ok';
      status.textContent = 'Thanks! Your message was sent. We will be in touch soon.';
    } catch (err) {
      status.className = 'form-status err';
      status.textContent = 'Something went wrong. Please email info@constantgrowthsolutions.com directly.';
    }
    status.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Submit';
  });
}

/* ---------- services dropdown (tap to open) ---------- */
const dd = document.querySelector('.dropdown');
const ddBtn = dd.querySelector('.dropdown-btn');
const closeDropdown = () => {
  dd.classList.remove('open');
  ddBtn.setAttribute('aria-expanded', 'false');
};
ddBtn.addEventListener('click', () => {
  const open = dd.classList.toggle('open');
  ddBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (e) => {
  if (!dd.contains(e.target)) closeDropdown();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDropdown();
});

/* ---------- mobile swipe carousels (dots) ---------- */
document.querySelectorAll('.strip-inner, .cards.three, .flow').forEach((track) => {
  const items = Array.from(track.children);
  if (items.length < 2) return;

  const dots = document.createElement('div');
  dots.className = 'dots';
  dots.setAttribute('aria-hidden', 'true');
  items.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.tabIndex = -1;
    b.addEventListener('click', () => {
      track.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: 'smooth' });
    });
    dots.appendChild(b);
  });
  track.insertAdjacentElement('afterend', dots);

  const setActive = () => {
    const step = items[1].offsetLeft - items[0].offsetLeft;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const idx = atEnd ? items.length - 1 : Math.round(track.scrollLeft / step);
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i === idx));
  };
  track.addEventListener('scroll', () => requestAnimationFrame(setActive), { passive: true });
  window.addEventListener('resize', setActive);
  setActive();
});

nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    closeDropdown();
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

/* ---------- scroll reveal ---------- */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealTargets = document.querySelectorAll(
  '.section-head, .cards, .flow, .logos li, .chips, .split-media, .split-text, .contact-info, .form'
);
revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.setProperty('--d', ((i % 4) * 0.08) + 's');
});

if (reduce || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach((el) => io.observe(el));
}

/* ---------- parallax ---------- */
if (!reduce) {
  const hero = document.getElementById('hero');
  const layers = hero.querySelectorAll('[data-parallax]');
  const heroContent = hero.querySelector('[data-parallax-content]');
  const sectionBgs = document.querySelectorAll('[data-parallax-section]');
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const heroH = hero.offsetHeight;

    if (y < heroH + 100) {
      layers.forEach((l) => {
        l.style.transform = 'translate3d(0,' + (y * parseFloat(l.dataset.parallax)).toFixed(1) + 'px,0)';
      });
      const fade = Math.max(0, 1 - y / (heroH * 0.85));
      heroContent.style.transform = 'translate3d(0,' + (y * 0.14).toFixed(1) + 'px,0)';
      heroContent.style.opacity = fade.toFixed(3);
    }

    sectionBgs.forEach((bg) => {
      const r = bg.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const offset = (r.top + r.height / 2 - vh / 2) * -0.18;
      bg.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}
