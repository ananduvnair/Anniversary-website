/* ═══════════════════════════════════════════════════════════
   app.js — Anniversary Website Main Logic
   Inside-Out 360° Photo Sphere · Cosmic Look-Around · Lightbox
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Config ───────────────────────────────────────────────── */
const MIN_TILES   = 220;    // Dense infinity sphere
const ASPECT      = 16 / 9; // 9:16 portrait ratio
const PERSPECTIVE = 750;    // Camera focal depth in px

/* ── State ─────────────────────────────────────────────────── */
let currentPage    = 'landing';
let currentYaw     = 0;
let currentPitch   = 0;
let targetPitch    = 0;
let mouseNormX     = 0;     // -1 (left) to +1 (right)
let mouseNormY     = 0;     // -1 (top) to +1 (bottom)
let isDragging     = false;
let isHovering     = false;
let dragStartX     = 0, dragStartY     = 0;
let dragYawStart   = 0, dragPitchStart = 0;
let galaxyCanvas, gCtx, starCanvas, sCtx;
let stars = [], galaxyStars = [];

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initMusic();
  initStarCanvas();
  spawnHearts();
  initGalaxyCanvas();
  buildInsideSphere();
  bindLookControls();
  startCameraLoop();
});

/* ════════════════════════════════════════════════════════════
   STAR CANVAS — Landing page background
════════════════════════════════════════════════════════════ */
function initStarCanvas() {
  starCanvas = document.getElementById('star-canvas');
  if (!starCanvas) return;
  sCtx = starCanvas.getContext('2d');
  resizeCanvas(starCanvas);

  stars = Array.from({ length: 220 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.8 + 0.3,
    alpha: Math.random() * 0.7 + 0.1,
    speed: Math.random() * 0.0008 + 0.0002,
    phase: Math.random() * Math.PI * 2,
    color: pickStarColor(),
  }));

  animateStars();
  window.addEventListener('resize', () => {
    resizeCanvas(starCanvas);
    if (galaxyCanvas) resizeCanvas(galaxyCanvas);
  });
}

function pickStarColor() {
  const p = ['#ffffff', '#a8d4ff', '#5ba3ff', '#3b7de9', '#eef5ff'];
  return p[Math.floor(Math.random() * p.length)];
}

function animateStars() {
  const W = starCanvas.width, H = starCanvas.height;
  const t = performance.now() / 1000;
  sCtx.clearRect(0, 0, W, H);

  for (const s of stars) {
    const tw    = Math.sin(t * s.speed * 1000 + s.phase);
    const alpha = s.alpha * (0.5 + 0.5 * tw);
    const r     = s.r * (0.8 + 0.2 * tw);
    sCtx.beginPath();
    sCtx.arc(s.x * W, s.y * H, r, 0, Math.PI * 2);
    sCtx.fillStyle = hexToRgba(s.color, alpha);
    sCtx.fill();

    if (s.r > 1.3 && tw > 0.5) {
      const g = sCtx.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, r * 5);
      g.addColorStop(0, hexToRgba(s.color, alpha * 0.4));
      g.addColorStop(1, 'transparent');
      sCtx.beginPath();
      sCtx.arc(s.x * W, s.y * H, r * 5, 0, Math.PI * 2);
      sCtx.fillStyle = g;
      sCtx.fill();
    }
  }
  requestAnimationFrame(animateStars);
}

/* ════════════════════════════════════════════════════════════
   GALAXY CANVAS — Deep Space Starfield & Subtle Nebulas
════════════════════════════════════════════════════════════ */
function initGalaxyCanvas() {
  galaxyCanvas = document.getElementById('galaxy-canvas');
  if (!galaxyCanvas) return;
  gCtx = galaxyCanvas.getContext('2d');
  resizeCanvas(galaxyCanvas);

  galaxyStars = Array.from({ length: 480 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 2 + 0.2,
    alpha: Math.random() * 0.75 + 0.15,
    speed: Math.random() * 0.0007 + 0.00015,
    phase: Math.random() * Math.PI * 2,
    color: pickStarColor(),
    drift: { x: (Math.random() - 0.5) * 0.00012, y: (Math.random() - 0.5) * 0.00006 },
  }));

  animateGalaxy();
}

function animateGalaxy() {
  const W = galaxyCanvas.width, H = galaxyCanvas.height;
  const t = performance.now() / 1000;
  gCtx.clearRect(0, 0, W, H);

  // Deep pitch black void with subtle cosmic vignette
  const bgGrad = gCtx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.75);
  bgGrad.addColorStop(0,   'rgba(4, 12, 34, 0.45)');
  bgGrad.addColorStop(0.5, 'rgba(1, 4, 16, 0.25)');
  bgGrad.addColorStop(1,   'rgba(0, 1, 4, 0.85)');
  gCtx.fillStyle = bgGrad;
  gCtx.fillRect(0, 0, W, H);

  // Faint celestial dust streak
  const dust = gCtx.createLinearGradient(0, H * 0.25, W, H * 0.75);
  dust.addColorStop(0,   'transparent');
  dust.addColorStop(0.3, 'rgba(12, 32, 95, 0.07)');
  dust.addColorStop(0.5, 'rgba(28, 70, 185, 0.09)');
  dust.addColorStop(0.7, 'rgba(12, 32, 95, 0.07)');
  dust.addColorStop(1,   'transparent');
  gCtx.fillStyle = dust;
  gCtx.fillRect(0, 0, W, H);

  for (const s of galaxyStars) {
    s.x = (s.x + s.drift.x + 1) % 1;
    s.y = (s.y + s.drift.y + 1) % 1;
    const tw    = Math.sin(t * s.speed * 1000 + s.phase);
    const alpha = s.alpha * (0.4 + 0.6 * Math.abs(tw));
    const r     = s.r * (0.7 + 0.3 * Math.abs(tw));
    gCtx.beginPath();
    gCtx.arc(s.x * W, s.y * H, r, 0, Math.PI * 2);
    gCtx.fillStyle = hexToRgba(s.color, alpha);
    gCtx.fill();

    if (s.r > 1.4) {
      const g = gCtx.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, r * 5);
      g.addColorStop(0, hexToRgba(s.color, alpha * 0.4));
      g.addColorStop(1, 'transparent');
      gCtx.beginPath();
      gCtx.arc(s.x * W, s.y * H, r * 5, 0, Math.PI * 2);
      gCtx.fillStyle = g;
      gCtx.fill();
    }
  }
  requestAnimationFrame(animateGalaxy);
}

/* ════════════════════════════════════════════════════════════
   FLOATING HEARTS — Landing page
════════════════════════════════════════════════════════════ */
function spawnHearts() {
  const container = document.getElementById('hearts-container');
  if (!container) return;
  const symbols = ['♡', '✦', '·', '♡', '✧', '♡'];

  function spawnOne() {
    const el = document.createElement('span');
    el.className = 'floating-heart';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + '%';
    const dur = 8 + Math.random() * 10;
    el.style.animationDuration = dur + 's';
    el.style.animationDelay   = Math.random() * 2 + 's';
    el.style.fontSize = (0.7 + Math.random() * 1.3) + 'rem';
    el.style.opacity  = (0.2 + Math.random() * 0.5).toString();
    container.appendChild(el);
    setTimeout(() => el.remove(), (dur + 2) * 1000);
  }

  for (let i = 0; i < 15; i++) setTimeout(spawnOne, i * 200);
  setInterval(spawnOne, 1200);
}

/* ════════════════════════════════════════════════════════════
   360° INSIDE-OUT PHOTO SPHERE
════════════════════════════════════════════════════════════ */
function buildInsideSphere() {
  const container = document.getElementById('sphere-container');
  if (!container) return;
  container.innerHTML = '';
  if (!PHOTOS || PHOTOS.length === 0) return;

  const src = PHOTOS;
  const n   = Math.max(src.length, MIN_TILES);
  const tiles = Array.from({ length: n }, (_, i) => src[i % src.length]);

  // Responsive tile sizing
  const isMobile = window.innerWidth <= 600;
  const tileW    = isMobile ? 54 : 68;
  const tileH    = Math.round(tileW * ASPECT);
  const baseR    = isMobile ? 620 : 760;

  document.documentElement.style.setProperty('--tile-w', tileW + 'px');
  document.documentElement.style.setProperty('--tile-h', tileH + 'px');

  // 1. Scatter 3D stardust particles inside the sphere for genuine depth parallax
  const starCount = 130;
  for (let s = 0; s < starCount; s++) {
    const starEl = document.createElement('div');
    starEl.className = 'star-3d';
    const sYaw   = Math.random() * 360;
    const sPitch = (Math.random() - 0.5) * 150;
    const sR     = 380 + Math.random() * 700; // varied depths
    const sSize  = 1.5 + Math.random() * 2.5;

    starEl.style.width  = sSize + 'px';
    starEl.style.height = sSize + 'px';
    starEl.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
    starEl.style.transform = `rotateY(${sYaw}deg) rotateX(${sPitch}deg) translateZ(${sR}px)`;
    container.appendChild(starEl);
  }

  // 2. Distribute photos evenly around the celestial dome facing inwards
  tiles.forEach((photo, i) => {
    // Fibonacci golden-angle distribution across sphere
    const yRatio   = 1 - (i / (n - 1)) * 2; // +1 (top) down to -1 (bottom)
    const phi      = Math.asin(Math.max(-0.92, Math.min(0.92, yRatio)));
    const pitchDeg = (phi * 180) / Math.PI;
    const yawDeg   = (i * 137.507764) % 360;

    // Subtle natural cosmic depth variation
    const r = baseR + ((i * 47) % 80) - 40;

    const tile = document.createElement('div');
    tile.className = 'photo-tile';

    // Inward facing transform: element is pushed to distance r and turned 180° so front faces center
    tile.style.transform = `rotateY(${yawDeg}deg) rotateX(${-pitchDeg}deg) translateZ(${r}px) rotateY(180deg)`;

    const inner = document.createElement('div');
    inner.className = 'photo-tile-inner';

    const img = document.createElement('img');
    img.alt = photo.caption || `Memory ${(i % src.length) + 1}`;
    img.onerror = () => {
      img.style.display = 'none';
      inner.appendChild(makePlaceholder(i, src.length));
    };
    img.src = photo.src;
    inner.appendChild(img);

    // Hover interactions: slow the camera and bring photo closer
    tile.addEventListener('mouseenter', () => { isHovering = true; });
    tile.addEventListener('mouseleave', () => { isHovering = false; });

    tile.appendChild(inner);
    tile.addEventListener('click', () => openLightbox(photo.src, photo.caption));
    container.appendChild(tile);
  });
}

function makePlaceholder(i, srcLen) {
  const ph = document.createElement('div');
  ph.className = 'placeholder';
  ph.innerHTML = `<span class="ph-icon">✦</span><span>Memory ${(i % srcLen) + 1}</span>`;
  return ph;
}

/* ════════════════════════════════════════════════════════════
   CAMERA & MOUSE LOOK-AROUND ENGINE
════════════════════════════════════════════════════════════ */
function bindLookControls() {
  const scene = document.getElementById('sphere-scene');
  if (!scene) return;

  // Track mouse coordinates across entire window
  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseNormX = (e.clientX - cx) / cx;
    mouseNormY = (e.clientY - cy) / cy;

    // Pitch target: look up when mouse moves up, look down when mouse moves down
    if (!isDragging) {
      targetPitch = Math.max(-65, Math.min(65, -mouseNormY * 48));
    } else {
      // 1:1 drag look
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      currentYaw  = dragYawStart + dx * 0.35;
      targetPitch = Math.max(-75, Math.min(75, dragPitchStart - dy * 0.35));
    }
  });

  // Mouse drag to look around 360° freely
  scene.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragYawStart   = currentYaw;
    dragPitchStart = currentPitch;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch look controls (phones & tablets)
  scene.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    isDragging = true;
    dragStartX = t.clientX;
    dragStartY = t.clientY;
    dragYawStart   = currentYaw;
    dragPitchStart = currentPitch;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStartX;
    const dy = t.clientY - dragStartY;
    currentYaw  = dragYawStart + dx * 0.45;
    targetPitch = Math.max(-75, Math.min(75, dragPitchStart - dy * 0.45));
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

function startCameraLoop() {
  const container = document.getElementById('sphere-container');

  function render() {
    if (container) {
      if (!isDragging) {
        if (isHovering) {
          // Subtle drifting when inspecting a photo
          currentYaw += 0.015;
        } else {
          // Camera continuously pans horizontally with mouse position + natural cosmic drift
          const mouseVelocity = mouseNormX * 0.55;
          currentYaw += mouseVelocity + 0.05;
        }
      }

      // Smooth pitch damping (lerp)
      currentPitch += (targetPitch - currentPitch) * 0.085;

      // Apply camera transform: eye is at center (0, 0, 0)
      container.style.transform =
        `translateZ(${PERSPECTIVE}px) ` +
        `rotateX(${currentPitch.toFixed(2)}deg) ` +
        `rotateY(${currentYaw.toFixed(2)}deg)`;
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* ════════════════════════════════════════════════════════════
   LIGHTBOX
════════════════════════════════════════════════════════════ */
function openLightbox(src, caption) {
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCap = document.getElementById('lightbox-caption');
  lbImg.src = src;
  lbImg.style.display = 'block';
  lbCap.textContent = caption || '';
  lb.classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

/* ════════════════════════════════════════════════════════════
   BACKGROUND MUSIC CONTROLLER
════════════════════════════════════════════════════════════ */
let isMusicPlaying = false;
let audioFadeInterval = null;

function initMusic() {
  const audio = document.getElementById('bg-music');
  if (!audio) return;

  // Use dynamic source from photos.js if defined
  if (typeof MUSIC_SRC !== 'undefined' && MUSIC_SRC) {
    audio.src = MUSIC_SRC;
  }
}

function toggleMusic() {
  if (isMusicPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function playMusic() {
  const audio  = document.getElementById('bg-music');
  const toggle = document.getElementById('music-toggle');
  const label  = document.getElementById('music-label');
  if (!audio) return;

  clearInterval(audioFadeInterval);
  audio.volume = 0;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isMusicPlaying = true;
        if (toggle) toggle.classList.add('playing');
        if (label)  label.textContent = 'Music On';

        // Smooth romantic audio fade in up to 0.7 volume
        let vol = 0;
        audioFadeInterval = setInterval(() => {
          vol += 0.05;
          if (vol >= 0.7) {
            vol = 0.7;
            clearInterval(audioFadeInterval);
          }
          audio.volume = vol;
        }, 70);
      })
      .catch((err) => {
        console.log('Audio playback info:', err.message);
      });
  }
}

function pauseMusic() {
  const audio  = document.getElementById('bg-music');
  const toggle = document.getElementById('music-toggle');
  const label  = document.getElementById('music-label');
  if (!audio) return;

  clearInterval(audioFadeInterval);
  audio.pause();
  isMusicPlaying = false;
  if (toggle) toggle.classList.remove('playing');
  if (label)  label.textContent = 'Music';
}

/* ════════════════════════════════════════════════════════════
   PAGE TRANSITIONS
════════════════════════════════════════════════════════════ */
function enterGalaxy() {
  // Start music automatically on enter gesture
  if (!isMusicPlaying) {
    playMusic();
  }

  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');

  setTimeout(() => {
    document.getElementById('page-landing').classList.remove('active');
    document.getElementById('page-galaxy').classList.add('active');
    currentPage = 'galaxy';
    buildInsideSphere();
  }, 800);

  setTimeout(() => overlay.classList.remove('active'), 1600);
}

function goBack() {
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');

  setTimeout(() => {
    document.getElementById('page-galaxy').classList.remove('active');
    document.getElementById('page-landing').classList.add('active');
    currentPage = 'landing';
  }, 800);

  setTimeout(() => overlay.classList.remove('active'), 1600);
}

/* ════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════ */
function resizeCanvas(canvas) {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}
