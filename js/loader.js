/* ============================================================
   loader.js — Boot loader controller
   Plays Sharingan / DNA / cyber loading animation while we
   pre-load the lambo GLB. Minimum 3 seconds visible.
   When done, fades out and emits 'risky:loaderDone'.
   ============================================================ */
(function () {
  'use strict';

  const MIN_VISIBLE_MS = 3000;
  const MAX_VISIBLE_MS = 25000; // bumped — 21MB GLB on slow connections needs more time

  const loader   = document.getElementById('bootLoader');
  const canvas   = document.getElementById('loaderCanvas');
  const bar      = document.getElementById('loaderBar');
  const pctEl    = document.getElementById('loaderPct');
  const statusEl = document.getElementById('loaderStatus');
  const lcRow1   = document.getElementById('lcRow1');
  const lcRow2   = document.getElementById('lcRow2');
  const lcRow3   = document.getElementById('lcRow3');

  if (!loader || !canvas) return;

  document.body.classList.add('loading');

  // ── DNA / cyber background canvas ──────────────────────
  const ctx = canvas.getContext('2d');
  let cw = 0, ch = 0;
  function resizeCanvas() {
    cw = canvas.width  = window.innerWidth;
    ch = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  /* DNA double-helix particles + matrix code rain.
     Two streams cross over each other and connect with rungs. */
  const HELIX_POINTS = 60;
  const helixParticles = [];
  for (let i = 0; i < HELIX_POINTS; i++) {
    helixParticles.push({
      t: i / HELIX_POINTS,
      phase: 0
    });
  }

  // Matrix code rain (scoped to loader canvas only)
  const RAIN_FONT_SIZE = 14;
  let rainCols = 0, rainDrops = [];
  function setupRain() {
    rainCols = Math.floor(cw / RAIN_FONT_SIZE);
    rainDrops = Array(rainCols).fill(0).map(() => Math.random() * ch / RAIN_FONT_SIZE);
  }
  setupRain();
  window.addEventListener('resize', setupRain, { passive: true });

  const RAIN_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ⫯⫰⫱';

  let rainStep = 0;
  function drawRain() {
    rainStep++;
    ctx.fillStyle = 'rgba(2, 4, 8, 0.16)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.font = `${RAIN_FONT_SIZE}px 'Share Tech Mono', monospace`;
    for (let i = 0; i < rainCols; i++) {
      const ch_ = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
      const isAccent = (i + rainStep) % 11 === 0;
      ctx.fillStyle = isAccent ? 'rgba(255, 34, 68, 0.7)' : 'rgba(0, 229, 255, 0.5)';
      ctx.fillText(ch_, i * RAIN_FONT_SIZE, rainDrops[i] * RAIN_FONT_SIZE);
      if (rainDrops[i] * RAIN_FONT_SIZE > ch && Math.random() > 0.97) rainDrops[i] = 0;
      rainDrops[i] += 1;
    }
  }

  function drawHelix(time) {
    const cx = cw * 0.5;
    const top = ch * 0.05;
    const bottom = ch * 0.95;
    const amp = 60;
    const wavelength = 280;

    /* Sequenced visibility: 0–600ms invisible, 600–1500ms fade in,
       2300ms+ dim down to 35% so it doesn't fight with the text. */
    const elapsed = time - helixStartTime;
    let helixOp = 0;
    if      (elapsed < 600)  helixOp = 0;
    else if (elapsed < 1500) helixOp = (elapsed - 600) / 900;
    else if (elapsed < 2300) helixOp = 1;
    else                     helixOp = 0.35 + 0.65 * Math.max(0, 1 - (elapsed - 2300) / 800);
    if (helixOp <= 0.02) return;

    helixParticles.forEach(p => p.phase = time * 0.0008);

    /* Two strands */
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      const offset = strand === 0 ? 0 : Math.PI;
      for (let i = 0; i < HELIX_POINTS; i++) {
        const t = i / (HELIX_POINTS - 1);
        const y = top + (bottom - top) * t;
        const x = cx + Math.sin(t * wavelength * 0.018 + helixParticles[i].phase + offset) * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strand === 0
        ? `rgba(0, 229, 255, ${0.5 * helixOp})`
        : `rgba(255, 34, 68, ${0.45 * helixOp})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    /* Rungs (cross-bars between strands) — every 4th particle */
    for (let i = 0; i < HELIX_POINTS; i += 4) {
      const t = i / (HELIX_POINTS - 1);
      const y = top + (bottom - top) * t;
      const x1 = cx + Math.sin(t * wavelength * 0.018 + helixParticles[i].phase)            * amp;
      const x2 = cx + Math.sin(t * wavelength * 0.018 + helixParticles[i].phase + Math.PI)  * amp;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      const grad = ctx.createLinearGradient(x1, y, x2, y);
      grad.addColorStop(0,   `rgba(0, 229, 255, ${0.6 * helixOp})`);
      grad.addColorStop(0.5, `rgba(255, 255, 255, ${0.5 * helixOp})`);
      grad.addColorStop(1,   `rgba(255, 34, 68, ${0.6 * helixOp})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();

      /* Anchor dots */
      ctx.fillStyle = `rgba(0, 229, 255, ${helixOp})`;
      ctx.beginPath(); ctx.arc(x1, y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, 34, 68, ${helixOp})`;
      ctx.beginPath(); ctx.arc(x2, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  let rafId = null;
  const helixStartTime = performance.now();
  function loop(time) {
    drawRain();
    drawHelix(time);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  // ── ANIMATED STATUS LINES ──────────────────────────────
  const statusMessages = [
    'INITIALIZING JARVIS CORE',
    'LOADING NEURAL MODULES',
    'CALIBRATING WEAPONS GRADE UI',
    'COMPILING SHADER PIPELINES',
    'WARMING UP PARTICLE ENGINE',
    'DECRYPTING IDENTITY MATRIX',
    'SECURING NETWORK PERIMETER',
    'JARVIS-LINK ESTABLISHED'
  ];
  let statusIdx = 0;
  const statusInterval = setInterval(() => {
    if (!statusEl) return;
    /* If GLB is still loading and we're past the min hold,
       prefer telling the user what's actually happening. */
    if (!glbReady && glbProgress > 0 && performance.now() - startTime > MIN_VISIBLE_MS) {
      const pct = Math.floor(glbProgress * 100);
      statusEl.textContent = `DOWNLOADING ASSETS · ${pct}%`;
      return;
    }
    statusIdx = (statusIdx + 1) % statusMessages.length;
    statusEl.textContent = statusMessages[statusIdx];
  }, 380);

  // ── HEX CODE ROWS ──────────────────────────────────────
  const HEX_CHARS = '0123456789ABCDEF';
  function randHex(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
    return s;
  }
  const codeRowsInterval = setInterval(() => {
    if (lcRow1) lcRow1.textContent = `0x${randHex(2)}: ${randHex(2)} ${randHex(2)} ${randHex(2)} ${randHex(2)} ${randHex(2)}`;
    if (lcRow2) {
      const ports = [22, 80, 443, 1337, 4444, 8080];
      const p = ports[Math.floor(Math.random() * ports.length)];
      lcRow2.textContent = `SCAN: PORT ${p} ${Math.random() > 0.5 ? 'OPEN' : 'CLOSED'}`;
    }
    if (lcRow3) {
      const dna = ['A','T','G','C'];
      let s = 'DNA: ';
      for (let i = 0; i < 12; i++) {
        s += dna[Math.floor(Math.random() * 4)];
        if (i === 3 || i === 7) s += '-';
      }
      lcRow3.textContent = s;
    }
  }, 250);

  // ── PROGRESS LOGIC ─────────────────────────────────────
  const startTime = performance.now();
  let glbReady = false;
  let glbProgress = 0; // 0–1 from XHR loader
  let displayedPct = 0;

  /**
   * Pre-load the GLB ourselves so we know exactly when it's ready.
   * three-scene.js will read window.RISKY_GLB if set, skipping its own load.
   */
  function preloadGLB() {
    return new Promise((resolve) => {
      try {
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
          // Three.js not yet defined — fall back to time-only progress
          glbReady = true; glbProgress = 1;
          resolve(null);
          return;
        }
        // GLB has no DRACO compression — skip DRACOLoader entirely
        // (avoids a separate WASM fetch that can fail under strict CSP)
        const loaderG = new THREE.GLTFLoader();
        loaderG.load(
          'models/lambo.glb',
          (gltf) => {
            window.RISKY_GLB = gltf;
            glbReady = true;
            glbProgress = 1;
            resolve(gltf);
          },
          (xhr) => {
            if (xhr && xhr.lengthComputable && xhr.total > 0) {
              glbProgress = Math.min(1, xhr.loaded / xhr.total);
            }
          },
          (err) => {
            console.warn('[loader] GLB preload failed, fallback engaged', err);
            glbReady = true; glbProgress = 1;
            resolve(null);
          }
        );
      } catch (e) {
        console.warn('[loader] preload exception', e);
        glbReady = true; glbProgress = 1;
        resolve(null);
      }
    });
  }
  preloadGLB();

  function pctTick() {
    const elapsed = performance.now() - startTime;
    /* Real progress = blend of (time / MIN_VISIBLE_MS) and GLB progress. */
    const timePct = Math.min(1, elapsed / MIN_VISIBLE_MS);
    const realPct = Math.max(timePct * 0.7, glbProgress * 0.95);
    /* Smooth toward target */
    displayedPct += (realPct * 100 - displayedPct) * 0.12;
    const shown = Math.min(99, Math.floor(displayedPct));
    if (bar)   bar.style.width = `${shown}%`;
    if (pctEl) pctEl.textContent = `${shown}%`;

    /* Done condition */
    const done = elapsed >= MIN_VISIBLE_MS && glbReady;
    const forceDone = elapsed >= MAX_VISIBLE_MS;
    if (done || forceDone) {
      finish();
      return;
    }
    requestAnimationFrame(pctTick);
  }
  requestAnimationFrame(pctTick);

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    if (bar)   bar.style.width = '100%';
    if (pctEl) pctEl.textContent = '100%';
    if (statusEl) statusEl.textContent = 'JARVIS-LINK ESTABLISHED';

    /* Brief hold so the 100% reads, then fade. */
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
        document.body.classList.remove('loading');
        cancelAnimationFrame(rafId);
        clearInterval(statusInterval);
        clearInterval(codeRowsInterval);
        /* Notify the rest of the app */
        window.RISKY_LOADER_DONE = true;
        const evt = new CustomEvent('risky:loaderDone', { detail: { glb: window.RISKY_GLB || null } });
        window.dispatchEvent(evt);
      }, 900);
    }, 350);
  }

})();
