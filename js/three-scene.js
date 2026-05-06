/* ============================================================
   three-scene.js — Hero car drift + on-spot spin
   ────────────────────────────────────────────────────────────
   Sequence:
     1. Boots when 'risky:loaderDone' fires (loader.js stashes
        the parsed GLB at window.RISKY_GLB so we don't re-fetch).
     2. Car enters from far RIGHT, drifts cinematically across
        the scene with star-shaped sparks + skid marks + flicker.
     3. Drift ENDS at LEFT-CENTER position (~world x=-3, z=0)
        — matching the right-side hero content layout.
     4. On-spot spin from drift-end yaw, camera DOLLIES IN
        so the car appears bigger / closer than during drift.
     5. Hero content (logo, tags, CTAs) fades in on the right
        column once drift completes.
   ============================================================ */
(function () {
  'use strict';

  // ── DOM ────────────────────────────────────────────────────
  const hero   = document.getElementById('hero');
  const canvas = document.getElementById('threeCanvas');
  if (!hero || !canvas || typeof THREE === 'undefined') return;

  // ── RENDERER + CAMERA + SCENE ──────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x020408, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled  = true;
  renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.7;
  renderer.outputEncoding     = THREE.sRGBEncoding;

  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 600);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020408, 0.018);

  function setSize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h);
    cam.aspect = w / Math.max(1, h);
    cam.updateProjectionMatrix();
  }
  setSize();
  window.addEventListener('resize', setSize, { passive: true });

  // ── LIGHTS ─────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0x002244, 0x000000, 0.9));

  const cyanDir = new THREE.DirectionalLight(0x00e5ff, 5);
  cyanDir.position.set(8, 12, 5);
  cyanDir.castShadow = true;
  cyanDir.shadow.mapSize.setScalar(2048);
  cyanDir.shadow.camera.left   = -30;
  cyanDir.shadow.camera.right  =  30;
  cyanDir.shadow.camera.top    =  30;
  cyanDir.shadow.camera.bottom = -30;
  scene.add(cyanDir);

  const redDir = new THREE.DirectionalLight(0xff2244, 2.5);
  redDir.position.set(-8, 6, -6);
  scene.add(redDir);

  const fillDir = new THREE.DirectionalLight(0x88aaff, 1.0);
  fillDir.position.set(0, 14, -8);
  scene.add(fillDir);

  // Underglow lights track the car
  const glC = new THREE.PointLight(0x00e5ff, 6, 10);
  const glR = new THREE.PointLight(0xff2244, 3, 7);
  const glW = new THREE.PointLight(0xffffff, 2, 6);
  glC.position.y = -0.3;
  glR.position.y = -0.3;
  glW.position.y =  1.2;
  scene.add(glC, glR, glW);

  // ── GROUND + GRID ──────────────────────────────────────────
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ color: 0x010306, roughness: 0.04, metalness: 0.99 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(140, 140, 0x00e5ff, 0x040d1f);
  grid.material.transparent = true;
  grid.material.opacity = 0.32;
  scene.add(grid);

  // ── LETTERBOX BARS (cinematic intro) ───────────────────────
  const lb = document.createElement('div');
  lb.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:48;display:flex;flex-direction:column;justify-content:space-between';
  lb.innerHTML =
    '<div id="lbT" style="background:#000;height:90px;transition:height 1.4s cubic-bezier(.4,0,.2,1)"></div>' +
    '<div id="lbB" style="background:#000;height:90px;transition:height 1.4s cubic-bezier(.4,0,.2,1)"></div>';
  document.body.appendChild(lb);

  // ── MOTION-BLUR side overlay during entry ──────────────────
  const mb = document.createElement('div');
  mb.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:47;opacity:0;transition:opacity .3s;' +
    'background:linear-gradient(90deg,rgba(0,229,255,0.18) 0%,transparent 28%,transparent 72%,rgba(0,229,255,0.18) 100%);' +
    'mix-blend-mode:screen';
  document.body.appendChild(mb);

  // ════════════════════════════════════════════════════════════
  //  STAR-SHAPED SPARKS (replaces dull spheres)
  // ════════════════════════════════════════════════════════════
  function makeStarTexture() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const cx = size / 2, cy = size / 2;

    // Soft radial glow base
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.5,  'rgba(255,200,80,0.35)');
    grad.addColorStop(1,    'rgba(255,160,40,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);

    // 4-pointed star rays via additive lines
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    const drawRay = (angle, length, width, color) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(angle);
      const lg = g.createLinearGradient(0, 0, length, 0);
      lg.addColorStop(0, color);
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = lg;
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(length, 0);
      g.stroke();
      g.restore();
    };
    // 4 main long rays (bigger star arms)
    for (let i = 0; i < 4; i++) {
      drawRay((Math.PI / 2) * i, size * 0.48, 6, 'rgba(255,255,255,1)');
    }
    // 4 diagonal short rays
    for (let i = 0; i < 4; i++) {
      drawRay(Math.PI / 4 + (Math.PI / 2) * i, size * 0.28, 3, 'rgba(255,220,150,0.9)');
    }
    // Bright core dot
    g.globalCompositeOperation = 'source-over';
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, 14);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = core;
    g.beginPath();
    g.arc(cx, cy, 14, 0, Math.PI * 2);
    g.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }
  const STAR_TEX = makeStarTexture();

  const SPARKS = 160;
  const sparkPool = [];
  for (let i = 0; i < SPARKS; i++) {
    const mat = new THREE.SpriteMaterial({
      map: STAR_TEX,
      color: 0xffaa00,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const s = new THREE.Sprite(mat);
    s.visible = false;
    s.scale.set(0.6, 0.6, 1);
    scene.add(s);
    sparkPool.push({ sprite: s, life: 0, vx: 0, vy: 0, vz: 0, baseSize: 0.6, rot: 0, rotV: 0 });
  }
  function emitSparks(x, y, z, count) {
    let n = 0;
    for (let i = 0; i < sparkPool.length && n < count; i++) {
      const s = sparkPool[i];
      if (s.life > 0) continue;
      s.sprite.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y +  Math.random() * 0.2,
        z + (Math.random() - 0.5) * 0.4
      );
      s.vx = (Math.random() - 0.5) * 0.32;
      s.vy =  Math.random() * 0.40 + 0.06;
      s.vz = (Math.random() - 0.5) * 0.32;
      s.life = 1.0;
      s.rot  = Math.random() * Math.PI * 2;
      s.rotV = (Math.random() - 0.5) * 0.18;
      const r = Math.random();
      const col = r > 0.65 ? 0x00e5ff : (r > 0.3 ? 0xffcc55 : 0xff5566);
      s.sprite.material.color.setHex(col);
      s.sprite.material.opacity = 1;
      s.baseSize = 0.55 + Math.random() * 0.45;
      s.sprite.scale.set(s.baseSize, s.baseSize, 1);
      s.sprite.visible = true;
      n++;
    }
  }
  function tickSparks() {
    sparkPool.forEach(s => {
      if (s.life <= 0) return;
      s.life -= 0.022;
      s.vy   -= 0.011;
      s.sprite.position.x += s.vx;
      s.sprite.position.y += s.vy;
      s.sprite.position.z += s.vz;
      s.vx *= 0.95;
      s.vz *= 0.95;
      s.rot += s.rotV;
      s.sprite.material.rotation = s.rot;
      s.sprite.material.opacity  = Math.max(0, s.life * 1.0);
      // Sparkle: pulse size while it lives
      const pulse = 0.85 + Math.sin(s.life * 18) * 0.15;
      const sz = s.baseSize * (s.life * 0.7 + 0.3) * pulse;
      s.sprite.scale.set(sz, sz, 1);
      if (s.life <= 0) s.sprite.visible = false;
    });
  }

  // ── SKID MARKS ─────────────────────────────────────────────
  function makeSkid(x, z, ang) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3), mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = ang;
    m.position.set(x, 0.001, z);
    scene.add(m);
    let op = 0.55;
    const t = setInterval(() => {
      op -= 0.0014;
      mat.opacity = Math.max(0, op);
      if (op <= 0) { clearInterval(t); scene.remove(m); mat.dispose(); }
    }, 60);
  }

  // ════════════════════════════════════════════════════════════
  //  CAR PATH — RIGHT → LEFT-CENTER (drift ends at ~ x=-3.5, z=0)
  // ════════════════════════════════════════════════════════════
  const carPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 50, 0,  0.5),
    new THREE.Vector3( 26, 0,  0.5),
    new THREE.Vector3( 14, 0,  0.8),
    new THREE.Vector3(  6, 0,  1.2),
    new THREE.Vector3( -1, 0,  2.2),
    new THREE.Vector3( -4, 0,  3.2),   // peak swerve out
    new THREE.Vector3( -6, 0,  2.0),
    new THREE.Vector3( -5, 0,  0.8),
    new THREE.Vector3( -3.5,0, 0.2),
    new THREE.Vector3( -3.5,0, 0.0)    // drift end (left-center)
  ], false, 'catmullrom', 0.5);

  // Camera tracks the car cinematically (low + wide angles)
  const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 24,  3.5, -3),
    new THREE.Vector3( 10,  3.0, -3),
    new THREE.Vector3(  2,  2.0, -5),
    new THREE.Vector3( -5,  1.5, -7),
    new THREE.Vector3( -9,  2.0, -6),
    new THREE.Vector3(-11,  2.5, -3)
  ]);
  const lkPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 26, 0.8,  0.5),
    new THREE.Vector3( 10, 0.8,  1.0),
    new THREE.Vector3(  0, 0.8,  3.0),
    new THREE.Vector3( -4, 0.8,  3.0),
    new THREE.Vector3( -3.8,0.8, 0.5),
    new THREE.Vector3( -3.5,0.8, 0.0)
  ]);

  // ════════════════════════════════════════════════════════════
  //  STATE
  // ════════════════════════════════════════════════════════════
  let car = null;
  let frame = 0;
  const FRAMES = 440;        // ~7.3s at 60fps — clean cinematic length
  let phase = 'idle';        // 'idle' | 'drift' | 'spin'
  let driftEndYaw = 0;
  const driftEndPos = new THREE.Vector3(-3.5, 0, 0);
  const driftEndCamPos = new THREE.Vector3();
  let spinStartTime = 0;
  let sTimer = 0;
  let skidLeftDone = false, skidRightDone = false;
  let heroShown = false;

  const _cp = new THREE.Vector3(), _cn = new THREE.Vector3();
  const _cv = new THREE.Vector3(), _lv = new THREE.Vector3();

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ── CAR SETUP (post-load) ──────────────────────────────────
  function setupCar(gltf) {
    car = gltf.scene;
    car.traverse(c => {
      if (!c.isMesh) return;
      c.castShadow = c.receiveShadow = true;
      const ms = Array.isArray(c.material) ? c.material : [c.material];
      ms.forEach(m => {
        if (!m) return;
        m.envMapIntensity = 4.0;
        if (m.metalness !== undefined) m.metalness = Math.max(m.metalness, 0.92);
        if (m.roughness !== undefined) m.roughness = Math.min(m.roughness, 0.13);
        m.needsUpdate = true;
      });
    });
    const box = new THREE.Box3().setFromObject(car);
    const sz  = new THREE.Vector3();
    box.getSize(sz);
    const sc = 7.0 / Math.max(sz.x, sz.z);
    car.scale.setScalar(sc);
    box.setFromObject(car);
    car.position.y = -box.min.y;
    car.position.x = 50;
    car.position.z = 0.5;
    // Face leftwards (we move from +x to -x)
    car.rotation.y = Math.PI;
    scene.add(car);
    phase = 'drift';
  }

  function makeFallback() {
    // Used if GLB load fails entirely
    const g = new THREE.Group();
    const bm = new THREE.MeshStandardMaterial({ color: 0x08101e, metalness: 0.98, roughness: 0.06 });
    const b  = new THREE.Mesh(new THREE.BoxGeometry(6, 0.7, 2.4), bm);
    b.position.y = 0.75; g.add(b);
    const cm = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 0.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x001422, metalness: 0.8, roughness: 0.15, transparent: true, opacity: 0.75 })
    );
    cm.position.set(-0.2, 1.3, 0); g.add(cm);
    const wg = new THREE.CylinderGeometry(0.5, 0.5, 0.32, 20);
    const wm = new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.85, roughness: 0.35 });
    [[-2, 0.5, -1.35], [-2, 0.5, 1.35], [2, 0.5, -1.35], [2, 0.5, 1.35]].forEach(p => {
      const w = new THREE.Mesh(wg, wm);
      w.rotation.z = Math.PI / 2;
      w.position.set(...p);
      g.add(w);
    });
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.05, 2.2),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.92 })
    );
    glow.position.y = 0.09;
    g.add(glow);
    g.position.set(50, 0, 0.5);
    g.rotation.y = Math.PI;
    scene.add(g);
    car = g;
    phase = 'drift';
  }

  // ── HERO CONTENT REVEAL ────────────────────────────────────
  function showHero() {
    if (heroShown) return;
    heroShown = true;

    const heroEl = document.getElementById('heroContent');
    const logoEl = document.getElementById('heroLogoImg');
    if (heroEl) {
      // Use GSAP if available, else CSS fallback
      if (typeof gsap !== 'undefined') {
        gsap.set(heroEl, { opacity: 0, x: 40, filter: 'blur(8px)' });
        gsap.to(heroEl, {
          opacity: 1, x: 0, filter: 'blur(0px)',
          duration: 1.0, ease: 'power3.out',
          onStart: () => { heroEl.style.pointerEvents = 'auto'; }
        });
        // Glitch the logo on entry
        if (logoEl) {
          gsap.fromTo(logoEl,
            { opacity: 0, scale: 0.85, filter: 'hue-rotate(120deg) blur(6px)' },
            {
              opacity: 1, scale: 1, filter: 'drop-shadow(0 0 60px rgba(0,229,255,.35)) drop-shadow(0 0 30px rgba(0,229,255,.2))',
              duration: 1.2, ease: 'power4.out', delay: 0.15
            });
        }
        // Stagger tags + buttons
        const tags = heroEl.querySelectorAll('.hero-tag, .hero-sep');
        if (tags.length) {
          gsap.from(tags, { opacity: 0, y: 14, stagger: 0.06, duration: 0.5, ease: 'power2.out', delay: 0.45 });
        }
        const btns = heroEl.querySelectorAll('.btn-primary, .btn-ghost');
        if (btns.length) {
          gsap.from(btns, { opacity: 0, y: 18, stagger: 0.09, duration: 0.55, ease: 'power2.out', delay: 0.65 });
        }
      } else {
        heroEl.style.transition = 'opacity 1.4s ease, transform 1.4s ease';
        heroEl.style.opacity = '1';
        heroEl.style.pointerEvents = 'auto';
      }
    }
    // Open the letterbox
    const lbT = document.getElementById('lbT');
    const lbB = document.getElementById('lbB');
    if (lbT) lbT.style.height = '0';
    if (lbB) lbB.style.height = '0';
    setTimeout(() => { if (lb && lb.parentNode) lb.parentNode.removeChild(lb); }, 1600);
  }

  // ════════════════════════════════════════════════════════════
  //  ANIMATION LOOP
  // ════════════════════════════════════════════════════════════
  function animate() {
    requestAnimationFrame(animate);

    // ── DRIFT PHASE ─────────────────────────────────────────
    if (car && phase === 'drift') {
      frame++;
      const rawT = Math.min(frame / FRAMES, 1);
      const t    = ease(rawT);

      // Side motion-blur during the entry fast-streak
      if (rawT < 0.30) {
        mb.style.opacity = String(Math.min(rawT / 0.15, 1));
      } else if (rawT < 0.40) {
        mb.style.opacity = String(Math.max(0, 1 - (rawT - 0.30) / 0.10));
      } else {
        mb.style.opacity = '0';
      }

      carPath.getPoint(t, _cp);
      carPath.getPoint(Math.min(t + 0.01, 1), _cn);
      car.position.copy(_cp);

      // Direction of travel → base yaw
      const fwd = new THREE.Vector3().subVectors(_cn, _cp).normalize();
      const baseYaw = Math.atan2(fwd.x, fwd.z);

      // Drift kick — counter-steer a bit during mid-drift
      let drift = 0;
      if (rawT > 0.40 && rawT < 0.84) {
        const dp = (rawT - 0.40) / 0.44;
        // Negative because we're going right→left (fwd is -x direction)
        drift = -Math.sin(dp * Math.PI) * 0.78;
      }
      const targetYaw = baseYaw + drift;
      // Smooth toward target yaw
      let dy = targetYaw - car.rotation.y;
      while (dy >  Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      car.rotation.y += dy * 0.16;

      // Body roll
      if (rawT > 0.40 && rawT < 0.84) {
        const dp = (rawT - 0.40) / 0.44;
        car.rotation.z = Math.sin(dp * Math.PI) * 0.10;
      } else {
        car.rotation.z *= 0.88;
      }

      // Sparks + skids during drift
      if (rawT > 0.42 && rawT < 0.82) {
        sTimer++;
        if (sTimer % 2 === 0) {
          // Sparks emit FROM the rear wheels (behind direction of travel)
          const bx = _cp.x - fwd.x * 2.5;
          const bz = _cp.z - fwd.z * 2.5;
          emitSparks(bx - 0.5, 0.05, bz, 6);
          emitSparks(bx + 0.5, 0.05, bz, 6);
        }
        if (!skidLeftDone && rawT > 0.55) {
          makeSkid(_cp.x - 0.6, _cp.z, car.rotation.y + 0.3);
          skidLeftDone = true;
        }
        if (!skidRightDone && rawT > 0.62) {
          makeSkid(_cp.x + 0.6, _cp.z, car.rotation.y + 0.3);
          skidRightDone = true;
        }
      }

      // Underglow tracks car
      glC.position.set(_cp.x, -0.3, _cp.z);
      glR.position.set(_cp.x, -0.3, _cp.z);
      glW.position.set(_cp.x,  1.2, _cp.z);

      if (rawT > 0.42 && rawT < 0.82) {
        const flk = Math.sin(Date.now() * 0.018) * 2.5;
        glC.intensity = 6   + flk;
        glR.intensity = 3.5 + flk * 0.5;
      } else {
        glC.intensity += ((rawT < 0.42 ? 2.5 : 5) - glC.intensity) * 0.04;
        glR.intensity += ((rawT < 0.42 ? 1   : 2) - glR.intensity) * 0.04;
      }

      // Camera follows path
      const ct = Math.min(t * 1.05, 1);
      camPath.getPoint(ct, _cv);
      lkPath.getPoint(ct,  _lv);
      cam.position.lerp(_cv, 0.045);
      cam.lookAt(_lv);

      // End of drift → enter spin phase
      if (rawT >= 1) {
        // Snap rotation/position cleanly
        driftEndYaw = car.rotation.y;
        driftEndPos.copy(_cp);
        driftEndCamPos.copy(cam.position);
        spinStartTime = Date.now();
        phase = 'spin';
        showHero();
      }
    }

    // ── SPIN PHASE — on-spot spin with camera DOLLY-IN ──────
    if (car && phase === 'spin') {
      const elapsed = (Date.now() - spinStartTime) / 1000;

      // Slow on-spot spin (~0.18 rad/s = ~10°/s)
      car.rotation.y = driftEndYaw + elapsed * 0.18;
      car.rotation.z *= 0.94;
      car.rotation.x *= 0.94;

      // Snap back to drift end x/z (no drifting around)
      car.position.x += (driftEndPos.x - car.position.x) * 0.06;
      car.position.z += (driftEndPos.z - car.position.z) * 0.06;
      car.position.y  =  car.position.y; // GLB y already set

      /* CAMERA DOLLY-IN:
         Drift cam was orbit ~11 wide. Spin cam orbits at ~7 = closer
         → car appears bigger/closer (per spec). 2.2s blend in. */
      const ORBIT_R = 7.2;
      const orbitT  = elapsed * 0.16;       // slow cam rotation around car
      const camY    = 1.9 + Math.sin(elapsed * 0.5) * 0.18; // gentle bob
      const targetCamX = driftEndPos.x + Math.cos(orbitT - 0.7) * ORBIT_R;
      const targetCamZ = driftEndPos.z + Math.sin(orbitT - 0.7) * ORBIT_R - 1.5;

      const blendT = Math.min(elapsed / 2.2, 1);
      const blendE = blendT < 0.5
        ? 2 * blendT * blendT
        : 1 - Math.pow(-2 * blendT + 2, 2) / 2;

      cam.position.x = driftEndCamPos.x + (targetCamX - driftEndCamPos.x) * blendE;
      cam.position.y = driftEndCamPos.y + (camY        - driftEndCamPos.y) * blendE;
      cam.position.z = driftEndCamPos.z + (targetCamZ - driftEndCamPos.z) * blendE;

      // Look slightly above car center so the body fills the frame
      cam.lookAt(driftEndPos.x, driftEndPos.y + 0.7, driftEndPos.z);

      // Underglow gentle pulse
      const t2 = elapsed * 1.2;
      glC.intensity = 5   + Math.sin(t2)        * 1.0;
      glR.intensity = 2.5 + Math.sin(t2 * 1.5)  * 0.6;
      glC.position.set(car.position.x, -0.3, car.position.z);
      glR.position.set(car.position.x, -0.3, car.position.z);
      glW.position.set(car.position.x,  1.2, car.position.z);
    }

    tickSparks();
    renderer.render(scene, cam);
  }

  // ── BOOT — wait for loader to finish ───────────────────────
  function boot(detail) {
    const gltf = (detail && detail.glb) || window.RISKY_GLB || null;
    if (gltf) {
      setupCar(gltf);
    } else if (typeof THREE.GLTFLoader !== 'undefined') {
      // Loader didn't preload — fetch now as fallback
      try {
        const draco = new THREE.DRACOLoader();
        draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
        const ldr = new THREE.GLTFLoader();
        ldr.setDRACOLoader(draco);
        ldr.load('models/lambo.glb',
          g => setupCar(g),
          undefined,
          () => makeFallback()
        );
      } catch (e) {
        console.warn('[three-scene] load fallback', e);
        makeFallback();
      }
    } else {
      makeFallback();
    }
    animate();
  }

  // If loader already finished before we attached
  if (window.RISKY_LOADER_DONE) {
    boot({ glb: window.RISKY_GLB });
  } else {
    window.addEventListener('risky:loaderDone', (ev) => boot(ev.detail), { once: true });
    // Hard safety: if loader event never fires within 14s, boot anyway
    setTimeout(() => {
      if (phase === 'idle') boot({ glb: window.RISKY_GLB || null });
    }, 14000);
  }
})();
