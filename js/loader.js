/* ============================================================
   loader.js — Boot loader with multi-strategy GLB loading
   ────────────────────────────────────────────────────────────
   Strategy order (each tried if previous fails):
     1. fetch() with stream progress  → window.RISKY_GLB_BUFFER (ArrayBuffer)
     2. XMLHttpRequest with progress  → window.RISKY_GLB_BUFFER (ArrayBuffer)
     3. THREE.GLTFLoader.load()       → window.RISKY_GLB (parsed gltf)
   If ALL fail, an on-screen debug overlay shows the exact reason.
   ============================================================ */
(function () {
  'use strict';

  const MIN_VISIBLE_MS   = 3000;
  const HARD_TIMEOUT_MS  = 60000;
  const STALL_TIMEOUT_MS = 8000;
  const GLB_URL          = 'models/lambo.glb';

  const loader   = document.getElementById('bootLoader');
  const canvas   = document.getElementById('loaderCanvas');
  const bar      = document.getElementById('loaderBar');
  const pctEl    = document.getElementById('loaderPct');
  const statusEl = document.getElementById('loaderStatus');
  const lcRow1   = document.getElementById('lcRow1');
  const lcRow2   = document.getElementById('lcRow2');
  const lcRow3   = document.getElementById('lcRow3');

  if (!loader || !canvas) {
    console.warn('[loader] missing #bootLoader or #loaderCanvas — skipping');
    return;
  }

  document.body.classList.add('loading');

  // ════════════════════════════════════════════════════════════
  //  ANIMATED BACKGROUND
  // ════════════════════════════════════════════════════════════
  const ctx = canvas.getContext('2d');
  let cw = 0, ch = 0;
  function resizeCanvas() {
    cw = canvas.width  = window.innerWidth;
    ch = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  const HELIX_POINTS = 60;
  const helixParticles = [];
  for (let i = 0; i < HELIX_POINTS; i++) helixParticles.push({ phase: 0 });

  const RAIN_FONT_SIZE = 14;
  let rainCols = 0, rainDrops = [];
  function setupRain() {
    rainCols = Math.floor(cw / RAIN_FONT_SIZE);
    rainDrops = Array(rainCols).fill(0).map(() => Math.random() * ch / RAIN_FONT_SIZE);
  }
  setupRain();
  window.addEventListener('resize', setupRain, { passive: true });

  const RAIN_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ';
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

  const helixStartTime = performance.now();
  function drawHelix(time) {
    const cx = cw * 0.5, top = ch * 0.05, bottom = ch * 0.95, amp = 60, wavelength = 280;
    const elapsed = time - helixStartTime;
    let helixOp;
    if      (elapsed < 600)  helixOp = 0;
    else if (elapsed < 1500) helixOp = (elapsed - 600) / 900;
    else if (elapsed < 2300) helixOp = 1;
    else                     helixOp = 0.35 + 0.65 * Math.max(0, 1 - (elapsed - 2300) / 800);
    if (helixOp <= 0.02) return;
    helixParticles.forEach(p => p.phase = time * 0.0008);
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      const offset = strand === 0 ? 0 : Math.PI;
      for (let i = 0; i < HELIX_POINTS; i++) {
        const t = i / (HELIX_POINTS - 1);
        const y = top + (bottom - top) * t;
        const x = cx + Math.sin(t * wavelength * 0.018 + helixParticles[i].phase + offset) * amp;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strand === 0 ? `rgba(0,229,255,${0.5 * helixOp})` : `rgba(255,34,68,${0.45 * helixOp})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (let i = 0; i < HELIX_POINTS; i += 4) {
      const t = i / (HELIX_POINTS - 1);
      const y = top + (bottom - top) * t;
      const x1 = cx + Math.sin(t * wavelength * 0.018 + helixParticles[i].phase)           * amp;
      const x2 = cx + Math.sin(t * wavelength * 0.018 + helixParticles[i].phase + Math.PI) * amp;
      ctx.beginPath();
      ctx.moveTo(x1, y); ctx.lineTo(x2, y);
      const grad = ctx.createLinearGradient(x1, y, x2, y);
      grad.addColorStop(0, `rgba(0,229,255,${0.6 * helixOp})`);
      grad.addColorStop(0.5, `rgba(255,255,255,${0.5 * helixOp})`);
      grad.addColorStop(1, `rgba(255,34,68,${0.6 * helixOp})`);
      ctx.strokeStyle = grad; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = `rgba(0,229,255,${helixOp})`;
      ctx.beginPath(); ctx.arc(x1, y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,34,68,${helixOp})`;
      ctx.beginPath(); ctx.arc(x2, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  let rafId = null;
  function loop(time) {
    drawRain();
    drawHelix(time);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  // ════════════════════════════════════════════════════════════
  //  STATE
  // ════════════════════════════════════════════════════════════
  const startTime = performance.now();
  let glbReady = false;
  let glbProgress = 0;
  let glbBytesLoaded = 0;
  let glbBytesTotal = 0;
  let glbLastProgressTime = startTime;
  let displayedPct = 0;
  let downloadFailed = false;
  let strategyUsed = '';
  const errorLog = [];

  // Status ticker
  const statusMessages = [
    'INITIALIZING JARVIS CORE',
    'LOADING NEURAL MODULES',
    'CALIBRATING WEAPONS GRADE UI',
    'WARMING UP PARTICLE ENGINE',
    'DECRYPTING IDENTITY MATRIX',
    'SECURING NETWORK PERIMETER',
    'JARVIS-LINK ESTABLISHED'
  ];
  let statusIdx = 0;
  const statusInterval = setInterval(() => {
    if (!statusEl) return;
    if (downloadFailed) {
      statusEl.textContent = 'PROCEEDING WITHOUT 3D ASSETS';
      return;
    }
    if (!glbReady && glbProgress > 0.02) {
      const pct = Math.floor(glbProgress * 100);
      const mb = (glbBytesLoaded / 1048576).toFixed(1);
      statusEl.textContent = `DOWNLOADING ASSETS · ${pct}% (${mb}MB)`;
      return;
    }
    statusIdx = (statusIdx + 1) % statusMessages.length;
    statusEl.textContent = statusMessages[statusIdx];
  }, 380);

  const HEX = '0123456789ABCDEF';
  const codeRowsInterval = setInterval(() => {
    function rh(n) { let s=''; for(let i=0;i<n;i++) s+=HEX[Math.floor(Math.random()*16)]; return s; }
    if (lcRow1) lcRow1.textContent = `0x${rh(2)}: ${rh(2)} ${rh(2)} ${rh(2)} ${rh(2)} ${rh(2)}`;
    if (lcRow2) {
      const ports = [22, 80, 443, 1337, 4444, 8080];
      const p = ports[Math.floor(Math.random() * ports.length)];
      lcRow2.textContent = `SCAN: PORT ${p} ${Math.random() > 0.5 ? 'OPEN' : 'CLOSED'}`;
    }
    if (lcRow3) {
      const dna = ['A','T','G','C']; let s = 'DNA: ';
      for (let i = 0; i < 12; i++) {
        s += dna[Math.floor(Math.random() * 4)];
        if (i === 3 || i === 7) s += '-';
      }
      lcRow3.textContent = s;
    }
  }, 250);

  // ════════════════════════════════════════════════════════════
  //  STRATEGY 1 — fetch() with stream progress
  // ════════════════════════════════════════════════════════════
  async function tryFetchStrategy() {
    console.log('[loader] STRATEGY 1: fetch() with stream');
    try {
      const response = await fetch(GLB_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const cl = response.headers.get('content-length');
      glbBytesTotal = cl ? parseInt(cl, 10) : 0;

      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          glbBytesLoaded = received;
          glbLastProgressTime = performance.now();
          if (glbBytesTotal > 0) glbProgress = Math.min(0.99, received / glbBytesTotal);
          else glbProgress = Math.min(0.95, received / 10000000);
        }
        const combined = new Uint8Array(received);
        let offset = 0;
        for (const c of chunks) { combined.set(c, offset); offset += c.length; }
        return combined.buffer;
      } else {
        return await response.arrayBuffer();
      }
    } catch (err) {
      errorLog.push(`fetch(): ${err.message}`);
      console.error('[loader] STRATEGY 1 failed:', err.message);
      throw err;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  STRATEGY 2 — XMLHttpRequest with progress
  // ════════════════════════════════════════════════════════════
  function tryXHRStrategy() {
    console.log('[loader] STRATEGY 2: XMLHttpRequest');
    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', GLB_URL, true);
        xhr.responseType = 'arraybuffer';
        xhr.onprogress = (e) => {
          if (e.lengthComputable) {
            glbBytesTotal = e.total;
            glbBytesLoaded = e.loaded;
            glbProgress = Math.min(0.99, e.loaded / e.total);
            glbLastProgressTime = performance.now();
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            const msg = `HTTP ${xhr.status} ${xhr.statusText}`;
            errorLog.push(`XHR: ${msg}`);
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => {
          const msg = 'XHR network error';
          errorLog.push(`XHR: ${msg}`);
          reject(new Error(msg));
        };
        xhr.ontimeout = () => {
          const msg = 'XHR timeout';
          errorLog.push(`XHR: ${msg}`);
          reject(new Error(msg));
        };
        xhr.send();
      } catch (err) {
        errorLog.push(`XHR: ${err.message}`);
        console.error('[loader] STRATEGY 2 failed:', err.message);
        reject(err);
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  //  STRATEGY 3 — THREE.GLTFLoader.load() directly
  // ════════════════════════════════════════════════════════════
  function tryGLTFLoaderStrategy() {
    console.log('[loader] STRATEGY 3: THREE.GLTFLoader.load');
    return new Promise((resolve, reject) => {
      try {
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
          throw new Error('THREE or GLTFLoader undefined');
        }
        const ldr = new THREE.GLTFLoader();
        ldr.load(
          GLB_URL,
          (gltf) => resolve(gltf),
          (xhr) => {
            if (xhr && xhr.lengthComputable && xhr.total > 0) {
              glbBytesTotal = xhr.total;
              glbBytesLoaded = xhr.loaded;
              glbProgress = Math.min(0.99, xhr.loaded / xhr.total);
              glbLastProgressTime = performance.now();
            }
          },
          (err) => {
            const msg = (err && err.message) || String(err);
            errorLog.push(`GLTFLoader: ${msg}`);
            reject(new Error(msg));
          }
        );
      } catch (err) {
        errorLog.push(`GLTFLoader: ${err.message}`);
        reject(err);
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  //  ORCHESTRATION — try all strategies in order
  // ════════════════════════════════════════════════════════════
  async function loadGLB() {
    // Strategy 1: fetch()
    try {
      const buffer = await tryFetchStrategy();
      console.log(`[loader] ✅ STRATEGY 1 succeeded · ${(buffer.byteLength / 1048576).toFixed(2)}MB`);
      window.RISKY_GLB_BUFFER = buffer;
      strategyUsed = 'fetch';
      glbProgress = 1; glbReady = true;
      return;
    } catch (e1) { /* fall through */ }

    // Reset progress tracking for next attempt
    glbProgress = 0; glbBytesLoaded = 0;

    // Strategy 2: XHR
    try {
      const buffer = await tryXHRStrategy();
      console.log(`[loader] ✅ STRATEGY 2 succeeded · ${(buffer.byteLength / 1048576).toFixed(2)}MB`);
      window.RISKY_GLB_BUFFER = buffer;
      strategyUsed = 'xhr';
      glbProgress = 1; glbReady = true;
      return;
    } catch (e2) { /* fall through */ }

    // Reset for last try
    glbProgress = 0; glbBytesLoaded = 0;

    // Strategy 3: THREE.GLTFLoader (gives us parsed gltf, not buffer)
    try {
      const gltf = await tryGLTFLoaderStrategy();
      console.log(`[loader] ✅ STRATEGY 3 succeeded · pre-parsed gltf`);
      window.RISKY_GLB = gltf; // pre-parsed
      strategyUsed = 'gltfloader';
      glbProgress = 1; glbReady = true;
      return;
    } catch (e3) { /* all failed */ }

    // ALL strategies failed
    console.error('[loader] ❌ ALL STRATEGIES FAILED. Errors:');
    errorLog.forEach((e, i) => console.error(`   ${i + 1}. ${e}`));
    showDebugOverlay();
    downloadFailed = true;
    glbProgress = 1; glbReady = true;
    window.RISKY_GLB_BUFFER = null;
    window.RISKY_GLB = null;
  }

  // ════════════════════════════════════════════════════════════
  //  ON-SCREEN DEBUG OVERLAY (only shown if all 3 strategies fail)
  // ════════════════════════════════════════════════════════════
  function showDebugOverlay() {
    const o = document.createElement('div');
    o.style.cssText = [
      'position:fixed','top:50%','left:50%','transform:translate(-50%,-50%)',
      'z-index:100000','background:rgba(2,4,8,0.96)','border:2px solid #ff2244',
      'padding:24px 32px','font-family:Share Tech Mono,monospace','color:#fff',
      'max-width:580px','box-shadow:0 0 60px rgba(255,34,68,0.4)'
    ].join(';');
    const url = location.href.startsWith('file:')
      ? location.href + ' ⚠ FILE PROTOCOL — use a local server!'
      : location.href;
    o.innerHTML = `
      <h2 style="color:#ff2244;margin:0 0 16px;font-family:Orbitron,sans-serif;letter-spacing:3px">⚠ GLB LOAD FAILED</h2>
      <p style="color:#fff;font-size:13px;line-height:1.7;margin:8px 0">All 3 download strategies failed:</p>
      <pre style="background:#0a0a0a;padding:12px;color:#00e5ff;font-size:11px;white-space:pre-wrap;border-left:2px solid #00e5ff">${errorLog.map((e, i) => (i + 1) + '. ' + e).join('\n')}</pre>
      <p style="color:#ffbd2e;font-size:12px;margin:12px 0">Page URL: <code style="color:#fff">${url}</code></p>
      <p style="color:#fff;opacity:0.7;font-size:11px;line-height:1.7">
        Likely causes:<br>
        • Open via <code>file://</code> instead of <code>http://localhost</code><br>
        • <code>models/lambo.glb</code> file missing<br>
        • CSP / firewall blocking same-origin fetch<br>
        • Folder path mismatch (Live Server serving wrong dir)
      </p>
      <button onclick="this.parentNode.remove()" style="margin-top:12px;background:#ff2244;color:#fff;border:none;padding:8px 16px;cursor:pointer;font-family:inherit;letter-spacing:2px">CONTINUE WITH FALLBACK</button>
    `;
    document.body.appendChild(o);
  }

  loadGLB();

  // ════════════════════════════════════════════════════════════
  //  PROGRESS TICK
  // ════════════════════════════════════════════════════════════
  function pctTick() {
    const now = performance.now();
    const elapsed = now - startTime;

    const timePct = Math.min(1, elapsed / MIN_VISIBLE_MS);
    const realPct = Math.max(timePct * 0.6, glbProgress * 0.95);
    displayedPct += (realPct * 100 - displayedPct) * 0.12;
    const shown = Math.min(99, Math.floor(displayedPct));
    if (bar)   bar.style.width = `${shown}%`;
    if (pctEl) pctEl.textContent = `${shown}%`;

    const minHoldOk = elapsed >= MIN_VISIBLE_MS;
    const stalled   = (now - glbLastProgressTime) > STALL_TIMEOUT_MS && glbProgress < 0.99;
    const hardOut   = elapsed >= HARD_TIMEOUT_MS;

    if ((minHoldOk && glbReady) || hardOut || (stalled && minHoldOk)) {
      finish();
      return;
    }
    requestAnimationFrame(pctTick);
  }
  requestAnimationFrame(pctTick);

  // ════════════════════════════════════════════════════════════
  //  FINISH
  // ════════════════════════════════════════════════════════════
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    if (bar)   bar.style.width = '100%';
    if (pctEl) pctEl.textContent = '100%';
    if (statusEl) statusEl.textContent = downloadFailed
      ? 'PROCEEDING WITHOUT 3D ASSETS'
      : 'JARVIS-LINK ESTABLISHED';

    // If debug overlay is showing, don't auto-fade — let user click button
    const hasOverlay = document.querySelector('div[style*="GLB LOAD FAILED"]') !== null;
    if (hasOverlay) {
      console.warn('[loader] debug overlay active — not auto-fading');
      return;
    }

    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
        document.body.classList.remove('loading');
        cancelAnimationFrame(rafId);
        clearInterval(statusInterval);
        clearInterval(codeRowsInterval);
        window.RISKY_LOADER_DONE = true;
        const evt = new CustomEvent('risky:loaderDone', {
          detail: {
            buffer: window.RISKY_GLB_BUFFER || null,
            preParsed: window.RISKY_GLB || null,
            strategy: strategyUsed
          }
        });
        window.dispatchEvent(evt);
        console.log('[loader] DONE · strategy:', strategyUsed || 'NONE',
          '· buffer:', window.RISKY_GLB_BUFFER ? `${(window.RISKY_GLB_BUFFER.byteLength / 1048576).toFixed(2)}MB` : 'null',
          '· preParsed:', window.RISKY_GLB ? 'yes' : 'no');
      }, 900);
    }, 350);
  }
})();
