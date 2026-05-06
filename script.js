/* ============================================================
   STELLAR CARTOGRAPHY — Portfolio script
   Modules:
     1. Starfield   — canvas parallax + twinkle
     2. Cursor      — custom cursor with hover state
     3. Clock       — live UTC HUD readout
     4. Routing     — orbital ⇄ focused view transitions
   ============================================================ */


/* ------------------------------------------------------------
   1. Starfield — gentle parallax + twinkling
   ------------------------------------------------------------ */
(() => {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h;

  function resize() {
    w = canvas.width  = window.innerWidth  * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.floor((w * h) / (6500 * devicePixelRatio));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.7 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.005 + Math.random() * 0.012,
        layer: Math.random(),
        // ~78% white, the rest split between red ember and cool blue
        hue: Math.random() < 0.78
          ? null
          : (Math.random() < 0.65 ? '#ff7a6b' : '#a8c4ff'),
      });
    }
  }

  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });

  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.twinkle += s.twinkleSpeed;
      const a = s.a * (0.7 + 0.3 * Math.sin(s.twinkle));
      const px = s.x - mx * 14 * s.layer * devicePixelRatio;
      const py = s.y - my * 14 * s.layer * devicePixelRatio;

      ctx.beginPath();
      ctx.fillStyle = s.hue
        ? hexToRgba(s.hue, a)
        : `rgba(255, 255, 255, ${a})`;
      ctx.arc(px, py, s.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();

      // sparkle cross on bigger stars at peak twinkle
      if (s.r > 1.1 && Math.sin(s.twinkle) > 0.92) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.45})`;
        ctx.lineWidth = 0.5 * devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(px - s.r * 3.2, py); ctx.lineTo(px + s.r * 3.2, py);
        ctx.moveTo(px, py - s.r * 3.2); ctx.lineTo(px, py + s.r * 3.2);
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();


/* ------------------------------------------------------------
   2. Custom cursor
   ------------------------------------------------------------ */
(() => {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let cx = 0, cy = 0, tx = 0, ty = 0;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
  });

  function loop() {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  const HOVER_SELECTOR = '.planet, .return-btn, .contact-item, a, button';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVER_SELECTOR)) cursor.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(HOVER_SELECTOR)) cursor.classList.remove('hover');
  });
})();


/* ------------------------------------------------------------
   3. Live HUD clock (UTC)
   ------------------------------------------------------------ */
(() => {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;

  function tick() {
    const d = new Date();
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s} UTC`;
  }
  setInterval(tick, 1000);
  tick();
})();


/* ------------------------------------------------------------
   4. Routing — orbital ⇄ focused view
      Pauses the orbit on hover so the planet can be clicked
      without chasing it around the screen.
   ------------------------------------------------------------ */
(() => {
  const body = document.body;
  const returnBtn = document.getElementById('returnBtn');
  const sysStatus = document.getElementById('sysStatus');
  const planets = document.querySelectorAll('.planet[data-section]');
  let currentView = null;

  function showView(section, planetName) {
    if (currentView) {
      document.getElementById('view-' + currentView).classList.remove('active');
    }
    currentView = section;
    body.classList.add('focused');
    document.getElementById('view-' + section).classList.add('active');
    returnBtn.classList.add('show');
    if (sysStatus) {
      sysStatus.textContent = 'TRANSIT · ' + (planetName || section.toUpperCase());
    }
  }

  function returnToOrbit() {
    if (!currentView) return;
    document.getElementById('view-' + currentView).classList.remove('active');
    body.classList.remove('focused');
    returnBtn.classList.remove('show');
    if (sysStatus) sysStatus.textContent = 'NOMINAL';
    currentView = null;
  }

  planets.forEach((p) => {
    const orbit = p.closest('.orbit');

    // Pause this planet's orbit on hover so the click target is still
    p.addEventListener('mouseenter', () => orbit && orbit.classList.add('paused'));
    p.addEventListener('mouseleave', () => orbit && orbit.classList.remove('paused'));

    p.addEventListener('click', (e) => {
      e.stopPropagation();
      showView(p.dataset.section, p.dataset.name);
    });

    p.addEventListener('touchend', (e) => {
      e.preventDefault();
      showView(p.dataset.section, p.dataset.name);
    }, { passive: false });
  });

  if (returnBtn) returnBtn.addEventListener('click', returnToOrbit);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'ArrowLeft') returnToOrbit();
  });
})();
