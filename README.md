# RISKY — Portfolio v3.0

JARVIS-style cyberpunk personal portfolio for Deep Lambhade (a.k.a. Risky).
Three.js drift intro, holographic Earth, hacker terminal, secure contact form,
and a full security hardening layer — all in vanilla JS (no build step).

---

## Quick start

Just open `index.html` in a modern browser via a local server. The site is
fully static — no build, no Node runtime needed.

### Easiest options

**Python:**
```bash
cd Portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

**Node:**
```bash
npx serve Portfolio
```

> ⚠ Don't open `index.html` with `file://` — Three.js GLB loading and
> CSP rules need a real HTTP origin.

---

## Configuring the contact form (EmailJS)

The form sends submissions to `deeplambhade101@gmail.com`.
Until EmailJS is configured, the form falls back to opening the user's mail
client (mailto:) prefilled with the message — so nothing is ever lost.

To enable direct API delivery (no mail-client prompt):

1. Sign up at https://www.emailjs.com (free tier = 200 emails/month).
2. Add a **service** for your Gmail (or any SMTP provider).
3. Create an **email template**. The variables it must support:
   - `{{from_name}}`
   - `{{from_email}}`
   - `{{message}}`
   - `{{submitted_at}}`
   - `{{user_agent}}`
4. In the template's "To Email" field, put `deeplambhade101@gmail.com`.
5. Open `data/data.js` and fill in:
   ```js
   email: {
     notifyTo:   "deeplambhade101@gmail.com",
     publicKey:  "user_xxxxxxxxxxxx",   // from EmailJS dashboard
     serviceId:  "service_xxxxx",
     templateId: "template_xxxxx"
   }
   ```
6. Refresh the site. Submissions now post directly to EmailJS.

Every submission is **also** saved to the user's browser localStorage
under key `risky_contact_log` (rolling 50 entries). You can inspect them
in DevTools → Application → Local Storage.

---

## Security layer (`js/security.js`)

| # | Protection | What it does |
|---|------------|--------------|
| 1 | **CSP** (meta) | Whitelists scripts/styles/connect — blocks third-party injection. |
| 2 | **Anti-clickjacking** | Frame-busts if served inside `<iframe>`. |
| 3 | **HTML escaping** | `RSec.escapeHTML` / `RSec.stripTags` for any user input. |
| 4 | **Rate limiter** | Token bucket per action (form: 3/hour). |
| 5 | **Honeypot field** | Hidden `name="website"` input — bots fill, humans don't. |
| 6 | **Typing-time floor** | Submissions <1.5s after load are rejected. |
| 7 | **Input validators** | Whitelist regex for email + name; max-length caps. |
| 8 | **URL whitelist** | `RSec.isSafeURL` blocks `javascript:` and unknown hosts. |
| 9 | **Console banner** | Bright red warning to deter "paste this in console" social engineering. |
| 10 | **Permissions-Policy** | Geolocation, mic, camera all blocked at the meta tag. |

These are **client-side** layers — they can't replace server-side validation
(EmailJS handles that on the API side). But they raise the bar significantly
against drive-by bots, scrapers, and casual abuse.

---

## File map

```
Portfolio/
├── index.html               ← entry point
├── README.md                ← this file
├── assets/
│   ├── risky-logo.png       ← logo PNG (was double-extension; renamed)
│   └── Deep.jpeg            ← profile photo
├── models/
│   └── lambo.glb            ← hero car (~21 MB)
├── videos/
│   └── jarvis.mp4           ← project hover video
├── css/
│   ├── loader.css           ← boot loader (Sharingan + DNA)
│   ├── style.css            ← main layout
│   ├── animations.css       ← keyframes
│   └── extras.css           ← photo card, glitch overlays, helpers
├── data/
│   └── data.js              ← all content + EmailJS config
└── js/
    ├── security.js          ← RSec global (boots first)
    ├── loader.js            ← preloads GLB, runs the loading screen
    ├── three-scene.js       ← hero car drift + on-spot spin
    ├── holographic-earth.js ← rotating globe + India pulse marker
    ├── terminal.js          ← hacker terminal + auto-spawn boot
    ├── scroll-animations.js ← GSAP ScrollTrigger reveal/parallax
    ├── contact.js           ← form: honeypot + rate-limit + EmailJS
    └── main.js              ← orchestrator (cursor, nav, render)
```

---

## Hero animation sequence

1. Loader (Sharingan + DNA helix + matrix rain) holds for ≥3s while
   `loader.js` preloads `lambo.glb`.
2. On `risky:loaderDone`, `three-scene.js` drops the GLB into the scene
   off-screen at world `(50, 0, 0.5)` (far right).
3. The car drifts **right → left-center**, ending at `(-3.5, 0, 0)`.
   Star-shaped sparks + skid marks + cyan/red underglow flicker.
4. Drift end → on-spot spin (≈10°/s). Camera **dollies in** from orbit
   radius ~11 (drift) to ~7 (spin) — the car visibly grows larger.
5. Hero content (logo + tags + CTAs) fades in on the **right** side
   with a glitch-decrypt entrance, choreographed by GSAP.

---

## Customizing content

All content lives in `data/data.js`:
- `skillCategories` — tabs + per-tab skill chips with logos
- `projects` — 3 project cards (title, description, video, links)
- `timeline` — 4 journey rows
- `links` — social/contact URLs
- `email` — EmailJS config

Don't edit `index.html` to change content. Just edit `data.js`.

---

## Tested in

Chrome 121+, Firefox 122+, Safari 17+, Edge 121+.
Three.js requires WebGL2; if absent, the hero falls back to a low-poly
boxy car. Mobile (≤900px) reflows hero content beneath the car.

---

## Known limits

- The GLB is large (~21 MB). For production, run it through Draco
  compression and/or KTX2 textures to bring it under 5 MB.
- EmailJS free tier caps at 200 emails/month. Beyond that, upgrade or
  swap in your own backend (Cloudflare Worker, Vercel function, etc.).

---

## Credits

- Three.js — https://threejs.org/
- GSAP — https://greensock.com/
- EmailJS — https://www.emailjs.com/
- devicon — https://devicon.dev/ (skill logos via jsdelivr CDN)

Built with sleepless nights. — Risky
