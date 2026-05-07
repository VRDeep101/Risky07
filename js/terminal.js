/* ============================================================
   terminal.js — Animation-only boot terminal (no input)
   ────────────────────────────────────────────────────────────
   Plays the auto-code-spawn boot sequence (Kali / Python / Java
   / Node / React appear inline as if the code spawned them),
   then drops into ambient mode that occasionally ticks out a
   status line so the terminal never feels "dead".
   No input field. No commands. Pure showpiece.
   ============================================================ */
(function () {
  'use strict';

  const output = document.getElementById('termOut');
  if (!output) return;

  // ── PRINT HELPERS (textContent only — XSS-safe) ───────────
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  function appendLine(text, cls) {
    const line = document.createElement('div');
    line.className = `t-line ${cls || ''}`.trim();
    line.textContent = text || '';
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
    return line;
  }

  // Char-by-char typing (faster than v1 — 6-14ms per char)
  function typeLine(text, cls) {
    return new Promise(resolve => {
      const line = document.createElement('div');
      line.className = `t-line ${cls || ''}`.trim();
      output.appendChild(line);
      let i = 0;
      const tick = () => {
        line.textContent = text.slice(0, i);
        output.scrollTop = output.scrollHeight;
        i++;
        if (i <= text.length) {
          setTimeout(tick, 6 + Math.random() * 8);
        } else {
          resolve(line);
        }
      };
      tick();
    });
  }

  function spawnLogo(name, src, color) {
    const wrap = document.createElement('div');
    wrap.className = 't-line';
    const chip = document.createElement('span');
    chip.className = 'term-logo';
    chip.style.color = color;
    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.loading = 'lazy';
    img.onerror = () => { img.style.display = 'none'; };
    const lbl = document.createElement('span');
    lbl.textContent = name.toUpperCase();
    chip.appendChild(img);
    chip.appendChild(lbl);
    wrap.appendChild(chip);
    output.appendChild(wrap);
    output.scrollTop = output.scrollHeight;
  }

  // ── BOOT SEQUENCE ─────────────────────────────────────────
  async function bootTerminal() {
    output.innerHTML = '';

    await typeLine('# initializing risky.os v3.0 — kernel handshake', 'green');
    await delay(60);

    await typeLine('$ apt install kali-tools-top10 -y',  'white');
    await typeLine('  >>> reading package lists ...',     'dim');
    await delay(80);
    spawnLogo('KALI LINUX', 'https://www.kali.org/images/kali-dragon-icon.svg', '#ff2244');
    await delay(70);

    await typeLine('$ python3 -c "import jarvis; jarvis.boot()"', 'white');
    await typeLine('  >>> Python 3.12 :: importing modules ...',   'dim');
    await delay(70);
    spawnLogo('PYTHON',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      '#ffe066');
    await delay(60);

    await typeLine('$ javac -d build src/Risky.java && java Risky', 'white');
    await typeLine('  >>> compiling 18 sources ...',                 'dim');
    await delay(70);
    spawnLogo('JAVA',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      '#f89820');
    await delay(60);

    await typeLine('$ npm run build && node dist/index.js', 'white');
    await delay(50);
    spawnLogo('NODE.JS',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      '#4caf50');
    await delay(50);
    spawnLogo('REACT',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      '#61dafb');
    await delay(80);

    await typeLine('# all modules online — JARVIS-LINK ESTABLISHED', 'green');
    await delay(120);
    await typeLine('$ tail -f /var/log/risky.log', 'cyan');
    await delay(40);

    // Drop into ambient mode
    startAmbient();
  }

  // ── AMBIENT MODE — periodic status lines (cosmetic only) ─
  function startAmbient() {
    const ambientLines = [
      { text: '[ok] heartbeat from jarvis-core',          cls: 'dim' },
      { text: '[ok] mcp-bridge connected',                cls: 'dim' },
      { text: '[ok] memory layer flushed',                cls: 'dim' },
      { text: '[scan] no anomalies detected',             cls: 'dim' },
      { text: '[ok] vector-db sync complete',             cls: 'dim' },
      { text: '[ok] agent-task-queue idle',               cls: 'dim' },
      { text: '[ok] gpu warm — 3.2 TFLOPS available',     cls: 'dim' },
      { text: '[ping] latency 12ms · all green',          cls: 'green' },
      { text: '[ok] firewall rules · 287 active',         cls: 'dim' },
      { text: '[ok] tools loaded — 14 available',         cls: 'dim' }
    ];

    function tick() {
      const item = ambientLines[Math.floor(Math.random() * ambientLines.length)];
      const ts = new Date().toTimeString().slice(0, 8);
      appendLine(`[${ts}] ${item.text}`, item.cls);

      // Trim if too many lines (keep memory steady)
      while (output.childElementCount > 80) {
        output.removeChild(output.firstChild);
      }
      // Random interval 2-5 seconds — feels alive but not spammy
      setTimeout(tick, 2000 + Math.random() * 3000);
    }
    setTimeout(tick, 1500);
  }

  // ── KICKOFF — wait for terminal to scroll into view ───────
  let booted = false;
  const sec = document.getElementById('terminal');
  if (sec && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !booted) {
          booted = true;
          bootTerminal();
          obs.disconnect();
        }
      });
    }, { threshold: 0.25 });
    obs.observe(sec);
  } else {
    // Fallback if IntersectionObserver unavailable
    setTimeout(bootTerminal, 1500);
  }
})();
