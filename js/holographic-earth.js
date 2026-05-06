/* ============================================================
   holographic-earth.js — Holographic rotating Earth
   ────────────────────────────────────────────────────────────
   Renders a wireframe globe in #earthCanvas (right of terminal).
   • Continent outlines via low-poly procedural sphere with
     dotted texture for continent suggestion.
   • Operator's location (Nashik, India — lat 19.99°N lon 73.78°E)
     marked with a pulsing dot + ring + label-line.
   • Slow spin, holographic cyan tones, scanlines.
   • Uses a separate WebGL renderer scoped to its own canvas so
     it doesn't conflict with the hero scene.
   ============================================================ */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('earthCanvas');
  if (!canvas) return;

  const wrap = canvas.parentElement; // .earth-box
  if (!wrap) return;

  // Defer init until the section is near-viewport (saves GPU)
  let initialized = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !initialized) {
        initialized = true;
        init();
        observer.disconnect();
      }
    });
  }, { rootMargin: '150px' });
  observer.observe(wrap);

  function init() {
    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    cam.position.set(0, 0.4, 5);

    function setSize() {
      const r = wrap.getBoundingClientRect();
      const w = Math.max(200, r.width);
      const h = Math.max(200, r.height);
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    setSize();
    window.addEventListener('resize', setSize, { passive: true });
    // Re-size when wrap layout shifts (terminal section resize)
    if (window.ResizeObserver) {
      new ResizeObserver(setSize).observe(wrap);
    }

    // ── EARTH GROUP ───────────────────────────────────────────
    const earth = new THREE.Group();
    scene.add(earth);

    // Lat/lon → 3D position on a unit sphere of given radius
    function latLonToVec3(lat, lon, radius) {
      const phi   = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
         radius * Math.cos(phi),
         radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    // Solid dark inner sphere (so back wireframe doesn't bleed through)
    const innerGeo = new THREE.SphereGeometry(1.18, 48, 48);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x020a18, transparent: true, opacity: 0.85
    });
    earth.add(new THREE.Mesh(innerGeo, innerMat));

    // Glow shell (additive, slightly larger)
    const glowGeo = new THREE.SphereGeometry(1.32, 48, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    earth.add(new THREE.Mesh(glowGeo, glowMat));

    // Wireframe globe (latitude / longitude lines)
    const wireGeo = new THREE.SphereGeometry(1.20, 36, 24);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff, transparent: true, opacity: 0.32
    });
    const wireEdges = new THREE.WireframeGeometry(wireGeo);
    earth.add(new THREE.LineSegments(wireEdges, wireMat));

    // ── CONTINENT-LIKE DOT CLOUD ─────────────────────────────
    /* We don't have map textures (offline-friendly), so we
       render a procedural dot cloud whose density spikes around
       the rough lat/lon footprint of each continent. */
    const continents = [
      // [lat, lon, latSpread, lonSpread, density]
      [ 50,  10, 25, 35, 1.0],   // Europe
      [ 25,  85, 30, 40, 1.0],   // Asia (incl. India)
      [  0,  20, 35, 30, 1.0],   // Africa
      [-25, 135, 20, 25, 1.0],   // Australia
      [ 50, -100,30, 40, 1.0],   // North America
      [-15, -60, 30, 25, 1.0],   // South America
      [-80,   0, 10, 180, 0.8]   // Antarctica strip
    ];

    const dotPositions = [];
    continents.forEach(([cLat, cLon, dLat, dLon, density]) => {
      const N = Math.floor(180 * density);
      for (let i = 0; i < N; i++) {
        // Gaussian-ish jitter for organic shape
        const lat = cLat + (Math.random() + Math.random() + Math.random() - 1.5) * dLat * 0.9;
        const lon = cLon + (Math.random() + Math.random() + Math.random() - 1.5) * dLon * 0.9;
        const v = latLonToVec3(lat, lon, 1.21);
        dotPositions.push(v.x, v.y, v.z);
      }
    });
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.022,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    earth.add(new THREE.Points(dotGeo, dotMat));

    // ── INDIA HIGHLIGHT (denser red dot cloud) ───────────────
    const indiaPos = [];
    // Tighter cluster covering Indian subcontinent
    const indiaSpots = [
      [ 28,  77], [ 26,  80], [ 22,  88], [ 19,  73], [ 17,  78],
      [ 13,  77], [ 10,  76], [ 24,  73], [ 21,  79], [ 27,  82],
      [ 29,  79], [ 31,  76], [ 23,  72], [ 25,  85]
    ];
    indiaSpots.forEach(([lat, lon]) => {
      for (let i = 0; i < 8; i++) {
        const jLat = lat + (Math.random() - 0.5) * 3;
        const jLon = lon + (Math.random() - 0.5) * 3;
        const v = latLonToVec3(jLat, jLon, 1.215);
        indiaPos.push(v.x, v.y, v.z);
      }
    });
    const indiaGeo = new THREE.BufferGeometry();
    indiaGeo.setAttribute('position', new THREE.Float32BufferAttribute(indiaPos, 3));
    const indiaMat = new THREE.PointsMaterial({
      color: 0xff2244,
      size: 0.030,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    earth.add(new THREE.Points(indiaGeo, indiaMat));

    // ── NASHIK PULSE MARKER ──────────────────────────────────
    const NASHIK = latLonToVec3(19.99, 73.78, 1.22);
    const nashikDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff2244 })
    );
    nashikDot.position.copy(NASHIK);
    earth.add(nashikDot);

    // Pulsing ring around marker (sprite of additive star)
    function makePulseTexture() {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const cx = size / 2, cy = size / 2;
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      grad.addColorStop(0,    'rgba(255,255,255,0)');
      grad.addColorStop(0.6,  'rgba(255,34,68,0)');
      grad.addColorStop(0.78, 'rgba(255,34,68,0.6)');
      grad.addColorStop(0.92, 'rgba(255,80,120,0.9)');
      grad.addColorStop(1,    'rgba(255,34,68,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    const pulseTex = makePulseTexture();
    const pulse = new THREE.Sprite(new THREE.SpriteMaterial({
      map: pulseTex, color: 0xff2244, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    pulse.position.copy(NASHIK);
    pulse.scale.set(0.3, 0.3, 1);
    earth.add(pulse);

    // Outer halo (much larger, slow pulse)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: pulseTex, color: 0xff5577, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    halo.position.copy(NASHIK);
    halo.scale.set(0.55, 0.55, 1);
    earth.add(halo);

    // ── SCANLINE EQUATOR RING ─────────────────────────────────
    const ringGeo = new THREE.RingGeometry(1.24, 1.27, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff, transparent: true, opacity: 0.45,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    earth.add(ring);

    // ── ANIMATE ───────────────────────────────────────────────
    let running = true;
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
    });

    let last = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Slow earth spin
      earth.rotation.y += dt * 0.18;
      // Subtle wobble
      earth.rotation.x = Math.sin(now * 0.0002) * 0.06;

      // Pulse animation
      const pulseT = (now * 0.001) % 2.4;     // 2.4s cycle
      const haloT  = (now * 0.001) % 4.0;     // 4s cycle (slower halo)
      // pulseT runs 0→2.4, normalize
      const pn = pulseT / 2.4;
      const hn = haloT  / 4.0;
      pulse.scale.setScalar(0.18 + pn * 0.55);
      pulse.material.opacity = 1 - pn;
      halo.scale.setScalar(0.30 + hn * 1.10);
      halo.material.opacity = (1 - hn) * 0.55;

      // Ring rotation for sci-fi vibe
      ring.rotation.z += dt * 0.25;

      renderer.render(scene, cam);
    }
    requestAnimationFrame(loop);
  }
})();
