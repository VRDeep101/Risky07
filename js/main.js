/* ============================================================
   main.js — Top-level orchestrator
   ────────────────────────────────────────────────────────────
   Boots all non-hero subsystems on DOMContentLoaded:
     • Custom cursor (dot + ring)
     • Code-rain background canvas
     • Floating particles canvas
     • Nav scroll state + active link highlighting
     • Clock HUD
     • Dynamic rendering: skills tabs, projects grid,
       timeline list, contact links
     • Stat counters (fallback if scroll-animations.js is absent)
   The hero scene + form + scroll animations + earth + terminal
   each boot themselves in their own files.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initCursor();
    initCodeRain();
    initParticles();
    initNavScroll();
    initRevealFallback();
    initClock();
    renderSkills();
    renderProjects();
    renderTimeline();
    renderContactLinks();
    initStatCountersFallback();
  }

  // ════════════════════════════════════════════════════════════
  //  CUSTOM CURSOR
  // ════════════════════════════════════════════════════════════
  function initCursor() {
    const dot  = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    // Hide on touch devices
    if (matchMedia('(pointer: coarse)').matches) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      document.body.style.cursor = 'auto';
      return;
    }

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });
    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // Hover state on interactive elements
    document.querySelectorAll('a, button, .skill-tab, .project-card, .cl-item, input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.style.width = '60px';
        ring.style.height = '60px';
        ring.style.borderColor = 'var(--red)';
      });
      el.addEventListener('mouseleave', () => {
        ring.style.width = '38px';
        ring.style.height = '38px';
        ring.style.borderColor = 'var(--cyan)';
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  //  CODE RAIN (background)
  // ════════════════════════════════════════════════════════════
  function initCodeRain() {
    const canvas = document.getElementById('codeRainCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let cw = 0, ch = 0;
    function resize() {
      cw = canvas.width  = window.innerWidth;
      ch = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const SIZE = 18;
    let cols = 0, drops = [];
    function setupCols() {
      cols = Math.floor(cw / SIZE);
      drops = Array(cols).fill(0).map(() => Math.random() * ch / SIZE);
    }
    setupCols();
    window.addEventListener('resize', setupCols, { passive: true });

    const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ⫯⫰⫱';

    window._codeRainSpeed = window._codeRainSpeed || 1;

    function draw() {
      ctx.fillStyle = 'rgba(2,4,8,0.10)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.font = `${SIZE}px 'Share Tech Mono', monospace`;
      const speed = window._codeRainSpeed || 1;
      for (let i = 0; i < cols; i++) {
        const ch_ = CHARS[Math.floor(Math.random() * CHARS.length)];
        const accent = (i * 7 + Math.floor(performance.now() / 200)) % 13 === 0;
        ctx.fillStyle = accent ? 'rgba(255,34,68,0.85)' : 'rgba(0,229,255,0.75)';
        ctx.fillText(ch_, i * SIZE, drops[i] * SIZE);
        if (drops[i] * SIZE > ch && Math.random() > 0.975) drops[i] = 0;
        drops[i] += speed;
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ════════════════════════════════════════════════════════════
  //  PARTICLES
  // ════════════════════════════════════════════════════════════
  function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let cw = 0, ch = 0;
    function resize() {
      cw = canvas.width  = window.innerWidth;
      ch = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COUNT = 35;
    const parts = [];
    for (let i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1 + Math.random() * 2
      });
    }
    function draw() {
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = 'rgba(0,229,255,0.6)';
      parts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > cw) p.vx *= -1;
        if (p.y < 0 || p.y > ch) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ════════════════════════════════════════════════════════════
  //  NAV SCROLL + ACTIVE LINK
  // ════════════════════════════════════════════════════════════
  function initNavScroll() {
    const nav = document.getElementById('navbar');
    const links = document.querySelectorAll('.nav-link');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');

      // Active link
      const sections = ['hero','about','skills','projects','timeline','contact','terminal'];
      let active = sections[0];
      sections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) {
          const r = sec.getBoundingClientRect();
          if (r.top <= 120 && r.bottom > 120) active = id;
        }
      });
      links.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + active);
      });
    }, { passive: true });
  }

  // ════════════════════════════════════════════════════════════
  //  REVEAL FALLBACK (if GSAP fails to load — IntersectionObserver)
  // ════════════════════════════════════════════════════════════
  function initRevealFallback() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal-section').forEach(s => obs.observe(s));
  }

  // ════════════════════════════════════════════════════════════
  //  CLOCK
  // ════════════════════════════════════════════════════════════
  function initClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    function tick() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      el.textContent = `[ ${hh}:${mm}:${ss} ]`;
    }
    tick();
    setInterval(tick, 1000);
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER SKILLS — tabs + dynamic panel
  // ════════════════════════════════════════════════════════════
  function renderSkills() {
    const tabs  = document.getElementById('skillsTabs');
    const panel = document.getElementById('skillsPanel');
    if (!tabs || !panel || !window.PORTFOLIO_DATA) return;

    const cats = PORTFOLIO_DATA.skillCategories || [];
    if (!cats.length) return;

    tabs.innerHTML = '';
    cats.forEach((cat, idx) => {
      const btn = document.createElement('button');
      btn.className = 'skill-tab' + (idx === 0 ? ' active' : '');
      btn.style.setProperty('--tab-color', cat.color);
      btn.dataset.idx = String(idx);

      if (cat.logo) {
        const img = document.createElement('img');
        img.src = cat.logo; img.alt = '';
        img.onerror = () => { img.style.display = 'none'; };
        btn.appendChild(img);
      }
      const lbl = document.createElement('span');
      lbl.textContent = cat.label;
      btn.appendChild(lbl);

      btn.addEventListener('click', () => {
        tabs.querySelectorAll('.skill-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        renderSkillPanel(cat);
      });
      tabs.appendChild(btn);
    });
    renderSkillPanel(cats[0]);
  }
  function renderSkillPanel(cat) {
    const panel = document.getElementById('skillsPanel');
    if (!panel) return;
    panel.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'skills-grid';
    (cat.skills || []).forEach((sk, i) => {
      const card = document.createElement('div');
      card.className = 'skill-card show';
      // stagger continuous-spin offset so they don't all rotate in lockstep
      card.style.setProperty('animation-delay', (-i * 0.7) + 's', 'important');
      if (sk.logo) {
        const img = document.createElement('img');
        img.className = 'skill-card-logo';
        img.src = sk.logo;
        img.alt = '';
        img.loading = 'lazy';
        img.style.animationDelay = (-i * 0.7) + 's';
        img.onerror = () => { img.style.display = 'none'; };
        card.appendChild(img);
      }
      const name = document.createElement('span');
      name.className = 'skill-card-name';
      name.textContent = sk.name;
      card.appendChild(name);
      grid.appendChild(card);
    });
    panel.appendChild(grid);
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER PROJECTS
  // ════════════════════════════════════════════════════════════
  function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid || !window.PORTFOLIO_DATA) return;
    const projects = PORTFOLIO_DATA.projects || [];
    grid.innerHTML = '';
    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.style.setProperty('--card-color', p.color || 'var(--cyan)');

      // Video / placeholder
      const vw = document.createElement('div');
      vw.className = 'proj-video-wrap';
      if (p.videoSrc) {
        const v = document.createElement('video');
        v.src = p.videoSrc;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = 'metadata';
        v.addEventListener('mouseenter', () => v.play().catch(() => {}));
        card.addEventListener('mouseenter', () => v.play().catch(() => {}));
        card.addEventListener('mouseleave', () => v.pause());
        vw.appendChild(v);
      } else {
        const ph = document.createElement('div');
        ph.className = 'proj-placeholder';
        ph.textContent = (p.title || '').slice(0, 1);
        vw.appendChild(ph);
      }
      card.appendChild(vw);

      // Info
      const info = document.createElement('div');
      info.className = 'proj-info';
      const tag = document.createElement('span');
      tag.className = 'proj-tag';
      tag.textContent = p.tag || '';
      info.appendChild(tag);

      const title = document.createElement('h3');
      title.className = 'proj-title';
      title.textContent = p.title || '';
      info.appendChild(title);

      const desc = document.createElement('p');
      desc.className = 'proj-desc';
      desc.textContent = p.description || '';
      info.appendChild(desc);

      const links = document.createElement('div');
      links.className = 'proj-links';
      if (p.github && isSafeUrl(p.github)) {
        const a = document.createElement('a');
        a.href = p.github;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'proj-link';
        a.textContent = 'CODE →';
        links.appendChild(a);
      }
      if (p.live && isSafeUrl(p.live)) {
        const a = document.createElement('a');
        a.href = p.live;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'proj-link';
        a.textContent = 'LIVE →';
        links.appendChild(a);
      }
      info.appendChild(links);
      card.appendChild(info);

      const glow = document.createElement('div');
      glow.className = 'proj-glow';
      glow.style.background = p.color || 'var(--cyan)';
      card.appendChild(glow);

      grid.appendChild(card);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER TIMELINE
  // ════════════════════════════════════════════════════════════
  function renderTimeline() {
    const list = document.getElementById('timelineList');
    if (!list || !window.PORTFOLIO_DATA) return;
    const items = PORTFOLIO_DATA.timeline || [];
    list.innerHTML = '';
    items.forEach(it => {
      const wrap = document.createElement('div');
      wrap.className = 'tl-item';
      const head = document.createElement('div');
      const yr = document.createElement('span');
      yr.className = 'tl-year';
      yr.textContent = it.year;
      head.appendChild(yr);
      if (it.tag) {
        const tg = document.createElement('span');
        tg.className = 'tl-tag';
        tg.textContent = it.tag;
        head.appendChild(tg);
      }
      wrap.appendChild(head);
      const t = document.createElement('div');
      t.className = 'tl-title';
      t.textContent = it.title;
      wrap.appendChild(t);
      const d = document.createElement('div');
      d.className = 'tl-desc';
      d.textContent = it.desc;
      wrap.appendChild(d);
      list.appendChild(wrap);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER CONTACT LINKS
  // ════════════════════════════════════════════════════════════
  function renderContactLinks() {
    const wrap = document.getElementById('contactLinks');
    if (!wrap || !window.PORTFOLIO_DATA) return;
    const L = PORTFOLIO_DATA.links || {};
    wrap.innerHTML = '';

    const entries = [
      { label: 'EMAIL',    val: 'sirfrisky07@gmail.com',    href: L.email    },
      { label: 'WHATSAPP', val: '+91 72495 63744',           href: L.whatsapp },
      { label: 'GITHUB',   val: 'github.com/VRDeep101',      href: L.github   },
      { label: 'LINKEDIN', val: 'linkedin.com/in/risky07',   href: L.linkedin }
    ];
    entries.forEach(en => {
      if (!en.href) return;
      const a = document.createElement('a');
      a.className = 'cl-item';
      a.href = en.href;
      if (en.href.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      const left = document.createElement('div');
      left.className = 'cl-left';
      const lbl = document.createElement('span');
      lbl.className = 'cl-label';
      lbl.textContent = en.label;
      left.appendChild(lbl);
      const val = document.createElement('span');
      val.className = 'cl-val';
      val.textContent = en.val;
      left.appendChild(val);
      a.appendChild(left);
      const arr = document.createElement('span');
      arr.className = 'cl-arr';
      arr.textContent = '↗';
      a.appendChild(arr);
      wrap.appendChild(a);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  STAT COUNTERS FALLBACK (only if scroll-animations.js absent)
  // ════════════════════════════════════════════════════════════
  function initStatCountersFallback() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') return;
    const els = document.querySelectorAll('.stat-n[data-count]');
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        let v = 0;
        const step = Math.max(1, Math.ceil(target / 60));
        const t = setInterval(() => {
          v += step;
          if (v >= target) { v = target; clearInterval(t); }
          el.textContent = v;
        }, 22);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(el => obs.observe(el));
  }

  // ════════════════════════════════════════════════════════════
  //  Helpers
  // ════════════════════════════════════════════════════════════
  function isSafeUrl(url) {
    if (typeof RSec !== 'undefined' && typeof RSec.isSafeURL === 'function') {
      return RSec.isSafeURL(url);
    }
    try {
      const u = new URL(url, window.location.origin);
      return /^https?:|^mailto:|^tel:/.test(u.protocol);
    } catch (_) { return false; }
  }
})();
