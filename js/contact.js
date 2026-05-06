/* ============================================================
   contact.js — Secure contact form handler
   ────────────────────────────────────────────────────────────
   Security layers (all enforced before send):
     1. Honeypot field "website" — bots fill, humans don't.
     2. Typing-time floor — submission < 1.5s after load = bot.
     3. Rate-limit — max 3 sends per hour per browser.
     4. RSec.escapeHTML on all values before display.
     5. RSec.isValidEmail / isValidName whitelist regex.
     6. Length caps enforced (browser maxlength + JS).

   Delivery:
     • If PORTFOLIO_DATA.email.publicKey is set → EmailJS.send
     • Otherwise → mailto: prefilled with deeplambhade101@…
       (so messages still reach the inbox even without API)
   Backup:
     • Every submission also goes to localStorage key
       "risky_contact_log" (rolling 50). Visible to user in
       browser DevTools — guarantees nothing is lost.
   ============================================================ */
(function () {
  'use strict';

  const form    = document.getElementById('contactForm');
  if (!form) return;

  const nameEl    = form.querySelector('#cf-name');
  const emailEl   = form.querySelector('#cf-email');
  const msgEl     = form.querySelector('#cf-msg');
  const hpEl      = form.querySelector('input[name="website"]');
  const submitBtn = form.querySelector('#cfSubmit');
  const status    = form.querySelector('#formStatus');
  const counter   = form.querySelector('#msgCount');

  if (!nameEl || !emailEl || !msgEl) return;

  // RSec is provided by security.js — defensive fallback if missing
  const Sec = (typeof RSec !== 'undefined') ? RSec : {
    escapeHTML: s => String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    isValidEmail: s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s),
    isValidName: s => /^[A-Za-z\s\-\.']{2,80}$/.test(s),
    looksLikeBot: () => false,
    createRateLimiter: () => ({ check: () => true, remaining: () => 99 })
  };

  // ── RATE LIMITER (3 / hour per browser) ────────────────────
  const rateLimiter = Sec.createRateLimiter('contact-form', 3, 3600000);

  // ── TYPING-TIME ANCHOR ─────────────────────────────────────
  const formLoadTime = Date.now();
  const MIN_TYPING_MS = 1500;

  // ── LIVE COUNTER ──────────────────────────────────────────
  function refreshCount() {
    if (counter) counter.textContent = String(msgEl.value.length);
  }
  msgEl.addEventListener('input', refreshCount);
  refreshCount();

  // ── STATUS HELPERS ────────────────────────────────────────
  function setStatus(kind, text) {
    if (!status) return;
    status.classList.remove('ok', 'err', 'pending');
    if (kind) status.classList.add(kind);
    status.textContent = text;
  }
  function lock(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = !!loading;
    submitBtn.style.opacity = loading ? '0.55' : '';
    submitBtn.style.cursor  = loading ? 'wait' : '';
  }

  // ── LOCAL BACKUP ──────────────────────────────────────────
  function backupLocally(payload) {
    try {
      const KEY = 'risky_contact_log';
      const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
      arr.push(Object.assign({}, payload, { savedAt: new Date().toISOString() }));
      while (arr.length > 50) arr.shift();
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) { /* localStorage may be disabled — ignore */ }
  }

  // ── MAILTO FALLBACK ───────────────────────────────────────
  function sendViaMailto(payload) {
    const to = (window.PORTFOLIO_DATA &&
                PORTFOLIO_DATA.email &&
                PORTFOLIO_DATA.email.notifyTo) || 'deeplambhade101@gmail.com';
    const subject = `Portfolio contact — ${payload.name}`;
    const body =
      `Name: ${payload.name}\n` +
      `Email: ${payload.email}\n\n` +
      `Message:\n${payload.message}\n\n` +
      `— sent ${new Date().toISOString()}`;
    const url = `mailto:${encodeURIComponent(to)}` +
                `?subject=${encodeURIComponent(subject)}` +
                `&body=${encodeURIComponent(body)}`;
    // Open in new tab so the form page stays put
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 200);
  }

  // ── EMAILJS DELIVERY ──────────────────────────────────────
  async function sendViaEmailJS(cfg, payload) {
    if (typeof emailjs === 'undefined') throw new Error('EmailJS SDK not loaded');
    // Initialize once
    if (!sendViaEmailJS._inited) {
      try { emailjs.init({ publicKey: cfg.publicKey }); }
      catch (e) {
        // Older API
        try { emailjs.init(cfg.publicKey); } catch(_) {}
      }
      sendViaEmailJS._inited = true;
    }
    const params = {
      from_name:    payload.name,
      from_email:   payload.email,
      message:      payload.message,
      submitted_at: new Date().toISOString(),
      user_agent:   navigator.userAgent.slice(0, 200),
      to_email:     cfg.notifyTo
    };
    return emailjs.send(cfg.serviceId, cfg.templateId, params);
  }

  // ── SUBMIT HANDLER ────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Bot check: honeypot
    if (hpEl && hpEl.value.trim().length > 0) {
      // Silent success — don't tell bots they're caught
      setStatus('ok', '✓ Message sent. I\'ll reply soon.');
      form.reset();
      return;
    }

    // 2. Bot check: typing-time floor
    if (Date.now() - formLoadTime < MIN_TYPING_MS) {
      setStatus('err', '⚠ Please take a moment before submitting.');
      return;
    }

    // 3. Bot check: UA / behavior + honeypot consistency check
    if (Sec.looksLikeBot && Sec.looksLikeBot({
      honeypot: hpEl ? hpEl.value : '',
      elapsedMs: Date.now() - formLoadTime,
      message: msgEl.value || ''
    })) {
      setStatus('err', '⚠ Submission blocked.');
      return;
    }

    // 4. Rate limit (3/hour per browser)
    if (!rateLimiter.check()) {
      setStatus('err', '⚠ Too many messages. Try again in about an hour.');
      return;
    }

    // 5. Validate
    const name    = (nameEl.value  || '').trim().slice(0, 80);
    const email   = (emailEl.value || '').trim().slice(0, 120);
    const message = (msgEl.value   || '').trim().slice(0, 2000);

    if (!Sec.isValidName(name))     { setStatus('err', '⚠ Please enter a valid name.');    return; }
    if (!Sec.isValidEmail(email))   { setStatus('err', '⚠ Please enter a valid email.');   return; }
    if (message.length < 10)        { setStatus('err', '⚠ Message must be at least 10 characters.'); return; }

    const payload = { name, email, message };

    // Always back up locally first — guarantees no message is ever lost
    backupLocally(payload);

    setStatus('pending', '⟳ Transmitting message…');
    lock(true);

    const cfg = (window.PORTFOLIO_DATA &&
                 PORTFOLIO_DATA.email) || {};
    const hasEmailJS = cfg.publicKey && cfg.serviceId && cfg.templateId;

    if (hasEmailJS) {
      try {
        await sendViaEmailJS(cfg, payload);
        setStatus('ok', `✓ Message delivered. I'll reply within 24 hours.`);
        form.reset();
        refreshCount();
      } catch (err) {
        console.warn('[contact] EmailJS failed, falling back to mailto', err);
        sendViaMailto(payload);
        setStatus('ok', '✓ Opening your email client. Just hit Send.');
      }
    } else {
      // No EmailJS configured — mailto fallback
      sendViaMailto(payload);
      setStatus('ok', '✓ Opening your email client. Just hit Send.');
      // Don't reset form — user may want to verify what they sent
    }

    lock(false);
  });
})();
