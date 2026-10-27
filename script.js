document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('form[data-endpoint]').forEach((form) => {
  const status = form.querySelector('.form-status');
  const btn = form.querySelector('button[type="submit"]');
  const btnLabel = btn.textContent;
  const skip = ['access_key', 'subject', 'from_name', 'botcheck'];

  const mailtoHref = () => {
    const lines = [];
    new FormData(form).forEach((v, k) => {
      if (skip.includes(k) || !String(v).trim()) return;
      lines.push(k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) + ': ' + v);
    });
    return 'mailto:' + form.dataset.mailto + '?subject=' +
      encodeURIComponent(form.querySelector('[name="subject"]').value) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  };

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
      if (!res.ok || data.success !== true) throw new Error('failed');
      form.reset();
      status.className = 'form-status ok';
      status.textContent = 'Thanks! Your message was sent. We will be in touch soon.';
    } catch (err) {
      status.className = 'form-status err';
      status.textContent = 'We could not send that just now. ';
      const a = document.createElement('a');
      a.href = mailtoHref();
      a.textContent = 'Send it by email instead';
      status.appendChild(a);
      status.appendChild(document.createTextNode(' (your answers are filled in) or write to ' + form.dataset.mailto + '.'));
    }
    status.hidden = false;
    btn.disabled = false;
    btn.textContent = btnLabel;
  });
});

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
document.querySelectorAll('.strip-inner, .cards.three, .flow, .info-cards').forEach((track) => {
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

  /* auto-rotate the stat strip every 3s (pauses while touched) */
  if (track.classList.contains('strip-inner') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let paused = false, timer;
    const step = () => items[1].offsetLeft - items[0].offsetLeft;
    const tick = () => {
      if (paused || track.scrollWidth <= track.clientWidth + 4) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step(), behavior: 'smooth' });
    };
    const start = () => { clearInterval(timer); timer = setInterval(tick, 3000); };
    const hold = () => { paused = true; };
    const release = () => { paused = false; start(); };
    track.addEventListener('touchstart', hold, { passive: true });
    track.addEventListener('touchend', () => setTimeout(release, 1500), { passive: true });
    track.addEventListener('pointerdown', hold);
    track.addEventListener('pointerup', () => setTimeout(release, 1500));
    start();
  }
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
  '.section-head, .cards, .flow, .logos li, .chips, .split-media, .team-media, .split-text, .contact-info, .form, .info-cards, .map-wrap'
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
const hero = document.getElementById('hero');
if (!reduce && hero) {
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


/* ---------- meet the team slider ---------- */
(function () {
  const root = document.querySelector('.team-media');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('.ts-slide'));
  const viewport = root.querySelector('.ts-viewport');
  const dotsWrap = root.querySelector('.ts-dots');
  let cur = 0, timer = null, paused = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dots = slides.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show ' + s.querySelector('strong').textContent);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  function go(n) {
    n = (n + slides.length) % slides.length;
    if (n === cur) return;
    const prev = slides[cur];
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    prev.setAttribute('aria-hidden', 'true');
    setTimeout(() => prev.classList.remove('is-leaving'), 720);
    slides[n].classList.add('is-active');
    slides[n].setAttribute('aria-hidden', 'false');
    cur = n;
    dots.forEach((d, i) => d.classList.toggle('on', i === n));
  }
  function restart() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => { if (!paused) go(cur + 1); }, 2500);
  }
  dots[0].classList.add('on');
  restart();

  root.addEventListener('mouseenter', () => { paused = true; });
  root.addEventListener('mouseleave', () => { paused = false; });

  let x0 = null;
  viewport.addEventListener('pointerdown', (e) => { x0 = e.clientX; paused = true; });
  const end = (e) => {
    if (x0 !== null) {
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); restart(); }
    }
    x0 = null; paused = false;
  };
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', () => { x0 = null; paused = false; });
  slides.forEach((s) => s.querySelectorAll('img').forEach((im) => im.addEventListener('dragstart', (e) => e.preventDefault())));
})();
