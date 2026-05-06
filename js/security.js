/* ============================================================
   security.js — Lightweight client-side hardening
   ============================================================
   What it does:
     1. Anti-clickjacking (frame-busting if not top window).
     2. HTML/text sanitization helper (escapes <, >, &, ", ').
     3. Rate limiter for actions (e.g. form submit) — token bucket.
     4. URL whitelist check for opening external links safely.
     5. CSRF-style nonce per session (stored in sessionStorage).
     6. Console security banner (deters social-engineering attacks).
     7. Input validators (email, length, bot pattern detection).
   What it does NOT do (and cannot):
     - Replace server-side validation. Anyone can disable JS.
     - Encrypt anything — TLS happens at the transport layer.
   ============================================================ */
(function () {
  'use strict';

  // ── 1. ANTI-CLICKJACKING ──────────────────────────────────
  // If this page is loaded inside an iframe (someone trying to
  // overlay a hidden version of our site), break out.
  try {
    if (window.top !== window.self) {
      // First, try to navigate top to our URL.
      window.top.location = window.self.location;
    }
  } catch (e) {
    // Cross-origin frame — same-origin policy blocks .top access.
    // Hide the body so nothing renders inside an attacker frame.
    document.documentElement.style.display = 'none';
    setTimeout(() => { document.documentElement.style.display = ''; }, 1500);
  }

  // ── 2. HTML / TEXT SANITIZATION ───────────────────────────
  /**
   * Escape special HTML chars to safe entity equivalents.
   * Use whenever inserting USER-supplied text into the DOM via innerHTML.
   * @param {string} input
   * @returns {string}
   */
  function escapeHTML(input) {
    if (input === null || input === undefined) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' };
    return String(input).replace(/[&<>"'/]/g, ch => map[ch]);
  }

  /**
   * Strip ALL HTML tags from a string; keep the text only.
   * Safer than escapeHTML when you want plain text for an attribute.
   * @param {string} input
   */
  function stripTags(input) {
    if (!input) return '';
    return String(input).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F]/g, '');
  }

  // ── 3. RATE LIMITER (token bucket) ────────────────────────
  /**
   * Create a rate limiter scoped to a given key.
   * @param {string} key                Unique key (e.g. 'contact-form').
   * @param {number} maxRequests        Tokens in the bucket.
   * @param {number} windowMs           Refill window (ms).
   * @returns {{check: () => boolean, remaining: () => number, reset: () => void}}
   */
  function createRateLimiter(key, maxRequests, windowMs) {
    if (typeof key !== 'string' || !key) throw new Error('rate-limiter: invalid key');
    if (!Number.isFinite(maxRequests) || maxRequests <= 0) throw new Error('rate-limiter: invalid maxRequests');
    if (!Number.isFinite(windowMs) || windowMs <= 0)        throw new Error('rate-limiter: invalid windowMs');

    const storeKey = `__sec_rl_${key}`;

    function read() {
      try {
        const raw = localStorage.getItem(storeKey);
        if (!raw) return { tokens: maxRequests, last: Date.now() };
        const obj = JSON.parse(raw);
        if (typeof obj.tokens !== 'number' || typeof obj.last !== 'number') {
          return { tokens: maxRequests, last: Date.now() };
        }
        return obj;
      } catch (e) {
        return { tokens: maxRequests, last: Date.now() };
      }
    }
    function write(state) {
      try { localStorage.setItem(storeKey, JSON.stringify(state)); }
      catch (e) { /* storage full or disabled — fail open */ }
    }
    function refill(state) {
      const now = Date.now();
      const elapsed = Math.max(0, now - state.last);
      const refillRate = maxRequests / windowMs; // tokens per ms
      const newTokens = Math.min(maxRequests, state.tokens + elapsed * refillRate);
      return { tokens: newTokens, last: now };
    }

    return {
      check() {
        let state = refill(read());
        if (state.tokens >= 1) {
          state.tokens -= 1;
          write(state);
          return true;
        }
        write(state);
        return false;
      },
      remaining() {
        const state = refill(read());
        return Math.floor(state.tokens);
      },
      reset() {
        write({ tokens: maxRequests, last: Date.now() });
      }
    };
  }

  // ── 4. URL WHITELIST ─────────────────────────────────────
  const SAFE_DOMAINS = [
    'github.com', 'www.github.com',
    'linkedin.com', 'www.linkedin.com',
    'twitter.com', 'x.com',
    'wa.me', 'api.whatsapp.com',
    'instagram.com', 'www.instagram.com',
    'youtube.com', 'www.youtube.com',
    'mailto:'
  ];
  /**
   * Verify a URL points to a known-safe destination before navigation.
   * Allows mailto: + absolute https:// URLs whose host is in SAFE_DOMAINS.
   */
  function isSafeURL(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    const url = rawUrl.trim();
    if (url.startsWith('mailto:')) return true;
    if (url.startsWith('#') || url.startsWith('/')) return true; // same-page or relative
    try {
      const u = new URL(url, location.href);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
      if (u.protocol === 'http:' && location.protocol === 'https:') return false; // mixed content
      return SAFE_DOMAINS.includes(u.hostname);
    } catch (e) {
      return false;
    }
  }

  // ── 5. SESSION NONCE ─────────────────────────────────────
  // A per-session random token used to tag client-side actions.
  // Useful for correlating form submissions and detecting replays.
  function getSessionNonce() {
    let n = sessionStorage.getItem('__sec_nonce');
    if (!n) {
      const arr = new Uint8Array(16);
      (crypto && crypto.getRandomValues) ? crypto.getRandomValues(arr)
                                         : arr.forEach((_, i) => arr[i] = Math.floor(Math.random() * 256));
      n = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      try { sessionStorage.setItem('__sec_nonce', n); } catch (e) { /* private mode */ }
    }
    return n;
  }

  // ── 6. CONSOLE BANNER ────────────────────────────────────
  // If someone tells the user "open dev tools and paste this code" —
  // show a big warning. Stops most social-engineering attacks.
  function showConsoleBanner() {
    const styles = [
      'color:#ff2244', 'font-size:24px', 'font-weight:900',
      'text-shadow:0 0 8px #ff2244', 'font-family:Orbitron,sans-serif'
    ].join(';');
    const styles2 = ['color:#00e5ff', 'font-size:13px', 'font-family:monospace'].join(';');
    console.log('%c⚠ STOP', styles);
    console.log('%cThis is a developer console. If someone told you to paste something here to "hack" or "verify" something — DO NOT do it. It will give attackers control of your account, banking, and more.', styles2);
    console.log('%cRISKY says: stay safe. - https://github.com/VRDeep101', styles2);
  }

  // ── 7. INPUT VALIDATORS ──────────────────────────────────
  function isValidEmail(s) {
    if (!s || typeof s !== 'string') return false;
    if (s.length > 254) return false;
    // RFC 5322-lite — covers 99% of real emails
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(s);
  }
  function isValidName(s) {
    if (!s || typeof s !== 'string') return false;
    if (s.length < 2 || s.length > 80) return false;
    return /^[A-Za-z\u00C0-\u017F\u0900-\u097F\s\-\.\']{2,80}$/.test(s);
  }
  function looksLikeBot(formData) {
    // Honeypot trap: if hidden 'website' field has a value, it's a bot.
    if (formData.honeypot && formData.honeypot.length > 0) return true;
    // Submitted faster than any human could type
    if (formData.elapsedMs !== undefined && formData.elapsedMs < 1500) return true;
    // Excessive URLs — common spam pattern
    const urlCount = (formData.message || '').match(/https?:\/\//gi);
    if (urlCount && urlCount.length > 4) return true;
    return false;
  }

  // ── EXPOSE PUBLIC API ────────────────────────────────────
  window.RSec = Object.freeze({
    escapeHTML,
    stripTags,
    createRateLimiter,
    isSafeURL,
    getSessionNonce,
    isValidEmail,
    isValidName,
    looksLikeBot
  });

  // Run console banner on every page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showConsoleBanner);
  } else {
    showConsoleBanner();
  }

})();
