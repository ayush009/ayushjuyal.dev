/* =======================
   DOM helpers
======================= */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

/* =======================
   Cached refs
======================= */
const navLinks      = $$('header nav a');
const logoLink      = $('.logo');
const sections      = $$('section');
const menuIcon      = $('#menu-icon');
const navbar        = $('header nav');
const barsBox       = $('.bars-box');

const resumeBtns    = $$('.resume-box .resume-btn');
const resumeDetails = $$('.resume-detail');

const arrowRight    = $('.portfolio-box .navigation .arrow-right');
const arrowLeft     = $('.portfolio-box .navigation .arrow-left');
const imgSlide      = $('.portfolio-carousel .img-slide');
const detailCards   = $$('.portfolio-detail');

const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

/* =======================
   Small utilities
======================= */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function setHash(hash) { if (location.hash !== hash) history.pushState(null, '', hash); }

/* =======================
   Mobile menu
======================= */
if (menuIcon && navbar) {
  const toggleMenu = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
  };
  menuIcon.addEventListener('click', toggleMenu);
  menuIcon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
  });
}

/* =======================
   Section routing
======================= */
function showSection(idLike) {
  const target = (idLike || '').toString().replace('#', '') || 'home';
  let matched = false;

  sections.forEach(sec => {
    const on = sec.id === target;
    sec.classList.toggle('active', on);
    if (on) matched = true;
  });

  // nav active state + aria-current
  navLinks.forEach(a => {
    const href = a.getAttribute('href') || '';
    const hrefId = href.startsWith('#') ? href.slice(1) : '';
    const isActive = hrefId === target;
    a.classList.toggle('active', isActive);
    if (isActive) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  // reset mobile menu
  navbar?.classList.remove('active');
  menuIcon?.classList.remove('bx-x');

  // replay intro bars (optional)
  if (barsBox && !prefersReduced) {
    barsBox.classList.remove('active');
    void barsBox.offsetWidth;
    barsBox.classList.add('active');
  }

  if (!matched) document.getElementById('home')?.classList.add('active');
}

// nav clicks (only intercept hash links)
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.slice(1);
      setHash(`#${id}`);
      showSection(id);
    }
  });
});

// logo -> home
logoLink?.addEventListener('click', (e) => {
  e.preventDefault();
  setHash('#home');
  showSection('home');
});

// initial + history nav
window.addEventListener('hashchange', () => showSection(location.hash));
document.addEventListener('DOMContentLoaded', () => showSection(location.hash || 'home'));

/* =======================
   Resume tabs
======================= */
if (resumeBtns.length && resumeDetails.length) {
  resumeBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      resumeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      resumeDetails.forEach(d => d.classList.remove('active'));
      resumeDetails[i]?.classList.add('active');
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });
}

/* =======================
   Portfolio carousel
======================= */
let idx = 0;

function updateCarousel() {
  const max = detailCards.length - 1;
  idx = clamp(idx, 0, max);

  // activate correct description card
  detailCards.forEach((d, i) => d.classList.toggle('active', i === idx));

  // slide images
  if (imgSlide) {
    const pct = idx * 100;
    imgSlide.style.transform = `translateX(-${pct}%)`;
  }

  // arrow states
  arrowLeft?.classList.toggle('disabled', idx <= 0);
  arrowRight?.classList.toggle('disabled', idx >= max);
}

// init after images load to avoid misalignment jumps
function initCarouselOnceImagesReady() {
  if (!imgSlide) return updateCarousel();

  const imgs = Array.from(imgSlide.querySelectorAll('img'));
  if (!imgs.length) return updateCarousel();

  let loaded = 0;
  const done = () => { loaded++; if (loaded >= imgs.length) updateCarousel(); };

  imgs.forEach(img => {
    if (img.complete) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  });

  // safety: fall back after a tick even if no events fire
  setTimeout(updateCarousel, 400);
}

initCarouselOnceImagesReady();

arrowRight?.addEventListener('click', () => {
  if (idx < detailCards.length - 1) { idx++; updateCarousel(); }
});
arrowLeft?.addEventListener('click', () => {
  if (idx > 0) { idx--; updateCarousel(); }
});

// keyboard arrows (ignore when typing)
document.addEventListener('keydown', (e) => {
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === 'ArrowRight') arrowRight?.click();
  else if (e.key === 'ArrowLeft') arrowLeft?.click();
});

// touch swipe
if (imgSlide) {
  let startX = 0, diff = 0;
  const threshold = 40;

  imgSlide.addEventListener('touchstart', (e) => {
    startX = e.touches?.[0]?.clientX ?? 0;
    diff = 0;
  }, { passive: true });

  imgSlide.addEventListener('touchmove', (e) => {
    const x = e.touches?.[0]?.clientX ?? 0;
    diff = x - startX;
  }, { passive: true });

  imgSlide.addEventListener('touchend', () => {
    if (Math.abs(diff) > threshold) {
      if (diff < 0) arrowRight?.click();
      else arrowLeft?.click();
    }
  });
}

/* =======================
   Contact form (Formspree)
   - No backend server needed
   - Make sure your inputs in index.html have:
     name="name", name="email", name="subject", name="message"
======================= */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status    = document.getElementById('cf-status');
  const submitBtn = document.getElementById('cf-submit');

  // 🔁 Replace with YOUR Formspree endpoint:
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/your_form_id';

  let inFlight = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (inFlight) return;

    // Grab values from named inputs
    const getByName = (n) => form.querySelector(`[name="${n}"]`)?.value?.trim() || '';
    const name    = getByName('name').slice(0, 120);
    const email   = getByName('email').toLowerCase().slice(0, 254);
    const subject = getByName('subject').slice(0, 200);
    const message = getByName('message').slice(0, 5000);

    // Simple validation
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !email || !subject || !message) {
      if (status) { status.textContent = 'Please fill in all fields.'; status.className = 'error'; }
      return;
    }
    if (!EMAIL_RE.test(email)) {
      if (status) { status.textContent = 'Please enter a valid email address.'; status.className = 'error'; }
      return;
    }

    // Prepare payload for Formspree
    const payload = {
      name,
      email,
      subject,
      message,
      _subject: `Portfolio: ${subject}`,
    };

    try {
      inFlight = true;
      if (status) { status.textContent = 'Sending...'; status.className = ''; }
      if (submitBtn) submitBtn.disabled = true;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        if (status) { status.textContent = 'Thanks! Your message was sent.'; status.className = 'success'; }
        form.reset();
      } else {
        // try to read Formspree’s error response
        let msg = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.errors?.length) msg = data.errors.map(e => e.message).join('; ');
        } catch (_) {}
        throw new Error(msg);
      }
    } catch (err) {
      console.error(err);
      if (status) {
        status.textContent = (err?.name === 'AbortError')
          ? 'Network timeout — please try again.'
          : (err?.message || 'Sorry—something went wrong. Please try again or email me directly.');
        status.className = 'error';
      }
    } finally {
      inFlight = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();

/* =======================
   Reduced motion: limit transitions
======================= */
if (prefersReduced && imgSlide) {
  imgSlide.style.transition = 'none';
}
