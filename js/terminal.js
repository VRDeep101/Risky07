/* ============================================================
   terminal.js — Hacker terminal + auto-code-spawn boot
   ────────────────────────────────────────────────────────────
   Preserves all original commands (help / whoami / skills /
   projects / contact / social / hack / jarvis / matrix / nmap /
   hire / clear) AND adds a fancy boot sequence that types code
   line-by-line and "spawns" tech logos (Kali / Python / Java /
   Node / React) inline as if the code created them.
   Element IDs match v3.0 markup:  #termOut  #termIn
   ============================================================ */
(function () {
  'use strict';

  const output = document.getElementById('termOut');
  const input  = document.getElementById('termIn');
  if (!output || !input) return;

  // ── COMMAND DEFINITIONS (preserved + sanitized echo) ──────
  const COMMANDS = {
    help: {
      desc: 'List all commands',
      fn: () => [
        { text: '╔══════════════════════════════════════╗', cls: 'cyan' },
        { text: '║       RISKY OS — HELP MENU           ║', cls: 'cyan' },
        { text: '╚══════════════════════════════════════╝', cls: 'cyan' },
        { text: '' },
        { text: '  whoami         — who is RISKY?',                cls: 'white' },
        { text: '  skills         — list all skill modules',       cls: 'white' },
        { text: '  projects       — list projects',                cls: 'white' },
        { text: '  contact        — get contact info',             cls: 'white' },
        { text: '  social         — links & handles',              cls: 'white' },
        { text: '  hack           — [CLASSIFIED]',                 cls: 'red'   },
        { text: '  jarvis         — JARVIS status report',         cls: 'white' },
        { text: '  matrix         — enter the matrix',             cls: 'green' },
        { text: '  nmap           — scan the network',             cls: 'white' },
        { text: '  earth          — locate operator',              cls: 'cyan'  },
        { text: '  clear          — clear terminal',               cls: 'white' },
        { text: '  hire           — why hire RISKY?',              cls: 'amber' },
        { text: '' },
        { text: '  Type any command to execute.', cls: 'dim' }
      ]
    },

    whoami: {
      desc: 'Who is RISKY?',
      fn: () => [
        { text: '> IDENTITY QUERY...', cls: 'cyan' },
        { text: '' },
        { text: '  NAME     :  RISKY (VRDeep101)',                       cls: 'white' },
        { text: '  BASE     :  INDIA (Nashik, Maharashtra)',             cls: 'white' },
        { text: '  CLASS    :  MULTI-CLASS OPERATOR',                    cls: 'white' },
        { text: '  THREAT   :  ██████████ MAXIMUM',                      cls: 'red'   },
        { text: '  STATUS   :  AVAILABLE FOR HIRE',                      cls: 'green' },
        { text: '  MISSION  :  BUILD THE REAL JARVIS',                   cls: 'amber' },
        { text: '  HOBBIES  :  BREAKING THINGS. BUILDING THEM BACK.',    cls: 'white' },
        { text: '' },
        { text: '  "I don\'t fit in one box. I never did."',             cls: 'cyan'  }
      ]
    },

    skills: {
      desc: 'List skill modules',
      fn: () => [
        { text: '> LOADING SKILL MODULES...', cls: 'cyan' },
        { text: '' },
        { text: '  [■■■■■■■■■■] WEB DEV        — JavaScript, React, Node.js, Three.js', cls: 'white'  },
        { text: '  [■■■■■■■■■□] AI & ML         — TensorFlow, OpenAI, Claude AI',         cls: 'purple' },
        { text: '  [■■■■■■■■□□] FLUTTER         — Cross-platform mobile',                  cls: 'white'  },
        { text: '  [■■■■■■■■■□] DESIGN          — Figma, Blender, After Effects',          cls: 'amber'  },
        { text: '  [■■■■■■■■□□] ETHICAL HACKER  — Kali, Burp Suite, OWASP',                cls: 'red'    },
        { text: '  [■■■■■■■■□□] CYBERSECURITY   — Pen Testing, CTF, OSINT',                cls: 'red'    },
        { text: '  [■■■■■■■□□□] AGENT DEV       — LangChain, MCP, Claude API',             cls: 'cyan'   },
        { text: '  [■■■■■■■■■□] CONTENT CREATOR — Reels, YouTube, Editing',                cls: 'amber'  },
        { text: '  [■■■■■■■■■■] FREELANCER      — Delivery. No excuses.',                  cls: 'green'  },
        { text: '' },
        { text: '  ALL MODULES OPERATIONAL.', cls: 'green' }
      ]
    },

    projects: {
      desc: 'List projects',
      fn: () => [
        { text: '> FETCHING PROJECT DATABASE...', cls: 'cyan' },
        { text: '' },
        { text: '  [001] JARVIS AI', cls: 'white' },
        { text: '        → Personal AI assistant. Voice. Vision. Memory. Real-time.', cls: 'dim' },
        { text: '        → STATUS: IN DEVELOPMENT', cls: 'amber' },
        { text: '' },
        { text: '  [002] PORTFOLIO v3.0', cls: 'white' },
        { text: '        → This site. Three.js + GSAP + EmailJS. Hackproof.', cls: 'dim' },
        { text: '        → STATUS: DEPLOYED', cls: 'green' },
        { text: '' },
        { text: '  More incoming. Watch github.com/VRDeep101', cls: 'dim' }
      ]
    },

    contact: {
      desc: 'Contact info',
      fn: () => [
        { text: '> CONTACT CHANNELS:', cls: 'cyan' },
        { text: '' },
        { text: '  EMAIL    :  sirfrisky07@gmail.com', cls: 'white' },
        { text: '  WHATSAPP :  +91 72495 63744',       cls: 'green' },
        { text: '  GITHUB   :  github.com/VRDeep101',   cls: 'white' },
        { text: '  LINKEDIN :  linkedin.com/in/risky07', cls: 'white' },
        { text: '' },
        { text: '  Response time: < 24 hours.', cls: 'dim' }
      ]
    },

    social: {
      desc: 'Social links',
      fn: () => [
        { text: '> SOCIAL NETWORK SCAN:', cls: 'cyan' },
        { text: '' },
        { text: '  GitHub   →  github.com/VRDeep101',     cls: 'white' },
        { text: '  LinkedIn →  linkedin.com/in/risky07',  cls: 'white' },
        { text: '  Email    →  sirfrisky07@gmail.com',    cls: 'white' },
        { text: '  WhatsApp →  wa.me/917249563744',       cls: 'green' }
      ]
    },

    hack: {
      desc: 'Secret hack command',
      fn: () => {
        // Quick red overlay flash
        const el = document.createElement('div');
        el.style.cssText =
          'position:fixed;inset:0;background:rgba(255,51,85,0.05);pointer-events:none;z-index:9990;';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
        return [
          { text: '> INITIATING INTRUSION SEQUENCE...', cls: 'red' },
          { text: '' },
          { text: '  [■□□□□□□□□□] SCANNING PORTS...',           cls: 'red'   },
          { text: '  [■■■■□□□□□□] FINDING VULNERABILITIES...',  cls: 'red'   },
          { text: '  [■■■■■■■□□□] BYPASSING FIREWALL...',       cls: 'red'   },
          { text: '  [■■■■■■■■■■] ACCESS GRANTED.',             cls: 'green' },
          { text: '' },
          { text: '  Just kidding. But I could.',               cls: 'cyan'  },
          { text: '  TryHackMe & HackTheBox stats on request.', cls: 'dim'   }
        ];
      }
    },

    jarvis: {
      desc: 'JARVIS status',
      fn: () => [
        { text: '> JARVIS SYSTEM STATUS', cls: 'cyan' },
        { text: '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'dim' },
        { text: '  CORE ENGINE     :  ████████░░ 80%',  cls: 'white' },
        { text: '  VOICE MODULE    :  ██████░░░░ 60%',  cls: 'white' },
        { text: '  VISION MODULE   :  ████░░░░░░ 40%',  cls: 'white' },
        { text: '  MEMORY LAYER    :  ██████████ 100%', cls: 'green' },
        { text: '  AGENT SYSTEM    :  ██████░░░░ 65%',  cls: 'white' },
        { text: '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'dim' },
        { text: '  OVERALL         :  IN PROGRESS',     cls: 'amber' },
        { text: '' },
        { text: '  ETA: CLASSIFIED.', cls: 'red' }
      ]
    },

    matrix: {
      desc: 'Matrix mode',
      fn: () => {
        if (window._codeRainSpeed !== undefined) {
          window._codeRainSpeed = 8;
          setTimeout(() => { window._codeRainSpeed = 1; }, 5000);
        }
        return [
          { text: 'Wake up, Neo...',     cls: 'green' },
          { text: 'The Matrix has you.', cls: 'green' },
          { text: '' },
          { text: '// MATRIX MODE ACTIVE — 5 seconds', cls: 'dim' }
        ];
      }
    },

    nmap: {
      desc: 'Scan the network',
      fn: () => [
        { text: '> nmap -sV -O localhost', cls: 'white' },
        { text: '' },
        { text: '  Starting Nmap 7.94 ...',                          cls: 'dim'   },
        { text: '  Nmap scan report for RISKY-OS (127.0.0.1)',       cls: 'white' },
        { text: '' },
        { text: '  PORT     STATE  SERVICE    VERSION',              cls: 'white' },
        { text: '  80/tcp   open   http       RISKY Portfolio v3.0', cls: 'green' },
        { text: '  443/tcp  open   https      RISKY Portfolio v3.0 (SSL)', cls: 'green' },
        { text: '  1337/tcp open   leet       JARVIS Core Engine',   cls: 'amber' },
        { text: '  4444/tcp open   krb524     [CLASSIFIED]',         cls: 'red'   },
        { text: '' },
        { text: '  OS: RISKY-OS 1.0 (Linux kernel 6.x)', cls: 'dim' },
        { text: '  Nmap done: 1 IP address (1 host up)', cls: 'dim' }
      ]
    },

    earth: {
      desc: 'Locate operator',
      fn: () => [
        { text: '> RESOLVING OPERATOR LOCATION...', cls: 'cyan' },
        { text: '' },
        { text: '  HOSTNAME :  risky.local',                cls: 'white' },
        { text: '  CITY     :  Nashik, Maharashtra, INDIA', cls: 'white' },
        { text: '  LAT/LON  :  19.99°N, 73.78°E',           cls: 'white' },
        { text: '  TIMEZONE :  IST (UTC+5:30)',             cls: 'white' },
        { text: '  ISP      :  ENCRYPTED',                  cls: 'red'   },
        { text: '  STATUS   :  ONLINE — see globe →',       cls: 'green' }
      ]
    },

    hire: {
      desc: 'Why hire RISKY?',
      fn: () => [
        { text: '> GENERATING PITCH DOCUMENT...', cls: 'cyan' },
        { text: '' },
        { text: '  WHY HIRE RISKY?',                              cls: 'amber' },
        { text: '  ─────────────────────────────────────',         cls: 'dim'   },
        { text: '  ✓ Multi-skilled — web, AI, design, security',  cls: 'green' },
        { text: '  ✓ Delivers on time. No ghosting.',             cls: 'green' },
        { text: '  ✓ Learns anything fast.',                      cls: 'green' },
        { text: '  ✓ Won\'t charge 10x for simple things.',       cls: 'green' },
        { text: '  ✓ Communicates clearly.',                      cls: 'green' },
        { text: '' },
        { text: '  CONTACT: sirfrisky07@gmail.com',     cls: 'cyan' },
        { text: '  or WhatsApp: +91 72495 63744',       cls: 'cyan' }
      ]
    },

    clear: {
      desc: 'Clear terminal',
      fn: () => { output.innerHTML = ''; return []; }
    }
  };

  // ── PRINT HELPERS (text-content only, never innerHTML) ────
  function printLine(text, cls, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.className = `t-line ${cls || ''}`.trim();
        line.textContent = text || '';   // safe — no HTML injection
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        resolve();
      }, delay || 0);
    });
  }
  async function printLines(lines) {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await printLine(l.text || '', l.cls || '', i * 35);
    }
  }

  // ── TYPE-OUT ANIMATION (chars, with optional logo embed) ──
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
          setTimeout(tick, 14 + Math.random() * 14);
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

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── BOOT SEQUENCE — auto-typing code that spawns logos ───
  async function bootTerminal() {
    output.innerHTML = '';

    await typeLine('# initializing risky.os v3.0 — kernel handshake', 'green');
    await delay(150);
    await typeLine('$ uname -a',                                     'white');
    await typeLine('  RISKY-OS 6.6.0 #JARVIS-CORE x86_64 GNU/Linux', 'dim');
    await delay(120);

    // Code line that "spawns" Kali Linux
    await typeLine('$ apt install kali-tools-top10 -y',  'white');
    await typeLine('  >>> reading package lists ...',     'dim');
    await delay(200);
    spawnLogo('KALI LINUX', 'https://www.kali.org/images/kali-dragon-icon.svg', '#ff2244');
    await delay(180);

    // Python
    await typeLine('$ python3 -c "import jarvis; jarvis.boot()"', 'white');
    await typeLine('  >>> Python 3.12 :: importing modules ...',   'dim');
    await delay(180);
    spawnLogo('PYTHON',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      '#ffe066');
    await delay(160);

    // Java
    await typeLine('$ javac -d build src/Risky.java && java Risky', 'white');
    await typeLine('  >>> compiling 18 sources ...',                 'dim');
    await delay(180);
    spawnLogo('JAVA',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      '#f89820');
    await delay(160);

    // Node + React
    await typeLine('$ npm run build && node dist/index.js', 'white');
    await delay(120);
    spawnLogo('NODE.JS',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      '#4caf50');
    await delay(120);
    spawnLogo('REACT',
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      '#61dafb');
    await delay(180);

    await typeLine('# all modules online', 'green');
    await delay(80);
    await typeLine('Welcome, operator. Type "help" to begin.', 'cyan');
    await typeLine('', 'dim');
    output.scrollTop = output.scrollHeight;
  }

  // ── COMMAND DISPATCH ──────────────────────────────────────
  // Whitelist regex prevents weird control chars / overlong inputs
  const SAFE_INPUT = /^[a-z0-9 _-]{1,40}$/i;

  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    let raw = (input.value || '').trim();
    input.value = '';
    if (!raw) return;
    if (raw.length > 40) raw = raw.slice(0, 40);
    if (!SAFE_INPUT.test(raw)) {
      await printLines([{ text: '  invalid input.', cls: 'red' }]);
      return;
    }
    raw = raw.toLowerCase();

    // Echo command (textContent prevents injection)
    const echo = document.createElement('div');
    echo.className = 't-line white';
    echo.textContent = `risky@jarvis:~$ ${raw}`;
    output.appendChild(echo);

    const cmd = COMMANDS[raw];
    if (cmd) {
      const result = cmd.fn();
      if (result && result.length) await printLines(result);
    } else {
      await printLines([
        { text: `  command not found: ${raw}`,  cls: 'red' },
        { text: '  Type "help" for commands.',  cls: 'dim' }
      ]);
    }
    output.scrollTop = output.scrollHeight;
  });

  // ── KICKOFF — wait for terminal to scroll into view ───────
  let booted = false;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !booted) {
        booted = true;
        bootTerminal();
        obs.disconnect();
      }
    });
  }, { threshold: 0.25 });
  const sec = document.getElementById('terminal');
  if (sec) obs.observe(sec);
})();
