/* ============================================================
   scroll-animations.js — GSAP ScrollTrigger orchestrator
   ────────────────────────────────────────────────────────────
   • Reveals sections with fade/slide/glitch on scroll-in.
   • Photo card: triggers .decrypted on viewport entry → CSS
     fades the .photo-glitch overlay away to reveal stable image.
   • Generic helpers: .gs-fade-up / .gs-fade-left / .gs-fade-right
     / .gs-zoom-in classes are auto-animated on enter.
   • Parallax on hero HUD corner labels.
   • Stat counters animate when in view.
   • All effects skip if user prefers reduced motion.
   ============================================================ */
(function () {
  'use strict';
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── REVEAL SECTIONS (.reveal-section) ──────────────────────
  document.querySelectorAll('.reveal-section').forEach(sec => {
    if (reduced) {
      sec.classList.add('revealed');
      return;
    }
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 82%',
      onEnter: () => sec.classList.add('revealed'),
      once: true
    });
  });

  // ── GENERIC ENTRANCE HELPERS ──────────────────────────────
  function batchEnter(selector, vars, fromVars) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (reduced) {
      gsap.set(els, vars);
      return;
    }
    ScrollTrigger.batch(els, {
      start: 'top 88%',
      onEnter: batch => {
        gsap.fromTo(batch, fromVars,
          Object.assign({ duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: 'auto' }, vars));
      },
      once: true
    });
  }
  batchEnter('.gs-fade-up',    { opacity: 1, y: 0 },    { opacity: 0, y: 30  });
  batchEnter('.gs-fade-left',  { opacity: 1, x: 0 },    { opacity: 0, x: -40 });
  batchEnter('.gs-fade-right', { opacity: 1, x: 0 },    { opacity: 0, x: 40  });
  batchEnter('.gs-zoom-in',    { opacity: 1, scale: 1 },{ opacity: 0, scale: 0.85 });

  // ── PHOTO DECRYPT — fires when journey photo enters view ──
  const photoFrame = document.getElementById('photoFrame');
  if (photoFrame) {
    if (reduced) {
      photoFrame.classList.add('decrypted');
    } else {
      ScrollTrigger.create({
        trigger: photoFrame,
        start: 'top 75%',
        onEnter: () => {
          // 1.4s glitch-out, then mark decrypted (CSS fades overlay)
          setTimeout(() => photoFrame.classList.add('decrypted'), 1400);
        },
        once: true
      });
    }
  }

  // ── PARALLAX ON HERO HUD CORNERS ──────────────────────────
  if (!reduced) {
    document.querySelectorAll('.hero-hud').forEach((el, i) => {
      gsap.to(el, {
        y: (i % 2 === 0) ? -60 : 60,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end:   'bottom top',
          scrub: 0.6
        }
      });
    });
  }

  // ── SECTION HEADER GLITCH-IN (.sec-title) ─────────────────
  if (!reduced) {
    document.querySelectorAll('.sec-title').forEach(t => {
      gsap.from(t, {
        opacity: 0,
        x: -20,
        skewX: -8,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: t, start: 'top 85%', once: true }
      });
    });
    document.querySelectorAll('.sec-num').forEach(n => {
      gsap.from(n, {
        opacity: 0,
        x: -30,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: { trigger: n, start: 'top 88%', once: true }
      });
    });
  }

  // ── SKILL CARD STAGGER (per-tab — observed when tabs change) ─
  // Cards are rendered dynamically, so we delegate via MutationObserver
  const skillsPanel = document.getElementById('skillsPanel');
  if (skillsPanel && !reduced) {
    const mo = new MutationObserver(() => {
      const cards = skillsPanel.querySelectorAll('.skill-card');
      if (!cards.length) return;
      gsap.fromTo(cards,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.4, ease: 'power2.out',
          onComplete: () => cards.forEach(c => c.classList.add('show')) });
    });
    mo.observe(skillsPanel, { childList: true });
  }

  // ── PROJECT CARD STAGGER ──────────────────────────────────
  const projectsGrid = document.getElementById('projectsGrid');
  if (projectsGrid && !reduced) {
    const checkProjects = () => {
      const cards = projectsGrid.querySelectorAll('.project-card');
      if (!cards.length) return false;
      ScrollTrigger.batch(cards, {
        start: 'top 88%',
        onEnter: batch => {
          gsap.fromTo(batch,
            { opacity: 0, y: 30, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, overwrite: 'auto' });
        },
        once: true
      });
      return true;
    };
    if (!checkProjects()) {
      const pmo = new MutationObserver(() => { if (checkProjects()) pmo.disconnect(); });
      pmo.observe(projectsGrid, { childList: true });
    }
  }

  // ── TIMELINE ITEM STAGGER ─────────────────────────────────
  const tlList = document.getElementById('timelineList');
  if (tlList && !reduced) {
    const tcheck = () => {
      const items = tlList.querySelectorAll('.tl-item');
      if (!items.length) return false;
      ScrollTrigger.batch(items, {
        start: 'top 88%',
        onEnter: batch => {
          gsap.fromTo(batch,
            { opacity: 0, x: -22 },
            { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out', stagger: 0.12, overwrite: 'auto' });
        },
        once: true
      });
      return true;
    };
    if (!tcheck()) {
      const tmo = new MutationObserver(() => { if (tcheck()) tmo.disconnect(); });
      tmo.observe(tlList, { childList: true });
    }
  }

  // ── STAT COUNTERS (.stat-n[data-count]) ───────────────────
  document.querySelectorAll('.stat-n[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduced) {
      el.textContent = target;
      return;
    }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.floor(obj.v); }
        });
      },
      once: true
    });
  });

  // ── REFRESH ON LOAD COMPLETE (in case dynamic content shifts layout) ──
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
