/**
 * HADJX — Personal 3D Link Hub (Awwwards / arstraumur.music Level)
 * Sound-Reactive 3D Galaxy Engine, Audio Synthesis, 3D Stereoscopic Card Physics & Magnetic Cursor
 */

(function () {
  'use strict';

  /* ==========================================================================
     Configuration & State
     ========================================================================== */
  const CONFIG = {
    modelPath: 'assets/model.glb',
    dampingFactor: 0.06,
    parallaxIntensity: 0.85,
    maxAudioVolume: 0.65,
    galaxy: {
      count: 42000,
      size: 0.016,
      radius: 10.5,
      branches: 3,
      spin: 0.95,
      randomness: 0.38,
      randomnessPower: 3.2,
      colorInside: '#ffe4f3',
      colorMid: '#9933ff',
      colorOutside: '#00f2fe'
    }
  };

  const state = {
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0, screenX: window.innerWidth / 2, screenY: window.innerHeight / 2 },
    cursor: { x: window.innerWidth / 2, y: window.innerHeight / 2, ringX: window.innerWidth / 2, ringY: window.innerHeight / 2 },
    hasInteracted: false,
    isPlayingAudio: false,
    isTabActive: true,
    cameraView: 'default', // 'default', 'top', 'core'
    audioCtx: null,
    analyser: null,
    audioData: null,
    audioSource: null,
    audioPulse: 0
  };

  /* DOM Elements */
  const canvas = document.getElementById('webgl-canvas');
  const audio = document.getElementById('bg-audio');
  const audioToggle = document.getElementById('audio-toggle');
  const audioTooltip = document.getElementById('audio-tooltip');
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  const copyToast = document.getElementById('copy-toast');
  const toastText = document.getElementById('toast-text');
  const liveClock = document.getElementById('live-clock');
  const cameraButtons = document.querySelectorAll('.cam-btn');
  const linkCards = document.querySelectorAll('.link-card');
  const copyButtons = document.querySelectorAll('.copy-handle-btn');

  /* ==========================================================================
     1. Web Audio API & Synthesized UI Spatial Audio
     ========================================================================== */
  function initWebAudio() {
    if (state.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioContextClass();
      
      // Connect Background Music to Real-Time Analyser
      if (audio) {
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 128;
        state.analyser.smoothingTimeConstant = 0.85;
        state.audioData = new Uint8Array(state.analyser.frequencyBinCount);

        try {
          state.audioSource = state.audioCtx.createMediaElementSource(audio);
          state.audioSource.connect(state.analyser);
          state.analyser.connect(state.audioCtx.destination);
        } catch (e) {
          console.info('Media element source already connected or fallback active:', e);
        }
      }
    } catch (err) {
      console.warn('Web Audio API not supported:', err);
    }
  }

  // Synthesize futuristic UI sounds without external assets
  function playSoundFX(type) {
    if (!state.audioCtx || state.audioCtx.state !== 'running' || !state.isPlayingAudio) return;

    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      const now = state.audioCtx.currentTime;

      if (type === 'hover') {
        // High-frequency crystal harmonic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);

        gain.gain.setValueAtTime(0.018, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'click') {
        // Warm tactile sub-frequency pulse
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.11);
      }
    } catch (e) {}
  }

  /* ==========================================================================
     2. Three.js Engine & Sound-Reactive 3D Galaxy Wallpaper
     ========================================================================== */
  let scene, camera, renderer;
  let galaxyGroup, galaxyPoints, galaxyCoreMesh;
  let ambientParticles;
  let meteors = [];
  let shockwaves = [];
  let pointLightCyan, pointLightPurple;

  const cameraPositions = {
    default: { x: 0, y: 0, z: 10, rotX: Math.PI * 0.32, rotY: -Math.PI * 0.08 },
    top: { x: 0, y: 3, z: 11, rotX: Math.PI * 0.52, rotY: 0 },
    core: { x: 0, y: 0.6, z: 5.5, rotX: Math.PI * 0.25, rotY: Math.PI * 0.1 }
  };

  let targetCamPos = { ...cameraPositions.default };

  function initThree() {
    if (!window.THREE) return;

    // 1. Scene & Camera
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030509, 0.04);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    camera.position.set(targetCamPos.x, targetCamPos.y, targetCamPos.z);

    // 2. WebGL Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 3. Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    pointLightCyan = new THREE.PointLight(0x00f2fe, 3.2, 25);
    pointLightCyan.position.set(-5, 4, 4);
    scene.add(pointLightCyan);

    pointLightPurple = new THREE.PointLight(0x8a2be2, 3.8, 25);
    pointLightPurple.position.set(5, -4, 3);
    scene.add(pointLightPurple);

    // 4. Ambient Starfield Dust (1,500 particles)
    createAmbientStarfield();

    // 5. 3D Spiral Particle Galaxy Wallpaper (Sketchfab Galaxy Simulation)
    createGalaxySystem();

    // 6. GLTF/GLB Drop-in Loader
    loadCustomModel();

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('click', onCanvasClick, { passive: true });

    // 8. Start Animation Loop
    animate();
  }

  /* Ambient Deep Space Dust */
  function createAmbientStarfield() {
    const geometry = new THREE.BufferGeometry();
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorCyan = new THREE.Color(0x00f2fe);
    const colorPurple = new THREE.Color(0x8a2be2);
    const colorWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 45;
      positions[i + 1] = (Math.random() - 0.5) * 45;
      positions[i + 2] = (Math.random() - 0.5) * 30 - 3;

      const r = Math.random();
      const col = r < 0.35 ? colorCyan : r < 0.7 ? colorPurple : colorWhite;
      colors[i] = col.r;
      colors[i + 1] = col.g;
      colors[i + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    ambientParticles = new THREE.Points(geometry, material);
    scene.add(ambientParticles);
  }

  /* 3D Spiral Particle Galaxy */
  function createGalaxySystem() {
    galaxyGroup = new THREE.Group();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CONFIG.galaxy.count * 3);
    const colors = new Float32Array(CONFIG.galaxy.count * 3);

    const cInside = new THREE.Color(CONFIG.galaxy.colorInside);
    const cMid = new THREE.Color(CONFIG.galaxy.colorMid);
    const cOutside = new THREE.Color(CONFIG.galaxy.colorOutside);

    for (let i = 0; i < CONFIG.galaxy.count; i++) {
      const i3 = i * 3;

      const radius = Math.random() * CONFIG.galaxy.radius;
      const spinAngle = radius * CONFIG.galaxy.spin;
      const branchAngle = ((i % CONFIG.galaxy.branches) / CONFIG.galaxy.branches) * Math.PI * 2;

      const randomX = Math.pow(Math.random(), CONFIG.galaxy.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * CONFIG.galaxy.randomness * (radius + 0.6);
      const randomY = Math.pow(Math.random(), CONFIG.galaxy.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * (CONFIG.galaxy.randomness * 0.45) * (radius + 0.3);
      const randomZ = Math.pow(Math.random(), CONFIG.galaxy.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * CONFIG.galaxy.randomness * (radius + 0.6);

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      // Color gradient: Core -> Mid -> Outer
      const mixedColor = cInside.clone();
      const midPoint = CONFIG.galaxy.radius * 0.35;

      if (radius < midPoint) {
        mixedColor.lerp(cMid, radius / midPoint);
      } else {
        mixedColor.copy(cMid).lerp(cOutside, (radius - midPoint) / (CONFIG.galaxy.radius - midPoint));
      }

      const jitter = (Math.random() - 0.5) * 0.12;
      colors[i3] = Math.min(1, Math.max(0, mixedColor.r + jitter));
      colors[i3 + 1] = Math.min(1, Math.max(0, mixedColor.g + jitter));
      colors[i3 + 2] = Math.min(1, Math.max(0, mixedColor.b + jitter));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: CONFIG.galaxy.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      opacity: 0.88
    });

    galaxyPoints = new THREE.Points(geometry, material);
    galaxyGroup.add(galaxyPoints);

    // Initial orientation
    galaxyGroup.rotation.x = targetCamPos.rotX;
    galaxyGroup.rotation.y = targetCamPos.rotY;
    galaxyGroup.position.set(0, 0.6, -1);

    scene.add(galaxyGroup);
  }

  /* Cosmic Meteors / Shooting Stars */
  function spawnMeteor() {
    if (!scene || meteors.length > 2) return;

    const startX = (Math.random() - 0.5) * 20;
    const startY = 6 + Math.random() * 6;
    const startZ = (Math.random() - 0.5) * 8 - 2;

    const length = 2.5 + Math.random() * 2;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      startX, startY, startZ,
      startX - length * 0.8, startY - length * 0.8, startZ
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: Math.random() < 0.5 ? 0x00f2fe : 0xff80bf,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const meteor = new THREE.Line(geometry, material);
    meteor.userData = {
      vx: -(0.25 + Math.random() * 0.2),
      vy: -(0.25 + Math.random() * 0.2),
      life: 1.0,
      decay: 0.02 + Math.random() * 0.015
    };

    scene.add(meteor);
    meteors.push(meteor);
  }

  /* Click Shockwave Expansion */
  function onCanvasClick(e) {
    if (!scene) return;
    // Don't spawn on button clicks
    if (e.target.closest('button') || e.target.closest('a')) return;

    const shockGeo = new THREE.RingGeometry(0.1, 0.25, 48);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(shockGeo, shockMat);
    ring.position.set(state.mouse.x * 4, state.mouse.y * 3, 2);
    ring.userData = { scale: 1, opacity: 0.8 };

    scene.add(ring);
    shockwaves.push(ring);
    playSoundFX('click');
  }

  /* Custom GLB Drop-in Loader */
  function loadCustomModel() {
    if (!window.THREE || !window.THREE.GLTFLoader) return;

    const loader = new THREE.GLTFLoader();
    loader.load(
      CONFIG.modelPath,
      function (gltf) {
        console.log('✓ Custom 3D Model successfully loaded from:', CONFIG.modelPath);
        if (galaxyGroup) scene.remove(galaxyGroup);

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5.0 / maxDim;
        model.scale.set(scale, scale, scale);

        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += 0.8;
        model.position.z -= 1;

        scene.add(model);
      },
      undefined,
      function () {
        // Fallback active smoothly
      }
    );
  }

  /* Mouse & Touch Coordinates */
  function onMouseMove(e) {
    state.mouse.screenX = e.clientX;
    state.mouse.screenY = e.clientY;
    state.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      state.mouse.screenX = e.touches[0].clientX;
      state.mouse.screenY = e.touches[0].clientY;
      state.mouse.targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      state.mouse.targetY = -(e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }
  }

  function onWindowResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /* 3D Animation Loop */
  let clock = new THREE.Clock();
  let meteorTimer = 0;

  function animate() {
    requestAnimationFrame(animate);

    if (!state.isTabActive) return;

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 1. Audio Reactivity Analysis
    let bass = 0;
    let mid = 0;
    if (state.analyser && state.isPlayingAudio) {
      state.analyser.getByteFrequencyData(state.audioData);
      // Average low frequencies (0-5)
      let bassSum = 0;
      for (let i = 0; i < 6; i++) bassSum += state.audioData[i];
      bass = (bassSum / 6) / 255;

      // Average mids (6-16)
      let midSum = 0;
      for (let i = 6; i < 16; i++) midSum += state.audioData[i];
      mid = (midSum / 10) / 255;
    } else {
      // Gentle sine breathing pulse when audio is idle
      bass = Math.sin(elapsedTime * 1.5) * 0.15 + 0.15;
    }

    state.audioPulse += (bass - state.audioPulse) * 0.15;

    // 2. Smooth Lerp Mouse Parallax
    state.mouse.x += (state.mouse.targetX - state.mouse.x) * CONFIG.dampingFactor;
    state.mouse.y += (state.mouse.targetY - state.mouse.y) * CONFIG.dampingFactor;

    // 3. Camera Position Lerping (View Modes)
    camera.position.x += (targetCamPos.x + state.mouse.x * CONFIG.parallaxIntensity - camera.position.x) * 0.05;
    camera.position.y += (targetCamPos.y + state.mouse.y * CONFIG.parallaxIntensity + Math.sin(elapsedTime * 0.6) * 0.12 - camera.position.y) * 0.05;
    camera.position.z += (targetCamPos.z - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);

    // 4. Sound-Reactive Lights
    if (pointLightCyan && pointLightPurple) {
      pointLightCyan.position.x = -5 + state.mouse.x * 2.5;
      pointLightCyan.position.y = 4 + state.mouse.y * 2.5;
      pointLightCyan.intensity = 3.0 + state.audioPulse * 2.5;

      pointLightPurple.position.x = 5 - state.mouse.x * 2.5;
      pointLightPurple.position.y = -4 - state.mouse.y * 2.5;
      pointLightPurple.intensity = 3.5 + state.audioPulse * 2.0;
    }

    // 5. Galaxy Rotation & Sound Pulse
    if (galaxyGroup) {
      if (galaxyPoints) {
        // Sound boosts rotation speed dynamically
        galaxyPoints.rotation.y += (0.001 + state.audioPulse * 0.004);
      }

      // Parallax Tilt
      galaxyGroup.rotation.x = targetCamPos.rotX - state.mouse.y * 0.18;
      galaxyGroup.rotation.y = targetCamPos.rotY + state.mouse.x * 0.18;
      galaxyGroup.rotation.z = Math.sin(elapsedTime * 0.08) * 0.04;

      // Audio reactive starlight shimmer
      if (galaxyPoints) {
        galaxyPoints.material.size = CONFIG.galaxy.size * (1.0 + state.audioPulse * 0.45);
      }
    }

    // 6. Ambient Dust Rotation
    if (ambientParticles) {
      ambientParticles.rotation.y = elapsedTime * 0.012;
      ambientParticles.rotation.x = Math.sin(elapsedTime * 0.01) * 0.02;
    }

    // 7. Meteor Spawning & Updates
    meteorTimer += delta;
    if (meteorTimer > 2.8) {
      if (Math.random() < 0.6) spawnMeteor();
      meteorTimer = 0;
    }

    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.position.x += m.userData.vx;
      m.position.y += m.userData.vy;
      m.userData.life -= m.userData.decay;
      m.material.opacity = m.userData.life;

      if (m.userData.life <= 0) {
        scene.remove(m);
        meteors.splice(i, 1);
      }
    }

    // 8. Shockwaves Update
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.userData.scale += 0.25;
      sw.userData.opacity -= 0.025;
      sw.scale.setScalar(sw.userData.scale);
      sw.material.opacity = Math.max(0, sw.userData.opacity);

      if (sw.userData.opacity <= 0) {
        scene.remove(sw);
        shockwaves.splice(i, 1);
      }
    }

    // 9. Custom Magnetic Cursor Lerp
    updateCursor();

    renderer.render(scene, camera);
  }

  /* Handle Tab Visibility */
  document.addEventListener('visibilitychange', () => {
    state.isTabActive = !document.hidden;
  });

  /* ==========================================================================
     3. Custom Magnetic Reticle Cursor (Desktop)
     ========================================================================== */
  function initCursor() {
    if (!cursorDot || !cursorRing) return;

    window.addEventListener('mousedown', () => {
      cursorRing.classList.add('clicking');
    });

    window.addEventListener('mouseup', () => {
      cursorRing.classList.remove('clicking');
    });

    // Magnetic attraction over interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .avatar-wrapper');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorRing.classList.add('hovered');
        playSoundFX('hover');
      });
      el.addEventListener('mouseleave', () => {
        cursorRing.classList.remove('hovered');
      });
    });
  }

  function updateCursor() {
    if (!cursorDot || !cursorRing) return;
    state.cursor.ringX += (state.mouse.screenX - state.cursor.ringX) * 0.18;
    state.cursor.ringY += (state.mouse.screenY - state.cursor.ringY) * 0.18;

    cursorDot.style.left = `${state.mouse.screenX}px`;
    cursorDot.style.top = `${state.mouse.screenY}px`;

    cursorRing.style.left = `${state.cursor.ringX}px`;
    cursorRing.style.top = `${state.cursor.ringY}px`;
  }

  /* ==========================================================================
     4. Stereoscopic 3D Card Physics & Dynamic Specular Sheen
     ========================================================================== */
  function initCardPhysics() {
    linkCards.forEach(card => {
      card.addEventListener('mousemove', handleCardMouseMove);
      card.addEventListener('mouseleave', handleCardMouseLeave);
      card.addEventListener('mouseenter', handleCardMouseEnter);
    });
  }

  function handleCardMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${percentX}%`);
    card.style.setProperty('--mouse-y', `${percentY}%`);
  }

  function handleCardMouseLeave(e) {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.35s ease';
  }

  function handleCardMouseEnter(e) {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.1s ease-out, border-color 0.35s ease, box-shadow 0.35s ease';
  }

  /* ==========================================================================
     5. Camera Perspective Controls
     ========================================================================== */
  function initCameraControls() {
    cameraButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSoundFX('click');

        cameraButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const view = btn.dataset.view;
        state.cameraView = view;

        if (cameraPositions[view]) {
          targetCamPos = { ...cameraPositions[view] };
        }
      });
    });
  }

  /* ==========================================================================
     6. Copy to Clipboard System & Holographic Toast
     ========================================================================== */
  function initCopySystem() {
    copyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const textToCopy = btn.dataset.copy;
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`تم نسخ: ${textToCopy}`);
          playSoundFX('click');
        }).catch(() => {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showToast(`تم نسخ: ${textToCopy}`);
          playSoundFX('click');
        });
      });
    });
  }

  let toastTimeout;
  function showToast(msg) {
    if (!copyToast) return;
    if (toastText) toastText.textContent = msg;

    copyToast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      copyToast.classList.remove('show');
    }, 2800);
  }

  /* ==========================================================================
     7. Live Digital Telemetry Clock
     ========================================================================== */
  function initLiveClock() {
    function updateTime() {
      if (!liveClock) return;
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      liveClock.textContent = `${hours}:${mins}:${secs} UTC`;
    }
    updateTime();
    setInterval(updateTime, 1000);
  }

  /* ==========================================================================
     8. Ambient Background Music & Autoplay Unlock Manager
     ========================================================================== */
  function initAudioManager() {
    if (!audio) return;

    // Comprehensive unlock triggers so music starts instantly on any movement
    const unlockEvents = ['pointerdown', 'touchstart', 'keydown', 'pointermove', 'mousemove', 'wheel', 'scroll', 'click'];

    function handleFirstUserGesture() {
      if (state.hasInteracted && state.isPlayingAudio) return;
      state.hasInteracted = true;

      initWebAudio();
      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }

      startAudioWithFadeIn();

      unlockEvents.forEach(evt => document.removeEventListener(evt, handleFirstUserGesture));
      if (audioTooltip) audioTooltip.classList.add('dismissed');
    }

    unlockEvents.forEach(evt => {
      document.addEventListener(evt, handleFirstUserGesture, { once: true, passive: true });
    });

    // Try starting audio immediately on load
    initWebAudio();
    startAudioWithFadeIn();
    window.addEventListener('load', () => {
      startAudioWithFadeIn();
    });

    if (audioToggle) {
      audioToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        state.hasInteracted = true;
        initWebAudio();
        if (state.audioCtx && state.audioCtx.state === 'suspended') {
          state.audioCtx.resume();
        }
        if (audioTooltip) audioTooltip.classList.add('dismissed');

        if (state.isPlayingAudio) {
          pauseAudio();
        } else {
          startAudioWithFadeIn();
        }
        playSoundFX('click');
      });
    }

    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });
  }

  function startAudioWithFadeIn() {
    if (!audio) return;
    audio.volume = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          state.isPlayingAudio = true;
          updateAudioUI(true);

          let vol = 0;
          const fadeInterval = setInterval(() => {
            vol += 0.05;
            if (vol >= CONFIG.maxAudioVolume) {
              vol = CONFIG.maxAudioVolume;
              clearInterval(fadeInterval);
            }
            audio.volume = vol;
          }, 60);
        })
        .catch(err => {
          console.warn('Audio waiting for user gesture:', err);
          updateAudioUI(false);
        });
    }
  }

  function pauseAudio() {
    if (!audio) return;
    let vol = audio.volume;
    const fadeOutInterval = setInterval(() => {
      vol -= 0.08;
      if (vol <= 0.05) {
        clearInterval(fadeOutInterval);
        audio.pause();
        state.isPlayingAudio = false;
        updateAudioUI(false);
      } else {
        audio.volume = vol;
      }
    }, 40);
  }

  function updateAudioUI(isPlaying) {
    if (!audioToggle) return;
    if (isPlaying) {
      audioToggle.classList.add('playing');
      const text = audioToggle.querySelector('.audio-status-text');
      if (text) text.textContent = 'صوت متفاعل ♫';
    } else {
      audioToggle.classList.remove('playing');
      const text = audioToggle.querySelector('.audio-status-text');
      if (text) text.textContent = 'صوت مكتوم';
    }
  }

  /* ==========================================================================
     9. Dynamic Settings Sync from Admin Panel (localStorage)
     ========================================================================== */
  function syncDynamicSettings() {
    try {
      const saved = localStorage.getItem('ammar_hub_settings');
      if (!saved) return;
      const data = JSON.parse(saved);

      // 1. Profile sync
      if (data.profile) {
        const nameEl = document.getElementById('profile-name');
        if (nameEl && data.profile.name) nameEl.textContent = data.profile.name;

        const bioEl = document.getElementById('profile-bio');
        if (bioEl && data.profile.bio) bioEl.textContent = data.profile.bio;

        const avatarImg = document.getElementById('header-avatar-img');
        if (avatarImg && data.profile.avatar) avatarImg.src = data.profile.avatar;

        const tagsContainer = document.getElementById('profile-tags');
        if (tagsContainer && Array.isArray(data.profile.tags) && data.profile.tags.length > 0) {
          tagsContainer.innerHTML = data.profile.tags.map(tag => `<span class="id-tag">${tag}</span>`).join('');
        }
      }

      // 2. Audio sync — check for custom uploaded song first (from admin panel)
      if (data.audio) {
        if (data.audio.trackTitle) {
          const trackTitleEl = document.querySelector('.audio-track-title');
          if (trackTitleEl) trackTitleEl.textContent = data.audio.trackTitle;
        }

        // Priority: custom uploaded audio blob > audioSrc path
        const customBlob = localStorage.getItem('ammar_custom_audio');
        const customName = localStorage.getItem('ammar_custom_audio_name');
        if (customBlob && audio) {
          // Use the base64 blob uploaded from admin/phone
          if (audio.getAttribute('data-custom-loaded') !== customName) {
            audio.src = customBlob;
            audio.setAttribute('data-custom-loaded', customName);
            if (customName) {
              const trackTitleEl = document.querySelector('.audio-track-title');
              if (trackTitleEl) trackTitleEl.textContent = customName;
            }
          }
        } else if (data.audio.audioSrc && audio) {
          const currentSrc = audio.getAttribute('src') || (audio.querySelector('source') ? audio.querySelector('source').getAttribute('src') : '');
          if (currentSrc !== data.audio.audioSrc) {
            audio.src = data.audio.audioSrc;
          }
        }
      }

      // 3. Footer sync
      if (data.footer) {
        const badgeEl = document.getElementById('footer-badge-text');
        if (badgeEl && data.footer.badge) badgeEl.textContent = data.footer.badge;

        const footerSub = document.querySelector('.footer-sub');
        if (footerSub && data.footer.sub) footerSub.textContent = data.footer.sub;
      }
    } catch (e) {
      console.warn('Could not sync admin settings:', e);
    }
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    syncDynamicSettings();
    initThree();
    initCursor();
    initCardPhysics();
    initCameraControls();
    initCopySystem();
    initLiveClock();
    initAudioManager();
  });

})();
